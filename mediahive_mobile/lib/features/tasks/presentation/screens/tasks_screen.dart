import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/design_tokens.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/network_service.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/analytics_service.dart';
import '../providers/tasks_provider.dart';
import '../../domain/models/task.dart';
import '../../../../core/providers/user_provider.dart';
import 'package:intl/intl.dart';
import '../../data/datasources/task_local_datasource.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../../../../shared/widgets/mh_empty_state.dart';
import '../../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../../../../core/testing/chaos_controller.dart';
import '../../../system/presentation/screens/system_health_screen.dart';
import '../../../../shared/widgets/mh_loading.dart';
import '../../../../core/theme_provider.dart';
import '../../../../../models/institutional_data.dart';

final tasksTabProvider = StateProvider<int>((ref) => 0);
final tasksStatusFilterProvider = StateProvider<String>((ref) => 'ALL');
final tasksSearchQueryProvider = StateProvider<String>((ref) => '');
final tasksSortOrderProvider = StateProvider<String>((ref) => 'DEFAULT'); // DEFAULT | STATUS_ASC | STATUS_DESC | DATE_ASC | DATE_DESC
final tasksDeptFilterProvider = StateProvider<String?>((ref) => null);
final tasksInstFilterProvider = StateProvider<String?>((ref) => null);

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
          child: tasksAsync.when(
            data: (tasks) => tasks.isEmpty 
              ? _buildEmptyState(context)
              : _buildContent(context, ref, activeTab, tasks, isOffline, colors),
            loading: () => _buildLoadingState(),
            error: (e, _) => _buildErrorState(ref, e, colors),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, int activeTab, List<dynamic> tasks, bool isOffline, ThemeColors colors) {
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
        _buildHeader(context, ref, isOffline, colors),
        const SizedBox(height: AppSpacing.s),
        _buildStatGrid(tasks, colors),
        const SizedBox(height: AppSpacing.m),
        _buildTabs(ref, activeTab, colors),
        const SizedBox(height: AppSpacing.m),
        _buildSearchAndControls(context, ref, colors),
        const SizedBox(height: AppSpacing.s),
        _buildStatusFilters(ref, colors),
        const SizedBox(height: AppSpacing.m),
        _buildTaskList(context, ref, tasks, activeTab, fullName, isOffline, colors),
      ],
    );
  }

  Widget _buildLoadingState() {
    return const MhLoading();
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

  Widget _buildErrorState(WidgetRef ref, Object error, ThemeColors colors) {
    return Center(
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
              onLongPress: () => _showChaosMenu(context, ref, colors),
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
                      color: colors.textSecondary.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            MhButton(
              label: 'Add Task',
              onTap: isOffline ? null : () => context.push('/create-task'),
              height: 40,
              type: isOffline ? MhButtonType.secondary : MhButtonType.primary,
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
    final dueToday = tasks.where((t) {
      final task = t as Task;
      return task.dueDate == todayStr && task.status.toLowerCase() != 'done';
    }).length.toString();
    
    final inProgress = tasks.where((t) => 
      (t as Task).status.toLowerCase() == 'in progress' || 
      (t as Task).status.toLowerCase() == 'in_progress'
    ).length.toString();
    
    final onHold = tasks.where((t) => 
      (t as Task).status.toLowerCase() == 'on hold' || 
      (t as Task).status.toLowerCase() == 'on_hold'
    ).length.toString();
    
    final completed = tasks.where((t) => 
      (t as Task).status.toLowerCase() == 'done' || 
      (t as Task).status.toLowerCase() == 'completed'
    ).length.toString();

    return Row(
      children: [
        _buildStatCard(colors, 'TOTAL', total, LucideIcons.clipboardCheck, const Color(0xFF3B82F6)),
        const SizedBox(width: 6),
        _buildStatCard(colors, 'TODAY', dueToday, LucideIcons.clock, colors.honey),
        const SizedBox(width: 6),
        _buildStatCard(colors, 'ACTIVE', inProgress, LucideIcons.activity, const Color(0xFF6366F1)),
        const SizedBox(width: 6),
        _buildStatCard(colors, 'HOLD', onHold, LucideIcons.pauseCircle, colors.error),
        const SizedBox(width: 6),
        _buildStatCard(colors, 'DONE', completed, LucideIcons.checkCircle2, colors.emerald),
      ],
    );
  }

  Widget _buildStatCard(ThemeColors colors, String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: colors.isDark ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark 
                ? Colors.white.withOpacity(0.05) 
                : colors.border.withOpacity(0.12),
          ),
          boxShadow: colors.isDark
              ? []
              : [
                  BoxShadow(
                    color: colors.border.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          children: [
            Icon(icon, size: 12, color: color.withOpacity(colors.isDark ? 0.8 : 0.9)),
            const SizedBox(height: 8),
            Text(
              value,
              style: AppTypography.h3.copyWith(
                color: colors.isDark ? Colors.white : colors.textPrimary, 
                height: 1,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: AppTypography.caption.copyWith(
                fontSize: 6.5,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.2,
                color: colors.isDark 
                    ? Colors.white.withOpacity(0.4) 
                    : colors.textSecondary.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabs(WidgetRef ref, int activeTab, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          _buildTab(ref, 'TODAY', 0, activeTab == 0, colors),
          _buildTab(ref, 'ALL', 1, activeTab == 1, colors),
          _buildTab(ref, 'REQUESTS', 2, activeTab == 2, colors),
        ],
      ),
    );
  }

  Widget _buildTab(WidgetRef ref, String title, int index, bool isActive, ThemeColors colors) {
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(tasksTabProvider.notifier).state = index,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? colors.honey : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isActive ? [
              BoxShadow(
                color: colors.honey.withOpacity(0.3),
                blurRadius: 10,
                offset: const Offset(0, 2),
              )
            ] : null,
          ),
          child: Center(
            child: Text(
              title,
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w900,
                fontSize: 10,
                letterSpacing: 1.0,
                color: isActive ? Colors.black : colors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  // ─── Search + Sort + Filter (single row) ─────────────────────────────────
  Widget _buildSearchAndControls(BuildContext context, WidgetRef ref, ThemeColors colors) {
    final query = ref.watch(tasksSearchQueryProvider);
    final sortOrder = ref.watch(tasksSortOrderProvider);
    final deptFilter = ref.watch(tasksDeptFilterProvider);
    final instFilter = ref.watch(tasksInstFilterProvider);
    final hasActiveFilters = deptFilter != null || instFilter != null;
    final isSorted = sortOrder != 'DEFAULT';

    return Row(
      children: [
        // ── Expandable search field ──
        Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            height: 44,
            decoration: BoxDecoration(
              color: colors.isDark
                  ? colors.surface.withOpacity(0.6)
                  : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: query.isNotEmpty
                    ? colors.honey.withOpacity(0.6)
                    : colors.border.withOpacity(0.3),
                width: query.isNotEmpty ? 1.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: colors.border.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              onChanged: (v) =>
                  ref.read(tasksSearchQueryProvider.notifier).state = v.trim(),
              style: AppTypography.bodyM.copyWith(
                color: colors.textPrimary,
                fontSize: 12,
              ),
              decoration: InputDecoration(
                hintText: 'Search tasks, assignees…',
                hintStyle: AppTypography.bodyM.copyWith(
                  color: colors.textSecondary.withOpacity(0.4),
                  fontSize: 12,
                ),
                prefixIcon: Padding(
                  padding: const EdgeInsets.only(left: 12, right: 6),
                  child: Icon(
                    LucideIcons.search,
                    size: 15,
                    color: query.isNotEmpty
                        ? colors.honey
                        : colors.textSecondary.withOpacity(0.45),
                  ),
                ),
                prefixIconConstraints: const BoxConstraints(minWidth: 36),
                suffixIcon: query.isNotEmpty
                    ? GestureDetector(
                        onTap: () => ref
                            .read(tasksSearchQueryProvider.notifier)
                            .state = '',
                        child: Padding(
                          padding: const EdgeInsets.only(right: 10),
                          child: Icon(
                            LucideIcons.x,
                            size: 13,
                            color: colors.textSecondary.withOpacity(0.55),
                          ),
                        ),
                      )
                    : null,
                border: InputBorder.none,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 4, vertical: 11),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        // ── Sort button ──
        _buildIconControlButton(
          icon: LucideIcons.arrowUpDown,
          isActive: isSorted,
          colors: colors,
          onTap: () => _showSortSheet(context, ref, colors),
          badge: isSorted ? _sortShortLabel(sortOrder) : null,
        ),
        const SizedBox(width: 8),
        // ── Filter button ──
        _buildIconControlButton(
          icon: LucideIcons.slidersHorizontal,
          isActive: hasActiveFilters,
          colors: colors,
          onTap: () => _showFilterSheet(context, ref, colors),
          badge: hasActiveFilters
              ? '${(deptFilter != null ? 1 : 0) + (instFilter != null ? 1 : 0)}'
              : null,
        ),
      ],
    );
  }

  /// Square icon-only control button with optional active dot/badge.
  Widget _buildIconControlButton({
    required IconData icon,
    required bool isActive,
    required ThemeColors colors,
    required VoidCallback onTap,
    String? badge,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isActive
              ? colors.honey.withOpacity(0.12)
              : colors.isDark
                  ? colors.surface.withOpacity(0.6)
                  : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive
                ? colors.honey.withOpacity(0.6)
                : colors.border.withOpacity(0.3),
            width: isActive ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: colors.border.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive
                  ? colors.honey
                  : colors.textSecondary.withOpacity(0.6),
            ),
            if (badge != null)
              Positioned(
                top: 7,
                right: 7,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: colors.honey,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      badge,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        height: 1,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _sortShortLabel(String sortOrder) {
    switch (sortOrder) {
      case 'STATUS_ASC': return 'S↑';
      case 'STATUS_DESC': return 'S↓';
      case 'DATE_ASC': return 'D↑';
      case 'DATE_DESC': return 'D↓';
      default: return '';
    }
  }

  // ─── Status Filter Pills ──────────────────────────────────────────────────
  Widget _buildStatusFilters(WidgetRef ref, ThemeColors colors) {
    final selectedStatus = ref.watch(tasksStatusFilterProvider);
    final statuses = ['ALL', 'TO DO', 'IN PROGRESS', 'REVIEW', 'DONE'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: statuses.map((status) {
          final isSelected = selectedStatus == status;
          return GestureDetector(
            onTap: () => ref.read(tasksStatusFilterProvider.notifier).state = status,
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? colors.honey.withOpacity(0.1) : colors.surface.withOpacity(0.3),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? colors.honey : colors.border.withOpacity(0.5),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Text(
                status,
                style: TextStyle(
                  color: isSelected ? colors.honey : colors.textSecondary.withOpacity(0.7),
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          );
        }).toList(),
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
                      color: colors.textSecondary.withOpacity(0.2),
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
        return t.dueDate != null && t.dueDate.startsWith(todayStr);
      }
      if (activeTab == 2) return t.requester == fullName;
      return true;
    }).toList();

    final baseList = (tabFiltered.isEmpty && activeTab == 0) ? tasks : tabFiltered;

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
                (t.assignee?.toLowerCase().contains(searchQuery) ?? false) ||
                (t.requester?.toLowerCase().contains(searchQuery) ?? false) ||
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
          ...overdue.map((task) => _buildTaskItem(context, ref, task, isOffline, colors)),
          const SizedBox(height: 24),
        ],
        if (dueToday.isNotEmpty) ...[
          _buildSectionLabel('TODAY', colors.honey),
          const SizedBox(height: 12),
          ...dueToday.map((task) => _buildTaskItem(context, ref, task, isOffline, colors)),
          const SizedBox(height: 24),
        ],
        if (others.isNotEmpty) ...[
          _buildSectionLabel(overdue.isEmpty && dueToday.isEmpty ? 'TASKS' : 'UPCOMING', colors.textSecondary),
          const SizedBox(height: 12),
          ...others.map((task) => _buildTaskItem(context, ref, task, isOffline, colors)),
          const SizedBox(height: 24),
        ],
        if (completed.isNotEmpty) ...[
          _buildSectionLabel('COMPLETED', colors.emerald),
          const SizedBox(height: 12),
          ...completed.map((task) => _buildTaskItem(context, ref, task, isOffline, colors)),
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

  Widget _buildTaskItem(BuildContext context, WidgetRef ref, Task task, bool isOffline, ThemeColors colors) {
    final isDone = task.status.toString().toLowerCase() == 'done';
    
    // Urgency Logic
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    DateTime? dueDate;
    try {
      dueDate = DateTime.parse(task.dueDate);
    } catch (_) {}
    
    final isOverdue = !isDone && dueDate != null && dueDate.isBefore(today);
    final isDueToday = !isDone && dueDate != null && 
                       dueDate.year == today.year && 
                       dueDate.month == today.month && 
                       dueDate.day == today.day;

    return GestureDetector(
      onTap: isOffline ? null : () => context.push('/task-details', extra: task),
      onLongPress: isOffline ? null : () {
        final canDelete = _canEditDelete(ref, task);
        if (!canDelete) return; // Prevent action sheet if no permissions
        
        _showTaskActionSheet(context, ref, task, canDelete, colors);
      },
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 300),
        opacity: isDone ? 0.6 : 1.0,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.isDark 
                ? colors.surface 
                : (isDone ? colors.surface.withOpacity(0.5) : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isOverdue 
                  ? colors.error.withOpacity(0.5) 
                  : (isDone 
                      ? colors.emerald.withOpacity(0.2) 
                      : colors.border.withOpacity(colors.isDark ? 0.5 : 0.12)),
              width: isOverdue ? 1.5 : 1,
            ),
            boxShadow: [
              if (isOverdue)
                BoxShadow(
                  color: colors.error.withOpacity(0.1),
                  blurRadius: 15,
                  spreadRadius: 2,
                ),
              if (!isDone && !isOverdue)
                BoxShadow(
                  color: colors.border.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
            ],
          ),
          child: Row(
            children: [
              _buildTaskLeading(context, ref, task, isOffline, colors, isOverdue: isOverdue),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            task.title,
                            style: AppTypography.bodyM.copyWith(
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                              decoration: isDone ? TextDecoration.lineThrough : null,
                              color: isOverdue ? colors.error : (isDone ? colors.textSecondary : colors.textPrimary),
                            ),
                          ),
                        ),
                        if (task.isBlocked)
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Icon(LucideIcons.lock, size: 12, color: colors.error),
                          ),
                        if (task.requiresReview)
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Icon(LucideIcons.eye, size: 12, color: colors.honey),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(LucideIcons.user, size: 10, color: colors.textSecondary.withOpacity(0.4)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${task.requester ?? 'System'} → ${task.assignee ?? 'Unassigned'}',
                            style: AppTypography.caption.copyWith(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: colors.textSecondary.withOpacity(0.6),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        _buildMiniTag(
                          context,
                          _getPriorityIcon(task.priority),
                          task.priority.toUpperCase(),
                          _getPriorityColor(task.priority, colors),
                        ),
                        _buildMiniTag(
                          context,
                          LucideIcons.calendar,
                          _formatDate(task.dueDate),
                          colors.textSecondary.withOpacity(0.6),
                        ),
                        if (task.department != null && task.department!.trim().isNotEmpty)
                          _buildMiniTag(
                            context,
                            LucideIcons.building2,
                            task.department!.toUpperCase(),
                            colors.indigo.withOpacity(0.8),
                          ),
                        if (isDone && (task.completedByName != null || task.completionDate != null))
                          _buildMiniTag(
                            context,
                            LucideIcons.checkCircle2,
                            _formatCompletionInfo(task),
                            colors.emerald.withOpacity(0.9),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              _buildStatusChip(context, ref, task, isOffline, colors),
            ],
          ),
        ),
      ),
    );
  }
  String _formatCompletionInfo(Task task) {
    String name = task.completedByName ?? '';
    if (name.trim().isEmpty) {
      name = task.assignee ?? '';
    }
    if (name.trim().toLowerCase() == 'unassigned') {
      name = '';
    }
    final namePart = name.isNotEmpty ? ' by $name' : '';
    
    String timePart = '';
    if (task.completionDate != null) {
      try {
        final dt = DateTime.parse(task.completionDate!).toLocal();
        timePart = ' at ${DateFormat('MMM d, h:mm a').format(dt)}';
      } catch (_) {}
    }
    return 'Completed$namePart$timePart';
  }

  Widget _buildTaskLeading(BuildContext context, WidgetRef ref, Task task, bool isOffline, ThemeColors colors, {bool isOverdue = false}) {
    final isDone = task.status.toString().toLowerCase() == 'done';
    final color = isDone ? colors.emerald : (isOverdue ? colors.error : _getStatusColor(task.status, colors));
    
    return GestureDetector(
      onTap: (isOffline || isDone || !_canUpdateStatus(ref, task)) ? null : () {
        final profile = ref.read(currentUserProfileProvider).valueOrNull;
        final fullName = profile?['full_name'] as String?;
        final updatedTask = task.copyWith(status: 'done', completedByName: fullName);
        ref.read(tasksListProvider.notifier).updateTask(updatedTask);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isDone ? colors.emerald.withOpacity(0.1) : Colors.transparent,
          shape: BoxShape.circle,
          border: Border.all(
            color: isDone 
                ? colors.emerald 
                : (isOverdue ? colors.error : colors.border.withOpacity(0.8)),
            width: 1.5,
          ),
        ),
        child: Center(
          child: isDone
              ? Icon(LucideIcons.check, size: 14, color: colors.emerald)
              : (isOverdue 
                  ? Icon(LucideIcons.alertTriangle, size: 10, color: colors.error)
                  : null),
        ),
      ),
    );
  }

  Color _getStatusColor(String status, ThemeColors colors) {
    final normalizedStatus = status.toLowerCase();
    if (normalizedStatus == 'done') return colors.emerald;
    if (normalizedStatus == 'in_progress') return colors.indigo;
    if (normalizedStatus == 'review') return colors.honey;
    return colors.textSecondary;
  }

  Widget _buildStatusChip(BuildContext context, WidgetRef ref, Task task, bool isOffline, ThemeColors colors) {
    final status = task.status;
    final normalizedStatus = status.toLowerCase();
    Color color = colors.textSecondary;
    String label = status.toUpperCase();

    if (normalizedStatus == 'done') color = colors.emerald;
    if (normalizedStatus == 'in_progress') color = colors.indigo;
    if (normalizedStatus == 'review') color = colors.honey;
    if (normalizedStatus == 'todo' || normalizedStatus == 'to do') {
      color = colors.textSecondary;
      label = 'TODO';
    }

    return GestureDetector(
      onTap: (isOffline || !_canUpdateStatus(ref, task)) ? null : () => _showStatusPicker(context, ref, task, colors),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(isOffline ? 0.05 : 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(isOffline ? 0.1 : 0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isOffline ? color.withOpacity(0.5) : color,
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5,
          ),
        ),
      ),
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
                color: colors.textSecondary.withOpacity(0.2),
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
                  color: isSelected ? color : color.withOpacity(0.3),
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
            }).toList(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniTag(BuildContext context, IconData icon, String label, Color color) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width - 120),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 9,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getPriorityIcon(String priority) {
    final p = priority.toLowerCase();
    if (p == 'urgent' || p == 'high') return LucideIcons.alertTriangle;
    if (p == 'medium') return LucideIcons.gauge;
    return LucideIcons.chevronDown;
  }

  Color _getPriorityColor(String priority, ThemeColors colors) {
    final p = priority.toLowerCase();
    if (p == 'urgent') return colors.error;
    if (p == 'high') return colors.error;
    if (p == 'medium') return colors.honey;
    return colors.emerald;
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'No Date';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd-MM-yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
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
                color: colors.textSecondary.withOpacity(0.2),
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
                    await ref.read(tasksListProvider.notifier).deleteTask(task.id);
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
        border: Border.all(color: colors.border.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          // Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colors.textSecondary.withOpacity(0.2),
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
                  GestureDetector(
                    onTap: _clearFilters,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: colors.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: colors.error.withOpacity(0.3)),
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
        Icon(icon, size: 13, color: colors.textSecondary.withOpacity(0.7)),
        const SizedBox(width: 8),
        Text(
          title,
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.w900,
            fontSize: 9,
            letterSpacing: 1.5,
            color: colors.textSecondary.withOpacity(0.7),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            height: 1,
            color: colors.border.withOpacity(0.3),
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
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? accentColor.withOpacity(0.12)
              : colors.surface.withOpacity(0.4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? accentColor.withOpacity(0.6)
                : colors.border.withOpacity(0.4),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected
                ? accentColor
                : colors.textSecondary.withOpacity(0.7),
            fontSize: 11,
            fontWeight:
                isSelected ? FontWeight.w800 : FontWeight.w500,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
