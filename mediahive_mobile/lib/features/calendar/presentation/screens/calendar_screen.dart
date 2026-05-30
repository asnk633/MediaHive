import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/network_service.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/analytics_service.dart';
import '../providers/events_provider.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../../../../shared/widgets/mh_empty_state.dart';
import '../../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../domain/models/event.dart';
import '../../../../core/services/workflow_service.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../../../../presentation/providers/navigation_provider.dart';
import '../../../../../core/providers/user_provider.dart';
import '../../../../core/theme_provider.dart';

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
            data: (events) => _buildContent(context, ref, events, currentView, isOffline, colors),
            loading: () => _buildLoadingState(context, colors),
            error: (e, _) => _buildErrorState(ref, e, colors),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, List<Event> events, String currentView, bool isOffline, ThemeColors colors) {
    return ListView(
      padding: EdgeInsets.only(
        left: AppSpacing.l, 
        right: AppSpacing.l, 
        top: 120 + MediaQuery.of(context).padding.top, 
        bottom: 120,
      ),
      children: [
        _buildPageHeader(context, ref, isOffline, colors),
        const SizedBox(height: AppSpacing.xxl),
        _buildViewSwitcher(ref, currentView, colors),
        const SizedBox(height: AppSpacing.m),
        if (currentView == 'MONTH') 
          _buildMonthView(context, ref, events, colors)
        else if (currentView == 'WEEK')
          _buildWeekView(context, ref, events, colors)
        else if (currentView == 'TIMELINE')
          _buildTimelineView(context, ref, events, colors)
        else if (currentView == 'LIST')
          _buildListView(context, ref, events, colors)
        else
          _buildListView(context, ref, events, colors),
      ],
    );
  }

  Widget _buildLoadingState(BuildContext context, ThemeColors colors) {
    return ListView(
      padding: EdgeInsets.only(left: AppSpacing.l, right: AppSpacing.l, top: 120 + MediaQuery.of(context).padding.top),
      children: [
        const MhSkeleton(height: 60, width: double.infinity),
        const SizedBox(height: AppSpacing.m),
        const MhSkeleton(height: 400, width: double.infinity, borderRadius: 24),
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
                  color: colors.textSecondary.withOpacity(0.8),
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

  Widget _buildViewSwitcher(WidgetRef ref, String currentView, ThemeColors colors) {
    final views = [
      {'label': 'MONTH', 'icon': LucideIcons.calendar},
      {'label': 'WEEK', 'icon': LucideIcons.calendarDays},
      {'label': 'TIMELINE', 'icon': LucideIcons.gitBranch},
      {'label': 'LIST', 'icon': LucideIcons.list},
    ];

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: views.map((view) {
          final label = view['label'] as String;
          final isSelected = label == currentView;
          return Expanded(
            child: GestureDetector(
              onTap: () => ref.read(calendarViewProvider.notifier).setView(label),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? colors.indigo : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: colors.indigo.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      view['icon'] as IconData, 
                      size: 14, 
                      color: isSelected ? Colors.white : colors.textSecondary.withOpacity(0.4)
                    ),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: AppTypography.caption.copyWith(
                        fontSize: 8, 
                        fontWeight: FontWeight.w900, 
                        color: isSelected ? Colors.white : colors.textSecondary.withOpacity(0.4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMonthView(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildMonthHeader(ref, colors),
        const SizedBox(height: AppSpacing.m),
        _buildCalendarGrid(ref, events, colors),
        const SizedBox(height: AppSpacing.xl),
        _buildUpcomingAgenda(context, ref, events, colors),
      ],
    );
  }

  Widget _buildUpcomingAgenda(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    final now = DateTime.now();
    final upcomingEvents = events.where((e) {
      final date = DateTime.parse(e.date);
      return date.isAfter(now.subtract(const Duration(days: 1)));
    }).toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final displayEvents = upcomingEvents.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'UPCOMING EVENTS', 
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w900, 
                letterSpacing: 1.2,
                color: colors.textSecondary,
              ),
            ),
            if (upcomingEvents.length > 3)
              Text(
                '${upcomingEvents.length} TOTAL', 
                style: AppTypography.caption.copyWith(
                  fontSize: 8, 
                  color: colors.indigo,
                ),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.m),
        if (displayEvents.isEmpty)
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: colors.surface.withOpacity(0.5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border.withOpacity(0.5)),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(LucideIcons.calendarCheck, color: colors.textSecondary.withOpacity(0.2), size: 32),
                  const SizedBox(height: AppSpacing.s),
                  Text('No upcoming events scheduled', style: AppTypography.caption.copyWith(color: colors.textSecondary)),
                ],
              ),
            ),
          )
        else
          ...displayEvents.map((event) => _buildEventCard(context, ref, event, colors)),
      ],
    );
  }

  Widget _buildMonthHeader(WidgetRef ref, ThemeColors colors) {
    final activeDate = ref.watch(activeMonthProvider);
    final monthName = DateFormat('MMMM').format(activeDate);
    final year = DateFormat('yyyy').format(activeDate);

    return Row(
      children: [
        Text('$monthName ', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
        Text(year, style: AppTypography.h3.copyWith(color: colors.indigo)),
        const Spacer(),
        _buildCircleNavButton(
          LucideIcons.chevronLeft,
          () {
            final activeDateVal = ref.read(activeMonthProvider);
            ref.read(activeMonthProvider.notifier).state = 
                DateTime(activeDateVal.year, activeDateVal.month - 1, 1);
          },
          colors,
        ),
        const SizedBox(width: 12),
        _buildCircleNavButton(
          LucideIcons.chevronRight,
          () {
            final activeDateVal = ref.read(activeMonthProvider);
            ref.read(activeMonthProvider.notifier).state = 
                DateTime(activeDateVal.year, activeDateVal.month + 1, 1);
          },
          colors,
        ),
      ],
    );
  }

  Widget _buildCircleNavButton(IconData icon, VoidCallback onTap, ThemeColors colors) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: colors.surface,
          shape: BoxShape.circle,
          border: Border.all(color: colors.border),
        ),
        child: Icon(icon, color: colors.textPrimary, size: 16),
      ),
    );
  }

  Widget _buildCalendarGrid(WidgetRef ref, List<Event> events, ThemeColors colors) {
    final weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    final activeDate = ref.watch(activeMonthProvider);
    
    // Dynamically calculate the number of grid rows needed for the active month
    final firstDayOfMonth = DateTime(activeDate.year, activeDate.month, 1);
    final startOffset = firstDayOfMonth.weekday % 7;
    final daysInMonth = DateTime(activeDate.year, activeDate.month + 1, 0).day;
    final totalCells = startOffset + daysInMonth;
    final rows = (totalCells / 7).ceil();
    final gridItemCount = rows * 7;
    
    return Container(
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: colors.isDark 
              ? colors.border 
              : colors.border.withOpacity(0.12),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.border.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: weekdays.map((day) => Expanded(
              child: Text(
                day, 
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  color: colors.textSecondary.withOpacity(0.6),
                ),
              ),
            )).toList(),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.only(left: 8, right: 8, bottom: 16),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                childAspectRatio: 0.85,
              ),
              itemCount: gridItemCount,
              itemBuilder: (context, index) {
                final firstDayOfMonth = DateTime(activeDate.year, activeDate.month, 1);
                final startOffset = firstDayOfMonth.weekday % 7;
                
                final dayNumber = index - startOffset + 1;
                final isCurrentMonth = dayNumber > 0 && dayNumber <= DateTime(activeDate.year, activeDate.month + 1, 0).day;
                
                final displayDay = isCurrentMonth 
                    ? dayNumber 
                    : (dayNumber <= 0 
                        ? DateTime(activeDate.year, activeDate.month, 0).day + dayNumber 
                        : dayNumber - DateTime(activeDate.year, activeDate.month + 1, 0).day);
                
                final isToday = isCurrentMonth && 
                                dayNumber == DateTime.now().day && 
                                activeDate.month == DateTime.now().month && 
                                activeDate.year == DateTime.now().year;
                final currentDate = DateTime(activeDate.year, activeDate.month, dayNumber);
                
                // Check for events on this day
                final hasEvents = isCurrentMonth && events.any((e) {
                  final eDate = DateTime.parse(e.date);
                  return eDate.year == currentDate.year && 
                         eDate.month == currentDate.month && 
                         eDate.day == currentDate.day;
                });
                
                return Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: colors.border.withOpacity(colors.isDark ? 0.05 : 0.03), 
                      width: 0.5,
                    ),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      if (isToday)
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: colors.indigo.withOpacity(0.1),
                            shape: BoxShape.circle,
                            border: Border.all(color: colors.indigo.withOpacity(0.3)),
                          ),
                        ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '$displayDay',
                            style: AppTypography.bodyM.copyWith(
                              fontSize: 14,
                              fontWeight: isToday ? FontWeight.w900 : FontWeight.w600,
                              color: isToday 
                                ? colors.indigo 
                                : (isCurrentMonth 
                                    ? colors.textPrimary 
                                    : colors.textSecondary.withOpacity(0.2)),
                            ),
                          ),
                          if (hasEvents) ...[
                            const SizedBox(height: 4),
                            Container(
                              width: 4,
                              height: 4,
                              decoration: BoxDecoration(
                                color: colors.indigo,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
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
                              ? colors.indigo.withOpacity(0.5) 
                              : colors.border.withOpacity(colors.isDark ? 1 : 0.12)),
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: colors.honey.withOpacity(0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ]
                        : [
                            BoxShadow(
                              color: colors.border.withOpacity(0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        DateFormat('E').format(date).toUpperCase(),
                        style: AppTypography.caption.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.black.withOpacity(0.8) : colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        date.day.toString(),
                        style: AppTypography.h3.copyWith(
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
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.w900, 
            letterSpacing: 1.2,
            color: colors.textSecondary,
          )),
        const SizedBox(height: 16),
        ...events.where((e) {
          final eventDate = DateTime.parse(e.date);
          final selectedDateTime = DateTime(now.year, now.month, int.parse(selectedDate));
          return eventDate.year == selectedDateTime.year && 
                 eventDate.month == selectedDateTime.month && 
                 eventDate.day == selectedDateTime.day;
        }).map((event) => _buildEventCard(context, ref, event, colors)),
        if (events.where((e) {
          final eventDate = DateTime.parse(e.date);
          final selectedDateTime = DateTime(now.year, now.month, int.parse(selectedDate));
          return eventDate.year == selectedDateTime.year && 
                 eventDate.month == selectedDateTime.month && 
                 eventDate.day == selectedDateTime.day;
        }).isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 40),
              child: Text('NO EVENTS FOR THIS DAY', style: AppTypography.caption.copyWith(color: colors.textSecondary)),
            ),
          ),
      ],
    );
  }

  Widget _buildTimelineView(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    if (events.isEmpty) {
      return const MhEmptyState(
        title: 'No Events',
        message: 'Your timeline is clear for now.',
        icon: LucideIcons.calendarX,
      );
    }

    // Sort events by date and time
    final sortedEvents = List<Event>.from(events)..sort((a, b) {
      int dateComp = a.date.compareTo(b.date);
      if (dateComp != 0) return dateComp;
      return a.time.compareTo(b.time);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'CHRONOLOGICAL TIMELINE', 
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.w900,
            color: colors.textSecondary,
          )),
        const SizedBox(height: 12),
        ListView.builder(
          padding: EdgeInsets.zero,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: sortedEvents.length,
          itemBuilder: (context, index) {
            final event = sortedEvents[index];
            final isFirst = index == 0;
            final isLast = index == sortedEvents.length - 1;
            
            // Determine if we should show a date header
            bool showHeader = false;
            if (isFirst) {
              showHeader = true;
            } else {
              final prevEvent = sortedEvents[index - 1];
              if (prevEvent.date != event.date) {
                showHeader = true;
              }
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (showHeader) ...[
                  if (!isFirst) const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.only(left: 12, bottom: 16),
                    child: Text(
                      DateFormat('dd-MM-yyyy').format(DateTime.parse(event.date)),
                      style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.w900, color: colors.indigo),
                    ),
                  ),
                ],
                IntrinsicHeight(
                  child: Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          children: [
                            Expanded(
                              child: Container(
                                width: 2,
                                color: isFirst && showHeader ? Colors.transparent : colors.border,
                              ),
                            ),
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: Color(event.colorValue),
                                shape: BoxShape.circle,
                                border: Border.all(color: colors.backgroundPrimary, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: Color(event.colorValue).withOpacity(0.4),
                                    blurRadius: 8,
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Container(
                                width: 2,
                                color: isLast ? Colors.transparent : colors.border,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildEventCard(context, ref, event, colors),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildListView(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    if (events.isEmpty) {
      return const MhEmptyState(
        title: 'No Events',
        message: 'There are no upcoming events scheduled for this period.',
        icon: LucideIcons.calendarX,
      );
    }

    final now = DateTime.now();
    final thisWeek = now.add(Duration(days: 7 - now.weekday));
    final nextWeek = thisWeek.add(const Duration(days: 7));

    final thisWeekEvents = events.where((e) {
      final date = DateTime.parse(e.date);
      return date.isBefore(thisWeek) || date.isAtSameMomentAs(thisWeek);
    }).toList();

    final nextWeekEvents = events.where((e) {
      final date = DateTime.parse(e.date);
      return date.isAfter(thisWeek) && (date.isBefore(nextWeek) || date.isAtSameMomentAs(nextWeek));
    }).toList();

    final laterEvents = events.where((e) {
      final date = DateTime.parse(e.date);
      return date.isAfter(nextWeek);
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (thisWeekEvents.isNotEmpty) ...[
          Text(
            'THIS WEEK', 
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w900, 
              letterSpacing: 1.1,
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ...thisWeekEvents.map((event) => _buildEventCard(context, ref, event, colors)),
          const SizedBox(height: 24),
        ],
        if (nextWeekEvents.isNotEmpty) ...[
          Text(
            'NEXT WEEK', 
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w900, 
              letterSpacing: 1.1,
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ...nextWeekEvents.map((event) => _buildEventCard(context, ref, event, colors)),
          const SizedBox(height: 24),
        ],
        if (laterEvents.isNotEmpty) ...[
          Text(
            'LATER', 
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w900, 
              letterSpacing: 1.1,
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ...laterEvents.map((event) => _buildEventCard(context, ref, event, colors)),
        ],
      ],
    );
  }

  Widget _buildEventCard(BuildContext context, WidgetRef ref, Event event, ThemeColors colors) {
    final color = Color(event.colorValue);

    // Calculate tag text: change UPCOMING to PAST if the event date/time is in the past
    String tagText = event.type.toUpperCase();
    if (tagText == 'UPCOMING') {
      try {
        final now = DateTime.now();
        final eventDateTime = DateTime.parse('${event.date}T${event.time}:00');
        if (now.isAfter(eventDateTime)) {
          tagText = 'PAST';
        }
      } catch (_) {
        try {
          final now = DateTime.now();
          final eventDate = DateTime.parse(event.date);
          final today = DateTime(now.year, now.month, now.day);
          if (eventDate.isBefore(today)) {
            tagText = 'PAST';
          }
        } catch (_) {}
      }
    }

    // Resolve the org label:
    String? orgLabel;
    
    final departments = ref.watch(departmentsProvider).valueOrNull ?? [];
    final institutions = ref.watch(institutionsProvider).valueOrNull ?? [];

    if (event.onBehalfOf != null && event.onBehalfOf!.isNotEmpty) {
      final deptName = event.onBehalfOf!['department_name']?.toString();
      final instName = event.onBehalfOf!['institution_name']?.toString();
      
      if (deptName != null && deptName.isNotEmpty) {
        orgLabel = deptName;
      } else if (instName != null && instName.isNotEmpty) {
        orgLabel = instName;
      } else {
        // Fallback to checking IDs inside the map
        final deptId = event.onBehalfOf!['department_id']?.toString();
        final instId = event.onBehalfOf!['institution_id']?.toString();
        
        if (deptId != null) {
          final dept = departments.cast<dynamic>().firstWhere(
            (d) => d.id.toString() == deptId,
            orElse: () => null,
          );
          if (dept != null) orgLabel = dept.name as String?;
        }
        if (orgLabel == null && instId != null) {
          final inst = institutions.cast<dynamic>().firstWhere(
            (i) => i.id.toString() == instId,
            orElse: () => null,
          );
          if (inst != null) orgLabel = inst.name as String?;
        }
      }
    } else {
      // Show department or institution of the user who created the event
      if (event.createdBy != null) {
        final allUsers = ref.watch(allUsersProvider).valueOrNull ?? [];
        final creator = allUsers.cast<dynamic>().firstWhere(
          (u) => u['id']?.toString() == event.createdBy,
          orElse: () => null,
        );
        
        if (creator != null) {
          final creatorDeptId = creator['department_id']?.toString();
          final creatorInstId = creator['institution_id']?.toString();
          
          if (creatorDeptId != null) {
            final dept = departments.cast<dynamic>().firstWhere(
              (d) => d.id.toString() == creatorDeptId,
              orElse: () => null,
            );
            if (dept != null) orgLabel = dept.name as String?;
          }
          if (orgLabel == null && creatorInstId != null) {
            final inst = institutions.cast<dynamic>().firstWhere(
              (i) => i.id.toString() == creatorInstId,
              orElse: () => null,
            );
            if (inst != null) orgLabel = inst.name as String?;
          }
        }
      }
      
      // Ultimate fallback: if still null, check if the event itself has a departmentId
      if ((orgLabel == null || orgLabel.isEmpty) && event.departmentId != null) {
        final dept = departments.cast<dynamic>().firstWhere(
          (d) => d.id.toString() == event.departmentId.toString(),
          orElse: () => null,
        );
        if (dept != null) orgLabel = dept.name as String?;
      }
    }
    
    return GestureDetector(
      onTap: () => _showEventDetails(context, ref, event, colors),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: colors.isDark 
                ? colors.border 
                : colors.border.withOpacity(0.12),
          ),
          boxShadow: [
            BoxShadow(
              color: colors.border.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: IntrinsicHeight(
            child: Row(
              children: [
                Container(
                  width: 6,
                  color: color,
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                event.title,
                                style: AppTypography.bodyM.copyWith(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                  color: colors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: color.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                event.time,
                                style: AppTypography.caption.copyWith(
                                  color: color,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: colors.surface,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: colors.border),
                              ),
                              child: Text(
                                tagText,
                                style: AppTypography.caption.copyWith(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: colors.textSecondary.withOpacity(0.6),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            if (event.location != null && event.location!.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Icon(LucideIcons.mapPin, size: 10, color: colors.textSecondary.withOpacity(0.4)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  event.location!,
                                  style: AppTypography.caption.copyWith(
                                    fontSize: 10,
                                    color: colors.textSecondary.withOpacity(0.6),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),
                        // Org / department label
                        if (orgLabel != null && orgLabel.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(LucideIcons.building2, size: 10, color: colors.indigo.withOpacity(0.6)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  orgLabel,
                                  style: AppTypography.caption.copyWith(
                                    fontSize: 10,
                                    color: colors.indigo.withOpacity(0.8),
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 12),
                        _buildReadinessIndicator(context, ref, event, colors),
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
                    decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
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
                            ? colors.border.withOpacity(0.5) 
                            : colors.border.withOpacity(0.12),
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
                }).toList(),
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
                      color: colors.indigo.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: colors.indigo.withOpacity(0.3)),
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
                              : colors.border.withOpacity(0.12),
                        ),
                        boxShadow: colors.isDark
                            ? []
                            : [
                                BoxShadow(
                                  color: colors.border.withOpacity(0.03),
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
                              backgroundColor: colors.honey.withOpacity(0.2),
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
                            color: colors.indigo.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: colors.indigo.withOpacity(0.3)),
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
                            color: colors.error.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: colors.error.withOpacity(0.3)),
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
            backgroundColor: colors.border.withOpacity(0.5),
            valueColor: AlwaysStoppedAnimation<Color>(
              readiness == 1.0 ? colors.emerald : colors.indigo
            ),
          ),
        ),
      ],
    );
  }
}
