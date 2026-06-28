import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_policy.dart';

class AttendanceTimerBanner extends StatelessWidget {
  final bool isCheckedIn;
  final Duration elapsed;
  final String? checkInTime;
  final String statusLabel;
  final Color statusColor;
  final String todayWorkedStr;
  final String todayOvertimeStr;
  final AttendancePolicy policy;
  final String? workMode;
  final String? lastKnownWorkLocation;
  final Animation<double>? pulseAnimation;

  const AttendanceTimerBanner({
    super.key,
    required this.isCheckedIn,
    required this.elapsed,
    this.checkInTime,
    required this.statusLabel,
    required this.statusColor,
    required this.todayWorkedStr,
    required this.todayOvertimeStr,
    required this.policy,
    this.workMode,
    this.lastKnownWorkLocation,
    this.pulseAnimation,
  });

  String _formatElapsed(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isCheckedIn
                ? statusColor.withValues(alpha: 0.3)
                : colors.border,
          ),
          boxShadow: isCheckedIn
              ? [
                  BoxShadow(
                    color: statusColor.withValues(alpha: 0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ]
              : colors.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (pulseAnimation != null)
                  AnimatedBuilder(
                    animation: pulseAnimation!,
                    builder: (context, _) => Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCheckedIn
                            ? statusColor.withValues(
                                alpha: 0.5 + 0.5 * pulseAnimation!.value)
                            : colors.textSecondary.withValues(alpha: 0.3),
                      ),
                    ),
                  )
                else
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCheckedIn
                          ? statusColor
                          : colors.textSecondary.withValues(alpha: 0.3),
                    ),
                  ),
                const SizedBox(width: 8),
                Text(
                  statusLabel,
                  style: TextStyle(
                    color: isCheckedIn ? statusColor : colors.textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                  ),
                ),
                const Spacer(),
                if (isCheckedIn && workMode != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(
                          color: statusColor.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      workMode!.toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            if (isCheckedIn) ...[
              Center(
                child: Text(
                  _formatElapsed(elapsed),
                  style: AppTypography.h1.copyWith(
                    color: colors.textPrimary,
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ).animate(onPlay: (c) => c.repeat()).shimmer(
                      duration: 3000.ms,
                      color: colors.honey.withValues(alpha: 0.15),
                    ),
              ),
              const SizedBox(height: 8),
              if (checkInTime != null)
                Center(
                  child: Text(
                    'Checked in at ${DateFormat('hh:mm a').format(DateTime.parse(checkInTime!).toLocal())}',
                    style: TextStyle(
                        color: colors.textSecondary, fontSize: 12),
                  ),
                ),
              if (lastKnownWorkLocation != null) ...[
                const SizedBox(height: 4),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.mapPin,
                          color: colors.honey, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        lastKnownWorkLocation!,
                        style: TextStyle(
                            color: colors.honey,
                            fontSize: 11,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ] else ...[
              Center(
                child: Text(
                  'Ready to log attendance',
                  style:
                      TextStyle(color: colors.textSecondary, fontSize: 14),
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.backgroundPrimary.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('WORKED TODAY',
                            style: TextStyle(
                                color: colors.textSecondary,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Text(todayWorkedStr,
                            style: TextStyle(
                                color: colors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.backgroundPrimary.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('OVERTIME TODAY',
                            style: TextStyle(
                                color: colors.textSecondary,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Text(
                          todayOvertimeStr,
                          style: TextStyle(
                            color: policy.overtimeEnabled &&
                                    todayOvertimeStr != '0m'
                                ? colors.honey
                                : colors.textSecondary,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1);
    });
  }
}
