import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_record.dart';

class AttendanceHistoryList extends StatelessWidget {
  final List<AttendanceRecord> records;
  final ValueChanged<AttendanceRecord>? onRecordTap;

  const AttendanceHistoryList({
    super.key,
    required this.records,
    this.onRecordTap,
  });

  Color _getStatusColor(AttendanceStatus status, ThemeColors colors) {
    switch (status) {
      case AttendanceStatus.checkedIn:
        return AppColors.success;
      case AttendanceStatus.onField:
        return AppColors.warning;
      case AttendanceStatus.remote:
        return AppColors.info;
      case AttendanceStatus.autoClosed:
        return colors.isDark ? Colors.white54 : Colors.black87;
      case AttendanceStatus.checkedOut:
        return AppColors.error;
    }
  }

  String _getStatusLabel(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.checkedIn:
        return 'CHECKED IN';
      case AttendanceStatus.onField:
        return 'ON FIELD ASSIGNMENT';
      case AttendanceStatus.remote:
        return 'REMOTE WORK';
      case AttendanceStatus.autoClosed:
        return 'AUTO CLOSED';
      case AttendanceStatus.checkedOut:
        return 'CHECKED OUT';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      if (records.isEmpty) {
        return _buildEmptyState(colors);
      }
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatsSummary(colors),
          const SizedBox(height: 24),
          _buildHistoryHeader(colors),
          const SizedBox(height: 12),
          ...records.take(20).toList().asMap().entries.map((entry) {
            return _buildHistoryTile(colors, entry.value, entry.key);
          }),
        ],
      );
    });
  }

  Widget _buildStatsSummary(ThemeColors colors) {
    final now = DateTime.now();
    final monthStart = DateTime(now.year, now.month, 1);
    final monthRecords = records.where((r) {
      final dt = DateTime.tryParse(r.checkInTime);
      return dt != null && dt.isAfter(monthStart);
    }).toList();

    int workingDays = 0;
    Duration totalDuration = Duration.zero;
    int lateCount = 0;

    for (final r in monthRecords) {
      workingDays++;
      totalDuration += r.calculatedDuration;
      final checkIn = DateTime.tryParse(r.checkInTime)?.toLocal();
      if (checkIn != null &&
          (checkIn.hour > 9 || (checkIn.hour == 9 && checkIn.minute > 15))) {
        lateCount++;
      }
    }

    final avgHours =
        workingDays > 0 ? totalDuration.inHours / workingDays : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.barChart3, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text(
              'THIS MONTH',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
            const Spacer(),
            Text(
              DateFormat('MMMM yyyy').format(now),
              style:
                  TextStyle(color: colors.textSecondary, fontSize: 11),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildStatTile(
                colors, 'DAYS IN', workingDays.toString(), LucideIcons.calendarCheck, AppColors.success),
            const SizedBox(width: 10),
            _buildStatTile(colors, 'AVG HOURS',
                '${avgHours.toStringAsFixed(1)}h', LucideIcons.timer, colors.honey),
            const SizedBox(width: 10),
            _buildStatTile(colors, 'LATE IN',
                lateCount.toString(), LucideIcons.alarmClock, AppColors.warning),
          ],
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
  }

  Widget _buildStatTile(ThemeColors colors, String label, String value,
      IconData icon, Color accentColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
          boxShadow: [
            BoxShadow(
                color: accentColor.withValues(alpha: 0.05), blurRadius: 12)
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: accentColor, size: 18),
            const SizedBox(height: 12),
            Text(value,
                style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    color: colors.textSecondary,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryHeader(ThemeColors colors) {
    return Row(
      children: [
        Icon(LucideIcons.history, color: colors.honey, size: 16),
        const SizedBox(width: 8),
        Text(
          'ATTENDANCE HISTORY',
          style: TextStyle(
            color: colors.textPrimary,
            fontWeight: FontWeight.w900,
            fontSize: 11,
            letterSpacing: 1,
          ),
        ),
        const Spacer(),
        Text(
          '${records.length} RECORDS',
          style: TextStyle(color: colors.textSecondary, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildHistoryTile(
      ThemeColors colors, AttendanceRecord record, int index) {
    final checkIn = DateTime.tryParse(record.checkInTime)?.toLocal();
    final checkOut = record.checkOutTime != null
        ? DateTime.tryParse(record.checkOutTime!)?.toLocal()
        : null;
    final isClosed = record.attendanceState == 'closed';

    Color workModeColor;
    switch (record.workMode) {
      case 'field':
        workModeColor = AppColors.warning;
        break;
      case 'remote':
        workModeColor = AppColors.info;
        break;
      default:
        workModeColor = AppColors.success;
    }

    return GestureDetector(
      onTap: () => onRecordTap?.call(record),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 48,
              decoration: BoxDecoration(
                color: workModeColor,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  checkIn != null ? DateFormat('dd').format(checkIn) : '--',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w900),
                ),
                Text(
                  checkIn != null ? DateFormat('MMM').format(checkIn) : '--',
                  style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.logIn,
                          color: AppColors.success, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        checkIn != null
                            ? DateFormat('hh:mm a').format(checkIn)
                            : '--:--',
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 12,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getStatusColor(record.status, colors)
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(
                            color: _getStatusColor(record.status, colors)
                                .withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          _getStatusLabel(record.status),
                          style: TextStyle(
                            color:
                                _getStatusColor(record.status, colors),
                            fontSize: 7,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(LucideIcons.logOut,
                          color: AppColors.error, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        checkOut != null
                            ? DateFormat('hh:mm a').format(checkOut)
                            : (isClosed ? 'Auto Closed' : '--:-- '),
                        style: TextStyle(
                          color: isClosed &&
                                  record.closeReason ==
                                      'Forgotten Checkout'
                              ? _getStatusColor(
                                  AttendanceStatus.autoClosed, colors)
                              : colors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: workModeColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          record.workMode.toUpperCase(),
                          style: TextStyle(
                              color: workModeColor,
                              fontSize: 8,
                              fontWeight: FontWeight.w900),
                        ),
                      ),
                      if (record.closeReason != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: colors.border,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            record.closeReason!.toUpperCase(),
                            style: TextStyle(
                                color: colors.textSecondary, fontSize: 7),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  record.formattedDuration,
                  style: TextStyle(
                      color: colors.honey,
                      fontSize: 16,
                      fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Icon(LucideIcons.chevronRight,
                    color: colors.textSecondary, size: 14),
              ],
            ),
          ],
        ),
      ).animate(delay: (index * 50).ms).fadeIn(duration: 300.ms).slideX(begin: 0.05),
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(LucideIcons.calendarOff,
                color: colors.textSecondary, size: 48),
            const SizedBox(height: 16),
            Text(
              'No attendance records yet',
              style:
                  TextStyle(color: colors.textSecondary, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
