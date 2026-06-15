// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'field_work_session.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$FieldWorkSessionImpl _$$FieldWorkSessionImplFromJson(
        Map<String, dynamic> json) =>
    _$FieldWorkSessionImpl(
      id: json['id'] as String,
      attendanceId: json['attendanceId'] as String,
      userId: json['userId'] as String,
      nfcTagId: json['nfcTagId'] as String?,
      startedAt: json['startedAt'] as String,
      endedAt: json['endedAt'] as String?,
      returnTime: json['returnTime'] as String?,
      reason: json['reason'] as String?,
      status: json['status'] as String? ?? 'pending_approval',
      approvedBy: json['approvedBy'] as String?,
      approvedAt: json['approvedAt'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      managerNotifiedAt: json['managerNotifiedAt'] as String?,
      locationSnapshots: (json['locationSnapshots'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          const [],
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String?,
    );

Map<String, dynamic> _$$FieldWorkSessionImplToJson(
        _$FieldWorkSessionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'attendanceId': instance.attendanceId,
      'userId': instance.userId,
      'nfcTagId': instance.nfcTagId,
      'startedAt': instance.startedAt,
      'endedAt': instance.endedAt,
      'returnTime': instance.returnTime,
      'reason': instance.reason,
      'status': instance.status,
      'approvedBy': instance.approvedBy,
      'approvedAt': instance.approvedAt,
      'rejectionReason': instance.rejectionReason,
      'managerNotifiedAt': instance.managerNotifiedAt,
      'locationSnapshots': instance.locationSnapshots,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };
