import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
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
import '../../domain/models/event.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('CalendarScreen');
    
    final eventsAsync = ref.watch(eventListProvider);
    final currentView = ref.watch(calendarViewProvider);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;

    return Scaffold(
      backgroundColor: AppColors.backgroundPrimary,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.darkGradient,
        ),
        child: Column(
          children: [
            if (networkStatus == NetworkStatus.offline)
              _buildOfflineBanner(),
            Expanded(
              child: eventsAsync.when(
                data: (events) => _buildContent(context, ref, events, currentView),
                loading: () => _buildLoadingState(),
                error: (e, _) => _buildErrorState(ref, e),
              ),
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
            'OFFLINE MODE — CALENDAR CHANGES WILL SYNC LATER',
            style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, List<Event> events, String currentView) {
    return RefreshIndicator(
      onRefresh: () => ref.refresh(eventListProvider.future),
      color: AppColors.honey,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.only(
          left: AppSpacing.l, 
          right: AppSpacing.l, 
          top: 140, 
          bottom: 120,
        ),
        children: [
          _buildPageHeader(context, ref),
          const SizedBox(height: AppSpacing.xxl),
          _buildViewSwitcher(ref, currentView),
          const SizedBox(height: AppSpacing.m),
          if (currentView == 'MONTH') 
            _buildMonthView(events)
          else if (currentView == 'WEEK')
            _buildWeekView(events, ref)
          else if (currentView == 'TIMELINE')
            _buildTimelineView(events)
          else if (currentView == 'LIST')
            _buildListView(events)
          else
            _buildListView(events),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.only(left: AppSpacing.l, right: AppSpacing.l, top: 140),
      children: [
        const MhSkeleton(height: 60, width: double.infinity),
        const SizedBox(height: AppSpacing.m),
        const MhSkeleton(height: 400, width: double.infinity, borderRadius: 24),
      ],
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 48),
          const SizedBox(height: AppSpacing.m),
          Text('Failed to load events', style: AppTypography.h3),
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

  Widget _buildPageHeader(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('EVENTS', style: AppTypography.h1),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                'VIEW AND MANAGE INSTITUTIONAL EVENTS',
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: AppSpacing.xxs),
              Consumer(builder: (context, ref, _) {
                final pendingCount = ref.watch(pendingSyncCountProvider).valueOrNull ?? 0;
                if (pendingCount == 0) return const SizedBox.shrink();
                return Text('SYNCING $pendingCount CHANGES...', style: AppTypography.caption.copyWith(color: AppColors.info, fontSize: 8));
              }),
            ],
          ),
        ),
        MhButton(
          label: 'New Event',
          onTap: () {},
          height: 40,
          type: MhButtonType.primary,
        ),
      ],
    );
  }

  Widget _buildViewSwitcher(WidgetRef ref, String currentView) {
    final views = [
      {'label': 'MONTH', 'icon': LucideIcons.calendar},
      {'label': 'WEEK', 'icon': LucideIcons.calendarDays},
      {'label': 'TIMELINE', 'icon': LucideIcons.gitBranch},
      {'label': 'LIST', 'icon': LucideIcons.list},
    ];

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: views.map((view) {
          final label = view['label'] as String;
          final isSelected = label == currentView;
          return Expanded(
            child: GestureDetector(
              onTap: () => ref.read(calendarViewProvider.notifier).setView(label),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.info : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      view['icon'] as IconData, 
                      size: 14, 
                      color: isSelected ? Colors.white : AppColors.textSecondary.withOpacity(0.4)
                    ),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: AppTypography.caption.copyWith(
                        fontSize: 8, 
                        fontWeight: FontWeight.w900, 
                        color: isSelected ? Colors.white : AppColors.textSecondary.withOpacity(0.4),
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

  Widget _buildMonthView(List<Event> events) {
    return Column(
      children: [
        _buildMonthHeader(),
        const SizedBox(height: AppSpacing.m),
        _buildCalendarGrid(events),
      ],
    );
  }

  Widget _buildMonthHeader() {
    final now = DateTime.now();
    final monthName = DateFormat('MMMM').format(now);
    final year = DateFormat('yyyy').format(now);

    return Row(
      children: [
        Text('$monthName ', style: AppTypography.h3),
        Text(year, style: AppTypography.h3.copyWith(color: AppColors.info)),
        const Spacer(),
        const Icon(LucideIcons.chevronLeft, color: AppColors.textSecondary, size: 20),
        const SizedBox(width: 24),
        const Icon(LucideIcons.chevronRight, color: AppColors.textSecondary, size: 20),
      ],
    );
  }

  Widget _buildCalendarGrid(List<Event> events) {
    final weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
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
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold),
              ),
            )).toList(),
          ),
          const SizedBox(height: 16),
          Container(
            height: 380,
            padding: const EdgeInsets.only(left: 8, right: 8, bottom: 16),
            child: GridView.builder(
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                childAspectRatio: 0.8,
              ),
              itemCount: 35,
              itemBuilder: (context, index) {
                final now = DateTime.now();
                final firstDayOfMonth = DateTime(now.year, now.month, 1);
                final startOffset = firstDayOfMonth.weekday % 7;
                
                final dayNumber = index - startOffset + 1;
                final isCurrentMonth = dayNumber > 0 && dayNumber <= DateTime(now.year, now.month + 1, 0).day;
                
                final displayDay = isCurrentMonth 
                    ? dayNumber 
                    : (dayNumber <= 0 
                        ? DateTime(now.year, now.month, 0).day + dayNumber 
                        : dayNumber - DateTime(now.year, now.month + 1, 0).day);
                
                final isToday = isCurrentMonth && dayNumber == now.day;
                
                return Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border.withOpacity(0.1), width: 0.5),
                  ),
                  child: Stack(
                    children: [
                      if (!isToday)
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text(
                            '$displayDay',
                            style: AppTypography.caption.copyWith(
                              color: isCurrentMonth ? AppColors.textPrimary : AppColors.textSecondary.withOpacity(0.2),
                            ),
                          ),
                        ),
                      if (isToday)
                        Center(
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: const BoxDecoration(
                              color: AppColors.info,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                '$displayDay',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                          ),
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

  Widget _buildWeekView(List<Event> events, WidgetRef ref) {
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
                    color: isSelected ? null : AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? Colors.transparent : (isToday ? AppColors.info.withOpacity(0.5) : AppColors.border),
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        DateFormat('E').format(date).toUpperCase(),
                        style: AppTypography.caption.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white70 : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        date.day.toString(),
                        style: AppTypography.h3.copyWith(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
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
          style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1.2)),
        const SizedBox(height: 16),
        ...events.where((e) {
          final eventDate = DateTime.parse(e.date);
          final selectedDateTime = DateTime(now.year, now.month, int.parse(selectedDate));
          return eventDate.year == selectedDateTime.year && 
                 eventDate.month == selectedDateTime.month && 
                 eventDate.day == selectedDateTime.day;
        }).map((event) => _buildEventCard(event)),
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
              child: Text('NO EVENTS FOR THIS DAY', style: AppTypography.caption),
            ),
          ),
      ],
    );
  }

  Widget _buildTimelineView(List<Event> events) {
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
        Text('CHRONOLOGICAL TIMELINE', style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 24),
        ListView.builder(
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
                      DateFormat('MMMM d, yyyy').format(DateTime.parse(event.date)),
                      style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.w900, color: AppColors.info),
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
                                color: isFirst && showHeader ? Colors.transparent : AppColors.border,
                              ),
                            ),
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: Color(event.colorValue),
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.backgroundPrimary, width: 2),
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
                                color: isLast ? Colors.transparent : AppColors.border,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildEventCard(event),
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

  Widget _buildListView(List<Event> events) {
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
          Text('THIS WEEK', style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1.1)),
          const SizedBox(height: 16),
          ...thisWeekEvents.map((event) => _buildEventCard(event)),
          const SizedBox(height: 24),
        ],
        if (nextWeekEvents.isNotEmpty) ...[
          Text('NEXT WEEK', style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1.1)),
          const SizedBox(height: 16),
          ...nextWeekEvents.map((event) => _buildEventCard(event)),
          const SizedBox(height: 24),
        ],
        if (laterEvents.isNotEmpty) ...[
          Text('LATER', style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1.1)),
          const SizedBox(height: 16),
          ...laterEvents.map((event) => _buildEventCard(event)),
        ],
      ],
    );
  }

  Widget _buildEventCard(Event event) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.s),
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: Color(event.colorValue),
              borderRadius: BorderRadius.circular(2),
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
                        event.title,
                        style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(event.time, style: AppTypography.caption),
                  ],
                ),
                const SizedBox(height: 4),
                Text(event.type, style: AppTypography.caption.copyWith(color: Color(event.colorValue))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
