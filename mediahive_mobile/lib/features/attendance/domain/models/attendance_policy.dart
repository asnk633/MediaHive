/// Attendance Policy model — plain Dart class, no code generation required.
///
/// Settings stored in [system_config] Supabase table using the keys:
///   attendance_start_time, attendance_end_time, attendance_grace_period,
///   attendance_auto_close_time, attendance_overtime_enabled,
///   attendance_checkout_reminder_enabled
class AttendancePolicy {
  /// Office start time string, e.g. "09:00 AM" or "09:00"
  final String startTimeStr;

  /// Office end time string, e.g. "05:00 PM" or "17:00"
  final String endTimeStr;

  /// Grace period for late arrival / GPS exit (minutes), e.g. 15
  final int gracePeriod;

  /// Time at which forgotten sessions are auto-closed, e.g. "11:59 PM"
  final String autoCloseTimeStr;

  /// Whether overtime calculation is active
  final bool overtimeEnabled;

  /// Whether geofence checkout reminder notifications are active
  final bool checkoutReminderEnabled;

  /// NFC duplicate scan cooldown in seconds (allowed: 10 - 120, default: 30)
  final int scanCooldownSeconds;

  /// Lunch start time string, e.g. "01:00 PM" or "13:00"
  final String lunchStartTimeStr;

  /// Lunch end time string, e.g. "02:00 PM" or "14:00"
  final String lunchEndTimeStr;

  const AttendancePolicy({
    required this.startTimeStr,
    required this.endTimeStr,
    required this.gracePeriod,
    required this.autoCloseTimeStr,
    required this.overtimeEnabled,
    required this.checkoutReminderEnabled,
    required this.scanCooldownSeconds,
    required this.lunchStartTimeStr,
    required this.lunchEndTimeStr,
  });

  /// Default policy used when config is unavailable
  factory AttendancePolicy.defaultPolicy() {
    return const AttendancePolicy(
      startTimeStr: '09:00 AM',
      endTimeStr: '05:00 PM',
      gracePeriod: 15,
      autoCloseTimeStr: '11:59 PM',
      overtimeEnabled: true,
      checkoutReminderEnabled: true,
      scanCooldownSeconds: 30,
      lunchStartTimeStr: '01:00 PM',
      lunchEndTimeStr: '02:00 PM',
    );
  }

  /// Parses a time string (e.g. "09:00 AM" or "17:30") relative to [baseDate].
  /// Returns null if parsing fails.
  DateTime? parseTime(String timeStr, DateTime baseDate) {
    final trimmed = timeStr.trim().toUpperCase();
    int hour = 0;
    int minute = 0;

    try {
      if (trimmed.contains('AM') || trimmed.contains('PM')) {
        final isPm = trimmed.contains('PM');
        final cleanStr =
            trimmed.replaceAll('AM', '').replaceAll('PM', '').trim();
        final parts = cleanStr.split(':');
        hour = int.parse(parts[0]);
        minute = int.parse(parts[1]);
        if (isPm && hour < 12) hour += 12;
        if (!isPm && hour == 12) hour = 0;
      } else {
        final parts = trimmed.split(':');
        hour = int.parse(parts[0]);
        minute = int.parse(parts[1]);
      }
      return DateTime(
          baseDate.year, baseDate.month, baseDate.day, hour, minute);
    } catch (_) {
      return null;
    }
  }

  /// Standard workday duration = Office End Time − Office Start Time.
  ///
  /// Overtime is calculated as: totalWorked − standardWorkdayDuration.
  /// Example: Start 09:00, End 17:00 → 8 hours standard.
  ///          Worked 9h → Overtime = 1h.
  Duration get standardWorkdayDuration {
    final now = DateTime.now();
    final start = parseTime(startTimeStr, now) ??
        DateTime(now.year, now.month, now.day, 9, 0);
    final end = parseTime(endTimeStr, now) ??
        DateTime(now.year, now.month, now.day, 17, 0);
    if (end.isBefore(start)) {
      // Handles end time spanning past midnight
      return end.add(const Duration(days: 1)).difference(start);
    }
    return end.difference(start);
  }

  /// Creates a copy with the given fields overridden.
  AttendancePolicy copyWith({
    String? startTimeStr,
    String? endTimeStr,
    int? gracePeriod,
    String? autoCloseTimeStr,
    bool? overtimeEnabled,
    bool? checkoutReminderEnabled,
    int? scanCooldownSeconds,
    String? lunchStartTimeStr,
    String? lunchEndTimeStr,
  }) {
    return AttendancePolicy(
      startTimeStr: startTimeStr ?? this.startTimeStr,
      endTimeStr: endTimeStr ?? this.endTimeStr,
      gracePeriod: gracePeriod ?? this.gracePeriod,
      autoCloseTimeStr: autoCloseTimeStr ?? this.autoCloseTimeStr,
      overtimeEnabled: overtimeEnabled ?? this.overtimeEnabled,
      checkoutReminderEnabled:
          checkoutReminderEnabled ?? this.checkoutReminderEnabled,
      scanCooldownSeconds: scanCooldownSeconds ?? this.scanCooldownSeconds,
      lunchStartTimeStr: lunchStartTimeStr ?? this.lunchStartTimeStr,
      lunchEndTimeStr: lunchEndTimeStr ?? this.lunchEndTimeStr,
    );
  }

  /// Serialise to JSON (used when saving to system_config as individual keys).
  Map<String, dynamic> toJson() => {
        'startTimeStr': startTimeStr,
        'endTimeStr': endTimeStr,
        'gracePeriod': gracePeriod,
        'autoCloseTimeStr': autoCloseTimeStr,
        'overtimeEnabled': overtimeEnabled,
        'checkoutReminderEnabled': checkoutReminderEnabled,
        'scanCooldownSeconds': scanCooldownSeconds,
        'lunchStartTimeStr': lunchStartTimeStr,
        'lunchEndTimeStr': lunchEndTimeStr,
      };

  @override
  String toString() =>
      'AttendancePolicy(start: $startTimeStr, end: $endTimeStr, '
      'grace: ${gracePeriod}m, autoClose: $autoCloseTimeStr, '
      'overtime: $overtimeEnabled, reminder: $checkoutReminderEnabled, '
      'cooldown: ${scanCooldownSeconds}s, lunchStart: $lunchStartTimeStr, '
      'lunchEnd: $lunchEndTimeStr)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AttendancePolicy &&
          runtimeType == other.runtimeType &&
          startTimeStr == other.startTimeStr &&
          endTimeStr == other.endTimeStr &&
          gracePeriod == other.gracePeriod &&
          autoCloseTimeStr == other.autoCloseTimeStr &&
          overtimeEnabled == other.overtimeEnabled &&
          checkoutReminderEnabled == other.checkoutReminderEnabled &&
          scanCooldownSeconds == other.scanCooldownSeconds &&
          lunchStartTimeStr == other.lunchStartTimeStr &&
          lunchEndTimeStr == other.lunchEndTimeStr;

  @override
  int get hashCode => Object.hash(
        startTimeStr,
        endTimeStr,
        gracePeriod,
        autoCloseTimeStr,
        overtimeEnabled,
        checkoutReminderEnabled,
        scanCooldownSeconds,
        lunchStartTimeStr,
        lunchEndTimeStr,
      );
}
