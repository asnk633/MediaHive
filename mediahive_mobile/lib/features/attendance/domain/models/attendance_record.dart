import 'package:freezed_annotation/freezed_annotation.dart';
import 'attendance_policy.dart';

part 'attendance_record.freezed.dart';
part 'attendance_record.g.dart';

enum AttendanceStatus {
  checkedIn,       // Green 🟢 (Active + Office)
  onField,         // Yellow 🟡 (Active + Field / Assigned)
  remote,          // Blue 🔵 (Active + Remote)
  autoClosed,      // Black ⚫ (Closed + Forgotten Checkout)
  checkedOut       // Red 🔴 (Closed normally)
}

@freezed
class AttendanceRecord with _$AttendanceRecord {
  const AttendanceRecord._();

  const factory AttendanceRecord({
    required String id,
    required String userId,
    required String userName,
    String? nfcTagId,
    required String checkInTime,
    String? checkOutTime,
    @Default('nfc') String checkInSource, // 'nfc', 'qr', 'manual', 'admin_override'
    String? checkOutSource,
    double? latitude,
    double? longitude,
    String? deviceId,
    String? deviceName,
    String? checkOutDeviceId,
    String? checkOutDeviceName,
    String? campusId,
    String? campusName,
    @Default(false) bool isHoliday,
    @Default(false) bool isWeekend,
    @Default('active') String attendanceState, // 'active', 'closed'
    @Default('office') String workMode, // 'office', 'field', 'remote'
    String? lastKnownWorkLocation,
    String? assignmentId,
    String? closeReason, // 'Forgotten Checkout', etc.
    required String createdAt,
  }) = _AttendanceRecord;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => _$AttendanceRecordFromJson(json);

  // Getter for dynamic duration calculation
  Duration get calculatedDuration {
    final start = DateTime.tryParse(checkInTime) ?? DateTime.now();
    final end = checkOutTime != null ? (DateTime.tryParse(checkOutTime!) ?? DateTime.now()) : DateTime.now();
    final diff = end.difference(start);
    return diff.isNegative ? Duration.zero : diff;
  }

  String get formattedDuration {
    final dur = calculatedDuration;
    final hours = dur.inHours;
    final minutes = dur.inMinutes.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }

  /// Returns the current logical attendance status
  AttendanceStatus get status {
    if (attendanceState == 'active') {
      if (workMode == 'field' || assignmentId != null) {
        return AttendanceStatus.onField;
      } else if (workMode == 'remote') {
        return AttendanceStatus.remote;
      } else {
        return AttendanceStatus.checkedIn;
      }
    } else {
      if (closeReason == 'Forgotten Checkout') {
        return AttendanceStatus.autoClosed;
      } else {
        return AttendanceStatus.checkedOut;
      }
    }
  }

  /// Dynamic Overtime calculation: Total hours worked exceeding standard workday
  Duration getOvertimeHours(AttendancePolicy policy) {
    if (!policy.overtimeEnabled) return Duration.zero;
    final total = calculatedDuration;
    final standard = policy.standardWorkdayDuration;
    if (total > standard) {
      return total - standard;
    }
    return Duration.zero;
  }

  /// Dynamic Regular hours calculation: Total hours minus Overtime
  Duration getRegularHours(AttendancePolicy policy) {
    final total = calculatedDuration;
    final overtime = getOvertimeHours(policy);
    final regular = total - overtime;
    return regular.isNegative ? Duration.zero : regular;
  }

  /// Dynamic Late Arrival calculation: Check-in time past Office Start Time + Grace Period
  Duration getLateArrivalDuration(AttendancePolicy policy) {
    final start = DateTime.tryParse(checkInTime)?.toLocal();
    if (start == null) return Duration.zero;

    final policyStart = policy.parseTime(policy.startTimeStr, start);
    if (policyStart == null) return Duration.zero;

    final lateCutoff = policyStart.add(Duration(minutes: policy.gracePeriod));
    if (start.isAfter(lateCutoff)) {
      return start.difference(policyStart);
    }
    return Duration.zero;
  }

  /// Dynamic Early Departure calculation: Check-out before Office End Time
  Duration getEarlyDepartureDuration(AttendancePolicy policy) {
    if (attendanceState != 'closed' || checkOutTime == null) return Duration.zero;
    if (workMode == 'field' || workMode == 'remote' || assignmentId != null) {
      // Flexible hours for field/remote/assigned work
      return Duration.zero;
    }

    final end = DateTime.tryParse(checkOutTime!)?.toLocal();
    if (end == null) return Duration.zero;

    final start = DateTime.tryParse(checkInTime)?.toLocal();
    if (start == null) return Duration.zero;

    final policyEnd = policy.parseTime(policy.endTimeStr, start);
    if (policyEnd == null) return Duration.zero;

    if (end.isBefore(policyEnd)) {
      return policyEnd.difference(end);
    }
    return Duration.zero;
  }

  /// Holiday Hours worked
  Duration get holidayHours => isHoliday ? calculatedDuration : Duration.zero;

  /// Weekend Hours worked
  Duration get weekendHours => isWeekend ? calculatedDuration : Duration.zero;

  /// Field assignment hours worked
  Duration get fieldHours => (workMode == 'field' || assignmentId != null) ? calculatedDuration : Duration.zero;
}
