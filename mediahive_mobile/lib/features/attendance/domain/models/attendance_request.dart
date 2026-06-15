import 'package:freezed_annotation/freezed_annotation.dart';

part 'attendance_request.freezed.dart';
part 'attendance_request.g.dart';

enum RequestStatus {
  pending,
  approved,
  rejected,
  expired
}

@freezed
class AttendanceRequest with _$AttendanceRequest {
  const AttendanceRequest._();

  const factory AttendanceRequest({
    required String id,
    required String userId,
    required String userName,
    required String requestType, // 'missed_checkin', 'remote_checkout'
    @Default('pending') String status, // 'pending', 'approved', 'rejected', 'expired'
    required String requestedTime,
    required String reason,
    double? latitude,
    double? longitude,
    String? assignmentId,
    String? attendanceId,
    String? adminUserId,
    String? adminNotes,
    String? resolvedAt,
    required String createdAt,
  }) = _AttendanceRequest;

  factory AttendanceRequest.fromJson(Map<String, dynamic> json) => _$AttendanceRequestFromJson(json);

  RequestStatus get requestStatus {
    switch (status) {
      case 'approved':
        return RequestStatus.approved;
      case 'rejected':
        return RequestStatus.rejected;
      case 'expired':
        return RequestStatus.expired;
      case 'pending':
      default:
        return RequestStatus.pending;
    }
  }
}
