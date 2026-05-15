import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/logger_service.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/network_service.dart';
import '../../../../../core/testing/chaos_controller.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../tasks/domain/models/task.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';

class SystemHealthScreen extends ConsumerWidget {
  const SystemHealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logs = ref.watch(loggerProvider);
    final pendingCount = ref.watch(pendingSyncCountProvider).valueOrNull ?? 0;
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;
    final chaos = ref.watch(chaosProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundPrimary,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.darkGradient),
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
              _buildPageHeader(),
              const SizedBox(height: 32),
              _buildSectionTitle('OPERATIONAL STATUS'),
              const SizedBox(height: AppSpacing.m),
              _buildStatusCard(
                'Network Status',
                networkStatus == NetworkStatus.online ? 'ONLINE' : 'OFFLINE',
                networkStatus == NetworkStatus.online ? LucideIcons.wifi : LucideIcons.wifiOff,
                networkStatus == NetworkStatus.online ? AppColors.success : AppColors.error,
              ),
              const SizedBox(height: AppSpacing.s),
              _buildStatusCard(
                'Sync Queue',
                '$pendingCount Pending Mutations',
                LucideIcons.refreshCw,
                pendingCount == 0 ? AppColors.textSecondary : AppColors.info,
              ),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('CHAOS ENGINEERING'),
              const SizedBox(height: AppSpacing.m),
              _buildChaosControl(
                ref,
                'Simulate Network Loss',
                chaos.isForcedOffline,
                (val) => ref.read(chaosProvider.notifier).toggleForcedOffline(val),
              ),
              _buildChaosControl(
                ref,
                'Inject Failures',
                chaos.shouldInjectFailures,
                (val) => ref.read(chaosProvider.notifier).toggleInjectedFailures(val),
              ),
              const SizedBox(height: AppSpacing.m),
              MhButton(
                label: 'STRESS TEST: 1000 TASKS',
                onTap: () => _performStressTest(context, ref),
                type: MhButtonType.secondary,
                width: double.infinity,
              ),
              const SizedBox(height: AppSpacing.xl),
              
              _buildSectionTitle('LOGS & TELEMETRY'),
              const SizedBox(height: AppSpacing.m),
              _buildLogBuffer(ref, logs),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPageHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SYSTEM HEALTH', style: AppTypography.h1),
        const SizedBox(height: 8),
        Text(
          'DIAGNOSTICS, LOGS & CHAOS CONTROL.',
          style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, letterSpacing: 1.2),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, color: AppColors.textSecondary),
    );
  }

  Widget _buildStatusCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: AppSpacing.m),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.caption),
              Text(value, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: color)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChaosControl(WidgetRef ref, String label, bool value, Function(bool) onChanged) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: AppTypography.bodyM),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.honey,
      ),
    );
  }

  Widget _buildLogBuffer(WidgetRef ref, List<LogEntry> logs) {
    return Container(
      height: 300,
      decoration: BoxDecoration(
        color: Colors.black45,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.s),
        itemCount: logs.length,
        itemBuilder: (context, index) {
          final log = logs[index];
          Color color = Colors.white70;
          if (log.level == LogLevel.error) color = AppColors.error;
          if (log.level == LogLevel.sync) color = AppColors.info;
          if (log.level == LogLevel.warning) color = AppColors.warning;

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

  Future<void> _performStressTest(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text('START STRESS TEST?', style: AppTypography.h3),
        content: const Text('This will queue 1000 tasks and may impact app performance during processing.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('START', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final notifier = ref.read(tasksListProvider.notifier);
    final logger = ref.read(loggerProvider.notifier);
    
    logger.info('Starting 1000 Tasks Stress Test');
    
    // Perform in batches to avoid blocking UI too much
    for (int batch = 0; batch < 10; batch++) {
      await Future.delayed(const Duration(milliseconds: 100));
      for (int i = 0; i < 100; i++) {
        final id = 'stress_${batch}_$i';
        notifier.addTask(Task(
          id: id,
          title: 'Stress Task $id',
          status: 'To Do',
          priority: 'Medium',
          requester: 'Stress Test',
          assignee: 'System',
          dueDate: '2026-12-31',
        ));
      }
    }
    logger.info('Stress Test Queued Successfully');
  }
}
