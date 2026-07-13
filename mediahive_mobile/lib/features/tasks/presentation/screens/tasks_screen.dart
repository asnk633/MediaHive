import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/theme/app_spacing.dart';
import 'package:mediahive_mobile/core/utils/layout_helpers.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/network_service.dart';
import '../../../../../core/services/analytics_service.dart';
import 'package:mediahive_mobile/features/tasks/presentation/providers/tasks_provider.dart';
import 'package:mediahive_mobile/features/tasks/presentation/widgets/task_board_tabs.dart';
import 'package:mediahive_mobile/features/tasks/presentation/widgets/task_filter_bar.dart';
import 'package:mediahive_mobile/features/tasks/presentation/widgets/task_item_tile.dart';
import 'package:mediahive_mobile/features/tasks/domain/models/task.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:intl/intl.dart';
import 'package:mediahive_mobile/features/tasks/data/datasources/task_local_datasource.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_empty_state.dart';
import '../../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../../../../core/testing/chaos_controller.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';

class TasksScreen extends ConsumerWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('TasksScreen');
    
    final activeTab = ref.watch(tasksTabProvider);
    final tasksAsync = ref.watch(tasksListProvider);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;
    final isOffline = networkStatus == NetworkStatus.offline;
    final colors = ref.watch(themeColorsProvider);
    final headerHeight = ref.watch(headerHeightProvider);

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
        child: MhRefreshIndicator(
          edgeOffset: 120,
          onRefresh: () => ref.refresh(tasksListProvider.future),
          child: AnimatedCrossFade(
            duration: const Duration(milliseconds: 400),
            firstCurve: Curves.easeInOutCubic,
            secondCurve: Curves.easeInOutCubic,
            crossFadeState: tasksAsync.isLoading && !tasksAsync.hasValue
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            firstChild: _buildLoadingState(),
            secondChild: tasksAsync.hasError
                ? _buildErrorState(ref, tasksAsync.error!, colors)
                : tasksAsync.hasValue
                    ? (tasksAsync.value!.isEmpty
                        ? _buildEmptyState(context)
                        : _buildContent(context, ref, activeTab, tasksAsync.value!, isOffline, colors, headerHeight))
                    : const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, int activeTab, List<dynamic> tasks, bool isOffline, ThemeColors colors, double headerHeight) {
    final profile = ref.watch(currentUserProfileProvider).valueOrNull;
    final fullName = profile?['full_name'] as String?;

    return ListView(
      key: const ValueKey('tasks_content'),
      padding: EdgeInsets.only(
        left: AppSpacing.l, 
        right: AppSpacing.l, 
        top: (headerHeight == 0 ? (120.0 + MediaQuery.of(context).padding.top) : headerHeight) + 64.0, 
        bottom: 120,
      ),
      children: [
        _buildHeader(context, ref, isOffline, colors),
        const SizedBox(height: AppSpacing.s),
        _buildStatGrid(tasks, colors),
        const SizedBox(height: AppSpacing.m),
        TaskBoardTabs(activeTab: activeTab),
        const SizedBox(height: AppSpacing.m),
        TaskFilterBar(
          onSortTap: () => _showSortSheet(context, ref, colors),
          onFilterTap: () => _showFilterSheet(context, ref, colors),
        ),
        const SizedBox(height: AppSpacing.m),
        _buildTaskList(context, ref, tasks, activeTab, fullName, isOffline, colors),
      ],
    );
  }

  Widget _buildLoadingState() {
    return const SizedBox(
      key: ValueKey('tasks_loading'),
      child: MhLoading(),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return SizedBox(
      key: const ValueKey('tasks_empty'),
      child: MhEmptyState(
        title: 'No Tasks Found',
        message: 'Clean slate! Create a new task to get started with your workflow.',
        icon: LucideIcons.clipboardList,
        actionLabel: 'Create Task',
        onAction: () => context.push('/create-task'),
      ),
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object error, ThemeColors colors) {
    return Center(
      key: const ValueKey('tasks_error'),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.alertCircle, color: colors.error, size: 48),
          const SizedBox(height: AppSpacing.m),
          Text('Failed to load tasks', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
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

  Widget _buildHeader(BuildContext context, WidgetRef ref, bool isOffline, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            GestureDetector(
              onLongPress: () {
                if (kDebugMode) {
                  _showChaosMenu(context, ref, colors);
                }
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'TASKS', 
                    style: AppTypography.h1.copyWith(color: colors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'OPERATIONAL FLOW',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.bold, 
                      letterSpacing: 1.2,
                      color: colors.textSecondary.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),
            MhButton(
              label: 'Add Task',
              onTap: () => context.push('/create-task'),
              height: 40,
              type: MhButtonType.primary,
            ),
          ],
        ),
      ],
    );
  }

  void _showChaosMenu(BuildContext context, WidgetRef ref, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('CHAOS CONTROL', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
            const SizedBox(height: AppSpacing.m),
            ListTile(
              leading: Icon(LucideIcons.wifiOff, color: colors.textSecondary),
              title: Text('Simulate Network Loss', style: TextStyle(color: colors.textPrimary)),
              trailing: Switch(
                value: ref.watch(chaosProvider).isForcedOffline,
                onChanged: (val) => ref.read(chaosProvider.notifier).toggleForcedOffline(val),
              ),
            ),
            ListTile(
              leading: Icon(LucideIcons.trash2, color: colors.textSecondary),
              title: Text('Clear Local Cache', style: TextStyle(color: colors.textPrimary)),
              onTap: () async {
                final local = HiveTaskLocalDataSource();
                await local.clearCache();
                ref.invalidate(tasksListProvider);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(LucideIcons.zap, color: colors.textSecondary),
              title: Text('Inject 100 Tasks (Stress)', style: TextStyle(color: colors.textPrimary)),
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
                    attachments: [],
                  ));
                }
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(LucideIcons.bomb, color: colors.error),
              title: Text('Trigger Crash (Error Boundary)', style: TextStyle(color: colors.error)),
              onTap: () => throw Exception('Chaos Monkey Triggered Crash!'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatGrid(List<dynamic> tasks, ThemeColors colors) {
    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);
    
    final total = tasks.length.toString();
    final todo = tasks.where((t) {
      final status = (t as Task).status.toLowerCase();
      return status == 'todo' || status == 'to do' || status == 'to_do';
    }).length.toString();

    final dueToday = tasks.where((t) {
      final task = t as Task;
      return task.dueDate == todayStr && task.status.toLowerCase() != 'done';
    }).length.toString();
    
    final inProgress = tasks.where((t) => 
      (t as Task).status.toLowerCase() == 'in progress' || 
      (t).status.toLowerCase() == 'in_progress'
    ).length.toString();
    
    final onHold = tasks.where((t) => 
      (t as Task).status.toLowerCase() == 'on hold' || 
      (t).status.toLowerCase() == 'on_hold'
    ).length.toString();
    
    final completed = tasks.where((t) => 
      (t as Task).status.toLowerCase() == 'done' || 
      (t).status.toLowerCase() == 'completed'
    ).length.toString();

    return Row(
      children: [
        _buildStatCard(colors, 'TOTAL', total, LucideIcons.clipboardCheck, colors.isDark ? colors.indigo : colors.honey, flex: 3),
        const SizedBox(width: 4),
        _buildStatCard(colors, 'TO DO', todo, LucideIcons.listTodo, const Color(0xFF3B82F6), flex: 4),
        const SizedBox(width: 4),
        _buildStatCard(colors, 'TODAY', dueToday, LucideIcons.clock, colors.honey, flex: 4),
        const SizedBox(width: 4),
        _buildStatCard(colors, 'ACTIVE', inProgress, LucideIcons.activity, colors.isDark ? colors.indigo : colors.indigo, flex: 4),
        const SizedBox(width: 4),
        _buildStatCard(colors, 'HOLD', onHold, LucideIcons.pauseCircle, colors.error, flex: 4),
        const SizedBox(width: 4),
        _buildStatCard(colors, 'DONE', completed, LucideIcons.checkCircle2, colors.emerald, flex: 3),
      ],
    );
  }

  Widget _buildStatCard(ThemeColors colors, String label, String value, IconData icon, Color color, {int flex = 1}) {
    return Expanded(
      flex: flex,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 2),
        decoration: BoxDecoration(
          color: colors.isDark ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: colors.isDark 
                ? Colors.white.withValues(alpha: 0.05) 
                : colors.border.withValues(alpha: 0.12),
          ),
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
          children: [
            Icon(icon, size: 12, color: color.withValues(alpha: colors.isDark ? 0.8 : 0.9)),
            const SizedBox(height: 6),
            Text(
              value,
              style: AppTypography.h3.copyWith(
                color: colors.isDark ? Colors.white : colors.textPrimary, 
                height: 1,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: AppTypography.caption.copyWith(
                fontSize: 6,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.1,
                color: colors.isDark 
                    ? Colors.white.withValues(alpha: 0.4) 
                    : colors.textSecondary.withValues(alpha: 0.6),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.clip,
            ),
          ],
        ),
      ),
    );
  }



  // ─── Sort Bottom Sheet ────────────────────────────────────────────────────
  void _showSortSheet(BuildContext context, WidgetRef ref, ThemeColors colors) {
    final sortOptions = [
      {'label': 'Default (Newest First)', 'value': 'DEFAULT', 'icon': LucideIcons.layoutList},
      {'label': 'Status: A → Z', 'value': 'STATUS_ASC', 'icon': LucideIcons.arrowUpNarrowWide},
      {'label': 'Status: Z → A', 'value': 'STATUS_DESC', 'icon': LucideIcons.arrowDownNarrowWide},
      {'label': 'Due Date: Earliest First', 'value': 'DATE_ASC', 'icon': LucideIcons.arrowUp},
      {'label': 'Due Date: Latest First', 'value': 'DATE_DESC', 'icon': LucideIcons.arrowDown},
    ];

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Consumer(
          builder: (context, ref, _) {
            final currentSort = ref.watch(tasksSortOrderProvider);
            return Container(
              decoration: BoxDecoration(
                color: colors.backgroundPrimary,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: colors.border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colors.textSecondary.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'SORT BY',
                    style: AppTypography.caption.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                      color: colors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...sortOptions.map((opt) {
                    final isSelected = currentSort == opt['value'];
                    final color = isSelected ? colors.honey : colors.textSecondary;
                    return ListTile(
                      onTap: () {
                        ref.read(tasksSortOrderProvider.notifier).state =
                            opt['value'] as String;
                        Navigator.pop(context);
                      },
                      leading: Icon(opt['icon'] as IconData,
                          color: color, size: 18),
                      title: Text(
                        opt['label'] as String,
                        style: TextStyle(
                          color: isSelected
                              ? colors.textPrimary
                              : colors.textSecondary,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                          fontSize: 14,
                        ),
                      ),
                      trailing: isSelected
                          ? Icon(LucideIcons.check,
                              color: colors.honey, size: 18)
                          : null,
                    );
                  }),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ─── Department & Institution Filter Sheet ────────────────────────────────
  void _showFilterSheet(BuildContext context, WidgetRef ref, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _FilterSheet(colors: colors),
    );
  }

  Widget _buildTaskList(BuildContext context, WidgetRef ref, List<dynamic> tasks, int activeTab, String? fullName, bool isOffline, ThemeColors colors) {
    final selectedStatus = ref.watch(tasksStatusFilterProvider);
    final searchQuery = ref.watch(tasksSearchQueryProvider).toLowerCase();
    final sortOrder = ref.watch(tasksSortOrderProvider);
    final deptFilter = ref.watch(tasksDeptFilterProvider)?.toLowerCase();
    final instFilter = ref.watch(tasksInstFilterProvider)?.toLowerCase();
    final now = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(now);
    final today = DateTime(now.year, now.month, now.day);
    
    // 1. Initial filter by Tab (Today, All, Requests)
    final tabFiltered = tasks.where((t) {
      if (activeTab == 0) {
        final isDone = t.status.toString().toLowerCase() == 'done';
        DateTime? dueDate;
        if (t.dueDate != null) {
          try {
            dueDate = DateTime.parse(t.dueDate.toString()).toLocal();
          } catch (_) {}
        }
        final isOverdue = !isDone && dueDate != null && dueDate.isBefore(today);
        final isDueToday = t.dueDate != null && t.dueDate.toString().startsWith(todayStr);
        return isDueToday || isOverdue;
      }
      if (activeTab == 2) return t.requester == fullName;
      return true;
    }).toList();

    final baseList = tabFiltered;

    // 2. Filter by Status
    final statusFiltered = baseList.where((t) {
      if (selectedStatus == 'ALL') return true;
      final taskStatus = t.status.toString().toLowerCase().replaceAll(' ', '').replaceAll('_', '');
      final filterStatus = selectedStatus.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
      return taskStatus == filterStatus;
    }).toList().cast<Task>();

    // 3. Filter by Search Query
    final searchFiltered = searchQuery.isEmpty
        ? statusFiltered
        : statusFiltered.where((t) {
            return t.title.toLowerCase().contains(searchQuery) ||
                (t.assignee.toLowerCase().contains(searchQuery) ?? false) ||
                (t.requester.toLowerCase().contains(searchQuery) ?? false) ||
                (t.department?.toLowerCase().contains(searchQuery) ?? false) ||
                (t.description?.toLowerCase().contains(searchQuery) ?? false);
          }).toList();

    // 4. Filter by Department
    final deptFiltered = deptFilter == null
        ? searchFiltered
        : searchFiltered
            .where((t) =>
                t.department != null &&
                t.department!.toLowerCase().contains(deptFilter))
            .toList();

    // 5. Filter by Institution (stored in onBehalfOf JSON)
    final instFiltered = instFilter == null
        ? deptFiltered
        : deptFiltered.where((t) {
            if (t.onBehalfOf == null) return false;
            return t.onBehalfOf!.toLowerCase().contains(instFilter);
          }).toList();

    // 3. Grouping Logic
    final overdue = <Task>[];
    final dueToday = <Task>[];
    final others = <Task>[];
    final completed = <Task>[];

    for (final task in instFiltered) {
      final isDone = task.status.toLowerCase() == 'done';
      DateTime? dueDate;
      try { dueDate = DateTime.parse(task.dueDate); } catch (_) {}

      if (isDone) {
        completed.add(task);
      } else if (dueDate != null && dueDate.isBefore(today)) {
        overdue.add(task);
      } else if (dueDate != null && 
                 dueDate.year == today.year && dueDate.month == today.month && dueDate.day == today.day) {
        dueToday.add(task);
      } else {
        others.add(task);
      }
    }

    // Sort sections
    int statusWeight(String s) {
      final normalized = s.toLowerCase().replaceAll(' ', '').replaceAll('_', '');
      if (normalized == 'todo') return 0;
      if (normalized == 'inprogress') return 1;
      if (normalized == 'review') return 2;
      return 3;
    }

    int Function(Task, Task) sortFn;
    switch (sortOrder) {
      case 'STATUS_ASC':
        sortFn = (a, b) => statusWeight(a.status).compareTo(statusWeight(b.status));
        break;
      case 'STATUS_DESC':
        sortFn = (a, b) => statusWeight(b.status).compareTo(statusWeight(a.status));
        break;
      case 'DATE_ASC':
        sortFn = (a, b) {
          DateTime? da, db;
          try { da = DateTime.parse(a.dueDate); } catch (_) {}
          try { db = DateTime.parse(b.dueDate); } catch (_) {}
          if (da == null && db == null) return 0;
          if (da == null) return 1;
          if (db == null) return -1;
          return da.compareTo(db);
        };
        break;
      case 'DATE_DESC':
        sortFn = (a, b) {
          DateTime? da, db;
          try { da = DateTime.parse(a.dueDate); } catch (_) {}
          try { db = DateTime.parse(b.dueDate); } catch (_) {}
          if (da == null && db == null) return 0;
          if (da == null) return 1;
          if (db == null) return -1;
          return db.compareTo(da);
        };
        break;
      default:
        sortFn = (a, b) => statusWeight(a.status).compareTo(statusWeight(b.status));
    }

    overdue.sort(sortFn);
    dueToday.sort(sortFn);
    others.sort(sortFn);
    completed.sort(sortFn);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (overdue.isNotEmpty) ...[
          _buildSectionLabel('OVERDUE', colors.error),
          const SizedBox(height: 12),
          ...overdue.map((task) => TaskItemTile(
              task: task,
              isOffline: isOffline,
              onTap: () => context.push('/task-details', extra: task),
              onLongPress: () {
                final canDelete = _canEditDelete(ref, task);
                if (!canDelete) return;
                _showTaskActionSheet(context, ref, task, canDelete, colors);
              },
              onDeleted: () => _deleteTaskWithUndo(context, ref, task),
              onLeadingTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                final isDone = task.status.toString().toLowerCase() == 'done';
                if (isDone) return;
                final profile = ref.read(currentUserProfileProvider).valueOrNull;
                final fullName = profile?['full_name'] as String?;
                final updatedTask = task.copyWith(status: 'done', completedByName: fullName);
                ref.read(tasksListProvider.notifier).updateTask(updatedTask);
              },
              onStatusTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                _showStatusPicker(context, ref, task, colors);
              },
            )),
          const SizedBox(height: 24),
        ],
        if (dueToday.isNotEmpty) ...[
          _buildSectionLabel('TODAY', colors.honey),
          const SizedBox(height: 12),
          ...dueToday.map((task) => TaskItemTile(
              task: task,
              isOffline: isOffline,
              onTap: () => context.push('/task-details', extra: task),
              onLongPress: () {
                final canDelete = _canEditDelete(ref, task);
                if (!canDelete) return;
                _showTaskActionSheet(context, ref, task, canDelete, colors);
              },
              onDeleted: () => _deleteTaskWithUndo(context, ref, task),
              onLeadingTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                final isDone = task.status.toString().toLowerCase() == 'done';
                if (isDone) return;
                final profile = ref.read(currentUserProfileProvider).valueOrNull;
                final fullName = profile?['full_name'] as String?;
                final updatedTask = task.copyWith(status: 'done', completedByName: fullName);
                ref.read(tasksListProvider.notifier).updateTask(updatedTask);
              },
              onStatusTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                _showStatusPicker(context, ref, task, colors);
              },
            )),
          const SizedBox(height: 24),
        ],
        if (others.isNotEmpty) ...[
          _buildSectionLabel(overdue.isEmpty && dueToday.isEmpty ? 'TASKS' : 'UPCOMING', colors.textSecondary),
          const SizedBox(height: 12),
          ...others.map((task) => TaskItemTile(
              task: task,
              isOffline: isOffline,
              onTap: () => context.push('/task-details', extra: task),
              onLongPress: () {
                final canDelete = _canEditDelete(ref, task);
                if (!canDelete) return;
                _showTaskActionSheet(context, ref, task, canDelete, colors);
              },
              onDeleted: () => _deleteTaskWithUndo(context, ref, task),
              onLeadingTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                final isDone = task.status.toString().toLowerCase() == 'done';
                if (isDone) return;
                final profile = ref.read(currentUserProfileProvider).valueOrNull;
                final fullName = profile?['full_name'] as String?;
                final updatedTask = task.copyWith(status: 'done', completedByName: fullName);
                ref.read(tasksListProvider.notifier).updateTask(updatedTask);
              },
              onStatusTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                _showStatusPicker(context, ref, task, colors);
              },
            )),
          const SizedBox(height: 24),
        ],
        if (completed.isNotEmpty) ...[
          _buildSectionLabel('COMPLETED', colors.emerald),
          const SizedBox(height: 12),
          ...completed.map((task) => TaskItemTile(
              task: task,
              isOffline: isOffline,
              onTap: () => context.push('/task-details', extra: task),
              onLongPress: () {
                final canDelete = _canEditDelete(ref, task);
                if (!canDelete) return;
                _showTaskActionSheet(context, ref, task, canDelete, colors);
              },
              onDeleted: () => _deleteTaskWithUndo(context, ref, task),
              onLeadingTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                final isDone = task.status.toString().toLowerCase() == 'done';
                if (isDone) return;
                final profile = ref.read(currentUserProfileProvider).valueOrNull;
                final fullName = profile?['full_name'] as String?;
                final updatedTask = task.copyWith(status: 'done', completedByName: fullName);
                ref.read(tasksListProvider.notifier).updateTask(updatedTask);
              },
              onStatusTap: () {
                if (!_canUpdateStatus(ref, task)) return;
                _showStatusPicker(context, ref, task, colors);
              },
            )),
        ],
      ],
    );
  }

  Widget _buildSectionLabel(String label, Color color) {
    return Row(
      children: [
        Container(width: 3, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(1))),
        const SizedBox(width: 8),
        Text(
          label,
          style: AppTypography.caption.copyWith(
            color: color,
            fontWeight: FontWeight.w900,
            fontSize: 8,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }



  void _showStatusPicker(BuildContext context, WidgetRef ref, Task task, ThemeColors colors) {
    // Values use canonical lowercase form matching DB schema
    final statuses = [
      {'label': 'TO DO', 'value': 'todo', 'color': colors.textSecondary, 'icon': LucideIcons.circle},
      {'label': 'IN PROGRESS', 'value': 'in_progress', 'color': colors.indigo, 'icon': LucideIcons.playCircle},
      {'label': 'REVIEW', 'value': 'review', 'color': colors.honey, 'icon': LucideIcons.helpCircle},
      {'label': 'DONE', 'value': 'done', 'color': colors.emerald, 'icon': LucideIcons.checkCircle2},
    ];

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: colors.backgroundPrimary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.textSecondary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'UPDATE STATUS',
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
                color: colors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            ...statuses.map((s) {
              // Normalise both sides for comparison to handle legacy mixed-case values
              final isSelected = task.status.toLowerCase().replaceAll(' ', '_') == s['value'];
              final color = s['color'] as Color;
              
              return ListTile(
                onTap: () {
                  final profile = ref.read(currentUserProfileProvider).valueOrNull;
                  final fullName = profile?['full_name'] as String?;
                  final isMarkingDone = s['value'] == 'done';
                  
                  final updatedTask = task.copyWith(
                    status: s['value'] as String,
                    completedByName: isMarkingDone ? fullName : null,
                  );
                  ref.read(tasksListProvider.notifier).updateTask(updatedTask);
                  Navigator.pop(context);
                },
                leading: Icon(
                  s['icon'] as IconData, 
                  color: isSelected ? color : color.withValues(alpha: 0.3),
                ),
                title: Text(
                  s['label'] as String,
                  style: TextStyle(
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
                trailing: isSelected 
                  ? Icon(LucideIcons.check, color: color, size: 18)
                  : null,
              );
            }),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }



  bool _canUpdateStatus(WidgetRef ref, Task task) {
    final profile = ref.read(currentUserProfileProvider).valueOrNull;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    
    if (role == 'admin' || role == 'manager' || role == 'super_admin' || role == 'super admin') return true;
    
    if (role == 'team') {
      final fullName = profile?['full_name'] as String?;
      if (fullName != null && task.assignee == fullName) return true;
    }
    
    return false;
  }

  bool _canEditDelete(WidgetRef ref, Task task) {
    final profile = ref.read(currentUserProfileProvider).valueOrNull;
    final currentUserId = profile?['id'] as String?;
    final currentUserFullName = profile?['full_name'] as String?;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';

    final isAdminOrManager = role == 'admin' || role == 'manager' || role == 'super_admin' || role == 'super admin';
    final isCreator = (currentUserId != null && task.createdBy == currentUserId) || 
                      (currentUserFullName != null && task.requester == currentUserFullName);

    return isAdminOrManager || isCreator;
  }

  void _deleteTaskWithUndo(BuildContext context, WidgetRef ref, Task task) async {
    final notifier = ref.read(tasksListProvider.notifier);
    await notifier.deleteTask(task.id);

    if (context.mounted) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Task "${task.title}" deleted'),
          action: SnackBarAction(
            label: 'Undo',
            onPressed: () {
              ref.read(tasksListProvider.notifier).addTask(task);
            },
          ),
        ),
      );
    }
  }

  void _showTaskActionSheet(BuildContext context, WidgetRef ref, Task task, bool canDelete, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: colors.backgroundPrimary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.textSecondary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                task.title.toUpperCase(),
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                  color: colors.textSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            ListTile(
              onTap: () {
                Navigator.pop(context);
                context.push('/create-task', extra: task);
              },
              leading: Icon(LucideIcons.edit3, color: colors.textSecondary),
              title: Text(
                'EDIT TASK DETAILS',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            if (canDelete) ...[
              Divider(color: colors.border, height: 1),
              ListTile(
                onTap: () async {
                  Navigator.pop(context); // Close bottom sheet
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: colors.surface,
                      title: Text('Delete Task', style: TextStyle(color: colors.error, fontWeight: FontWeight.bold)),
                      content: Text('Are you sure you want to permanently delete this task? This action cannot be undone.', style: TextStyle(color: colors.textPrimary)),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: TextButton.styleFrom(foregroundColor: colors.error),
                          child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true) {
                    _deleteTaskWithUndo(context, ref, task);
                  }
                },
                leading: Icon(LucideIcons.trash2, color: colors.error),
                title: Text(
                  'DELETE TASK',
                  style: TextStyle(
                    color: colors.error,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

// ─── Filter Bottom Sheet Widget ───────────────────────────────────────────────
class _FilterSheet extends ConsumerStatefulWidget {
  final ThemeColors colors;
  const _FilterSheet({required this.colors});

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  String? _selectedDept;
  String? _selectedInst;

  @override
  void initState() {
    super.initState();
    _selectedDept = ref.read(tasksDeptFilterProvider);
    _selectedInst = ref.read(tasksInstFilterProvider);
  }

  void _applyFilters() {
    ref.read(tasksDeptFilterProvider.notifier).state = _selectedDept;
    ref.read(tasksInstFilterProvider.notifier).state = _selectedInst;
    Navigator.pop(context);
  }

  void _clearFilters() {
    setState(() {
      _selectedDept = null;
      _selectedInst = null;
    });
    ref.read(tasksDeptFilterProvider.notifier).state = null;
    ref.read(tasksInstFilterProvider.notifier).state = null;
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final deptsAsync = ref.watch(departmentsProvider);
    final instsAsync = ref.watch(institutionsProvider);
    final hasActiveFilters = _selectedDept != null || _selectedInst != null;

    return Container(
      height: MediaQuery.of(context).size.height * 0.72,
      decoration: BoxDecoration(
        color: colors.backgroundPrimary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: [
          // Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colors.textSecondary.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'FILTER BY',
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.0,
                    color: colors.textSecondary,
                    fontSize: 11,
                  ),
                ),
                if (hasActiveFilters)
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _clearFilters,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: colors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: colors.error.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          'CLEAR ALL',
                          style: TextStyle(
                            color: colors.error,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              children: [
                // ── Department Section ──
                _sectionHeader(
                    LucideIcons.building2, 'DEPARTMENT', colors),
                const SizedBox(height: 12),
                deptsAsync.when(
                  loading: () => const Center(
                      child: CircularProgressIndicator(strokeWidth: 2)),
                  error: (_, __) => Text(
                    'Failed to load departments',
                    style: TextStyle(
                        color: colors.error, fontSize: 12),
                  ),
                  data: (depts) => Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _filterChip(
                        label: 'All Departments',
                        isSelected: _selectedDept == null,
                        colors: colors,
                        onTap: () =>
                            setState(() => _selectedDept = null),
                        accentColor: colors.textSecondary,
                      ),
                      ...depts.map(
                        (d) => _filterChip(
                          label: d.name,
                          isSelected: _selectedDept == d.name,
                          colors: colors,
                          onTap: () => setState(() =>
                              _selectedDept =
                                  _selectedDept == d.name
                                      ? null
                                      : d.name),
                          accentColor: colors.indigo,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                // ── Institution Section ──
                _sectionHeader(
                    LucideIcons.landmark, 'INSTITUTION', colors),
                const SizedBox(height: 12),
                instsAsync.when(
                  loading: () => const Center(
                      child: CircularProgressIndicator(strokeWidth: 2)),
                  error: (_, __) => Text(
                    'Failed to load institutions',
                    style: TextStyle(
                        color: colors.error, fontSize: 12),
                  ),
                  data: (insts) => Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _filterChip(
                        label: 'All Institutions',
                        isSelected: _selectedInst == null,
                        colors: colors,
                        onTap: () =>
                            setState(() => _selectedInst = null),
                        accentColor: colors.textSecondary,
                      ),
                      ...insts.map(
                        (i) => _filterChip(
                          label: i.name,
                          isSelected: _selectedInst == i.name,
                          colors: colors,
                          onTap: () => setState(() =>
                              _selectedInst =
                                  _selectedInst == i.name
                                      ? null
                                      : i.name),
                          accentColor: colors.emerald,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
          // Apply Button
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _applyFilters,
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.honey,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'APPLY FILTERS',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(
      IconData icon, String title, ThemeColors colors) {
    return Row(
      children: [
        Icon(icon, size: 13, color: colors.textSecondary.withValues(alpha: 0.7)),
        const SizedBox(width: 8),
        Text(
          title,
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.w900,
            fontSize: 9,
            letterSpacing: 1.5,
            color: colors.textSecondary.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            height: 1,
            color: colors.border.withValues(alpha: 0.3),
          ),
        ),
      ],
    );
  }

  Widget _filterChip({
    required String label,
    required bool isSelected,
    required ThemeColors colors,
    required VoidCallback onTap,
    required Color accentColor,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? accentColor.withValues(alpha: 0.12)
                : colors.surface.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? accentColor.withValues(alpha: 0.6)
                  : colors.border.withValues(alpha: 0.4),
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected
                  ? accentColor
                  : colors.textSecondary.withValues(alpha: 0.7),
              fontSize: 11,
              fontWeight:
                  isSelected ? FontWeight.w800 : FontWeight.w500,
              letterSpacing: 0.3,
            ),
          ),
        ),
      ),
    );
  }
}
