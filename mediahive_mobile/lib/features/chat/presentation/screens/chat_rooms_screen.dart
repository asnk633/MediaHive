import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import '../providers/chat_providers.dart';
import '../../domain/models/chat_room.dart';

class ChatRoomsScreen extends ConsumerStatefulWidget {
  const ChatRoomsScreen({super.key});

  @override
  ConsumerState<ChatRoomsScreen> createState() => _ChatRoomsScreenState();
}

class _ChatRoomsScreenState extends ConsumerState<ChatRoomsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int _selectedTab = 0; // 0 for Chat Rooms, 1 for Private Chats

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;
    final chatRoomsAsync = ref.watch(chatRoomsProvider);
    final pinnedRooms = ref.watch(pinnedRoomsProvider);
    final unreadRooms = ref.watch(unreadRoomsProvider);
    return Scaffold(
      backgroundColor: colors.backgroundPrimary.withValues(alpha: 0.95), // Slight transparency for the "pane" feel
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colors.backgroundSecondary,
              colors.backgroundPrimary,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          children: [
            // Title Header (matches notifications exactly)
            Container(
              margin: EdgeInsets.only(top: 100 + MediaQuery.of(context).padding.top), // Clear the shell header exactly like notifications
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CHATS',
                          style: TextStyle(
                            color: colors.textPrimary,
                            fontWeight: FontWeight.w900,
                            fontSize: 22,
                            letterSpacing: 2.0,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'STAY CONNECTED WITH THE TEAM',
                          style: TextStyle(
                            color: colors.honey,
                            fontWeight: FontWeight.bold,
                            fontSize: 9,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Frosted Glass Search & Actions Panel
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: isLight ? Colors.white.withValues(alpha: 0.6) : colors.surface.withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3),
                            ),
                          ),
                          child: TextField(
                            controller: _searchController,
                            style: TextStyle(color: colors.textPrimary),
                            decoration: InputDecoration(
                              prefixIcon: Icon(LucideIcons.search, color: colors.textSecondary.withValues(alpha: 0.6), size: 20),
                              hintText: 'Search chats or people...',
                              hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5)),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val.trim().toLowerCase();
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: () => _showStartNewChatSheet(context),
                        child: Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            gradient: isLight ? AppColors.lightPrimaryGradient : AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: isLight ? DesignTokens.spatialGlowBlue : [],
                          ),
                          child: const Icon(LucideIcons.messageSquare, color: Colors.white, size: 20),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
                ),

                // Tabs
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTab = 0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _selectedTab == 0 ? colors.honey : (isLight ? Colors.white.withValues(alpha: 0.6) : colors.surface.withValues(alpha: 0.5)),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _selectedTab == 0 ? colors.honey : (isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3)),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Chat Rooms',
                                style: TextStyle(
                                  color: _selectedTab == 0 ? Colors.black : colors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTab = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _selectedTab == 1 ? colors.honey : (isLight ? Colors.white.withValues(alpha: 0.6) : colors.surface.withValues(alpha: 0.5)),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _selectedTab == 1 ? colors.honey : (isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3)),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Developer Support',
                                style: TextStyle(
                                  color: _selectedTab == 1 ? Colors.black : colors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
                ),

                // Rooms List
                Expanded(
                  child: chatRoomsAsync.when(
                    data: (rooms) {
                      final filteredRooms = rooms.where((room) {
                        final isPrivate = room.name == null || room.name!.isEmpty;
                        if (_selectedTab == 0 && isPrivate) return false;
                        if (_selectedTab == 1 && !isPrivate) return false;

                        final name = room.displayName?.toLowerCase() ?? '';
                        final preview = room.lastMessagePreview?.toLowerCase() ?? '';
                        return name.contains(_searchQuery) || preview.contains(_searchQuery);
                      }).toList();

                      // Sort: Pinned rooms float at the top, then sorted by last message time
                      filteredRooms.sort((a, b) {
                        final aPinned = pinnedRooms.contains(a.id);
                        final bPinned = pinnedRooms.contains(b.id);
                        if (aPinned && !bPinned) return -1;
                        if (!aPinned && bPinned) return 1;

                        final aTime = a.lastMessageTime ?? DateTime.fromMillisecondsSinceEpoch(0);
                        final bTime = b.lastMessageTime ?? DateTime.fromMillisecondsSinceEpoch(0);
                        return bTime.compareTo(aTime);
                      });

                      if (filteredRooms.isEmpty) {
                        return _buildEmptyState(colors);
                      }

                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: filteredRooms.length,
                        itemBuilder: (context, index) {
                          final room = filteredRooms[index];
                          return _buildChatRoomCard(context, room, colors, isLight, index);
                        },
                      );
                    },
                    loading: () => Center(
                      child: CircularProgressIndicator(color: colors.honey),
                    ),
                    error: (err, _) => Center(
                      child: Text(
                        'Failed to load chats: $err',
                        style: TextStyle(color: colors.textSecondary),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }

  Widget _buildChatRoomCard(BuildContext context, ChatRoom room, ThemeColors colors, bool isLight, int index) {
    final now = DateTime.now();
    final isPinned = ref.watch(pinnedRoomsProvider).contains(room.id);
    final isUnread = ref.watch(unreadRoomsProvider).contains(room.id);

    String timeStr = '';
    if (room.lastMessageTime != null) {
      final diff = now.difference(room.lastMessageTime!);
      if (diff.inDays > 0) {
        timeStr = '${diff.inDays}d ago';
      } else if (diff.inHours > 0) {
        timeStr = '${diff.inHours}h ago';
      } else if (diff.inMinutes > 0) {
        timeStr = '${diff.inMinutes}m ago';
      } else {
        timeStr = 'Just now';
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: GestureDetector(
        onTap: () {
          // Open room and clear custom unread indicator
          if (isUnread) {
            ref.read(unreadRoomsProvider.notifier).toggleUnread(room.id);
          }
          context.push('/chat/${room.id}', extra: room);
        },
        onLongPress: () {
          _showRoomContextMenu(context, room, colors);
        },
        child: Container(
          decoration: BoxDecoration(
            color: isLight ? Colors.white.withValues(alpha: 0.7) : colors.surface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isLight 
                  ? DesignTokens.lightBorder 
                  : (isPinned ? colors.honey.withValues(alpha: 0.5) : colors.border.withValues(alpha: 0.3)),
              width: isPinned ? 1.5 : 1.0,
            ),
            boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                child: Row(
                  children: [
                    // Avatar with Gradient Border
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: isLight ? AppColors.lightPrimaryGradient : AppColors.primaryGradient,
                      ),
                      child: _BeautifulAvatar(
                        radius: 24,
                        imageUrl: room.displayAvatar,
                        name: room.displayName,
                        fallbackIcon: LucideIcons.users,
                      ),

                    ),
                    const SizedBox(width: 14),

                    // Title & Last Message
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  room.displayName ?? 'Direct Chat',
                                  style: TextStyle(
                                    color: colors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (isPinned)
                                    Padding(
                                      padding: const EdgeInsets.only(right: 6.0),
                                      child: Transform.rotate(
                                        angle: 0.5,
                                        child: Icon(
                                          LucideIcons.pin,
                                          color: colors.honey,
                                          size: 13,
                                        ),
                                      ),
                                    ),
                                  Text(
                                    timeStr,
                                    style: TextStyle(
                                      color: colors.textSecondary.withValues(alpha: 0.5),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  room.lastMessagePreview ?? 'No messages yet',
                                  style: TextStyle(
                                    color: colors.textSecondary,
                                    fontSize: 13,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  maxLines: 1,
                                ),
                              ),
                              if (room.unreadCount > 0 || isUnread)
                                Container(
                                  margin: const EdgeInsets.only(left: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: colors.honey,
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: [
                                      BoxShadow(
                                        color: colors.honey.withValues(alpha: 0.35),
                                        blurRadius: 8,
                                        spreadRadius: 1.0,
                                      ),
                                    ],
                                  ),
                                  child: Text(
                                    room.unreadCount > 0 ? '${room.unreadCount}' : '!',
                                    style: const TextStyle(
                                      color: Colors.black,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ).animate().fadeIn(delay: (index * 50).ms, duration: 400.ms).slideY(begin: 0.1, end: 0),
    );
  }

  void _showRoomContextMenu(BuildContext context, ChatRoom room, ThemeColors colors) {
    final isPinned = ref.read(pinnedRoomsProvider).contains(room.id);
    final isUnread = ref.read(unreadRoomsProvider).contains(room.id);
    final isLight = !colors.isDark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isLight ? Colors.white : colors.backgroundSecondary,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
            border: Border.all(
              color: isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.textSecondary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              ListTile(
                leading: Icon(
                  isPinned ? LucideIcons.pinOff : LucideIcons.pin,
                  color: colors.honey,
                  size: 20,
                ),
                title: Text(
                  isPinned ? 'Unpin Chat' : 'Pin Chat',
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  ref.read(pinnedRoomsProvider.notifier).togglePin(room.id);
                },
              ),
              ListTile(
                leading: Icon(
                  isUnread ? LucideIcons.checkCheck : LucideIcons.mail,
                  color: colors.honey,
                  size: 20,
                ),
                title: Text(
                  isUnread ? 'Mark as Read' : 'Mark as Unread',
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  ref.read(unreadRoomsProvider.notifier).toggleUnread(room.id);
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.messageSquare, size: 64, color: colors.textSecondary.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(
            'No conversations found',
            style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'Tap the button above to start chatting with your team!',
            style: TextStyle(color: colors.textSecondary, fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
    );
  }

  void _showStartNewChatSheet(BuildContext context) {
    final colors = ref.read(themeColorsProvider);
    final isLight = !colors.isDark;
    final allUsersAsync = ref.read(allUsersProvider);
    final groupNameController = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
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
                          'New Group Chatroom',
                          style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 20,
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
                  const SizedBox(height: 16),
                  
                  // Only Group Chatroom creation is enabled
                  Expanded(
                    child: _buildGroupChatTab(context, colors, isLight, groupNameController),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDirectMessageTab(
    BuildContext context,
    ThemeColors colors,
    bool isLight,
    AsyncValue<List<Map<String, dynamic>>> allUsersAsync,
  ) {
    return allUsersAsync.when(
      data: (users) {
        final client = ref.read(supabaseClientProvider);
        final currentUser = client.auth.currentUser;
        
        // Filter out the current user
        final teamMembers = users.where((u) => u['id'] != currentUser?.id).toList();

        if (teamMembers.isEmpty) {
          return Center(
            child: Text(
              'No other team members found',
              style: TextStyle(color: colors.textSecondary),
            ),
          );
        }

        return ListView.builder(
          itemCount: teamMembers.length,
          itemBuilder: (context, index) {
            final member = teamMembers[index];
            final name = member['full_name'] as String? ?? 'Unknown';
            final avatarUrl = member['avatar_url'] as String?;
            final role = member['role'] as String? ?? 'Member';

            return ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              leading: _BeautifulAvatar(
                radius: 18,
                imageUrl: avatarUrl,
                name: name,
              ),
              title: Text(
                name,
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                role.toUpperCase(),
                style: TextStyle(color: colors.honey, fontSize: 11, fontWeight: FontWeight.w900),
              ),
              onTap: () async {
                Navigator.pop(context);
                try {
                  final roomId = await ref
                      .read(chatCreationProvider)
                      .getOrCreateDirectChat(member['id'] as String);
                  
                  if (context.mounted) {
                    final virtualRoom = ChatRoom(
                      id: roomId,
                      isMediaTeamOnly: false,
                      createdAt: DateTime.now(),
                      displayName: name,
                      displayAvatar: avatarUrl,
                    );
                    context.push('/chat/$roomId', extra: virtualRoom);
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to start chat: $e')),
                    );
                  }
                }
              },
            );
          },
        );
      },
      loading: () => Center(child: CircularProgressIndicator(color: colors.honey)),
      error: (err, _) => Center(child: Text('Error: $err', style: TextStyle(color: colors.textSecondary))),
    );
  }

  Widget _buildGroupChatTab(
    BuildContext context,
    ThemeColors colors,
    bool isLight,
    TextEditingController groupNameController,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Room Name',
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: isLight ? Colors.black.withValues(alpha: 0.03) : colors.surface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isLight ? DesignTokens.lightBorder : colors.border.withValues(alpha: 0.3),
              ),
            ),
            child: TextField(
              controller: groupNameController,
              style: TextStyle(color: colors.textPrimary),
              decoration: InputDecoration(
                hintText: 'e.g. Video Production - Campaign',
                hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.4)),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start a group to communicate. All Media & IT team members are automatically added as default participants.',
            style: TextStyle(
              color: colors.textSecondary.withValues(alpha: 0.5),
              fontSize: 11,
              height: 1.4,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () async {
              final name = groupNameController.text.trim();
              if (name.isEmpty) return;

              Navigator.pop(context);
              try {
                final roomId = await ref.read(chatCreationProvider).createGroupChat(name);
                if (context.mounted) {
                  final virtualRoom = ChatRoom(
                    id: roomId,
                    name: name,
                    isMediaTeamOnly: false,
                    createdAt: DateTime.now(),
                    displayName: name,
                  );
                  context.push('/chat/$roomId', extra: virtualRoom);
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to create room: $e')),
                  );
                }
              }
            },
            child: Container(
              width: double.infinity,
              height: 50,
              decoration: BoxDecoration(
                gradient: isLight ? AppColors.lightPrimaryGradient : AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: isLight ? DesignTokens.spatialGlowBlue : [],
              ),
              child: const Center(
                child: Text(
                  'Create Room',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
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

