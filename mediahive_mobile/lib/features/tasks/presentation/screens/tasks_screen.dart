import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/network_service.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/analytics_service.dart';
import '../providers/tasks_provider.dart';
import '../widgets/add_task_dialog.dart';
import '../../domain/models/task.dart';
import '../../../../core/providers/user_provider.dart';
import 'package:intl/intl.dart';
import '../../data/datasources/task_local_datasource.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../../../../shared/widgets/mh_empty_state.dart';
import '../../../../../core/testing/chaos_controller.dart';
import '../../../system/presentation/screens/system_health_screen.dart';

final tasksTabProvider = StateProvider<int>((ref) => 0);

class TasksScreen extends ConsumerWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('TasksScreen');
    
    final activeTab = ref.watch(tasksTabProvider);
    final tasksAsync = ref.watch(tasksListProvider);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;

    return Scaffold(
      backgroundColor: AppColors.backgroundPrimary,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.darkGradient,
        ),
        child: Stack(
          children: [
            Column(
              children: [
                // Top banner for offline mode
                if (networkStatus == NetworkStatus.offline)
                  _buildOfflineBanner(),
                  
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: () => ref.refresh(tasksListProvider.future),
                    color: AppColors.honey,
                    backgroundColor: AppColors.surface,
                    child: tasksAsync.when(
                      data: (tasks) => tasks.isEmpty 
                        ? _buildEmptyState(context)
                        : _buildContent(context, ref, activeTab, tasks),
                      loading: () => _buildLoadingState(),
                      error: (e, _) => _buildErrorState(ref, e),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflineBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      color: AppColors.warning.withOpacity(0.8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.wifiOff, size: 14, color: Colors.white),
          const SizedBox(width: AppSpacing.s),
          Text(
            'OFFLINE MODE — CHANGES WILL SYNC LATER',
            style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, int activeTab, List<dynamic> tasks) {
    final profile = ref.watch(currentUserProfileProvider).valueOrNull;
    final fullName = profile?['full_name'] as String?;

    return ListView(
      padding: const EdgeInsets.only(
        left: AppSpacing.l, 
        right: AppSpacing.l, 
        top: 140, 
        bottom: 120,
      ),
      children: [
        _buildHeader(context, ref),
        const SizedBox(height: AppSpacing.s),
        _buildStatGrid(tasks),
        const SizedBox(height: AppSpacing.m),
        _buildTabs(ref, activeTab),
        const SizedBox(height: AppSpacing.m),
        _buildTaskList(tasks, activeTab, fullName),
      ],
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.only(left: AppSpacing.l, right: AppSpacing.l, top: 140),
      children: [
        const MhSkeleton(height: 60, width: double.infinity),
        const SizedBox(height: AppSpacing.m),
        Row(
          children: [
            Expanded(child: MhSkeleton(height: 80)),
            const SizedBox(width: AppSpacing.s),
            Expanded(child: MhSkeleton(height: 80)),
            const SizedBox(width: AppSpacing.s),
            Expanded(child: MhSkeleton(height: 80)),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        ...List.generate(5, (index) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.s),
          child: MhSkeleton(height: 100, width: double.infinity),
        )),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return MhEmptyState(
      title: 'No Tasks Found',
      message: 'Clean slate! Create a new task to get started with your workflow.',
      icon: LucideIcons.clipboardList,
      actionLabel: 'Create Task',
      onAction: () => context.push('/create-task'),
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 48),
          const SizedBox(height: AppSpacing.m),
          Text('Failed to load tasks', style: AppTypography.h3),
          const SizedBox(height: AppSpacing.s),
          MhButton(
            label: 'Try Again',
            onTap: () => ref.refresh(tasksListProvider),
            type: MhButtonType.secondary,
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            GestureDetector(
              onLongPress: () => _showChaosMenu(context, ref),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TASKS', style: AppTypography.h1),
                  const SizedBox(height: 4),
                  Text(
                    'OPERATIONAL FLOW',
                    style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                ],
              ),
            ),
            MhButton(
              label: 'Add Task',
              onTap: () => showDialog(
                context: context,
                builder: (context) => const AddTaskDialog(),
              ),
              height: 40,
              type: MhButtonType.primary,
            ),
          ],
        ),
        const SizedBox(height: 32),
        Consumer(builder: (context, ref, _) {
          final pendingCount = ref.watch(pendingSyncCountProvider).valueOrNull ?? 0;
          if (pendingCount == 0) return const SizedBox.shrink();
          return GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SystemHealthScreen())),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.info.withOpacity(0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.refreshCcw, size: 10, color: AppColors.info),
                  const SizedBox(width: 6),
                  Text(
                    'SYNCING $pendingCount CHANGES...',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.info, 
                      fontSize: 9, 
                      fontWeight: FontWeight.bold
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  void _showChaosMenu(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('CHAOS CONTROL', style: AppTypography.h3),
            const SizedBox(height: AppSpacing.m),
            ListTile(
              leading: const Icon(LucideIcons.wifiOff),
              title: const Text('Simulate Network Loss'),
              trailing: Switch(
                value: ref.watch(chaosProvider).isForcedOffline,
                onChanged: (val) => ref.read(chaosProvider.notifier).toggleForcedOffline(val),
              ),
            ),
            ListTile(
              leading: const Icon(LucideIcons.trash2),
              title: const Text('Clear Local Cache'),
              onTap: () async {
                final local = HiveTaskLocalDataSource();
                await local.clearCache();
                ref.invalidate(tasksListProvider);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.zap),
              title: const Text('Inject 100 Tasks (Stress)'),
              onTap: () async {
                final notifier = ref.read(tasksListProvider.notifier);
                for (int i = 0; i < 100; i++) {
                  await notifier.addTask(Task(
                    id: 'stress_$i',
                    title: 'Stress Task $i',
                    status: 'To Do',
                    priority: 'Medium',
                    requester: 'Chaos Monkey',
                    assignee: 'System',
                    dueDate: '2026-12-31',
                  ));
                }
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.bomb),
              title: const Text('Trigger Crash (Error Boundary)'),
              onTap: () => throw Exception('Chaos Monkey Triggered Crash!'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatGrid(List<dynamic> tasks) {
    final total = tasks.length.toString();
    final done = tasks.where((t) => t.status?.toLowerCase() == 'done').length.toString();
    final inProgress = tasks.where((t) => t.status?.toLowerCase() == 'in_progress').length.toString();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildCompactStat('TOTAL', total, AppColors.textPrimary),
          _buildVerticalDivider(),
          _buildCompactStat('ACTIVE', inProgress, AppColors.info),
          _buildVerticalDivider(),
          _buildCompactStat('DONE', done, AppColors.success),
        ],
      ),
    );
  }

  Widget _buildCompactStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: AppTypography.h3.copyWith(color: color)),
        Text(label, style: AppTypography.caption.copyWith(fontSize: 8, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildVerticalDivider() {
    return Container(width: 1, height: 30, color: AppColors.border);
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.s),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(height: AppSpacing.xxs),
            Text(value, style: AppTypography.h3),
            Text(label, style: AppTypography.caption),
          ],
        ),
      ),
    );
  }

  Widget _buildTabs(WidgetRef ref, int activeTab) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          _buildTab(ref, 'TODAY', 0, activeTab == 0),
          _buildTab(ref, 'ALL', 1, activeTab == 1),
          _buildTab(ref, 'REQUESTS', 2, activeTab == 2),
        ],
      ),
    );
  }

  Widget _buildTab(WidgetRef ref, String title, int index, bool isActive) {
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(tasksTabProvider.notifier).state = index,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12), // Increased padding
          decoration: BoxDecoration(
            color: isActive ? AppColors.info : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.s),
            boxShadow: isActive ? [BoxShadow(color: AppColors.info.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 2))] : null,
          ),
          child: Center(
            child: Text(
              title,
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w900,
                fontSize: 10,
                letterSpacing: 0.5,
                color: isActive ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTaskList(List<dynamic> tasks, int activeTab, String? fullName) {
    final filtered = tasks.where((t) {
      final status = t.status?.toLowerCase() ?? '';
      if (activeTab == 0) {
        final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
        return t.dueDate == today;
      }
      if (activeTab == 2) return t.requester == fullName;
      return true;
    }).toList();

    return Column(
      children: filtered.map((task) => _buildTaskItem(task)).toList(),
    );
  }

  Widget _buildTaskItem(dynamic task) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.xs),
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(task.title, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: AppSpacing.xxs),
                Text('${task.requester ?? 'System'} → ${task.assignee ?? 'Unassigned'}', style: AppTypography.caption),
              ],
            ),
          ),
          _buildStatusChip(task.status),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    final normalizedStatus = status.toLowerCase();
    Color color = AppColors.textSecondary;
    if (normalizedStatus == 'done') color = AppColors.success;
    if (normalizedStatus == 'in_progress') color = AppColors.info;
    if (normalizedStatus == 'review') color = AppColors.warning;
    if (normalizedStatus == 'todo') color = AppColors.textSecondary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.s),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: AppTypography.caption.copyWith(color: color, fontWeight: FontWeight.bold),
      ),
    );
  }
}
