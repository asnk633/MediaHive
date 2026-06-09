import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/logger_service.dart';
import '../../../../../core/services/network_service.dart';
import '../../../../../core/testing/chaos_controller.dart';
import '../../../../../core/services/notification_service.dart';
import '../../../../../core/services/sound_service.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../core/providers/user_provider.dart';

class SystemHealthScreen extends ConsumerWidget {
  const SystemHealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logs = ref.watch(loggerProvider);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;
    final chaos = ref.watch(chaosProvider);
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(
            left: AppSpacing.l, 
            right: AppSpacing.l, 
            top: 140, // Account for global header
            bottom: 120, // Account for floating dock
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPageHeader(colors),
              const SizedBox(height: 32),
              _buildSectionTitle(colors, 'OPERATIONAL STATUS'),
              const SizedBox(height: AppSpacing.m),
              _buildStatusCard(
                colors,
                'Network Status',
                networkStatus == NetworkStatus.online ? 'CONNECTED' : 'DISCONNECTED',
                networkStatus == NetworkStatus.online ? LucideIcons.wifi : LucideIcons.wifiOff,
                networkStatus == NetworkStatus.online ? colors.emerald : colors.error,
              ),
              const SizedBox(height: AppSpacing.xl),
              
              // Fetch the profile state
              ref.watch(currentUserProfileProvider).maybeWhen(
                data: (profile) {
                  final rawRole = profile?['role'] as String? ?? 'member';
                  final normalized = rawRole.replaceAll(' ', '').replaceAll('_', '').toLowerCase();
                  final isDeveloper = normalized == 'admin' || normalized == 'manager';

                  if (!isDeveloper) return const SizedBox.shrink();

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle(colors, 'CHAOS ENGINEERING'),
                      const SizedBox(height: AppSpacing.m),
                      _buildChaosControl(
                        colors,
                        ref,
                        'Simulate Network Loss',
                        chaos.isForcedOffline,
                        (val) => ref.read(chaosProvider.notifier).toggleForcedOffline(val),
                      ),
                      _buildChaosControl(
                        colors,
                        ref,
                        'Inject Failures',
                        chaos.shouldInjectFailures,
                        (val) => ref.read(chaosProvider.notifier).toggleInjectedFailures(val),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                    ],
                  );
                },
                orElse: () => const SizedBox.shrink(),
              ),
              
