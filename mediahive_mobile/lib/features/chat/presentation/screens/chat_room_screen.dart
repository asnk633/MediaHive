import 'dart:ui';
import 'dart:io';
import 'dart:async';

import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/utils/url_helpers.dart';
import 'package:mediahive_mobile/core/utils/media_cache_manager.dart';
import 'package:mediahive_mobile/features/chat/presentation/widgets/cached_chat_image.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'pdf_viewer_screen.dart';
import 'image_viewer_screen.dart';
import 'package:mediahive_mobile/features/files/domain/models/file_asset.dart';
import 'package:mediahive_mobile/features/files/presentation/widgets/file_detail_modal.dart';
import '../../../../core/utils/file_download_helper.dart';
import '../providers/chat_providers.dart';
import '../../domain/models/chat_room.dart';
import 'package:mediahive_mobile/core/services/audio_service.dart';
import 'package:video_player/video_player.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:video_compress/video_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record/record.dart';

class ChatRoomScreen extends ConsumerStatefulWidget {
  final String roomId;
  final ChatRoom? roomExtra;

  const ChatRoomScreen({
    super.key,
    required this.roomId,
    this.roomExtra,
  });

  @override
  ConsumerState<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends ConsumerState<ChatRoomScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _messageFocusNode = FocusNode();
  bool _showScrollButton = false;
  bool _showEmojiPicker = false;
  final ImagePicker _picker = ImagePicker();
  
  bool _showAttachmentMenu = false;
  bool _isUploading = false;
  String? _uploadType;
  String _uploadStatus = '';

  // Simulated Voice Note state
  bool _isRecordingVoice = false;
  int _voiceSeconds = 0;
  Timer? _voiceTimer;
  final AudioRecorder _audioRecorder = AudioRecorder();

  String _myRole = 'member';
  int _unreadCount = 0;

  Future<void> _fetchMyRole() async {
    final client = ref.read(supabaseClientProvider);
    final user = client.auth.currentUser;
    if (user == null) return;
    try {
      final participant = await client
          .from('chat_participants')
          .select('role')
          .eq('room_id', widget.roomId)
          .eq('user_id', user.id)
          .maybeSingle();
      if (participant != null && mounted) {
        setState(() {
          _myRole = participant['role'] as String? ?? 'member';
        });
      }
    } catch (e) {
      print('[ROLE_FETCH_ERROR] Error fetching user role: $e');
    }
  }

