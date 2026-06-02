import 'dart:async';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:dio/dio.dart' as dio;
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/core/utils/url_helpers.dart';
import 'package:mediahive_mobile/core/config/env_config.dart';
import '../../domain/models/chat_room.dart';
import 'package:mediahive_mobile/core/services/audio_service.dart';

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

/// Fetch all active chat rooms for the current user and resolve names/avatars.
final chatRoomsProvider = StateNotifierProvider<ChatRoomsNotifier, AsyncValue<List<ChatRoom>>>((ref) {
  return ChatRoomsNotifier(ref);
});

class ChatRoomsNotifier extends StateNotifier<AsyncValue<List<ChatRoom>>> {
  final Ref _ref;
  RealtimeChannel? _roomsChannel;
  StreamSubscription<List<Map<String, dynamic>>>? _roomsSubscription;
  Timer? _pollingTimer;

  ChatRoomsNotifier(this._ref) : super(const AsyncValue.loading()) {
    fetchRooms();
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      fetchRooms(isBackgroundRefresh: true);
    });
  }

  Future<void> fetchRooms({bool isBackgroundRefresh = false}) async {
    if (!isBackgroundRefresh) {
      state = const AsyncValue.loading();
    }
    final client = _ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) {
      state = const AsyncValue.data([]);
      return;
    }

    try {
      // 1. Fetch user's participants to get room IDs
      final participantsRes = await client
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', user.id);

      final List<String> roomIds = (participantsRes as List)
          .map((p) => p['room_id'] as String)
          .toList();

      if (roomIds.isEmpty) {
        state = const AsyncValue.data([]);
        _subscribeToRealtime([]);
        return;
      }

      // 2. Fetch the rooms
      final roomsRes = await client
          .from('chat_rooms')
          .select('*')
          .inFilter('id', roomIds)
          .order('last_message_time', ascending: false);

      final List<Map<String, dynamic>> rawRooms = List<Map<String, dynamic>>.from(roomsRes);

      // 3. Resolve Display Names & Avatars
      final List<ChatRoom> resolvedRooms = [];
      for (final rawRoom in rawRooms) {
        final roomId = rawRoom['id'] as String;
        final roomName = rawRoom['name'] as String?;
        final isMediaTeamOnly = rawRoom['is_media_team_only'] as bool? ?? false;
        
        String? displayName = roomName;
        String? displayAvatar = UrlHelpers.getDirectImageUrl(rawRoom['icon_url'] as String?);

        // If direct message (no room name), find the other participant's profile
        if ((roomName == null || roomName.trim().isEmpty) && !isMediaTeamOnly) {
          final otherPartRes = await client
              .from('chat_participants')
              .select('user_id')
              .eq('room_id', roomId)
              .neq('user_id', user.id)
              .maybeSingle();

          if (otherPartRes != null) {
            final otherUserId = otherPartRes['user_id'] as String;
            final profileRes = await client
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', otherUserId)
                .maybeSingle();

            if (profileRes != null) {
              displayName = profileRes['full_name'] as String?;
              displayAvatar = UrlHelpers.getDirectImageUrl(profileRes['avatar_url'] as String?);
            }
          }
        }

        // Fetch the absolute latest message dynamically to prevent 'No messages yet' if out of sync
        String? finalPreview = rawRoom['last_message_preview'] as String?;
        DateTime? finalTime = rawRoom['last_message_time'] != null ? DateTime.parse(rawRoom['last_message_time'] as String) : null;

        try {
          final lastMsgRes = await client
              .from('chat_messages')
              .select('text, media_type, sender_id, created_at, is_deleted')
              .eq('room_id', roomId)
              .order('created_at', ascending: false)
              .limit(1)
              .maybeSingle();

          if (lastMsgRes != null) {
            final isDeleted = lastMsgRes['is_deleted'] as bool? ?? false;
            final msgText = lastMsgRes['text'] as String? ?? '';
            final mediaType = lastMsgRes['media_type'] as String?;
            final senderId = lastMsgRes['sender_id'] as String;
            final createdAt = DateTime.parse(lastMsgRes['created_at'] as String);

            // Use the actual last message time
            finalTime = createdAt;

            if (isDeleted) {
              finalPreview = 'Message was deleted';
            } else {
              // Fetch the sender's full name to prefix it for group chats
              String prefix = '';
              final isGroup = isMediaTeamOnly || (roomName != null && roomName.trim().isNotEmpty);
              if (isGroup) {
                final profileRes = await client
                    .from('profiles')
                    .select('full_name')
                    .eq('id', senderId)
                    .maybeSingle();
                if (profileRes != null) {
                  final senderName = profileRes['full_name'] as String?;
                  if (senderName != null) {
                    prefix = senderId == user.id ? 'You: ' : '$senderName: ';
                  }
                }
              }

              if (mediaType == 'audio' || mediaType == 'voice') {
                int? seconds = int.tryParse(msgText.trim());
                if (seconds != null) {
                  String minutes = (seconds ~/ 60).toString();
                  String secs = (seconds % 60).toString().padLeft(2, '0');
                  finalPreview = '${prefix}Voice note ($minutes:$secs)';
                } else if (msgText.trim().isNotEmpty && msgText.contains('Voice note')) {
                  finalPreview = '$prefix$msgText';
                } else if (msgText.trim().isNotEmpty) {
                  // Fallback if it's text but not parseable as seconds and not "Voice note"
                  finalPreview = '$prefix$msgText';
                } else {
                  finalPreview = '${prefix}Voice note';
                }
              } else if (msgText.trim().isNotEmpty) {
                finalPreview = '$prefix$msgText';
              } else if (mediaType != null) {
                finalPreview = '${prefix}Sent a $mediaType';
              } else {
                finalPreview = '${prefix}Attachment';
              }
            }
          }
        } catch (e) {
          print('[CHAT_PROVIDERS] Error fetching last message for room $roomId: $e');
        }

        final Map<String, dynamic> modifiedRoom = {
          ...rawRoom,
          if (finalPreview != null) 'last_message_preview': finalPreview,
          if (finalTime != null) 'last_message_time': finalTime.toIso8601String(),
        };

        // Calculate dynamic unread messages count from Supabase
        int unreadCount = 0;
        try {
          final box = await Hive.openBox('chat_preferences');
          final lastReadTimeStr = box.get('last_read_$roomId') as String? ?? rawRoom['created_at'] as String;
          
          final unreadMsgs = await client
              .from('chat_messages')
              .select('id')
              .eq('room_id', roomId)
              .neq('sender_id', user.id)
              .gt('created_at', lastReadTimeStr);
              
          unreadCount = (unreadMsgs as List).length;
        } catch (e) {
          print('[CHAT_PROVIDERS] Error calculating unread count: $e');
        }

        resolvedRooms.add(ChatRoom.fromJson(
          modifiedRoom,
          displayName: displayName ?? 'Direct Chat',
          displayAvatar: displayAvatar,
          unreadCount: unreadCount,
        ));
      }

      state = AsyncValue.data(resolvedRooms);
      _subscribeToRealtime(roomIds);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void _subscribeToRealtime(List<String> roomIds) {
    _roomsChannel?.unsubscribe();
    final client = _ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) return;

    _roomsChannel = client.channel('public:chat_rooms_updates');
    
    // Listen for updates on chat_rooms
    _roomsChannel!.onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'chat_rooms',
      callback: (payload) {
        // Refresh rooms list when a room gets updated
        fetchRooms(isBackgroundRefresh: true);
      },
    ).subscribe();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _roomsChannel?.unsubscribe();
    _roomsSubscription?.cancel();
    super.dispose();
  }
}

