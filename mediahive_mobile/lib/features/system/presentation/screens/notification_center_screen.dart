import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../providers/notifications_provider.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/design_tokens.dart';
import '../../../../core/services/sound_service.dart';
import '../../../../core/providers/update_provider.dart';
import '../../../../core/services/update_service.dart';
import '../../../files/domain/models/file_asset.dart';
import '../../../files/presentation/widgets/file_detail_modal.dart';

class NotificationCenterScreen extends ConsumerWidget {
  const NotificationCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final notificationsAsync = ref.watch(notificationsStreamProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary.withOpacity(0.95), // Slight transparency for the "pane" feel
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
        child: notificationsAsync.when(
          data: (notifications) {
            if (notifications.isEmpty) {
              return Column(
                children: [
                  _buildInternalHeader(context, colors, ref),
                  Expanded(child: _buildEmptyState(colors)),
                ],
              );
            }
            return _buildNotificationList(notifications, colors, ref);
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text('Error: $err', style: TextStyle(color: colors.textPrimary))),
        ),
      ),
    );
  }

  Widget _buildInternalHeader(BuildContext context, ThemeColors colors, WidgetRef ref) {
    return Container(
      margin: EdgeInsets.only(top: 100 + MediaQuery.of(context).padding.top), // Increased to ensure it clears the shell header
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NOTIFICATIONS',
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                    letterSpacing: 2.0,
                  ),
                ),
                Text(
                  'STAY UPDATED WITH YOUR TEAM',
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
          TextButton.icon(
            onPressed: () {
              ref.read(notificationRepositoryProvider).markAllAsRead();
              ref.read(soundServiceProvider).playSuccess();
            },
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              backgroundColor: colors.honey.withOpacity(0.15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
            icon: Icon(LucideIcons.checkCheck, color: colors.honey, size: 16),
            label: Text(
              'MARK ALL READ',
              style: TextStyle(
                color: colors.honey,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.bellOff, size: 64, color: colors.textSecondary.withOpacity(0.3)),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(color: colors.textSecondary, fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationList(List<Map<String, dynamic>> notifications, ThemeColors colors, WidgetRef ref) {
    final updateInfoAsync = ref.watch(updateInfoProvider);
    final updateState = ref.watch(updateStateProvider);
    final updateProgress = ref.watch(updateProgressProvider);
    
    final bool hasUpdate = updateInfoAsync.maybeWhen(
      data: (info) => info.isUpdateAvailable,
      orElse: () => false,
    );

    final int extraItems = hasUpdate ? 2 : 1; // Header (0), Update Card if hasUpdate (1)

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 100), // Space at bottom
      physics: const ElasticScrollPhysics(),
      itemCount: notifications.length + extraItems,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildInternalHeader(context, colors, ref);
        }
        
        if (hasUpdate && index == 1) {
          return updateInfoAsync.maybeWhen(
            data: (info) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: _buildUpdateNotificationCard(context, colors, info, updateState, updateProgress, ref),
            ),
            orElse: () => const SizedBox.shrink(),
          );
        }

        final notificationIndex = index - extraItems;
        final notification = notifications[notificationIndex];
        final isRead = notification['read'] as bool? ?? false;
        final createdAt = (DateTime.tryParse(notification['created_at'] ?? '') ?? DateTime.now()).toLocal();

        final id = notification['id'];

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Dismissible(
            key: Key(id.toString()),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: colors.error.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colors.error.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'DISMISS',
                    style: TextStyle(
                      color: colors.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(LucideIcons.trash2, color: colors.error, size: 18),
                ],
              ),
            ),
            onDismissed: (_) {
              ref.read(notificationRepositoryProvider).deleteNotification(id);
              ref.read(soundServiceProvider).playWarning();
            },
            child: _NotificationTile(
              notification: notification,
              isRead: isRead,
              createdAt: createdAt,
              colors: colors,
              onTap: () {
                ref.read(notificationRepositoryProvider).markAsRead(id);
                if (!isRead) {
                  ref.read(soundServiceProvider).playSuccess();
                }
                _showNotificationDetails(context, notification, colors, ref);
              },
              onDelete: () {
                ref.read(notificationRepositoryProvider).deleteNotification(id);
                ref.read(soundServiceProvider).playWarning();
              },
            ),
          ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1, end: 0),
        );
      },
    );
  }

  IconData _getIcon(String? type) {
    switch (type) {
      case 'task': return LucideIcons.checkSquare;
      case 'event': return LucideIcons.calendar;
      case 'system': return LucideIcons.info;
      case 'alert': return LucideIcons.alertTriangle;
      default: return LucideIcons.bell;
    }
  }

  Color _getIconColor(String? type) {
    switch (type) {
      case 'task': return const Color(0xFF6366F1);
      case 'event': return const Color(0xFF10B981);
      case 'system': return const Color(0xFF8B5CF6);
      case 'alert': return const Color(0xFFEF4444);
      default: return const Color(0xFFF59E0B);
    }
  }

  String _inferMimeType(String url) {
    final ext = url.split('?').first.split('.').last.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext)) {
      return 'image/$ext';
    } else if (['mp4', 'mov', 'avi'].contains(ext)) {
      return 'video/$ext';
    } else if (ext == 'pdf') {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  }

  void _showNotificationDetails(
    BuildContext context,
    Map<String, dynamic> notification,
    ThemeColors colors,
    WidgetRef ref,
  ) {
    final title = notification['title'] ?? 'Notification';
    final body = notification['body'] ?? '';
    final type = notification['type'] as String? ?? 'system';
    final createdAt = (DateTime.tryParse(notification['created_at'] ?? '') ?? DateTime.now()).toLocal();
    final metadata = notification['metadata'] as Map<String, dynamic>?;
    final attachments = metadata?['attachments'] as List<dynamic>? ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: colors.backgroundSecondary.withOpacity(0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          border: Border.all(color: colors.border.withOpacity(0.5)),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colors.textSecondary.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                
                // Header (Close button & Date)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Type Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _getIconColor(type).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: _getIconColor(type).withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(_getIcon(type), color: _getIconColor(type), size: 12),
                            const SizedBox(width: 6),
                            Text(
                              type.toUpperCase(),
                              style: TextStyle(
                                color: _getIconColor(type),
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: Icon(LucideIcons.x, color: colors.textSecondary),
                        style: IconButton.styleFrom(
                          backgroundColor: colors.surface.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                ),

                // Main Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          DateFormat('EEEE, MMM dd, yyyy • h:mm a').format(createdAt),
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: colors.surface.withOpacity(0.4),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: colors.border.withOpacity(0.5)),
                          ),
                          child: SelectableText(
                            body,
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 15,
                              height: 1.6,
                            ),
                          ),
                        ),
                        
                        if (attachments.isNotEmpty) ...[
                          const SizedBox(height: 32),
                          Text(
                            'ATTACHMENTS (${attachments.length})',
                            style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...attachments.map((urlStr) {
                            final url = urlStr.toString();
                            final uri = Uri.tryParse(url);
                            final rawName = uri != null && uri.pathSegments.isNotEmpty 
                                ? uri.pathSegments.last 
                                : 'Attachment';
                            // Remove leading timestamp from name (e.g. 1779170165109_filename.png)
                            final cleanName = rawName.contains('_') 
                                ? rawName.substring(rawName.indexOf('_') + 1) 
                                : rawName;

                            final mimeType = _inferMimeType(url);
                            final isImage = mimeType.startsWith('image/');
                            final isVideo = mimeType.startsWith('video/');
                            final isPdf = mimeType.contains('pdf');

                            IconData fileIcon = LucideIcons.file;
                            Color iconColor = colors.textSecondary;
                            if (isImage) {
                              fileIcon = LucideIcons.image;
                              iconColor = colors.indigo;
                            } else if (isVideo) {
                              fileIcon = LucideIcons.playCircle;
                              iconColor = colors.honey;
                            } else if (isPdf) {
                              fileIcon = LucideIcons.fileText;
                              iconColor = colors.error;
                            }

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              decoration: BoxDecoration(
                                color: colors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: colors.border),
                              ),
                              child: InkWell(
                                onTap: () {
                                  // Construct FileAsset and open detail modal
                                  final asset = FileAsset(
                                    id: url,
                                    name: cleanName,
                                    path: '',
                                    mimeType: mimeType,
                                    size: 0,
                                    createdAt: createdAt,
                                    downloadLink: url,
                                    viewLink: url,
                                  );
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (context) => FileDetailModal(asset: asset),
                                  );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: iconColor.withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(fileIcon, color: iconColor, size: 20),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Text(
                                          cleanName,
                                          style: TextStyle(
                                            color: colors.textPrimary,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Icon(LucideIcons.chevronRight, color: colors.textSecondary, size: 16),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ],
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUpdateNotificationCard(
    BuildContext context,
    ThemeColors colors,
    UpdateInfo info,
    UpdateDownloadState state,
    double progress,
    WidgetRef ref,
  ) {
    final isLight = !colors.isDark;
    final isDownloading = state == UpdateDownloadState.downloading;
    final isDownloaded = state == UpdateDownloadState.downloaded;
    final isInstalling = state == UpdateDownloadState.installing;

    return Container(
      decoration: BoxDecoration(
        color: isLight ? const Color(0xFFFFFBEB) : colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFD97706).withOpacity(isLight ? 0.3 : 0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD97706).withOpacity(isLight ? 0.05 : 0.1),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(23),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.rocket,
                        color: Color(0xFFD97706),
                        size: 24,
                      ),
                    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                     .moveY(begin: -3, end: 3, duration: 1200.ms, curve: Curves.easeInOut),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD97706).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'NEW VERSION AVAILABLE',
                              style: TextStyle(
                                color: Color(0xFFD97706),
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'MediaHive v${info.latestVersion}',
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isLight ? Colors.white.withOpacity(0.6) : colors.backgroundPrimary.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isLight ? Colors.black.withOpacity(0.05) : colors.border,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'RELEASE NOTES:',
                        style: TextStyle(
                          color: colors.textSecondary,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        info.releaseNotes,
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (isDownloading) ...[
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: progress,
                            backgroundColor: const Color(0xFFD97706).withOpacity(0.15),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD97706)),
                            minHeight: 8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${(progress * 100).toInt()}%',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Downloading package...',
                        style: TextStyle(
                          color: colors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      TextButton(
                        style: TextButton.styleFrom(
                          foregroundColor: colors.error,
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () {
                          ref.read(updateStateProvider.notifier).cancelDownload();
                        },
                        child: const Text(
                          'CANCEL',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ] else if (isInstalling) ...[
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFD97706)),
                            ),
                          ),
                          SizedBox(width: 12),
                          Text(
                            'Launching installer package...',
                            style: TextStyle(
                              color: Color(0xFFD97706),
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFD97706),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          onPressed: () {
                            if (isDownloaded) {
                              ref.read(updateStateProvider.notifier).installUpdate();
                            } else {
                              ref.read(updateStateProvider.notifier).downloadUpdate(info.downloadUrl);
                            }
                          },
                          icon: Icon(
                            isDownloaded ? LucideIcons.checkCircle : LucideIcons.download,
                            size: 18,
                          ),
                          label: Text(
                            isDownloaded ? 'INSTALL UPDATE' : 'DOWNLOAD & INSTALL NOW',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0, curve: Curves.easeOutBack);
  }
}



class _NotificationTile extends StatelessWidget {
  final Map<String, dynamic> notification;
  final bool isRead;
  final DateTime createdAt;
  final ThemeColors colors;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationTile({
    required this.notification,
    required this.isRead,
    required this.createdAt,
    required this.colors,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isRead ? colors.surface.withOpacity(0.5) : colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isRead ? colors.border : colors.honey.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: isRead ? [] : [
          BoxShadow(
            color: colors.honey.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _getIconColor(notification['type']).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getIcon(notification['type']),
                  color: _getIconColor(notification['type']),
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            notification['title'] ?? 'Notification',
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        Text(
                          DateFormat.jm().format(createdAt),
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      notification['body'] ?? '',
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                    if (notification['metadata'] != null && 
                        notification['metadata']['attachments'] != null &&
                        (notification['metadata']['attachments'] as List).isNotEmpty) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 60,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: (notification['metadata']['attachments'] as List).length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, i) {
                            final url = notification['metadata']['attachments'][i].toString();
                            final ext = url.split('?').first.split('.').last.toLowerCase();
                            final isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext);
                            final isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].contains(ext);
                            final isPdf = ext == 'pdf';

                            if (isImage) {
                              return ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  url,
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 60,
                                    height: 60,
                                    color: colors.border,
                                    child: Icon(LucideIcons.image, size: 16, color: colors.textSecondary),
                                  ),
                                ),
                              );
                            }

                            IconData icon = LucideIcons.file;
                            Color iconColor = colors.textSecondary;
                            if (isPdf) {
                              icon = LucideIcons.fileText;
                              iconColor = colors.error;
                            } else if (isVideo) {
                              icon = LucideIcons.playCircle;
                              iconColor = colors.honey;
                            }

                            return Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: colors.surface.withOpacity(0.5),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: colors.border),
                              ),
                              child: Center(
                                child: Icon(icon, size: 24, color: iconColor),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (isRead)
                IconButton(
                  icon: Icon(LucideIcons.trash2, size: 18, color: colors.textSecondary.withOpacity(0.5)),
                  onPressed: onDelete,
                ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIcon(String? type) {
    switch (type) {
      case 'task': return LucideIcons.checkSquare;
      case 'event': return LucideIcons.calendar;
      case 'system': return LucideIcons.info;
      case 'alert': return LucideIcons.alertTriangle;
      default: return LucideIcons.bell;
    }
  }

  Color _getIconColor(String? type) {
    switch (type) {
      case 'task': return const Color(0xFF6366F1);
      case 'event': return const Color(0xFF10B981);
      case 'system': return const Color(0xFF8B5CF6);
      case 'alert': return const Color(0xFFEF4444);
      default: return const Color(0xFFF59E0B);
    }
  }
}


