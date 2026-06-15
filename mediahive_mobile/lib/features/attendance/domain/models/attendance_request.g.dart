// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AttendanceRequestImpl _$$AttendanceRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$AttendanceRequestImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      requestType: json['requestType'] as String,
      status: json['status'] as String? ?? 'pending',
      requestedTime: json['requestedTime'] as String,
      reason: json['reason'] as String,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      assignmentId: json['assignmentId'] as String?,
      attendanceId: json['attendanceId'] as String?,
      adminUserId: json['adminUserId'] as String?,
      adminNotes: json['adminNotes'] as String?,
      resolvedAt: json['resolvedAt'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$AttendanceRequestImplToJson(
        _$AttendanceRequestImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'userName': instance.userName,
      'requestType': instance.requestType,
      'status': instance.status,
      'requestedTime': instance.requestedTime,
      'reason': instance.reason,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'assignmentId': instance.assignmentId,
      'attendanceId': instance.attendanceId,
      'adminUserId': instance.adminUserId,
      'adminNotes': instance.adminNotes,
      'resolvedAt': instance.resolvedAt,
      'createdAt': instance.createdAt,
    };
