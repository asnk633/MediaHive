import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/features/calendar/domain/models/event.dart';
import 'package:mediahive_mobile/core/services/workflow_service.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';

class CalendarEventList extends ConsumerWidget {
  final List<Event> events;
  final String viewMode;
  final String? selectedDate;
  final void Function(Event) onEventTap;

  const CalendarEventList({
    super.key,
    required this.events,
    required this.viewMode,
    this.selectedDate,
    required this.onEventTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    switch (viewMode) {
      case 'upcoming':
        return _buildUpcomingAgenda(context, ref, events, colors);
      case 'timeline':
        return _buildTimelineView(context, ref, events, colors);
      case 'list':
        return _buildListView(context, ref, events, colors);
      default:
        return _buildUpcomingAgenda(context, ref, events, colors);
    }
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
              style: TextStyle(
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
                fontSize: 10,
                color: colors.textSecondary,
              ),
            ),
            if (upcomingEvents.length > 3)
              Text(
                '${upcomingEvents.length} TOTAL',
                style: TextStyle(
                  fontSize: 8,
                  color: colors.indigo,
                  fontWeight: FontWeight.w900,
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (displayEvents.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: colors.surface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border.withValues(alpha: 0.5)),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(LucideIcons.calendarCheck, color: colors.textSecondary.withValues(alpha: 0.2), size: 32),
                  const SizedBox(height: 8),
                  Text('No upcoming events scheduled', style: TextStyle(fontSize: 10, color: colors.textSecondary)),
                ],
              ),
            ),
          )
        else
          ...displayEvents.map((event) => _buildEventCard(context, ref, event, colors)),
      ],
    );
  }

  Widget _buildTimelineView(BuildContext context, WidgetRef ref, List<Event> events, ThemeColors colors) {
    if (events.isEmpty) {
      return Column(
        children: [
          const SizedBox(height: 40),
          Icon(LucideIcons.calendarX, size: 48, color: colors.textSecondary.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text('No Events', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary)),
          const SizedBox(height: 8),
          Text('Your timeline is clear for now.', style: TextStyle(fontSize: 13, color: colors.textSecondary)),
        ],
      );
    }

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
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 10,
            color: colors.textSecondary,
          ),
        ),
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
                      DateFormat.yMMMd().format(DateTime.parse(event.date)),
                      style: TextStyle(fontWeight: FontWeight.w900, color: colors.indigo, fontSize: 14),
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
                                    color: Color(event.colorValue).withValues(alpha: 0.4),
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
      return Column(
        children: [
          const SizedBox(height: 40),
          Icon(LucideIcons.calendarX, size: 48, color: colors.textSecondary.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text('No Events', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary)),
          const SizedBox(height: 8),
          Text('There are no upcoming events scheduled for this period.', style: TextStyle(fontSize: 13, color: colors.textSecondary)),
        ],
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
            style: TextStyle(
              fontWeight: FontWeight.w900,
              letterSpacing: 1.1,
              fontSize: 10,
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
            style: TextStyle(
              fontWeight: FontWeight.w900,
              letterSpacing: 1.1,
              fontSize: 10,
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
            style: TextStyle(
              fontWeight: FontWeight.w900,
              letterSpacing: 1.1,
              fontSize: 10,
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

      if ((orgLabel == null || orgLabel.isEmpty) && event.departmentId != null) {
        final dept = departments.cast<dynamic>().firstWhere(
          (d) => d.id.toString() == event.departmentId.toString(),
          orElse: () => null,
        );
        if (dept != null) orgLabel = dept.name as String?;
      }
    }

    return GestureDetector(
      onTap: () => onEventTap(event),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: colors.isDark
                ? colors.border
                : colors.border.withValues(alpha: 0.12),
          ),
          boxShadow: [
            BoxShadow(
              color: colors.border.withValues(alpha: 0.05),
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
                                style: TextStyle(
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
                                color: color.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                event.time,
                                style: TextStyle(
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
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w900,
                                  color: colors.textSecondary.withValues(alpha: 0.6),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            if (event.location != null && event.location!.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Icon(LucideIcons.mapPin, size: 10, color: colors.textSecondary.withValues(alpha: 0.4)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  event.location!,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: colors.textSecondary.withValues(alpha: 0.6),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),
                        if (orgLabel != null && orgLabel.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(LucideIcons.building2, size: 10, color: colors.indigo.withValues(alpha: 0.6)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  orgLabel,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: colors.indigo.withValues(alpha: 0.8),
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
              style: TextStyle(
                fontSize: 7,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.0,
                color: colors.textSecondary,
              ),
            ),
            Text(
              '${(readiness * 100).toInt()}%',
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: readiness == 1.0 ? colors.emerald : colors.indigo,
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
              readiness == 1.0 ? colors.emerald : colors.indigo,
            ),
          ),
        ),
      ],
    );
  }
}
