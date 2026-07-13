import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/utils/layout_helpers.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme/app_spacing.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/services/network_service.dart';
import 'package:mediahive_mobile/core/services/analytics_service.dart';
import 'package:mediahive_mobile/features/calendar/presentation/providers/events_provider.dart';
import 'package:mediahive_mobile/shared/widgets/mh_button.dart';
import 'package:mediahive_mobile/shared/widgets/mh_skeleton.dart';
import 'package:mediahive_mobile/shared/widgets/mh_refresh_indicator.dart';
import 'package:mediahive_mobile/features/calendar/domain/models/event.dart';
import 'package:mediahive_mobile/core/services/workflow_service.dart';
import 'package:mediahive_mobile/presentation/providers/navigation_provider.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/features/calendar/presentation/widgets/calendar_view_tabs.dart';
import 'package:mediahive_mobile/features/calendar/presentation/widgets/calendar_grid.dart';
import 'package:mediahive_mobile/features/calendar/presentation/widgets/calendar_event_list.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('CalendarScreen');
    
    final eventsAsync = ref.watch(eventListProvider);
    final currentView = ref.watch(calendarViewProvider);
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
          edgeOffset: 140,
          onRefresh: () async {
            ref.invalidate(eventListProvider);
            await Future.delayed(const Duration(milliseconds: 500));
          },
          child: eventsAsync.when(
            data: (events) => _buildContent(context, ref, events, currentView, isOffline, colors, headerHeight),
            loading: () => _buildLoadingState(context, colors, headerHeight),
            error: (e, _) => _buildErrorState(ref, e, colors),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, List<Event> events, String currentView, bool isOffline, ThemeColors colors, double headerHeight) {
    return ListView(
      padding: EdgeInsets.only(
        left: AppSpacing.l, 
        right: AppSpacing.l, 
        top: (headerHeight == 0 ? (120.0 + MediaQuery.of(context).padding.top) : headerHeight) + 64.0, 
        bottom: 120,
      ),
      children: [
        _buildPageHeader(context, ref, isOffline, colors),
        const SizedBox(height: AppSpacing.xxl),
        CalendarViewTabs(
          currentView: currentView,
          onViewChanged: (label) => ref.read(calendarViewProvider.notifier).setView(label),
        ),
        const SizedBox(height: AppSpacing.m),
        if (currentView == 'MONTH')
          _buildMonthView(context, ref, events, colors)
        else if (currentView == 'WEEK')
          _buildWeekView(context, ref, events, colors)
        else if (currentView == 'TIMELINE')
          CalendarEventList(events: events, viewMode: 'timeline', onEventTap: (e) => _showEventDetails(context, ref, e, colors))
        else
          CalendarEventList(events: events, viewMode: 'list', onEventTap: (e) => _showEventDetails(context, ref, e, colors)),
      ],
    );
  }

  Widget _buildMonthView(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CalendarGrid(events: events),
        const SizedBox(height: AppSpacing.xl),
        CalendarEventList(events: events, viewMode: 'upcoming', onEventTap: (e) => _showEventDetails(context, ref, e, colors)),
      ],
    );
  }

  Widget _buildWeekView(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    final selectedDate = ref.watch(selectedDateProvider);
    final now = DateTime.now();

    // Generate dates for the current week (starting from Monday)
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final weekDates = List.generate(7, (i) => monday.add(Duration(days: i)));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: weekDates.map((date) {
              final isSelected = date.day.toString() == selectedDate;
              final isToday = date.day == now.day && date.month == now.month;

              return GestureDetector(
                onTap: () => ref.read(selectedDateProvider.notifier).setDate(date.day.toString()),
                child: Container(
                  margin: const EdgeInsets.only(right: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  decoration: BoxDecoration(
                    gradient: isSelected ? AppColors.primaryGradient : null,
                    color: isSelected ? null : (colors.isDark ? colors.surface : Colors.white),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : (isToday
                              ? colors.indigo.withValues(alpha: 0.5)
                              : colors.border.withValues(alpha: colors.isDark ? 1 : 0.12)),
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: colors.honey.withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ]
                        : [
                            BoxShadow(
                              color: colors.border.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        DateFormat('E').format(date).toUpperCase(),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                          color: isSelected ? Colors.black.withValues(alpha: 0.8) : colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        date.day.toString(),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.black : colors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 32),
        Text('SCHEDULE FOR ${DateFormat('MMMM d').format(DateTime(now.year, now.month, int.parse(selectedDate)))}',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
            fontSize: 10,
            color: colors.textSecondary,
          )),
        const SizedBox(height: 16),
        CalendarEventList(
          events: events.where((e) {
            final eventDate = DateTime.parse(e.date);
            final selectedDateTime = DateTime(now.year, now.month, int.parse(selectedDate));
            return eventDate.year == selectedDateTime.year &&
                eventDate.month == selectedDateTime.month &&
                eventDate.day == selectedDateTime.day;
          }).toList(),
          viewMode: 'upcoming',
          onEventTap: (e) => _showEventDetails(context, ref, e, colors),
        ),
      ],
    );
  }

  Widget _buildLoadingState(BuildContext context, ThemeColors colors, double headerHeight) {
    return ListView(
      padding: EdgeInsets.only(left: AppSpacing.l, right: AppSpacing.l, top: headerHeight == 0 ? (120.0 + MediaQuery.of(context).padding.top) : headerHeight),
      children: const [
        MhSkeleton(height: 60, width: double.infinity),
        SizedBox(height: AppSpacing.m),
        MhSkeleton(height: 400, width: double.infinity, borderRadius: 24),
      ],
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object error, ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.alertCircle, color: colors.error, size: 48),
          const SizedBox(height: AppSpacing.m),
          Text('Failed to load events', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
          const SizedBox(height: AppSpacing.s),
          MhButton(
            label: 'Try Again',
            onTap: () => ref.refresh(eventListProvider),
            type: MhButtonType.secondary,
          ),
        ],
      ),
    );
  }

  Widget _buildPageHeader(BuildContext context, WidgetRef ref, bool isOffline, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('EVENTS', style: AppTypography.h1.copyWith(color: colors.textPrimary)),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                'VIEW AND MANAGE INSTITUTIONAL EVENTS',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colors.textSecondary.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ),
        MhButton(
          label: 'Add Event',
          onTap: isOffline ? null : () => context.push('/create-event'),
          height: 40,
          type: isOffline ? MhButtonType.secondary : MhButtonType.primary,
        ),
      ],
    );
  }

  void _showEventDetails(BuildContext context, WidgetRef ref, Event event, ThemeColors colors) {
    final color = Color(event.colorValue);
    final workflowService = ref.read(workflowServiceProvider);
    final linkedTasks = workflowService.getTasksForEvent(event.id);

    // RBAC: admins/managers can edit any event; team/member only their own
    final profile = ref.read(currentUserProfileProvider).valueOrNull;
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    final isElevated = role == 'admin' || role == 'manager';
    final isOwner = event.createdBy != null && event.createdBy == currentUserId;
    final canModify = isElevated || isOwner;

    // Hide bottom navigation bar
    ref.read(bottomNavVisibleProvider.notifier).state = false;

    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      isScrollControlled: true,
      useRootNavigator: true, // renders above the shell nav bar
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (ctx) => Container(
        padding: EdgeInsets.fromLTRB(32, 32, 32, 32 + MediaQuery.of(ctx).padding.bottom),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.82),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
                    child: Icon(LucideIcons.calendar, color: color, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(event.title, style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                        Text(
                          '${event.date} @ ${event.time}',
                          style: AppTypography.caption.copyWith(color: colors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'OPERATIONAL READINESS',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 1.5,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              _buildReadinessIndicator(context, ref, event, colors),
              const SizedBox(height: 32),
              Text(
                'LINKED PREPARATION TASKS',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 1.5,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              if (linkedTasks.isEmpty)
                Text(
                  'No tasks linked to this event.',
                  style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
                )
              else
                ...linkedTasks.take(3).map((task) {
                  final isDone = task.status.toLowerCase() == 'done';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.isDark ? colors.surface : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: colors.isDark 
                            ? colors.border.withValues(alpha: 0.5) 
                            : colors.border.withValues(alpha: 0.12),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isDone ? LucideIcons.checkCircle2 : LucideIcons.circle, 
                          size: 14, 
                          color: isDone ? colors.emerald : colors.textSecondary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            task.title, 
                            style: AppTypography.bodyS.copyWith(
                              fontSize: 12, 
                              color: isDone ? colors.textSecondary : colors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              const SizedBox(height: 24),
              Text(
                'EQUIPMENT READY',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 1.5,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              if (event.linkedInventoryIds.isEmpty)
                Text(
                  'No equipment linked.',
                  style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
                )
              else
                Row(
                  children: [
                    Icon(LucideIcons.packageCheck, size: 16, color: colors.emerald),
                    const SizedBox(width: 12),
                    Text(
                      'All linked assets are ready.', 
                      style: TextStyle(color: colors.emerald, fontSize: 12),
                    ),
                  ],
                ),

              // Requested Media Coverage
              const SizedBox(height: 24),
              Text(
                'REQUESTED MEDIA SERVICES',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 1.5,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              if (event.mediaCoverage.isEmpty)
                Text(
                  'No media services requested.',
                  style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: event.mediaCoverage.map((service) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: colors.indigo.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: colors.indigo.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.camera, size: 12, color: colors.indigo),
                        const SizedBox(width: 6),
                        Text(
                          service,
                          style: AppTypography.bodyS.copyWith(
                            color: colors.indigo,
                            fontWeight: FontWeight.w600,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  )).toList(),
                ),

              // Assigned Crew
              const SizedBox(height: 24),
              Text(
                'ASSIGNED CREW',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 1.5,
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              if (event.assignedCrew.isEmpty)
                Text(
                  'No crew members assigned.',
                  style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: event.assignedCrew.map((crew) {
                    final fullName = crew['full_name'] ?? crew['email'] ?? 'Unknown User';
                    final role = crew['role'] ?? 'member';
                    final avatarUrl = crew['avatar_url'] as String?;
                    final initials = fullName.isNotEmpty ? fullName.substring(0, 1).toUpperCase() : '?';

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: colors.isDark ? colors.surface : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: colors.isDark 
                              ? colors.border 
                              : colors.border.withValues(alpha: 0.12),
                        ),
                        boxShadow: colors.isDark
                            ? []
                            : [
                                BoxShadow(
                                  color: colors.border.withValues(alpha: 0.03),
                                  blurRadius: 5,
                                ),
                              ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (avatarUrl != null && avatarUrl.isNotEmpty)
                            CircleAvatar(
                              radius: 10,
                              backgroundImage: NetworkImage(avatarUrl),
                            )
                          else
                            CircleAvatar(
                              radius: 10,
                              backgroundColor: colors.honey.withValues(alpha: 0.2),
                              child: Text(
                                initials,
                                style: TextStyle(
                                  fontSize: 8, 
                                  fontWeight: FontWeight.bold, 
                                  color: colors.honey,
                                ),
                              ),
                            ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                fullName,
                                style: AppTypography.bodyS.copyWith(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 11,
                                  color: colors.textPrimary,
                                ),
                              ),
                              Text(
                                role.toUpperCase(),
                                style: AppTypography.caption.copyWith(
                                  fontSize: 8,
                                  color: colors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),

              // Edit / Delete — only visible when user has permission
              if (canModify) ...[
                const SizedBox(height: 32),
                Divider(color: colors.border, height: 1),
                const SizedBox(height: 20),
                Row(
                  children: [
                    // Edit
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.of(ctx).pop();
                          context.push('/create-event', extra: event);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: colors.indigo.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: colors.indigo.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.pencil, size: 15, color: colors.indigo),
                              const SizedBox(width: 8),
                              Text(
                                'Edit Event',
                                style: AppTypography.bodyS.copyWith(
                                  color: colors.indigo,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Delete
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.of(ctx).pop();
                          _confirmDeleteEvent(context, ref, event, colors);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: colors.error.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: colors.error.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.trash2, size: 15, color: colors.error),
                              const SizedBox(width: 8),
                              Text(
                                'Delete',
                                style: AppTypography.bodyS.copyWith(
                                  color: colors.error,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ),
    ).then((_) {
      ref.read(bottomNavVisibleProvider.notifier).state = true;
    });
  }

  void _confirmDeleteEvent(BuildContext context, WidgetRef ref, Event event, ThemeColors colors) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Delete Event', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
        content: Text(
          'Are you sure you want to delete "${event.title}"? This cannot be undone.',
          style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final result = await ref.read(eventRepositoryProvider).deleteEvent(event.id);
              result.fold(
                (failure) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text('Failed to delete: ${failure.message}'),
                      backgroundColor: colors.error,
                    ));
                  }
                },
                (_) {
                  ref.invalidate(eventListProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Event deleted successfully'),
                      backgroundColor: AppColors.success,
                    ));
                  }
                },
              );
            },
            child: Text('Delete', style: TextStyle(color: colors.error, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _buildReadinessIndicator(BuildContext context, WidgetRef ref, Event event, ThemeColors colors) {
    final workflowService = ref.watch(workflowServiceProvider);
    final readiness = workflowService.getEventReadiness(event.id);
    final linkedTasks = workflowService.getTasksForEvent(event.id);
    
    if (linkedTasks.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'READINESS',
              style: AppTypography.caption.copyWith(
                fontSize: 7, 
                fontWeight: FontWeight.w900, 
                letterSpacing: 1.0,
                color: colors.textSecondary,
              ),
            ),
            Text(
              '${(readiness * 100).toInt()}%',
              style: AppTypography.caption.copyWith(
                fontSize: 8, 
                fontWeight: FontWeight.w900, 
                color: readiness == 1.0 ? colors.emerald : colors.indigo
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(2),
          child: LinearProgressIndicator(
            value: readiness,
            minHeight: 2,
            backgroundColor: colors.border.withValues(alpha: 0.5),
            valueColor: AlwaysStoppedAnimation<Color>(
              readiness == 1.0 ? colors.emerald : colors.indigo
            ),
          ),
        ),
      ],
    );
  }
}