/// Provider for messages within a specific room.
final chatMessagesProvider = StateNotifierProvider.family<ChatMessagesNotifier, AsyncValue<List<ChatMessage>>, String>((ref, roomId) {
  return ChatMessagesNotifier(ref, roomId);
});

class ChatMessagesNotifier extends StateNotifier<AsyncValue<List<ChatMessage>>> {
  final Ref _ref;
  final String _roomId;
  RealtimeChannel? _roomsChannel;
  StreamSubscription? _roomsSubscription;
  Timer? _messagesPollingTimer;

  ChatMessagesNotifier(this._ref, this._roomId) : super(const AsyncValue.loading()) {
    fetchMessages();
    _startPolling();
  }

  void _startPolling() {
    _messagesPollingTimer?.cancel();
    _messagesPollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      fetchMessages(isBackgroundRefresh: true);
    });
  }

  Future<void> fetchMessages({bool isBackgroundRefresh = false}) async {
    if (!isBackgroundRefresh) {
      state = const AsyncValue.loading();
    }
    
    try {
      final client = _ref.read(supabaseClientProvider);
      
      final res = await client
          .from('chat_messages')
          .select('*, profiles!chat_messages_sender_id_fkey(full_name, avatar_url)')
          .eq('room_id', _roomId)
          .order('created_at', ascending: true);

      final List<ChatMessage> resolvedMessages = (res as List).map((row) {
        final profile = row['profiles'] as Map<String, dynamic>?;
        return ChatMessage.fromJson(
          row,
          senderName: profile?['full_name'],
          senderAvatar: UrlHelpers.getDirectImageUrl(profile?['avatar_url']),
        );
      }).toList();

      state = AsyncValue.data(resolvedMessages);
    } catch (e, stack) {
      if (!isBackgroundRefresh) {
        state = AsyncValue.error(e, stack);
      }
    }
  }

  /// Upload a media file directly to Google Drive via Next.js Proxy Server
  Future<Map<String, dynamic>?> uploadChatFile(File file) async {
    String baseUrl = EnvConfig.current.apiBaseUrl;
    if (Platform.isAndroid && baseUrl.contains('localhost')) {
      baseUrl = baseUrl.replaceAll('localhost', '10.0.2.2');
    }

    final sanitizedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final uploadUrl = '$sanitizedBase/api/chat/upload/';

    try {
      final dioClient = dio.Dio();
      final formData = dio.FormData.fromMap({
        'roomId': _roomId,
        'file': await dio.MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
      });

      final response = await dioClient.post(
        uploadUrl,
        data: formData,
        options: dio.Options(
          followRedirects: true,
          validateStatus: (status) => status! < 500,
          connectTimeout: const Duration(seconds: 4), // 4 seconds short connect timeout
          receiveTimeout: const Duration(seconds: 15),
        ),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Map<String, dynamic>.from(response.data);
      } else {
        print('[CHAT_UPLOAD] Direct file upload failed with status: ${response.statusCode}, body: ${response.data}');
        throw Exception('Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('[CHAT_UPLOAD] Direct file upload failed on $uploadUrl: $e');
      
      const liveUploadUrl = 'https://thaiba-garden-media-manager.vercel.app/api/chat/upload/';
      if (uploadUrl != liveUploadUrl) {
        print('[CHAT_UPLOAD] Failover: Attempting direct upload to live production proxy: $liveUploadUrl');
        try {
          final dioClient = dio.Dio();
          final formData = dio.FormData.fromMap({
            'roomId': _roomId,
            'file': await dio.MultipartFile.fromFile(
              file.path,
              filename: file.path.split('/').last,
            ),
          });

          final response = await dioClient.post(
            liveUploadUrl,
            data: formData,
            options: dio.Options(
              followRedirects: true,
              validateStatus: (status) => status! < 500,
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 30),
            ),
          );

          if (response.statusCode == 201 || response.statusCode == 200) {
            print('[CHAT_UPLOAD] Failover upload Succeeded!');
            return Map<String, dynamic>.from(response.data);
          } else {
            print('[CHAT_UPLOAD] Failover upload failed with status: ${response.statusCode}');
          }
        } catch (failoverError) {
          print('[CHAT_UPLOAD] Direct failover upload failed: $failoverError');
        }
      }
    }
    return null;
  }

  Future<void> sendMessage(
    String text, {
    String? mediaUrl,
    String? mediaType,
    String? driveFileId,
  }) async {
    final client = _ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) return;

    final messageId = const Uuid().v4();
    final now = DateTime.now().toUtc();

    final senderProfile = _ref.read(currentUserProfileProvider).value;
    final tenantId = senderProfile?['tenant_id'] ?? user.userMetadata?['tenant_id'] ?? '7bc0bbe7-1943-4929-a769-5fdfbc487446';

    final payload = {
      'id': messageId,
      'room_id': _roomId,
      'sender_id': user.id,
      'text': text,
      'media_url': mediaUrl,
      'media_type': mediaType ?? 'text', // Default to 'text' to satisfy database NOT-NULL constraint
      'drive_file_id': driveFileId,
      'tenant_id': tenantId,
      'created_at': now.toIso8601String(),
    };

    try {
      print('[SEND_MESSAGE] Preparing payload for message: "$text", mediaUrl: $mediaUrl, driveFileId: $driveFileId');
      // Optimistic state update
      final senderName = senderProfile?['full_name'] as String?;
      final senderAvatar = senderProfile?['avatar_url'] as String?;

      final optimisticMsg = ChatMessage(
        id: messageId,
        roomId: _roomId,
        senderId: user.id,
        text: text,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        driveFileId: driveFileId,
        createdAt: now.toLocal(), // Use local timezone for optimistic display matching
        senderName: senderName ?? 'You',
        senderAvatar: senderAvatar,
      );

      state.whenData((currentList) {
        state = AsyncValue.data([...currentList, optimisticMsg]);
      });

      // Insert message in Supabase
      print('[SEND_MESSAGE] Inserting to Supabase...');
      await client.from('chat_messages').insert(payload);
      print('[SEND_MESSAGE] Supabase insertion successful.');

      // Play successful sent delivery sound + haptic feedback
      _ref.read(audioServiceProvider).playMessageSent();

      // Update room last message preview
      String preview = text;
      if (mediaType == 'audio' || mediaType == 'voice') {
         int? seconds = int.tryParse(text);
         if (seconds != null) {
            String minutes = (seconds ~/ 60).toString();
            String secs = (seconds % 60).toString().padLeft(2, '0');
            preview = 'Voice note ($minutes:$secs)';
         } else {
            preview = 'Voice note';
         }
      } else if (preview.isEmpty && mediaType != null) {
        preview = 'Sent a $mediaType';
      }

      print('[SEND_MESSAGE] Updating room last message preview...');
      await client.from('chat_rooms').update({
        'last_message_preview': preview,
        'last_message_time': now.toIso8601String(),
      }).eq('id', _roomId);
      print('[SEND_MESSAGE] Room update successful.');

    } catch (e, stackTrace) {
      print('[SEND_MESSAGE_ERROR] Failed to send message: $e');
      print('[SEND_MESSAGE_ERROR] Stacktrace: $stackTrace');
      // Rollback on error or refresh
      fetchMessages();
    }
  }

  Future<void> editMessage(String messageId, String newText) async {
    final client = _ref.read(supabaseClientProvider);
    try {
      await client
          .from('chat_messages')
          .update({
            'text': newText,
            'is_edited': true,
          })
          .eq('id', messageId);

      // Locally update immediately (optimistic update)
      state.whenData((currentList) {
        state = AsyncValue.data(
          currentList.map((m) {
            if (m.id == messageId) {
              return ChatMessage(
                id: m.id,
                roomId: m.roomId,
                senderId: m.senderId,
                text: newText,
                mediaUrl: m.mediaUrl,
                mediaType: m.mediaType,
                driveFileId: m.driveFileId,
                tenantId: m.tenantId,
                createdAt: m.createdAt,
                isEdited: true,
                isDeleted: m.isDeleted,
                senderName: m.senderName,
                senderAvatar: m.senderAvatar,
              );
            }
            return m;
          }).toList(),
        );
      });
    } catch (e) {
      print('[EDIT_MESSAGE_ERROR] Failed to edit message: $e');
    }
  }

  Future<void> deleteMessage(String messageId) async {
    final client = _ref.read(supabaseClientProvider);
    try {
      await client
          .from('chat_messages')
          .update({
            'text': null,
            'media_url': null,
            'drive_file_id': null,
            'is_deleted': true,
          })
          .eq('id', messageId);

      // Check if this was the latest message in the room, if so, update room preview
      try {
        final latestMsgRes = await client
            .from('chat_messages')
            .select('id')
            .eq('room_id', _roomId)
            .order('created_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (latestMsgRes != null && latestMsgRes['id'] == messageId) {
          await client.from('chat_rooms').update({
            'last_message_preview': 'Message was deleted',
          }).eq('id', _roomId);
          
          // Refresh rooms list
          _ref.read(chatRoomsProvider.notifier).fetchRooms(isBackgroundRefresh: true);
        }
      } catch (previewErr) {
        print('[DELETE_MESSAGE_PREVIEW_ERROR] Failed to update room preview: $previewErr');
      }

      // Locally update immediately (optimistic update)
      state.whenData((currentList) {
        state = AsyncValue.data(
          currentList.map((m) {
            if (m.id == messageId) {
              return ChatMessage(
                id: m.id,
                roomId: m.roomId,
                senderId: m.senderId,
                text: '',
                mediaUrl: null,
                mediaType: m.mediaType,
                driveFileId: null,
                tenantId: m.tenantId,
                createdAt: m.createdAt,
                isEdited: m.isEdited,
                isDeleted: true,
                senderName: m.senderName,
                senderAvatar: m.senderAvatar,
              );
            }
            return m;
          }).toList(),
        );
      });
    } catch (e) {
      print('[DELETE_MESSAGE_ERROR] Failed to delete message: $e');
    }
  }

  Future<bool> clearChat() async {
    final client = _ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) return false;

    String baseUrl = EnvConfig.current.apiBaseUrl;
    if (Platform.isAndroid && baseUrl.contains('localhost')) {
      baseUrl = baseUrl.replaceAll('localhost', '10.0.2.2');
    }

    final sanitizedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final clearUrl = '$sanitizedBase/api/chat/rooms/$_roomId/clear/?userId=${user.id}';

    try {
      final dioClient = dio.Dio();
      final response = await dioClient.delete(
        clearUrl,
        options: dio.Options(
          followRedirects: true,
          validateStatus: (status) => status! < 500,
        ),
      );

      if (response.statusCode == 200) {
        state = const AsyncValue.data([]);
        
        // Force refresh rooms list so the dynamic unread count & last message preview are updated
        _ref.read(chatRoomsProvider.notifier).fetchRooms(isBackgroundRefresh: true);
        return true;
      } else {
        print('[CLEAR_CHAT] Clear failed with status: ${response.statusCode}, body: ${response.data}');
      }
    } catch (e) {
      print('[CLEAR_CHAT_ERROR] Clear failed on $clearUrl: $e');
    }
    return false;
  }

  @override
  void dispose() {
    _messagesPollingTimer?.cancel();
    super.dispose();
  }
}

