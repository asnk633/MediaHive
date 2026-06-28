import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/features/calendar/presentation/providers/events_provider.dart';
import 'package:mediahive_mobile/features/calendar/domain/models/event.dart';

class CalendarGrid extends ConsumerWidget {
  final List<Event> events;

  const CalendarGrid({super.key, required this.events});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final activeDate = ref.watch(activeMonthProvider);

    return Column(
      children: [
        _buildMonthHeader(ref, activeDate, colors),
        const SizedBox(height: 16),
        _buildCalendarGrid(ref, activeDate, events, colors),
      ],
    );
  }

  Widget _buildMonthHeader(WidgetRef ref, DateTime activeDate, ThemeColors colors) {
    final monthName = DateFormat('MMMM').format(activeDate);
    final year = DateFormat('yyyy').format(activeDate);

    return Row(
      children: [
        Text('$monthName ', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: colors.textPrimary)),
        Text(year, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: colors.indigo)),
        const Spacer(),
        _buildCircleNavButton(
          LucideIcons.chevronLeft,
          () {
            ref.read(activeMonthProvider.notifier).state =
                DateTime(activeDate.year, activeDate.month - 1, 1);
          },
          colors,
        ),
        const SizedBox(width: 12),
        _buildCircleNavButton(
          LucideIcons.chevronRight,
          () {
            ref.read(activeMonthProvider.notifier).state =
                DateTime(activeDate.year, activeDate.month + 1, 1);
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

  Widget _buildCalendarGrid(WidgetRef ref, DateTime activeDate, List<Event> events, ThemeColors colors) {
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

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
              : colors.border.withValues(alpha: 0.12),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.border.withValues(alpha: 0.05),
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
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  color: colors.textSecondary.withValues(alpha: 0.6),
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
                final thisFirstDay = DateTime(activeDate.year, activeDate.month, 1);
                final thisStartOffset = thisFirstDay.weekday % 7;

                final dayNumber = index - thisStartOffset + 1;
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

                final hasEvents = isCurrentMonth && events.any((e) {
                  final eDate = DateTime.parse(e.date);
                  return eDate.year == currentDate.year &&
                      eDate.month == currentDate.month &&
                      eDate.day == currentDate.day;
                });

                return Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: colors.border.withValues(alpha: colors.isDark ? 0.05 : 0.03),
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
                            color: colors.indigo.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                            border: Border.all(color: colors.indigo.withValues(alpha: 0.3)),
                          ),
                        ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '$displayDay',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: isToday ? FontWeight.w900 : FontWeight.w600,
                              color: isToday
                                  ? colors.indigo
                                  : (isCurrentMonth
                                      ? colors.textPrimary
                                      : colors.textSecondary.withValues(alpha: 0.2)),
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
}