              _buildSectionTitle(colors, 'SOUNDS & NOTIFICATIONS'),
              const SizedBox(height: AppSpacing.m),
              _buildNotificationSoundTestPanel(context, ref, colors),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle(colors, 'LOGS & TELEMETRY'),
              const SizedBox(height: AppSpacing.m),
              _buildLogBuffer(colors, ref, logs),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPageHeader(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SYSTEM HEALTH', 
          style: AppTypography.h1.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: 8),
        Text(
          'DIAGNOSTICS, LOGS & CHAOS CONTROL.',
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.bold, 
            letterSpacing: 1.2,
            color: colors.textSecondary.withValues(alpha: 0.8),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(ThemeColors colors, String title) {
    return Text(
      title,
      style: AppTypography.caption.copyWith(
        fontWeight: FontWeight.w900, 
        color: colors.textSecondary,
      ),
    );
  }

  Widget _buildStatusCard(ThemeColors colors, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: AppSpacing.m),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label, 
                style: AppTypography.caption.copyWith(color: colors.textSecondary),
              ),
              Text(
                value, 
                style: AppTypography.bodyM.copyWith(
                  fontWeight: FontWeight.bold, 
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChaosControl(ThemeColors colors, WidgetRef ref, String label, bool value, Function(bool) onChanged) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        label, 
        style: AppTypography.bodyM.copyWith(color: colors.textPrimary),
      ),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeThumbColor: colors.honey,
      ),
    );
  }

  Widget _buildLogBuffer(ThemeColors colors, WidgetRef ref, List<LogEntry> logs) {
    return Container(
      height: 300,
      decoration: BoxDecoration(
        color: colors.isDark ? Colors.black45 : Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: colors.border),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.s),
        itemCount: logs.length,
        itemBuilder: (context, index) {
          final log = logs[index];
          Color color = colors.isDark ? Colors.white70 : colors.textPrimary.withValues(alpha: 0.7);
          if (log.level == LogLevel.error) color = colors.error;
          if (log.level == LogLevel.sync) color = colors.indigo;
          if (log.level == LogLevel.warning) color = colors.honey;

          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              log.toString(),
              style: TextStyle(
                color: color, 
                fontSize: 8, 
                fontFamily: 'monospace'
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationSoundTestPanel(BuildContext context, WidgetRef ref, ThemeColors colors) {
    final sound = ref.read(soundServiceProvider);
    final notification = ref.read(notificationServiceProvider);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'IN-APP SOUND TESTING',
            style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.honey),
          ),
          const SizedBox(height: AppSpacing.s),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                backgroundColor: colors.border.withValues(alpha: 0.1),
                side: BorderSide.none,
                label: Text('Task Sound', style: TextStyle(fontSize: 11, color: colors.textPrimary)),
                onPressed: () => sound.playTaskAdded(),
              ),
              ActionChip(
                backgroundColor: colors.border.withValues(alpha: 0.1),
                side: BorderSide.none,
                label: Text('Event Sound', style: TextStyle(fontSize: 11, color: colors.textPrimary)),
                onPressed: () => sound.playEventAlert(),
              ),
              ActionChip(
                backgroundColor: colors.border.withValues(alpha: 0.1),
                side: BorderSide.none,
                label: Text('Success Sound', style: TextStyle(fontSize: 11, color: colors.textPrimary)),
                onPressed: () => sound.playSuccess(),
              ),
              ActionChip(
                backgroundColor: colors.border.withValues(alpha: 0.1),
                side: BorderSide.none,
                label: Text('Warning Sound', style: TextStyle(fontSize: 11, color: colors.textPrimary)),
                onPressed: () => sound.playWarning(),
              ),
              ActionChip(
                backgroundColor: colors.border.withValues(alpha: 0.1),
                side: BorderSide.none,
                label: Text('Upload Sound', style: TextStyle(fontSize: 11, color: colors.textPrimary)),
                onPressed: () => sound.playUploadComplete(),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.m),
          Divider(color: colors.border.withValues(alpha: 0.3)),
          const SizedBox(height: AppSpacing.s),
          Text(
            'NATIVE PUSH NOTIFICATION TESTING',
            style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.honey),
          ),
          const SizedBox(height: AppSpacing.s),
          Column(
            children: [
              _buildNotificationTestRow(
                context,
                colors,
                title: 'Test Task Notification',
                subtitle: "Triggers native 'task_added' notification sound",
                icon: LucideIcons.checkSquare,
                onTap: () => notification.showTaskNotification(
                  'Task Assigned',
                  'New task assigned: "Restock Honeybee Batteries"'
                ),
              ),
              const SizedBox(height: AppSpacing.s),
              _buildNotificationTestRow(
                context,
                colors,
                title: 'Test Event Notification',
                subtitle: "Triggers native 'event_alert' notification sound",
                icon: LucideIcons.calendar,
                onTap: () => notification.showEventNotification(
                  'Media Briefing',
                  'Urgent briefing starting in 10 minutes at Studio A.'
                ),
              ),
              const SizedBox(height: AppSpacing.s),
              _buildNotificationTestRow(
                context,
                colors,
                title: 'Test System Warning',
                subtitle: "Triggers native 'warning' notification sound",
                icon: LucideIcons.alertTriangle,
                onTap: () => notification.showSystemNotification(
                  'Critical Warning',
                  'Storage capacity reached 95%. Cleanup immediately.'
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationTestRow(
    BuildContext context,
    ThemeColors colors, {
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.s),
        decoration: BoxDecoration(
          color: colors.textSecondary.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: colors.honey, size: 18),
      ),
      title: Text(title, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
      subtitle: Text(subtitle, style: AppTypography.bodyS.copyWith(color: colors.textSecondary.withValues(alpha: 0.8), fontSize: 10)),
      trailing: IconButton(
        icon: Icon(LucideIcons.bellRing, color: colors.honey, size: 18),
        onPressed: onTap,
      ),
    );
  }
}