/// Global provider for total unread chat messages count.
final unreadChatMessagesCountProvider = Provider<int>((ref) {
  final roomsAsync = ref.watch(chatRoomsProvider);
  return roomsAsync.maybeWhen(
    data: (rooms) {
      int total = 0;
      for (final room in rooms) {
        total += room.unreadCount;
      }
      return total;
    },
    orElse: () => 0,
  );
});

/// Create a new chat room (DM or Group) in the database.
final chatCreationProvider = Provider((ref) {
  return ChatCreationService(ref);
});

class ChatCreationService {
  final Ref _ref;

  ChatCreationService(this._ref);

  Future<String> getOrCreateDirectChat(String otherUserId) async {
    final client = _ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    // 1. Check if direct chat already exists
    // Query rooms where is_media_team_only is false and current user and other user are participants
    final myRoomsRes = await client
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id);

    final List<String> myRoomIds = (myRoomsRes as List)
        .map((p) => p['room_id'] as String)
        .toList();

    if (myRoomIds.isNotEmpty) {
      final matchingParticipant = await client
          .from('chat_participants')
          .select('room_id')
          .inFilter('room_id', myRoomIds)
          .eq('user_id', otherUserId)
          .maybeSingle();

      if (matchingParticipant != null) {
        return matchingParticipant['room_id'] as String;
      }
    }

