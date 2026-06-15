import 'package:freezed_annotation/freezed_annotation.dart';

part 'attendance_event.freezed.dart';
part 'attendance_event.g.dart';

@freezed
class AttendanceEvent with _$AttendanceEvent {
  const factory AttendanceEvent({
    required String id,
    required String attendanceId,
    required String userId,
    required String eventTime,
    required String eventType, // 'check_in', 'check_out', 'work_mode_change', 'assignment_change', 'gps_verification_failed', 'biometric_failed', 'offline_queued', 'offline_synced', 'attendance_override', 'auto_closed', 'checkout_reminder_sent', 'device_changed', 'duplicate_scan_ignored', 'remote_checkout', 'mock_location_detected', 'attendance_during_leave'
    String? workMode,
    String? lastKnownWorkLocation,
    String? nfcTagId,
    double? latitude,
    double? longitude,
    String? notes,
    Map<String, dynamic>? metadata,
    required String createdAt,
  }) = _AttendanceEvent;

  factory AttendanceEvent.fromJson(Map<String, dynamic> json) => _$AttendanceEventFromJson(json);
}