  void _showOptionsSheet(ChatMessage msg, bool isMe, ThemeColors colors) {
    final isLight = !colors.isDark;
    final showEdit = isMe && (msg.mediaUrl == null || msg.mediaUrl!.isEmpty);
    final showDelete = isMe || _myRole.toLowerCase() == 'manager' || _myRole.toLowerCase() == 'creator';

    if (!showEdit && !showDelete) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isLight ? Colors.white : colors.backgroundPrimary,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border.all(
              color: isLight ? DesignTokens.lightBorder : colors.border,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.textSecondary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              if (showEdit)
                ListTile(
                  leading: Icon(LucideIcons.pencil, color: colors.honey),
                  title: Text(
                    'Edit Message',
                    style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _showEditDialog(msg);
                  },
                ),
              if (showDelete)
                ListTile(
                  leading: const Icon(LucideIcons.trash2, color: Colors.redAccent),
                  title: const Text(
                    'Delete Message',
                    style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _showDeleteConfirmDialog(msg);
                  },
                ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _showEditDialog(ChatMessage msg) {
    final colors = ref.read(themeColorsProvider);
    final controller = TextEditingController(text: msg.text);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: colors.surface,
          title: Text('Edit Message', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold)),
          content: TextField(
            controller: controller,
            style: TextStyle(color: colors.textPrimary),
            maxLines: null,
            decoration: InputDecoration(
              hintText: 'Enter new text...',
              hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5)),
              focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: colors.honey)),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
            ),
            TextButton(
              onPressed: () async {
                final newText = controller.text.trim();
                if (newText.isNotEmpty) {
                  Navigator.pop(context);
                  await ref.read(chatMessagesProvider(widget.roomId).notifier).editMessage(msg.id, newText);
                }
              },
              child: Text('Save', style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteConfirmDialog(ChatMessage msg) {
    final colors = ref.read(themeColorsProvider);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: colors.surface,
          title: const Text('Delete Message', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          content: Text('Are you sure you want to delete this message?', style: TextStyle(color: colors.textPrimary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                await ref.read(chatMessagesProvider(widget.roomId).notifier).deleteMessage(msg.id);
              },
              child: const Text('Delete', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showClearChatConfirmDialog() {
    final colors = ref.read(themeColorsProvider);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: colors.surface,
          title: Text(
            'Clear Chat History',
            style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold),
          ),
          content: Text(
            'Are you sure you want to clear this conversation? This will permanently wipe all text message records from Supabase to free up database storage. Drive attachment files will remain saved.',
            style: TextStyle(color: colors.textPrimary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context); // close confirm dialog
                Navigator.pop(context); // close bottom sheet
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Clearing chat messages...'),
                    backgroundColor: Colors.indigo,
                    duration: Duration(seconds: 1),
                  ),
                );

                final success = await ref
                    .read(chatMessagesProvider(widget.roomId).notifier)
                    .clearChat();

                if (success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Chat messages cleared successfully.'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to clear chat messages.'),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              },
              child: Text(
                'Clear',
                style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _updateLastRead() async {
    try {
      final box = await Hive.openBox('chat_preferences');
      await box.put('last_read_${widget.roomId}', DateTime.now().toUtc().toIso8601String());
      // Refresh the chat rooms list to clear unread indicator
      ref.read(chatRoomsProvider.notifier).fetchRooms(isBackgroundRefresh: true);
    } catch (e) {
      debugPrint('[CHAT_ROOM] Error updating last read: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    _updateLastRead();
    _messageFocusNode.addListener(() {
      if (_messageFocusNode.hasFocus && _showEmojiPicker) {
        setState(() => _showEmojiPicker = false);
      }
    });

    _scrollController.addListener(() {
      if (!_scrollController.hasClients) return;
      final isScrolledUp = _scrollController.position.maxScrollExtent - _scrollController.offset > 200;
      if (_showScrollButton != isScrolledUp) {
        setState(() {
          _showScrollButton = isScrolledUp;
          if (!isScrolledUp) _unreadCount = 0;
        });
      } else if (!isScrolledUp && _unreadCount > 0) {
        setState(() {
          _unreadCount = 0;
        });
      }
    });

    _fetchMyRole();
  }

  @override
  void dispose() {
    _updateLastRead();
    _messageController.dispose();
    _scrollController.dispose();
    _messageFocusNode.dispose();
    _voiceTimer?.cancel();
    _audioRecorder.dispose();
    super.dispose();
  }

  bool _initialScrollDone = false;

  void _scrollToBottom({bool instant = false, bool force = false}) {
    if (_scrollController.hasClients) {
      if (!force && !instant) {
        final isNearBottom = _scrollController.position.maxScrollExtent - _scrollController.offset < 150;
        if (!isNearBottom) return; // Don't auto-scroll if user is looking at past messages
      }
      if (instant) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      } else {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    }
  }

  Future<void> _stopAndSendVoiceNote() async {
    try {
      ref.read(audioServiceProvider).playVoiceStop();
      _voiceTimer?.cancel();
      final duration = _voiceSeconds;
      
      setState(() {
        _isRecordingVoice = false;
      });

      final String? filePath = await _audioRecorder.stop();
      
      if (duration < 1) {
        _showError('Voice note too short');
        return;
      }

      if (filePath != null) {
        final File audioFile = File(filePath);
        if (await audioFile.exists()) {
          await _uploadAndSend(audioFile, 'voice', duration: duration);
        } else {
          _showError('Recorded audio file not found');
        }
      } else {
        _showError('Failed to capture audio path');
      }
    } catch (e) {
      _showError('Failed to stop recording: $e');
    }
  }

  Future<void> _cancelVoiceNote() async {
    try {
      _voiceTimer?.cancel();
      setState(() {
        _isRecordingVoice = false;
      });
      await _audioRecorder.stop();
    } catch (e) {
      debugPrint('[VOICE_RECORD] Error canceling voice note: $e');
    }
  }

  // File Uploader & Message Sender Helper
  Future<void> _uploadAndSend(File file, String type, {int? duration}) async {
    setState(() {
      _isUploading = true;
      _uploadType = type;
      _uploadStatus = 'Uploading $type...';
      _showAttachmentMenu = false;
    });

    try {
      final uploadRes = await ref.read(chatMessagesProvider(widget.roomId).notifier).uploadChatFile(file);
      if (uploadRes != null) {
        final url = uploadRes['url'] as String?;
        final fileId = uploadRes['fileId'] as String?;
        final name = uploadRes['name'] as String? ?? 'Attachment';
        
        // Resolve type based on MIME or name, but preserve 'document' if explicitly chosen to support file mode
        String resolvedType = type;
        if (type != 'document' && uploadRes['type'] != null) {
          final String mime = uploadRes['type'] as String;
          if (mime.startsWith('image/')) {
            resolvedType = 'image';
          } else if (mime.startsWith('video/')) resolvedType = 'video';
          else if (mime.startsWith('audio/')) resolvedType = 'voice';
          else resolvedType = 'document';
        }

        await ref.read(chatMessagesProvider(widget.roomId).notifier).sendMessage(
          duration != null ? duration.toString() : name, // Pass recorded duration or original filename
          mediaUrl: url,
          mediaType: resolvedType,
          driveFileId: fileId,
        );
      } else {
        _showError('Upload failed. Please try again.');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      setState(() {
        _isUploading = false;
        _uploadType = null;
      });
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: Colors.redAccent,
    ));
  }

  Future<File> _compressImage(File file) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final targetPath = '${tempDir.path}/img_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final compressedFile = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 70,
      );
      if (compressedFile != null) {
        return File(compressedFile.path);
      }
    } catch (e) {
      debugPrint("Image compression error: $e");
    }
    return file;
  }

  Future<File> _compressVideo(File file) async {
    try {
      setState(() {
        _uploadStatus = 'Compressing video...';
        _isUploading = true;
      });
      final MediaInfo? mediaInfo = await VideoCompress.compressVideo(
        file.path,
        quality: VideoQuality.MediumQuality,
        deleteOrigin: false,
      );
      if (mediaInfo != null && mediaInfo.file != null) {
        return mediaInfo.file!;
      }
    } catch (e) {
      debugPrint("Video compression error: $e");
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
    return file;
  }

  // 1. Take Photo
  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
      if (photo != null) {
        final compressed = await _compressImage(File(photo.path));
        await _uploadAndSend(compressed, 'image');
      }
    } catch (e) {
      _showError('Camera error: $e');
    }
  }

  // 1b. Record Video
  Future<void> _recordVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(source: ImageSource.camera);
      if (video != null) {
        final compressed = await _compressVideo(File(video.path));
        await _uploadAndSend(compressed, 'video');
      }
    } catch (e) {
      _showError('Camera video error: $e');
    }
  }

  // Camera Options Menu (Photo vs Video)
  Future<void> _showCameraOptions() async {
    try {
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) {
          final colors = ref.read(themeColorsProvider);
          final isLight = !colors.isDark;
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isLight ? Colors.white : colors.backgroundPrimary,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
              border: Border.all(
                color: isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: colors.textSecondary.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Text(
                  'Camera Capture',
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                ListTile(
                  leading: const Icon(LucideIcons.camera, color: Colors.blueAccent),
                  title: Text('Take Photo', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.pop(context);
                    _takePhoto();
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.video, color: Colors.redAccent),
                  title: Text('Record Video', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.pop(context);
                    _recordVideo();
                  },
                ),
              ],
            ),
          );
        },
      );
    } catch (e) {
      _showError('Error showing camera options: $e');
    }
  }

  // 2. Pick Video or Photo
  Future<void> _pickMedia() async {
    try {
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (context) {
          final colors = ref.read(themeColorsProvider);
          final isLight = !colors.isDark;
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isLight ? Colors.white : colors.backgroundPrimary,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(LucideIcons.image, color: Colors.blueAccent),
                  title: Text('Select Photo', style: TextStyle(color: colors.textPrimary)),
                  onTap: () async {
                    Navigator.pop(context);
                    final XFile? file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                    if (file != null) {
                      final compressed = await _compressImage(File(file.path));
                      await _uploadAndSend(compressed, 'image');
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.video, color: Colors.purpleAccent),
                  title: Text('Select Video', style: TextStyle(color: colors.textPrimary)),
                  onTap: () async {
                    Navigator.pop(context);
                    final XFile? file = await _picker.pickVideo(source: ImageSource.gallery);
                    if (file != null) {
                      final compressed = await _compressVideo(File(file.path));
                      await _uploadAndSend(compressed, 'video');
                    }
                  },
                ),
              ],
            ),
          );
        },
      );
    } catch (e) {
      _showError('Gallery error: $e');
    }
  }

  // 3. Send Document File (all types)
  Future<void> _pickDocument() async {
    try {
      final FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.any);
      if (result != null && result.files.single.path != null) {
        await _uploadAndSend(File(result.files.single.path!), 'document');
      }
    } catch (e) {
      _showError('File picker error: $e');
    }
  }

  // 4. Real Voice Note Recording
  Future<void> _startVoiceNote() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        // Pause all other media playing in the chatroom
        ChatMediaManager.play('');
        
        // Request exclusive audio focus to pause background music player apps like Spotify
        await AudioPlayer.global.setAudioContext(AudioContext(
          android: const AudioContextAndroid(
            isSpeakerphoneOn: true,
            stayAwake: true,
            contentType: AndroidContentType.music,
            usageType: AndroidUsageType.media,
            audioFocus: AndroidAudioFocus.gain,
          ),
          iOS: AudioContextIOS(
            category: AVAudioSessionCategory.playAndRecord,
            options: {
              AVAudioSessionOptions.defaultToSpeaker,
            },
          ),
        ));

        final tempDir = await getTemporaryDirectory();
        final path = '${tempDir.path}/voice_note_${DateTime.now().millisecondsSinceEpoch}.m4a';
        
        await ref.read(audioServiceProvider).playVoiceStart();
        // Wait for the beep sound effect to complete so the microphone capture starts cleanly
        await Future.delayed(const Duration(milliseconds: 500));
        
        await _audioRecorder.start(
          const RecordConfig(
            encoder: AudioEncoder.aacLc,
            sampleRate: 44100,
            bitRate: 128000,
          ),
          path: path,
        );

        setState(() {
          _isRecordingVoice = true;
          _voiceSeconds = 0;
          _showAttachmentMenu = false;
        });

        _voiceTimer?.cancel();
        _voiceTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
          setState(() {
            _voiceSeconds++;
          });
        });
      } else {
        _showError('Microphone permission is required to record voice notes');
      }
    } catch (e) {
      _showError('Failed to start recording: $e');
    }
  }



  String _formatDateHeader(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final checkDate = DateTime(date.year, date.month, date.day);

    if (checkDate == today) {
      return 'TODAY';
    } else if (checkDate == yesterday) {
      return 'YESTERDAY';
    } else {
      final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (now.difference(date).inDays < 7) {
        return weekdays[date.weekday - 1].toUpperCase();
      }
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;
    final messagesAsync = ref.watch(chatMessagesProvider(widget.roomId));
    final client = ref.read(supabaseClientProvider);
    final currentUser = client.auth.currentUser;

    // Use extra if available, otherwise fallback name/avatar
    final roomTitle = widget.roomExtra?.displayName ?? 'Chat';
    final roomAvatar = widget.roomExtra?.displayAvatar;

    // Schedule scroll to bottom when new messages arrive
    ref.listen(chatMessagesProvider(widget.roomId), (prev, next) {
      next.whenData((messages) {
        if (prev?.value != null && messages.length > prev!.value!.length) {
          final newMsgsCount = messages.length - prev!.value!.length;
          final newMsg = messages.last;
          
          if (newMsg.senderId != currentUser?.id) {
            final isVoiceNote = newMsg.mediaType == 'voice' || newMsg.mediaType == 'audio';
            if (isVoiceNote) {
              // Request exclusive audio focus to pause background music player apps like Spotify
              AudioPlayer.global.setAudioContext(AudioContext(
                android: AudioContextAndroid(
                  isSpeakerphoneOn: true,
                  stayAwake: true,
                  contentType: AndroidContentType.music,
                  usageType: AndroidUsageType.media,
                  audioFocus: AndroidAudioFocus.gain,
                ),
                iOS: AudioContextIOS(
                  category: AVAudioSessionCategory.playback,
                  options: {
                    AVAudioSessionOptions.defaultToSpeaker,
                  },
                ),
              ));
            }
            ref.read(audioServiceProvider).playMessageReceived();
          }

          final isScrolledUp = _scrollController.hasClients && 
              (_scrollController.position.maxScrollExtent - _scrollController.offset > 150);

          if (newMsg.senderId != currentUser?.id && isScrolledUp) {
            setState(() {
              _unreadCount += newMsgsCount;
            });
          } else {
            _updateLastRead();
          }
        }
        Future.delayed(const Duration(milliseconds: 100), () => _scrollToBottom(instant: false, force: false));
      });
    });

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      floatingActionButton: _showScrollButton && _unreadCount == 0 ? Padding(
        padding: EdgeInsets.only(bottom: _isRecordingVoice ? 120.0 : 80.0),
        child: FloatingActionButton(
          mini: true,
          backgroundColor: colors.honey,
          onPressed: () => _scrollToBottom(instant: false, force: true),
          child: const Icon(Icons.arrow_downward, color: Colors.white, size: 20),
        ),
      ) : null,
      body: Stack(
        children: [
          // Background layout
          Column(
            children: [
              // Custom Frosted Header for Chat
              ClipRect(
                child: BackdropFilter(
                  filter: isLight
                      ? ImageFilter.blur(sigmaX: 24, sigmaY: 24)
                      : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isLight ? Colors.white.withValues(alpha: 0.78) : colors.backgroundPrimary,
                      border: Border(
                        bottom: BorderSide(
                          color: isLight ? DesignTokens.lightBorder : colors.border,
                          width: isLight ? 0.75 : 1.0,
                        ),
                      ),
                    ),
                    child: SafeArea(
                      bottom: false,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 8, bottom: 12, left: 12, right: 16),
                        child: Row(
                          children: [
                            IconButton(
                              icon: Icon(LucideIcons.arrowLeft, color: colors.iconColor),
                              onPressed: () => context.pop(),
                            ),
                            const SizedBox(width: 8),
                            _BeautifulAvatar(
                              radius: 18,
                              imageUrl: roomAvatar,
                              name: roomTitle,
                              fallbackIcon: LucideIcons.users,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    roomTitle,
                                    style: TextStyle(
                                      color: colors.textPrimary,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Securely connected',
                                    style: TextStyle(
                                      color: colors.textSecondary.withValues(alpha: 0.6),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: Icon(LucideIcons.info, color: colors.iconColor),
                              onPressed: _showGroupInfoSheet,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // Chat Messages Stream
              Expanded(
                child: CustomPaint(
                  painter: WhatsAppWallpaperPainter(
                    isLight 
                        ? Colors.black.withValues(alpha: 0.018) 
                        : Colors.white.withValues(alpha: 0.012),
                  ),
                  child: messagesAsync.when(
                    data: (messagesList) {
                      final messages = List<ChatMessage>.from(messagesList)
                        ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

                      if (_isUploading && _uploadType == 'voice') {
                        messages.add(
                          ChatMessage(
                            id: 'uploading_mock',
                            roomId: widget.roomId,
                            senderId: currentUser?.id ?? '',
                            text: '',
                            mediaUrl: 'uploading_mock_url',
                            mediaType: 'voice',
                            createdAt: DateTime.now(),
                          ),
                        );
                      }

                      if (messages.isEmpty) {
                        return _buildEmptyMessagesState(colors);
                      }

                      // Post frame callback to ensure bottom scrolling on initial load
                      if (!_initialScrollDone) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          _scrollToBottom(instant: true, force: true);
                          // Multi-tiered delayed fail-safes to handle image and layout expansion offsets
                          Future.delayed(const Duration(milliseconds: 50), () {
                            _scrollToBottom(instant: true, force: true);
                          });
                          Future.delayed(const Duration(milliseconds: 150), () {
                            _scrollToBottom(instant: true, force: true);
                          });
                          Future.delayed(const Duration(milliseconds: 400), () {
                            _scrollToBottom(instant: false, force: true);
                          });
                          _initialScrollDone = true;
                        });
                      }

                      return ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final msg = messages[index];
                          final isMe = msg.senderId == currentUser?.id;
                          
                          // WhatsApp-style date header separator
                          bool showDateHeader = false;
                          if (index == 0) {
                            showDateHeader = true;
                          } else {
                            final prevMsg = messages[index - 1];
                            final prevDate = DateTime(prevMsg.createdAt.year, prevMsg.createdAt.month, prevMsg.createdAt.day);
                            final currDate = DateTime(msg.createdAt.year, msg.createdAt.month, msg.createdAt.day);
                            if (currDate != prevDate) {
                              showDateHeader = true;
                            }
                          }

                          final messageBubble = _buildMessageBubble(msg, isMe, colors, isLight);

                          if (showDateHeader) {
                            return Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Center(
                                  child: Container(
                                    margin: const EdgeInsets.symmetric(vertical: 12),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isLight ? Colors.black.withValues(alpha: 0.06) : colors.surface.withValues(alpha: 0.8),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isLight ? Colors.transparent : colors.border.withValues(alpha: 0.2),
                                      ),
                                    ),
                                    child: Text(
                                      _formatDateHeader(msg.createdAt),
                                      style: TextStyle(
                                        color: colors.textSecondary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ),
                                messageBubble,
                              ],
                            );
                          }

                          return messageBubble;
                        },
                      );
                    },
                    loading: () => Center(
                      child: CircularProgressIndicator(color: colors.honey),
                    ),
                    error: (err, _) => Center(
                      child: Text('Error loading messages: $err', style: TextStyle(color: colors.textSecondary)),
                    ),
                  ),
                ),
              ),

              // Uploading indicator
              if (_isUploading && _uploadType != 'voice')
                Container(
                  color: colors.backgroundSecondary.withValues(alpha: 0.8),
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                  child: Row(
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.amber),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        _uploadStatus,
                        style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),

              // Chat Input Area
              ClipRect(
                child: BackdropFilter(
                  filter: isLight
                      ? ImageFilter.blur(sigmaX: 12, sigmaY: 12)
                      : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isLight ? Colors.white.withValues(alpha: 0.8) : colors.backgroundPrimary,
                      border: Border(
                        top: BorderSide(
                          color: isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3),
                        ),
                      ),
                    ),
                    padding: EdgeInsets.only(
                      left: 16,
                      right: 16,
                      top: 10,
                      bottom: 10 + MediaQuery.of(context).padding.bottom,
                    ),
                    child: Row(
                      children: [
                        // Dynamic MIC / Record layout
                        if (_isRecordingVoice) ...[
                          Expanded(
                            child: Container(
                              height: 40,
                              decoration: BoxDecoration(
                                color: Colors.redAccent.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.3)),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Row(
                                children: [
                                  const Icon(LucideIcons.mic, color: Colors.redAccent, size: 16).animate(onPlay: (c) => c.repeat()).fadeIn(duration: 800.ms).fadeOut(duration: 800.ms),

                                  const SizedBox(width: 12),
                                  Text(
                                    'Recording Note: ${_voiceSeconds}s',
                                    style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  const Spacer(),
                                  TextButton(
                                    onPressed: _cancelVoiceNote,
                                    child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: _stopAndSendVoiceNote,
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: const BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.check, color: Colors.white, size: 16),
                            ),
                          ),
                        ] else ...[
                          // WhatsApp-style message input pill
                          Expanded(
                            child: Container(
                              decoration: BoxDecoration(
                                color: isLight ? Colors.black.withValues(alpha: 0.04) : colors.surface.withValues(alpha: 0.5),
                                borderRadius: BorderRadius.circular(28),
                                border: Border.all(
                                  color: isLight 
                                      ? Colors.grey.withValues(alpha: 0.2) 
                                      : Colors.white.withValues(alpha: 0.08),
                                ),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Row(
                                children: [

                                  // Message input text field
                                  Expanded(
                                    child: TextField(
                                      controller: _messageController,
                                      focusNode: _messageFocusNode,
                                      style: TextStyle(
                                        color: colors.textPrimary,
                                        fontSize: 15,
                                        fontFamily: '', // Explicitly clears the inherited global font to trigger Android system native emoji font fallback perfectly
                                      ),
                                      maxLines: null, // Allow expanding infinitely up to the constraints
                                      minLines: 1,
                                      keyboardType: TextInputType.multiline,
                                      textInputAction: TextInputAction.newline, // Forces enter key to trigger new line instead of send action
                                      onChanged: (text) => setState(() {}),
                                      decoration: InputDecoration(
                                        hintText: 'Message',
                                        hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.4)),
                                        border: InputBorder.none,
                                        enabledBorder: InputBorder.none,
                                        focusedBorder: InputBorder.none,
                                        disabledBorder: InputBorder.none,
                                        errorBorder: InputBorder.none,
                                        focusedErrorBorder: InputBorder.none,
                                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                                      ),
                                    ),
                                  ),
                                  // Expanding + button trigger
                                  GestureDetector(
                                    onTap: () => setState(() => _showAttachmentMenu = !_showAttachmentMenu),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 300),
                                      curve: Curves.easeInOut,
                                      width: 22,
                                      height: 22,
                                      margin: const EdgeInsets.symmetric(horizontal: 6),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _showAttachmentMenu ? colors.honey : Colors.transparent,
                                        border: Border.all(
                                          color: _showAttachmentMenu ? colors.honey : colors.textSecondary.withValues(alpha: 0.2),
                                          width: 1.2,
                                        ),
                                      ),
                                      child: AnimatedRotation(
                                        turns: _showAttachmentMenu ? 0.125 : 0, // 45 degrees
                                        duration: const Duration(milliseconds: 300),
                                        curve: Curves.easeInOut,
                                        child: TweenAnimationBuilder<Color?>(
                                          duration: const Duration(milliseconds: 300),
                                          tween: ColorTween(
                                            begin: colors.textSecondary.withValues(alpha: 0.5),
                                            end: _showAttachmentMenu 
                                                ? Colors.white 
                                                : colors.textSecondary.withValues(alpha: 0.5),
                                          ),
                                          builder: (context, color, child) {
                                            return Icon(
                                              LucideIcons.plus,
                                              color: color,
                                              size: 13,
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                  // Camera capture shortcut
                                  GestureDetector(
                                    onTap: _showCameraOptions,
                                    child: Padding(
                                      padding: const EdgeInsets.only(left: 6),
                                      child: Icon(
                                        LucideIcons.camera,
                                        color: colors.textSecondary.withValues(alpha: 0.5),
                                        size: 22,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Dynamic circular send/mic action button
                          GestureDetector(
                            onTap: _messageController.text.trim().isNotEmpty
                                ? _handleSend
                                : _startVoiceNote,
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: colors.honey,
                                shape: BoxShape.circle,
                                boxShadow: isLight ? DesignTokens.spatialGlowBlue : [],
                              ),
                              child: Center(
                                child: Icon(
                                  _messageController.text.trim().isNotEmpty
                                      ? LucideIcons.send
                                      : LucideIcons.mic,
                                  color: Colors.black87,
                                  size: 18,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),


            ],
          ),

          // Premium Vertical Attachment Popup
          if (_showAttachmentMenu) ...[
            // Backdrop tap-to-close with transparent detector
            Positioned.fill(
              child: GestureDetector(
                onTap: () => setState(() => _showAttachmentMenu = false),
                child: Container(
                  color: Colors.transparent,
                ),
              ),
            ),
            // Floating vertical attachment list
            Positioned(
              bottom: 74 + MediaQuery.of(context).padding.bottom,
              right: 112,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _buildPremiumAttachmentOption(
                    icon: LucideIcons.folderOpen,
                    label: 'Files',
                    gradientColors: [colors.honey, colors.indigo],
                    onTap: () {
                      setState(() => _showAttachmentMenu = false);
                      _pickDocument();
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildPremiumAttachmentOption(
                    icon: LucideIcons.image,
                    label: 'Gallery',
                    gradientColors: [colors.honey, colors.indigo],
                    onTap: () {
                      setState(() => _showAttachmentMenu = false);
                      _pickMedia();
                    },
                  ),
                ],
              ).animate()
                  .fadeIn(duration: 180.ms)
                  .slideY(begin: 0.15, end: 0, duration: 250.ms, curve: Curves.easeOutCubic)
                  .scale(begin: const Offset(0.92, 0.92), end: const Offset(1, 1), duration: 250.ms, curve: Curves.easeOutCubic),
            ),
          ],

          // Premium Floating Unread Message Pill Banner
          if (_showScrollButton && _unreadCount > 0)
            Positioned(
              bottom: 74 + MediaQuery.of(context).padding.bottom,
              left: 0,
              right: 0,
              child: Center(
                child: GestureDetector(
                  onTap: () {
                    _scrollToBottom(instant: false, force: true);
                    setState(() => _unreadCount = 0);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: colors.honey,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: colors.honey.withValues(alpha: 0.4),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.arrowDown, color: Colors.black87, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '$_unreadCount New',
                          style: const TextStyle(
                            color: Colors.black87,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
            ),
        ],
      ),
    );
  }

  Widget _buildAttachmentItem({
    required IconData icon,
    required String label,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    final colors = ref.read(themeColorsProvider);
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: gradient,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumAttachmentOption({
    required IconData icon,
    required String label,
    required List<Color> gradientColors,
    required VoidCallback onTap,
  }) {
    final colors = ref.read(themeColorsProvider);
    final isLight = Theme.of(context).brightness == Brightness.light;
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: isLight ? Colors.white.withValues(alpha: 0.95) : colors.surface.withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isLight ? Colors.grey.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.08),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Text(
              label,
              style: TextStyle(
                color: colors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradientColors,
              ),
              boxShadow: [
                BoxShadow(
                  color: gradientColors.first.withValues(alpha: 0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Icon(icon, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Color _getSenderColor(String senderId) {
    final int hash = senderId.hashCode;
    final List<Color> colors = [
      Colors.blueAccent,
      Colors.greenAccent,
      Colors.orangeAccent,
      Colors.pinkAccent,
      Colors.purpleAccent,
      Colors.tealAccent,
      Colors.redAccent,
      Colors.indigoAccent,
      Colors.amberAccent,
    ];
    return colors[hash.abs() % colors.length];
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isMe, ThemeColors colors, bool isLight) {
    final hasAttachment = msg.mediaUrl != null && msg.mediaUrl!.isNotEmpty;
    
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!isMe) ...[
              _BeautifulAvatar(
                radius: 12,
                imageUrl: msg.senderAvatar,
                name: msg.senderName,
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: GestureDetector(
                onLongPress: () => _showOptionsSheet(msg, isMe, colors),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: isMe && !isLight
                        ? const LinearGradient(
                            colors: [Color(0xFF2C2C2C), Color(0xFF383838)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    color: isMe
                        ? (isLight ? const Color(0xFFEAEAEA) : null)
                        : (isLight ? Colors.white.withValues(alpha: 0.9) : colors.surface),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: isMe ? const Radius.circular(20) : const Radius.circular(4),
                      bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(20),
                    ),
                    border: Border.all(
                      color: isMe
                          ? (isLight ? Colors.transparent : Colors.white.withValues(alpha: 0.08))
                          : (isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3)),
                    ),
                    boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
                  ),
                  child: Column(
                    crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      if (msg.senderName != null) ...[
                        Text(
                          msg.senderName!,
                          style: TextStyle(
                            color: isMe ? (isLight ? colors.textPrimary.withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.9)) : _getSenderColor(msg.senderId),
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 4),
                      ],
                      
                      // Inline Attachment Rendering
                      if (hasAttachment && !msg.isDeleted) ...[
                        _renderAttachmentContent(msg, isMe, colors),
                        const SizedBox(height: 4),
                      ],

                      if (msg.isDeleted)
                        Text(
                          'This message was deleted',
                          style: TextStyle(
                            color: isMe ? (isLight ? colors.textSecondary.withValues(alpha: 0.6) : Colors.white.withValues(alpha: 0.5)) : colors.textSecondary.withValues(alpha: 0.5),
                            fontSize: 14,
                            fontStyle: FontStyle.italic,
                          ),
                        ),

                      if (!msg.isDeleted && msg.text.isNotEmpty && msg.mediaType != 'image' && msg.mediaType != 'video' && msg.mediaType != 'voice')
                        Text(
                          msg.text,
                          style: TextStyle(
                            color: isMe ? (isLight ? colors.textPrimary : Colors.white) : colors.textPrimary,
                            fontSize: 14,
                            fontFamily: '', // Explicitly clears the inherited global font to trigger Android system native emoji font fallback perfectly
                          ),
                        ),

                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (msg.isEdited && !msg.isDeleted) ...[
                            Text(
                              '(edited) ',
                              style: TextStyle(
                                color: isMe ? (isLight ? colors.textSecondary.withValues(alpha: 0.6) : Colors.white60) : colors.textSecondary.withValues(alpha: 0.4),
                                fontSize: 9,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                          Text(
                            '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                            style: TextStyle(
                              color: isMe ? (isLight ? colors.textSecondary.withValues(alpha: 0.8) : Colors.white70) : colors.textSecondary.withValues(alpha: 0.6),
                              fontSize: 9,
                            ),
                          ),
                          if (isMe) ...[
                            const SizedBox(width: 4),
                            if (msg.status == 'sending')
                              SizedBox(
                                width: 11,
                                height: 11,
                                child: CircularProgressIndicator(
                                  strokeWidth: 1.2,
                                  color: isLight ? colors.textSecondary.withValues(alpha: 0.5) : Colors.white60,
                                ),
                              )
                            else if (msg.status == 'error')
                              const Icon(
                                LucideIcons.alertCircle,
                                size: 13,
                                color: Colors.redAccent,
                              )
                            else
                              AnimatedChatTick(
                                createdAt: msg.createdAt,
                                colors: colors,
                              ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (isMe) ...[
              const SizedBox(width: 8),
              _BeautifulAvatar(
                radius: 12,
                imageUrl: msg.senderAvatar,
                name: msg.senderName,
              ),
            ],
          ],
        ),
      ),
    ).animate().fadeIn(duration: 250.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _renderAttachmentContent(ChatMessage msg, bool isMe, ThemeColors colors) {
    final isLight = !colors.isDark;
    final directUrl = UrlHelpers.getDirectImageUrl(msg.mediaUrl, driveFileId: msg.driveFileId);
    
    if (msg.mediaType == 'image') {
      return GestureDetector(
        onTap: () {
          final mediaUrl = UrlHelpers.getDirectMediaUrl(msg.mediaUrl, driveFileId: msg.driveFileId) ?? msg.mediaUrl!;
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ImageViewerScreen(
                imageUrl: mediaUrl,
                title: msg.text.isNotEmpty ? msg.text : 'Image',
              ),
            ),
          );
        },
        child: ClipRRect(
          borderRadius: BorderRadius.zero,
          child: Container(
            constraints: const BoxConstraints(maxHeight: 180, maxWidth: 240),
            color: Colors.black.withValues(alpha: 0.04),
            child: Image.network(
              directUrl ?? msg.mediaUrl!,
              fit: BoxFit.cover,
              errorBuilder: (c, e, s) => Container(
                padding: const EdgeInsets.all(16),
                child: const Icon(LucideIcons.image, color: Colors.redAccent),
              ),
            ),
          ),
        ),
      );
    }

    if (msg.mediaType == 'video') {
      final videoUrl = UrlHelpers.getDirectMediaUrl(msg.mediaUrl, driveFileId: msg.driveFileId) ?? msg.mediaUrl!;
      return InlineVideoPlayer(
        videoUrl: videoUrl,
        colors: colors,
      );
    }

    if (msg.mediaType == 'voice') {
      final actualVoiceUrl = UrlHelpers.getDirectMediaUrl(msg.mediaUrl, driveFileId: msg.driveFileId) ?? msg.mediaUrl!;
      final voiceUrl = msg.id == 'uploading_mock' ? '' : actualVoiceUrl;
      final durationSecs = int.tryParse(msg.text);
      return InlineVoicePlayer(
        audioUrl: voiceUrl,
        colors: colors,
        isMe: isMe,
        isUploading: msg.id == 'uploading_mock',
        durationSeconds: durationSecs,
      );
    }

    String filename = msg.text.isNotEmpty ? msg.text : '';
    if (filename.isEmpty && msg.mediaUrl != null) {
      try {
        final uri = Uri.parse(msg.mediaUrl!);
        filename = uri.queryParameters['fileName'] ?? 
                   uri.queryParameters['name'] ?? 
                   uri.queryParameters['filename'] ?? 
                   '';
      } catch (_) {}
    }
    if (filename.isEmpty && msg.mediaUrl != null) {
      filename = msg.mediaUrl!.split('/').last.split('?').first;
    }

    debugPrint('[DEBUG_ATTACHMENT] id: "${msg.id}", text: "${msg.text}", mediaUrl: "${msg.mediaUrl}", filename: "$filename", driveFileId: "${msg.driveFileId}"');
    return GestureDetector(
      onTap: () async {
        final directUrl = UrlHelpers.getDirectMediaUrl(msg.mediaUrl, driveFileId: msg.driveFileId);
        if (directUrl == null) return;

        // 1. Detect by filename extension first (synchronous & instant)
        String ext = filename.contains('.') ? filename.split('.').last.toLowerCase() : '';
        
        final isImageExt = ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif' || ext == 'webp';
        final isPdfExt = ext == 'pdf';
        final isVideoExt = ext == 'mp4' || ext == 'mov' || ext == 'avi' || ext == 'mkv' || ext == 'webm';
        
        if (isImageExt) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ImageViewerScreen(
                imageUrl: directUrl,
                title: filename,
              ),
            ),
          );
          return;
        }
        
        if (isPdfExt) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PdfViewerScreen(
                pdfUrl: directUrl,
                title: filename,
              ),
            ),
          );
          return;
        }

        if (isVideoExt) {
          final fileAsset = FileAsset(
            id: msg.id,
            name: filename,
            path: '',
            mimeType: 'video/$ext',
            size: 0,
            createdAt: msg.createdAt,
            downloadLink: directUrl,
            viewLink: msg.mediaUrl,
            driveFileId: msg.driveFileId,
            uploadedBy: msg.senderId,
            uploadedByName: msg.senderName,
          );
          
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => FileDetailModal(asset: fileAsset, showDeleteOption: false),
          );
          return;
        }

        // 2. If extension is missing/unknown (e.g. 'uc' or raw ID), perform a quick HEAD check to resolve Content-Type dynamically!
        bool resolvedNatively = false;
        final bool shouldCheckHeaders = ext.isEmpty || filename == 'uc';
        
        if (shouldCheckHeaders) {
          // Show progress dialog
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (BuildContext dialogContext) {
              return const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: Colors.amber),
                        SizedBox(width: 16),
                        Text("Preparing file..."),
                      ],
                    ),
                  ),
                ),
              );
            },
          );

          try {
            final dioClient = Dio();
            final response = await dioClient.head(
              directUrl,
              options: Options(
                followRedirects: true,
                validateStatus: (status) => status != null && status < 400,
              ),
            ).timeout(const Duration(seconds: 3));

            final contentType = response.headers.value('content-type')?.toLowerCase() ?? '';
            final contentDisposition = response.headers.value('content-disposition') ?? '';
            
            String parsedFilename = filename;
            if (contentDisposition.contains('filename=')) {
              final match = RegExp(r'filename="?([^";]+)"?').firstMatch(contentDisposition);
              if (match != null && match.group(1) != null) {
                parsedFilename = match.group(1)!;
              }
            }
            
            String parsedExt = parsedFilename.contains('.') ? parsedFilename.split('.').last.toLowerCase() : '';
            debugPrint('[RESOLVE_FILE] HEAD request contentType: $contentType, parsedFilename: $parsedFilename');

            if (contentType.contains('application/pdf') || parsedExt == 'pdf') {
              resolvedNatively = true;
              if (context.mounted) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => PdfViewerScreen(
                      pdfUrl: directUrl,
                      title: parsedFilename == 'uc' ? 'Document.pdf' : parsedFilename,
                    ),
                  ),
                );
              }
            } else if (contentType.startsWith('image/') || 
                       parsedExt == 'jpg' || 
                       parsedExt == 'jpeg' || 
                       parsedExt == 'png' || 
                       parsedExt == 'gif' || 
                       parsedExt == 'webp') {
              resolvedNatively = true;
              if (context.mounted) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ImageViewerScreen(
                      imageUrl: directUrl,
                      title: parsedFilename == 'uc' ? 'Image' : parsedFilename,
                    ),
                  ),
                );
              }
            } else if (contentType.startsWith('video/') || 
                       parsedExt == 'mp4' || 
                       parsedExt == 'mov' || 
                       parsedExt == 'avi' || 
                       parsedExt == 'mkv' || 
                       parsedExt == 'webm') {
              resolvedNatively = true;
              if (context.mounted) {
                final fileAsset = FileAsset(
                  id: msg.id,
                  name: parsedFilename == 'uc' ? 'Video.mp4' : parsedFilename,
                  path: '',
                  mimeType: contentType.startsWith('video/') ? contentType : 'video/$parsedExt',
                  size: 0,
                  createdAt: msg.createdAt,
                  downloadLink: directUrl,
                  viewLink: msg.mediaUrl,
                  driveFileId: msg.driveFileId,
                  uploadedBy: msg.senderId,
                  uploadedByName: msg.senderName,
                );
                
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => FileDetailModal(asset: fileAsset, showDeleteOption: false),
                );
              }
            }
          } catch (e) {
            debugPrint('[RESOLVE_FILE_ERROR] Failed to query file headers: $e');
          } finally {
            if (context.mounted) {
              Navigator.of(context).pop();
            }
          }
        }

        if (resolvedNatively) return;

        // 3. Fallback to default external application / Google Docs Viewer for other formats
        final isDocsExt = ext == 'doc' || ext == 'docx' || ext == 'xls' || ext == 'xlsx' || 
                          ext == 'ppt' || ext == 'pptx' || ext == 'csv' || ext == 'txt';

        final urlToOpen = (isDocsExt)
            ? 'https://docs.google.com/viewer?url=${Uri.encodeComponent(directUrl)}&embedded=true'
            : directUrl;
            
        final uri = Uri.parse(urlToOpen);
        try {
          final launched = await launchUrl(
            uri, 
            mode: isDocsExt ? LaunchMode.inAppWebView : LaunchMode.externalApplication,
          );
          if (!launched) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        } catch (e) {
          debugPrint('[LAUNCH_ERROR] Failed to launch attachment url: $e');
          try {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } catch (err) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to open file: $err'),
                  backgroundColor: Colors.redAccent,
                ),
              );
            }
          }
        }
      },
      child: Container(
        width: 200,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.fileText, color: Colors.blueAccent, size: 24),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    filename,
                    style: TextStyle(
                      color: isMe ? (isLight ? colors.textPrimary : Colors.white) : colors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      overflow: TextOverflow.ellipsis,
                    ),
                    maxLines: 1,
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Tap to view',
                    style: TextStyle(color: Colors.grey, fontSize: 9),
                  ),
                ],
              ),
            ),
            if (msg.mediaUrl != null)
              IconButton(
                icon: const Icon(LucideIcons.download, color: Colors.blueAccent, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {
                  final actualMediaUrl = UrlHelpers.getDirectMediaUrl(msg.mediaUrl, driveFileId: msg.driveFileId) ?? msg.mediaUrl!;
                  FileDownloadHelper.downloadAndShare(context, actualMediaUrl, filename);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyMessagesState(ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.messageSquare, size: 48, color: colors.textSecondary.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          Text(
            'Secure Connection Established',
            style: TextStyle(color: colors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Say hello to start the conversation!',
            style: TextStyle(color: colors.textSecondary, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Future<List<Map<String, dynamic>>> _fetchParticipants() async {
    final client = ref.read(supabaseClientProvider);
    final response = await client
        .from('chat_participants')
        .select('role, user_id')
        .eq('room_id', widget.roomId);
    
    final List<Map<String, dynamic>> result = [];
    for (final p in response as List) {
      final userId = p['user_id'] as String;
      final role = p['role'] as String? ?? 'member';
      
      final profile = await client
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', userId)
          .maybeSingle();
      
      if (profile != null) {
        result.add({
          'user_id': userId,
          'role': role,
          'full_name': profile['full_name'] as String? ?? 'Unknown',
          'email': profile['email'] as String? ?? '',
          'avatar_url': UrlHelpers.getDirectImageUrl(profile['avatar_url'] as String?),
        });
      }
    }
    return result;
  }

  Future<void> _showGroupInfoSheet() async {
    final colors = ref.read(themeColorsProvider);
    final isLight = !colors.isDark;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.8,
              decoration: BoxDecoration(
                color: isLight ? Colors.white : colors.backgroundPrimary,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
                border: Border.all(
                  color: isLight ? DesignTokens.lightBorder : colors.border,
                ),
              ),
              child: FutureBuilder<List<Map<String, dynamic>>>(
                future: _fetchParticipants(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator(color: Colors.amber));
                  }
                  
                  final participants = snapshot.data ?? [];
                  
                  return Column(
                    children: [
                      // Bottom Sheet handle
                      Container(
                        margin: const EdgeInsets.only(top: 12, bottom: 8),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: colors.textSecondary.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Group Info',
                              style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            IconButton(
                              icon: Icon(LucideIcons.x, color: colors.iconColor),
                              onPressed: () => Navigator.pop(context),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1),
                      Expanded(
                        child: ListView(
                          padding: const EdgeInsets.all(24),
                          children: [
                            // Large Group Avatar
                            Center(
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: isLight ? AppColors.lightPrimaryGradient : AppColors.primaryGradient,
                                ),
                                child: _BeautifulAvatar(
                                  radius: 40,
                                  imageUrl: widget.roomExtra?.displayAvatar,
                                  name: widget.roomExtra?.displayName ?? 'Group',
                                  fallbackIcon: LucideIcons.users,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Center(
                              child: Text(
                                widget.roomExtra?.displayName ?? 'Group Chat',
                                style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Center(
                              child: Text(
                                '${participants.length} participants',
                                style: TextStyle(
                                  color: colors.honey,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            
                            // Media, Links & Docs Section
                            Consumer(
                              builder: (context, ref, _) {
                                final messagesAsync = ref.watch(chatMessagesProvider(widget.roomId));
                                return messagesAsync.maybeWhen(
                                  data: (messages) {
                                    final mediaList = messages.where((m) => m.mediaUrl != null).toList();
                                    
                                    return Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              'MEDIA, LINKS & DOCS',
                                              style: TextStyle(
                                                color: colors.textSecondary,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 1.0,
                                              ),
                                            ),
                                            Text(
                                              '${mediaList.length} items',
                                              style: TextStyle(
                                                color: colors.textSecondary.withValues(alpha: 0.6),
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        if (mediaList.isEmpty)
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.symmetric(vertical: 20),
                                            alignment: Alignment.center,
                                            child: Text(
                                              'No media files found in this stream.',
                                              style: TextStyle(
                                                color: colors.textSecondary.withValues(alpha: 0.5),
                                                fontSize: 12,
                                                fontStyle: FontStyle.italic,
                                              ),
                                            ),
                                          )
                                        else
                                          SizedBox(
                                            height: 80,
                                            child: ListView.builder(
                                              scrollDirection: Axis.horizontal,
                                              itemCount: mediaList.length,
                                              itemBuilder: (context, index) {
                                                final msg = mediaList[index];
                                                
                                                final directUrl = UrlHelpers.getDirectImageUrl(msg.mediaUrl, driveFileId: msg.driveFileId);
                                                
                                                return GestureDetector(
                                                  onTap: () async {
                                                    final mediaUrl = UrlHelpers.getDirectMediaUrl(msg.mediaUrl, driveFileId: msg.driveFileId);
                                                    final String fname = msg.text.isNotEmpty ? msg.text : msg.mediaUrl!.split('/').last.split('?').first;

                                                    if (fname.toLowerCase().endsWith('.pdf') && mediaUrl != null) {
                                                      Navigator.of(context).push(
                                                        MaterialPageRoute(
                                                          builder: (_) => PdfViewerScreen(
                                                            pdfUrl: mediaUrl,
                                                            title: fname,
                                                          ),
                                                        ),
                                                      );
                                                      return;
                                                    }

                                                    final isImageExt = fname.toLowerCase().endsWith('.jpg') || 
                                                                       fname.toLowerCase().endsWith('.jpeg') || 
                                                                       fname.toLowerCase().endsWith('.png') || 
                                                                       fname.toLowerCase().endsWith('.gif') || 
                                                                       fname.toLowerCase().endsWith('.webp');
                                                                       
                                                    if ((isImageExt || msg.mediaType == 'image') && mediaUrl != null) {
                                                      Navigator.of(context).push(
                                                        MaterialPageRoute(
                                                          builder: (_) => ImageViewerScreen(
                                                            imageUrl: mediaUrl,
                                                            title: fname,
                                                          ),
                                                        ),
                                                      );
                                                      return;
                                                    }

                                                    final isVideoExt = fname.toLowerCase().endsWith('.mp4') || 
                                                                       fname.toLowerCase().endsWith('.mov') || 
                                                                       fname.toLowerCase().endsWith('.avi') || 
                                                                       fname.toLowerCase().endsWith('.mkv') || 
                                                                       fname.toLowerCase().endsWith('.webm');
                                                                       
                                                    if ((isVideoExt || msg.mediaType == 'video') && mediaUrl != null) {
                                                      final fileAsset = FileAsset(
                                                        id: msg.id,
                                                        name: fname,
                                                        path: '',
                                                        mimeType: msg.mediaType == 'video' ? 'video/mp4' : 'video/${fname.split('.').last.toLowerCase()}',
                                                        size: 0,
                                                        createdAt: msg.createdAt,
                                                        downloadLink: mediaUrl,
                                                        viewLink: msg.mediaUrl,
                                                        driveFileId: msg.driveFileId,
                                                        uploadedBy: msg.senderId,
                                                        uploadedByName: msg.senderName,
                                                      );
                                                      
                                                      showModalBottomSheet(
                                                        context: context,
                                                        isScrollControlled: true,
                                                        backgroundColor: Colors.transparent,
                                                        builder: (context) => FileDetailModal(asset: fileAsset, showDeleteOption: false),
                                                      );
                                                      return;
                                                    }
                                                    
                                                    final isDocsExt = fname.toLowerCase().endsWith('.doc') || 
                                                                      fname.toLowerCase().endsWith('.docx') || 
                                                                      fname.toLowerCase().endsWith('.xls') || 
                                                                      fname.toLowerCase().endsWith('.xlsx') || 
                                                                      fname.toLowerCase().endsWith('.ppt') || 
                                                                      fname.toLowerCase().endsWith('.pptx') || 
                                                                      fname.toLowerCase().endsWith('.csv') || 
                                                                      fname.toLowerCase().endsWith('.txt');

                                                    final urlToOpen = (isDocsExt && mediaUrl != null)
                                                        ? 'https://docs.google.com/viewer?url=${Uri.encodeComponent(mediaUrl)}&embedded=true'
                                                        : (mediaUrl ?? msg.mediaUrl!);
                                                        
                                                    final uri = Uri.parse(urlToOpen);
                                                    if (await canLaunchUrl(uri)) {
                                                      await launchUrl(
                                                        uri, 
                                                        mode: isDocsExt ? LaunchMode.inAppWebView : LaunchMode.externalApplication,
                                                      );
                                                    }
                                                  },
                                                  child: Container(
                                                    width: 80,
                                                    margin: const EdgeInsets.only(right: 12),
                                                    decoration: BoxDecoration(
                                                      color: Colors.black.withValues(alpha: 0.1),
                                                      borderRadius: BorderRadius.circular(12),
                                                      border: Border.all(
                                                        color: isLight
                                                            ? DesignTokens.lightBorder
                                                            : colors.border.withValues(alpha: 0.2),
                                                      ),
                                                    ),
                                                    child: ClipRRect(
                                                      borderRadius: BorderRadius.circular(11),
                                                      child: msg.mediaType == 'image'
                                                          ? CachedChatImage(
                                                              imageUrl: directUrl ?? msg.mediaUrl!,
                                                              fit: BoxFit.cover,
                                                              errorWidget: const Center(
                                                                child: Icon(LucideIcons.image, color: Colors.grey),
                                                              ),
                                                            )
                                                          : Center(
                                                              child: Icon(
                                                                msg.mediaType == 'video'
                                                                    ? LucideIcons.video
                                                                    : msg.mediaType == 'voice'
                                                                        ? LucideIcons.mic
                                                                        : LucideIcons.fileText,
                                                                color: colors.honey,
                                                                size: 24,
                                                              ),
                                                            ),
                                                    ),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        const SizedBox(height: 24),
                                      ],
                                    );
                                  },
                                  orElse: () => const SizedBox.shrink(),
                                );
                              },
                            ),
                            
                            // Participants Header with Add User option
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'PARTICIPANTS',
                                  style: TextStyle(
                                    color: colors.textSecondary,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: () => _showAddUserSheet(participants, () {
                                    setSheetState(() {});
                                  }),
                                  icon: Icon(LucideIcons.userPlus, size: 14, color: colors.honey),
                                  label: Text(
                                    'Add User',
                                    style: TextStyle(color: colors.honey, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            
                            // Participants List
                            ...participants.map((p) {
                              final name = p['full_name'] as String;
                              final email = p['email'] as String;
                              final role = p['role'] as String;
                              final avatar = p['avatar_url'] as String?;
                              
                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isLight ? Colors.black.withValues(alpha: 0.02) : colors.surface.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.2),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    _BeautifulAvatar(
                                      radius: 16,
                                      imageUrl: avatar,
                                      name: name,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            name,
                                            style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            email,
                                            style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.6), fontSize: 10),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: role == 'creator' 
                                            ? Colors.redAccent.withValues(alpha: 0.12)
                                            : colors.honey.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        role.toUpperCase(),
                                        style: TextStyle(
                                          color: role == 'creator' ? Colors.redAccent : colors.honey,
                                          fontSize: 8,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                            
                            const SizedBox(height: 24),

                            // Clear Chat History Option (Manager Only)
                            () {
                              final profile = ref.read(currentUserProfileProvider).value;
                              final userRole = profile?['role']?.toString().toLowerCase() ?? '';
                              final isManager = userRole == 'manager' || userRole == 'admin';

                              if (!isManager) return const SizedBox.shrink();
                              return Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  GestureDetector(
                                    onTap: () => _showClearChatConfirmDialog(),
                                    child: Container(
                                      width: double.infinity,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: colors.honey.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: colors.honey.withValues(alpha: 0.2)),
                                      ),
                                      child: Center(
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(LucideIcons.trash2, color: colors.honey, size: 18),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Clear Chat Messages',
                                              style: TextStyle(
                                                color: colors.honey,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                ],
                              );
                            }(),
                            
                            // Leave Group Option
                            GestureDetector(
                              onTap: () async {
                                final client = ref.read(supabaseClientProvider);
                                final currentUser = client.auth.currentUser;
                                if (currentUser != null) {
                                  Navigator.pop(context); // close bottom sheet
                                  try {
                                    await client
                                        .from('chat_participants')
                                        .delete()
                                        .eq('room_id', widget.roomId)
                                        .eq('user_id', currentUser.id);
                                    
                                    ref.read(chatRoomsProvider.notifier).fetchRooms();
                                    if (mounted) {
                                      context.pop(); // close chat room screen
                                    }
                                  } catch (e) {
                                    _showError('Failed to leave group: $e');
                                  }
                                }
                              },
                              child: Container(
                                width: double.infinity,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: Colors.redAccent.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.redAccent.withValues(alpha: 0.2)),
                                ),
                                child: const Center(
                                  child: Text(
                                    'Leave Group',
                                    style: TextStyle(
                                      color: Colors.redAccent,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showAddUserSheet(List<Map<String, dynamic>> currentParticipants, VoidCallback onRefresh) async {
    final colors = ref.read(themeColorsProvider);
    final isLight = !colors.isDark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        String searchQuery = '';
        
        return StatefulBuilder(
          builder: (context, setStateSheet) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                height: MediaQuery.of(context).size.height * 0.7,
                decoration: BoxDecoration(
                  color: isLight ? Colors.white : colors.backgroundPrimary,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(32),
                    topRight: Radius.circular(32),
                  ),
                  border: Border.all(
                    color: isLight ? DesignTokens.lightBorder : colors.border,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 8),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: colors.textSecondary.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Add to Chat',
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          IconButton(
                            icon: Icon(LucideIcons.x, color: colors.iconColor),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                    ),
                    
                    Expanded(
                      child: Consumer(
                        builder: (context, ref, child) {
                          final allUsersAsync = ref.watch(allUsersProvider);
                          final currentUserAsync = ref.watch(currentUserProfileProvider);

                          final isCurrentlyLoading = (allUsersAsync.isLoading && !allUsersAsync.hasValue) ||
                                                     (currentUserAsync.isLoading && !currentUserAsync.hasValue);
                          if (isCurrentlyLoading) {
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          if (allUsersAsync.hasError || currentUserAsync.hasError) {
                            return Center(
                              child: Text(
                                'Failed to load team members',
                                style: TextStyle(color: colors.textSecondary),
                              ),
                            );
                          }

                          final allUsers = allUsersAsync.value ?? [];
                          final currentUser = currentUserAsync.value;
                          final myDeptId = currentUser?['department_id'];
                          final myInstId = currentUser?['institution_id'];

                          final participantIds = currentParticipants.map((p) => p['user_id'] as String).toSet();
                          final availableUsers = allUsers.where((u) => !participantIds.contains(u['id'] as String)).toList();

                          if (availableUsers.isEmpty) {
                            return Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    LucideIcons.users,
                                    size: 48,
                                    color: colors.textSecondary.withValues(alpha: 0.2),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    'All registered users are in this group',
                                    style: TextStyle(
                                      color: colors.textSecondary.withValues(alpha: 0.5),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          bool isTeamMember(Map<String, dynamic> u) {
                            final deptId = u['department_id'];
                            final instId = u['institution_id'];
                            if (myDeptId != null && deptId != null) {
                              return deptId.toString() == myDeptId.toString();
                            }
                            if (myInstId != null && instId != null) {
                              return instId.toString() == myInstId.toString();
                            }
                            return false;
                          }

                          final teamUsers = availableUsers.where((u) => isTeamMember(u)).toList();
                          final otherUsers = availableUsers.where((u) => !isTeamMember(u)).toList();

                          // Show banner if ALL department/institution team members are already in the group,
                          // but there are other users available in the system.
                          final allTeamMembersAdded = teamUsers.isEmpty && otherUsers.isNotEmpty;

                          final filteredUsers = availableUsers.where((u) {
                            final name = (u['full_name'] as String? ?? '').toLowerCase();
                            final role = (u['role'] as String? ?? '').toLowerCase();
                            return name.contains(searchQuery.toLowerCase()) ||
                                   role.contains(searchQuery.toLowerCase());
                          }).toList();

                          return Column(
                            children: [
                              // Theme-Matching Search Input Bar
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 6.0),
                                child: Container(
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: isLight ? Colors.black.withValues(alpha: 0.04) : colors.surface.withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isLight 
                                          ? Colors.grey.withValues(alpha: 0.2) 
                                          : Colors.white.withValues(alpha: 0.08),
                                    ),
                                  ),
                                  child: TextField(
                                    onChanged: (val) {
                                      setStateSheet(() {
                                        searchQuery = val;
                                      });
                                    },
                                    style: TextStyle(color: colors.textPrimary, fontSize: 14),
                                    decoration: InputDecoration(
                                      hintText: 'Search members...',
                                      hintStyle: TextStyle(
                                        color: colors.textSecondary.withValues(alpha: 0.4),
                                        fontSize: 14,
                                      ),
                                      prefixIcon: Icon(
                                        LucideIcons.search,
                                        color: colors.textSecondary.withValues(alpha: 0.4),
                                        size: 18,
                                      ),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Divider(height: 1),

                              if (allTeamMembersAdded)
                                Container(
                                  width: double.infinity,
                                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(LucideIcons.alertTriangle, color: Colors.redAccent, size: 18),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          'All team members are already in this group',
                                          style: TextStyle(
                                            color: isLight ? Colors.red.shade800 : Colors.redAccent.shade100,
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                              Expanded(
                                child: filteredUsers.isEmpty
                                    ? Center(
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              LucideIcons.users,
                                              size: 48,
                                              color: colors.textSecondary.withValues(alpha: 0.2),
                                            ),
                                            const SizedBox(height: 12),
                                            Text(
                                              'No members found',
                                              style: TextStyle(
                                                color: colors.textSecondary.withValues(alpha: 0.5),
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      )
                                    : ListView.builder(
                                        itemCount: filteredUsers.length,
                                        itemBuilder: (context, index) {
                                          final member = filteredUsers[index];
                                          final name = member['full_name'] as String? ?? 'Unknown';
                                          final avatarUrl = member['avatar_url'] as String?;
                                          final role = member['role'] as String? ?? 'Member';
                                          final isMyTeam = isTeamMember(member);

                                          return ListTile(
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                                            leading: _BeautifulAvatar(
                                              radius: 18,
                                              imageUrl: avatarUrl,
                                              name: name,
                                            ),
                                            title: Row(
                                              children: [
                                                Text(
                                                  name,
                                                  style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                                                ),
                                                if (isMyTeam) ...[
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: colors.honey.withValues(alpha: 0.15),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: Text(
                                                      'MY TEAM',
                                                      style: TextStyle(
                                                        color: colors.honey,
                                                        fontSize: 9,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            subtitle: Text(
                                              role.toUpperCase(),
                                              style: TextStyle(color: colors.honey, fontSize: 11, fontWeight: FontWeight.w900),
                                            ),
                                            onTap: () async {
                                              Navigator.pop(context);
                                              try {
                                                final client = ref.read(supabaseClientProvider);
                                                final now = DateTime.now().toIso8601String();
                                                
                                                await client.from('chat_participants').insert({
                                                  'id': const Uuid().v4(),
                                                  'room_id': widget.roomId,
                                                  'user_id': member['id'] as String,
                                                  'role': 'member',
                                                  'created_at': now,
                                                });
                                                
                                                onRefresh();
                                              } catch (e) {
                                                _showError('Failed to add user: $e');
                                              }
                                            },
                                          );
                                        },
                                      ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _handleSend() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    ref.read(chatMessagesProvider(widget.roomId).notifier).sendMessage(text);
    _scrollToBottom(instant: false, force: true);
  }
}

class _BeautifulAvatar extends StatelessWidget {
  final String? imageUrl;
  final double radius;
  final String? name;
  final IconData fallbackIcon;

  const _BeautifulAvatar({
    required this.imageUrl,
    this.radius = 20,
    this.name,
    this.fallbackIcon = LucideIcons.user,
  });

  @override
  Widget build(BuildContext context) {
    final initials = name != null && name!.trim().isNotEmpty
        ? name!.trim().split(' ').map((e) => e[0]).take(2).join().toUpperCase()
        : '';

    return SizedBox(
      width: radius * 2,
      height: radius * 2,
      child: ClipOval(
        child: imageUrl != null && imageUrl!.trim().isNotEmpty
            ? Image.network(
                imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildFallback(initials);
                },
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    color: Colors.black.withValues(alpha: 0.04),
                    child: const Center(
                      child: SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.amber),
                      ),
                    ),
                  );
                },
              )
            : _buildFallback(initials),
      ),
    );
  }

  Widget _buildFallback(String initials) {
    return Container(
      color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
      child: Center(
        child: initials.isNotEmpty
            ? Text(
                initials,
                style: TextStyle(
                  color: const Color(0xFFF59E0B),
                  fontWeight: FontWeight.bold,
                  fontSize: radius * 0.6,
                ),
              )
            : Icon(
                fallbackIcon,
                color: const Color(0xFFF59E0B),
                size: radius,
              ),
      ),
    );
  }
}

class WhatsAppWallpaperPainter extends CustomPainter {
  final Color color;
  WhatsAppWallpaperPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    const double stepX = 120.0;
    const double stepY = 120.0;

    for (double x = 40; x < size.width; x += stepX) {
      for (double y = 40; y < size.height; y += stepY) {
        final int index = ((x / stepX) + (y / stepY)).toInt();
        canvas.save();
        canvas.translate(x, y);

        if (index % 4 == 0) {
          final path = Path()
            ..moveTo(0, 0)
            ..lineTo(12, 0)
            ..quadraticBezierTo(15, 0, 15, 3)
            ..lineTo(15, 9)
            ..quadraticBezierTo(15, 12, 12, 12)
            ..lineTo(4, 12)
            ..lineTo(1, 15)
            ..lineTo(1, 12)
            ..lineTo(0, 12)
            ..quadraticBezierTo(-3, 12, -3, 9)
            ..lineTo(-3, 3)
            ..quadraticBezierTo(-3, 0, 0, 0);
          canvas.drawPath(path, paint);
        } else if (index % 4 == 1) {
          canvas.drawLine(const Offset(-4, 0), const Offset(4, 0), paint);
          canvas.drawLine(const Offset(0, -4), const Offset(0, 4), paint);
        } else if (index % 4 == 2) {
          canvas.drawCircle(Offset.zero, 3, paint);
        } else {
          final path = Path()
            ..moveTo(0, -2)
            ..cubicTo(-2, -5, -5, -3, -5, 0)
            ..cubicTo(-5, 3, -2, 5, 0, 7)
            ..cubicTo(2, 5, 5, 3, 5, 0)
            ..cubicTo(5, -3, 2, -5, 0, -2);
          canvas.drawPath(path, paint);
        }
        canvas.restore();
      }
    }
  }

  @override
  bool shouldRepaint(covariant WhatsAppWallpaperPainter oldDelegate) => false;
}

class InlineVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final ThemeColors colors;

  const InlineVideoPlayer({
    super.key,
    required this.videoUrl,
    required this.colors,
  });

  @override
  State<InlineVideoPlayer> createState() => _InlineVideoPlayerState();
}

class _InlineVideoPlayerState extends State<InlineVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isPlaying = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    ChatMediaManager.register(_onMediaChanged);
    _initializeVideo();
  }

  @override
  void dispose() {
    ChatMediaManager.unregister(_onMediaChanged);
    _controller?.dispose();
    super.dispose();
  }

  void _onMediaChanged(String? activeUrl) {
    if (activeUrl != widget.videoUrl && _isPlaying) {
      _controller?.pause();
      if (mounted) {
        setState(() {
          _isPlaying = false;
        });
      }
    }
  }

  Future<void> _initializeVideo() async {
    try {
      final localPath = await MediaCacheManager.getCachedFilePath(widget.videoUrl);
      if (localPath != null && File(localPath).existsSync()) {
        _controller = VideoPlayerController.file(
          File(localPath),
          videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
        );
      } else {
        _controller = VideoPlayerController.networkUrl(
          Uri.parse(widget.videoUrl),
          videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
        );
      }
      await _controller!.initialize();
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      debugPrint("Error pre-initializing video: $e");
    }
  }

  Future<void> _togglePlay() async {
    if (_controller == null || !_isInitialized) {
      await _initializeVideo();
    }

    if (_controller != null && _isInitialized) {
      setState(() {
        if (_controller!.value.isPlaying) {
          _controller!.pause();
          _isPlaying = false;
        } else {
          // Request exclusive audio focus to pause background music player apps like Spotify
          AudioPlayer.global.setAudioContext(AudioContext(
            android: AudioContextAndroid(
              isSpeakerphoneOn: true,
              stayAwake: true,
              contentType: AndroidContentType.music,
              usageType: AndroidUsageType.media,
              audioFocus: AndroidAudioFocus.gain,
            ),
            iOS: AudioContextIOS(
              category: AVAudioSessionCategory.playback,
              options: {
                AVAudioSessionOptions.defaultToSpeaker,
              },
            ),
          ));

          // Pause all other media playing in the chatroom
          ChatMediaManager.play(widget.videoUrl);

          _controller!.play();
          _isPlaying = true;
          _controller!.addListener(_videoListener);
        }
      });
    }
  }

  void _videoListener() {
    if (_controller != null && !_controller!.value.isPlaying && 
        _controller!.value.position >= _controller!.value.duration) {
      if (mounted) {
        setState(() {
          _isPlaying = false;
          _controller!.seekTo(Duration.zero);
        });
        _controller!.removeListener(_videoListener);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    double width = 200;
    double height = 120;
    if (_isInitialized) {
      final double ratio = _controller!.value.aspectRatio;
      if (ratio < 1.0) {
        // Portrait / Tall
        width = 160;
        height = width / ratio;
        if (height > 240) {
          height = 240;
          width = height * ratio;
        }
      } else {
        // Landscape / Wide
        width = 240;
        height = width / ratio;
        if (height > 165) {
          height = 165;
          width = height * ratio;
        }
      }
    }

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        borderRadius: BorderRadius.zero,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.zero,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (_isInitialized)
              GestureDetector(
                onTap: _togglePlay,
                child: Center(
                  child: AspectRatio(
                    aspectRatio: _controller!.value.aspectRatio,
                    child: VideoPlayer(_controller!),
                  ),
                ),
              )
            else
              // Thumbnail placeholder
              const Center(
                child: Icon(LucideIcons.video, color: Colors.white, size: 32),
              ),
            
            // Video overlay controls (Play/Pause indicator)
            if (!_isPlaying)
              Positioned(
                child: GestureDetector(
                  onTap: _togglePlay,
                  child: CircleAvatar(
                    backgroundColor: widget.colors.honey,
                    radius: 20,
                    child: const Icon(LucideIcons.play, color: Colors.white, size: 16),
                  ),
                ),
              ),

            // Loading indicator during initialization
            if (_controller != null && !_isInitialized)
              const Center(
                child: CircularProgressIndicator(color: Colors.amber),
              ),

            // Dynamic progress seek bar overlay
            if (_isInitialized)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: VideoProgressIndicator(
                  _controller!,
                  allowScrubbing: true,
                  colors: VideoProgressColors(
                    playedColor: widget.colors.honey,
                    bufferedColor: Colors.white24,
                    backgroundColor: Colors.black26,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class InlineVoicePlayer extends StatefulWidget {
  final String audioUrl;
  final ThemeColors colors;
  final bool isMe;
  final bool isUploading;
  final int? durationSeconds;

  const InlineVoicePlayer({
    super.key,
    required this.audioUrl,
    required this.colors,
    required this.isMe,
    this.isUploading = false,
    this.durationSeconds,
  });

  @override
  State<InlineVoicePlayer> createState() => _InlineVoicePlayerState();
}

class _InlineVoicePlayerState extends State<InlineVoicePlayer> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  bool _isDownloading = false;
  bool _downloadFailed = false;
  String? _localFilePath;  // Path to locally cached audio file
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  StreamSubscription? _durationSubscription;
  StreamSubscription? _positionSubscription;
  StreamSubscription? _playerCompleteSubscription;

  static final Set<String> _activeDownloads = {};

  @override
  void initState() {
    super.initState();
    ChatMediaManager.register(_onMediaChanged);
    debugPrint('[InlineVoicePlayer] initState: durationSeconds=${widget.durationSeconds}, audioUrl=${widget.audioUrl}');
    if (widget.durationSeconds != null) {
      _duration = Duration(seconds: widget.durationSeconds!);
      debugPrint('[InlineVoicePlayer] initState: Set _duration to $_duration');
    }
    if (!widget.isUploading) {
      _initAudio();
    }
  }

  void _onMediaChanged(String? activeUrl) {
    if (activeUrl != widget.audioUrl && _isPlaying) {
      _audioPlayer.pause();
      _playbackTimer?.cancel();
      if (mounted) setState(() => _isPlaying = false);
    }
  }

  @override
  void didUpdateWidget(covariant InlineVoicePlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.durationSeconds != oldWidget.durationSeconds && widget.durationSeconds != null) {
      setState(() {
        _duration = Duration(seconds: widget.durationSeconds!);
      });
      debugPrint('[InlineVoicePlayer] didUpdateWidget: Set _duration to $_duration');
    }
    if (!widget.isUploading && oldWidget.isUploading) {
      debugPrint('[InlineVoicePlayer] didUpdateWidget: Upload finished, initializing audio');
      _initAudio();
    }
  }

  Future<void> _initAudio() async {
    // Register listeners FIRST so we never miss events.
    _durationSubscription = _audioPlayer.onDurationChanged.listen((d) {
      if (mounted && widget.durationSeconds == null) setState(() => _duration = d);
    });
    _positionSubscription = _audioPlayer.onPositionChanged.listen((p) {
      if (mounted && widget.durationSeconds == null) setState(() => _position = p);
    });
    _playerCompleteSubscription = _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted && widget.durationSeconds == null) {
        setState(() { _isPlaying = false; _position = Duration.zero; });
      }
    });

    if (widget.audioUrl.isEmpty) return;

    // Set loop release mode for simulated notes to allow custom visual slider tick duration
    if (widget.durationSeconds != null) {
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
    }

    String cacheKey;
    try {
      final uri = Uri.parse(widget.audioUrl);
      cacheKey = uri.queryParameters['id'] ?? widget.audioUrl.split('/').last.split('?').first;
    } catch (_) {
      cacheKey = widget.audioUrl.split('/').last.split('?').first;
    }
    final tempDir = await getTemporaryDirectory();
    final cachedFile = File('${tempDir.path}/voice_$cacheKey.m4a'); // Use .m4a extension to match actual uploaded audio format!

    // Prevent concurrent download race conditions for the same file key
    if (_activeDownloads.contains(cacheKey)) {
      debugPrint('[InlineVoicePlayer] File is being downloaded by another player. Waiting...');
      if (mounted) setState(() => _isDownloading = true);
      while (_activeDownloads.contains(cacheKey) && mounted) {
        await Future.delayed(const Duration(milliseconds: 200));
      }
      if (mounted) setState(() => _isDownloading = false);
      if (cachedFile.existsSync() && cachedFile.lengthSync() > 0) {
        await _loadFromLocalFile(cachedFile.path);
        return;
      }
    }

    if (cachedFile.existsSync() && cachedFile.lengthSync() > 0) {
      debugPrint('[InlineVoicePlayer] Cache hit: ${cachedFile.path}');
      await _loadFromLocalFile(cachedFile.path);
      return;
    } else if (cachedFile.existsSync()) {
      try {
        await cachedFile.delete();
      } catch (_) {}
    }

    // Step 2: Download the audio file to local temp storage.
    //         Playing from a local file gives full metadata, correct duration,
    //         and reliable seeking — identical to how WhatsApp/Telegram work.
    if (mounted) setState(() => _isDownloading = true);
    _activeDownloads.add(cacheKey);
    try {
      debugPrint('[InlineVoicePlayer] Downloading: ${widget.audioUrl}');
      final dio = Dio();
      await dio.download(
        widget.audioUrl,
        cachedFile.path,
        options: Options(
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 10),
          headers: {'Accept': 'audio/*,*/*'},
        ),
      );
      debugPrint('[InlineVoicePlayer] Downloaded to: ${cachedFile.path}');
      if (!mounted) return;
      setState(() { _isDownloading = false; _localFilePath = cachedFile.path; });
      await _loadFromLocalFile(cachedFile.path);
    } catch (e) {
      debugPrint('[InlineVoicePlayer] Download failed: $e');
      if (mounted) setState(() { _isDownloading = false; _downloadFailed = true; });
      if (cachedFile.existsSync()) {
        try {
          await cachedFile.delete();
        } catch (_) {}
      }
    } finally {
      _activeDownloads.remove(cacheKey);
    }
  }

  Future<void> _loadFromLocalFile(String path) async {
    if (!mounted) return;
    setState(() => _localFilePath = path);
    try {
      await _audioPlayer.setSourceDeviceFile(path);
      if (!mounted) return;
      final dur = await _audioPlayer.getDuration();
      if (dur != null && mounted && widget.durationSeconds == null) {
        setState(() => _duration = dur);
      }
    } catch (e) {
      debugPrint('[InlineVoicePlayer] Error loading local file: $e');
    }
  }

  Timer? _playbackTimer;

  @override
  void dispose() {
    ChatMediaManager.unregister(_onMediaChanged);
    _durationSubscription?.cancel();
    _positionSubscription?.cancel();
    _playerCompleteSubscription?.cancel();
    _playbackTimer?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  void _startPlaybackTimer() {
    _playbackTimer?.cancel();
    _playbackTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (mounted && _isPlaying) {
        setState(() {
          final nextPos = _position + const Duration(milliseconds: 100);
          if (nextPos >= _duration) {
            _position = _duration;
            _isPlaying = false;
            _playbackTimer?.cancel();
            // Stop and release loop mode
            _audioPlayer.setReleaseMode(ReleaseMode.release).then((_) {
              _audioPlayer.stop();
            });
          } else {
            _position = nextPos;
          }
        });
      } else {
        _playbackTimer?.cancel();
      }
    });
  }

  Future<void> _togglePlay() async {
    if (widget.isUploading || _isDownloading) return;
    if (_downloadFailed) {
      // Retry download
      if (mounted) setState(() { _downloadFailed = false; });
      await _initAudio();
      return;
    }
    if (_localFilePath == null) return;

    if (_isPlaying) {
      await _audioPlayer.pause();
      _playbackTimer?.cancel();
      if (mounted) setState(() => _isPlaying = false);
    } else {
      if (_position >= _duration && _duration > Duration.zero) {
        _position = Duration.zero;
      }

      // Request exclusive audio focus to pause background music player apps like Spotify
      await AudioPlayer.global.setAudioContext(AudioContext(
        android: AudioContextAndroid(
          isSpeakerphoneOn: true,
          stayAwake: true,
          contentType: AndroidContentType.music,
          usageType: AndroidUsageType.media,
          audioFocus: AndroidAudioFocus.gain,
        ),
        iOS: AudioContextIOS(
          category: AVAudioSessionCategory.playback,
          options: {
            AVAudioSessionOptions.defaultToSpeaker,
          },
        ),
      ));

      // Pause all other media playing in the chatroom
      ChatMediaManager.play(widget.audioUrl);

      await _audioPlayer.play(
        DeviceFileSource(_localFilePath!),
        position: _position > Duration.zero ? _position : null,
      );
      if (mounted) {
        setState(() => _isPlaying = true);
        if (widget.durationSeconds != null) {
          _startPlaybackTimer();
        }
      }
    }
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString();
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    // debugPrint('[InlineVoicePlayer] build: durationSeconds=${widget.durationSeconds}, _duration=$_duration, isUploading=${widget.isUploading}, isMe=${widget.isMe}');
    final activeColor = widget.isMe ? Colors.white : widget.colors.honey;
    final inactiveColor = widget.isMe ? Colors.white30 : Colors.grey.shade400;

    return Container(
      width: 220,
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _togglePlay,
            child: CircleAvatar(
              backgroundColor: _downloadFailed
                  ? Colors.redAccent
                  : activeColor,
              radius: 16,
              child: widget.isUploading || _isDownloading
                  ? SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: widget.isMe ? Colors.black87 : Colors.white,
                      ),
                    )
                  : _downloadFailed
                      ? const Icon(LucideIcons.refreshCw, color: Colors.white, size: 14)
                      : Icon(
                          _isPlaying ? LucideIcons.pause : LucideIcons.play,
                          color: widget.isMe ? Colors.black87 : Colors.white,
                          size: 14,
                        ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                SliderTheme(
                  data: SliderThemeData(
                    trackHeight: 3.0,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.0),
                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 10.0),
                    activeTrackColor: activeColor,
                    inactiveTrackColor: inactiveColor,
                    thumbColor: activeColor,
                    overlayColor: activeColor.withValues(alpha: 0.2),
                  ),
                  child: Slider(
                    min: 0.0,
                    max: _duration.inMilliseconds.toDouble() > 0 
                        ? _duration.inMilliseconds.toDouble() 
                        : 100.0,
                    value: _position.inMilliseconds.toDouble().clamp(
                      0.0, 
                      _duration.inMilliseconds.toDouble() > 0 
                          ? _duration.inMilliseconds.toDouble() 
                          : 100.0
                    ),
                    onChanged: (value) async {
                      final newPosition = Duration(milliseconds: value.toInt());
                      await _audioPlayer.seek(newPosition);
                      if (mounted) {
                        setState(() {
                          _position = newPosition;
                        });
                      }
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.isUploading ? 'Uploading...' : _formatDuration(_position),
                        style: TextStyle(
                          color: widget.isMe ? Colors.white70 : widget.colors.textSecondary,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      _duration == Duration.zero
                          ? SizedBox(
                              width: 10,
                              height: 10,
                              child: CircularProgressIndicator(
                                strokeWidth: 1.5,
                                color: widget.isMe
                                    ? Colors.white54
                                    : widget.colors.textSecondary.withValues(alpha: 0.5),
                              ),
                            )
                          : Text(
                              _formatDuration(_duration),
                              style: TextStyle(
                                color: widget.isMe ? Colors.white70 : widget.colors.textSecondary,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AnimatedChatTick extends StatefulWidget {
  final DateTime createdAt;
  final ThemeColors colors;

  const AnimatedChatTick({
    super.key,
    required this.createdAt,
    required this.colors,
  });

  @override
  State<AnimatedChatTick> createState() => _AnimatedChatTickState();
}

class _AnimatedChatTickState extends State<AnimatedChatTick> with SingleTickerProviderStateMixin {
  bool _isRead = false;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    final age = DateTime.now().difference(widget.createdAt);
    if (age.inMilliseconds > 1200) {
      _isRead = true;
    } else {
      Timer(Duration(milliseconds: 1200 - age.inMilliseconds), () {
        if (mounted) {
          setState(() {
            _isRead = true;
          });
          _controller.forward().then((_) => _controller.reverse());
        }
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Icon(
        LucideIcons.checkCheck,
        size: 13,
        color: _isRead ? widget.colors.honey : widget.colors.textSecondary.withValues(alpha: 0.35),
      ),
    );
  }
}

class ChatMediaManager {
  static String? activeMediaUrl;
  static final List<void Function(String?)> _listeners = [];

  static void register(void Function(String?) listener) {
    _listeners.add(listener);
  }

  static void unregister(void Function(String?) listener) {
    _listeners.remove(listener);
  }

  static void play(String url) {
    activeMediaUrl = url;
    for (final listener in List.from(_listeners)) {
      try {
        listener(url);
      } catch (_) {}
    }
  }
}