    // 2. Direct chat doesn't exist, create it!
    final roomId = const Uuid().v4();
    final now = DateTime.now().toUtc().toIso8601String();

    // Create Room
    await client.from('chat_rooms').insert({
      'id': roomId,
      'name': '', // Empty name for direct messaging
      'is_media_team_only': false,
      'created_by': user.id,
      'created_at': now,
      'last_message_time': now,
      'last_message_preview': 'Conversation started',
    });

    // Create Participants
    await client.from('chat_participants').insert([
      {
        'id': const Uuid().v4(),
        'room_id': roomId,
        'user_id': user.id,
        'role': 'creator',
        'created_at': now,
      },
      {
        'id': const Uuid().v4(),
        'room_id': roomId,
        'user_id': otherUserId,
        'role': 'member',
        'created_at': now,
      }
    ]);

    // Force refresh of rooms list
    _ref.read(chatRoomsProvider.notifier).fetchRooms();

    return roomId;
  }

  Future<String> createGroupChat(String name) async {
    final client = _ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final roomId = const Uuid().v4();
    final now = DateTime.now().toUtc().toIso8601String();

    // Create Room
    await client.from('chat_rooms').insert({
      'id': roomId,
      'name': name,
      'is_media_team_only': false,
      'created_by': user.id,
      'created_at': now,
      'last_message_time': now,
      'last_message_preview': 'Group created',
    });

    // Create Participant for current user as 'creator'
    await client.from('chat_participants').insert({
      'id': const Uuid().v4(),
      'room_id': roomId,
      'user_id': user.id,
      'role': 'creator',
      'created_at': now,
    });

    // Automatically add all other Media & IT Team members as default participants
    final profilesRes = await client.from('profiles').select('id');
    final profiles = profilesRes as List;
    final List<Map<String, dynamic>> participants = [];
    for (final p in profiles) {
      final uid = p['id'] as String;
      if (uid != user.id) {
        participants.add({
          'id': const Uuid().v4(),
          'room_id': roomId,
          'user_id': uid,
          'role': 'member',
          'created_at': now,
        });
      }
    }

    if (participants.isNotEmpty) {
      await client.from('chat_participants').insert(participants);
    }

    // Force refresh of rooms list
    _ref.read(chatRoomsProvider.notifier).fetchRooms();

    return roomId;
  }
}

// ─── Pinned Chats Storage Provider ───────────────────────────────────────────

final pinnedRoomsProvider = StateNotifierProvider<PinnedRoomsNotifier, Set<String>>((ref) {
  return PinnedRoomsNotifier();
});

class PinnedRoomsNotifier extends StateNotifier<Set<String>> {
  PinnedRoomsNotifier() : super({}) {
    _loadFromHive();
  }

  static const _boxName = 'chat_preferences';
  static const _key = 'pinned_rooms';

  Future<void> _loadFromHive() async {
    final box = await Hive.openBox(_boxName);
    final list = box.get(_key) as List?;
    if (list != null) {
      state = list.cast<String>().toSet();
    }
  }

  Future<void> togglePin(String roomId) async {
    final box = await Hive.openBox(_boxName);
    final newState = Set<String>.from(state);
    if (newState.contains(roomId)) {
      newState.remove(roomId);
    } else {
      newState.add(roomId);
    }
    state = newState;
    await box.put(_key, newState.toList());
  }
}

// ─── Unread Chats Storage Provider ───────────────────────────────────────────

final unreadRoomsProvider = StateNotifierProvider<UnreadRoomsNotifier, Set<String>>((ref) {
  return UnreadRoomsNotifier();
});

class UnreadRoomsNotifier extends StateNotifier<Set<String>> {
  UnreadRoomsNotifier() : super({}) {
    _loadFromHive();
  }

  static const _boxName = 'chat_preferences';
  static const _key = 'unread_rooms';

  Future<void> _loadFromHive() async {
    final box = await Hive.openBox(_boxName);
    final list = box.get(_key) as List?;
    if (list != null) {
      state = list.cast<String>().toSet();
    }
  }

  Future<void> toggleUnread(String roomId) async {
    final box = await Hive.openBox(_boxName);
    final newState = Set<String>.from(state);
    if (newState.contains(roomId)) {
      newState.remove(roomId);
    } else {
      newState.add(roomId);
    }
    state = newState;
    await box.put(_key, newState.toList());
  }
}
