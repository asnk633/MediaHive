// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AttendanceEventImpl _$$AttendanceEventImplFromJson(
        Map<String, dynamic> json) =>
    _$AttendanceEventImpl(
      id: json['id'] as String,
      attendanceId: json['attendanceId'] as String,
      userId: json['userId'] as String,
      eventTime: json['eventTime'] as String,
      eventType: json['eventType'] as String,
      workMode: json['workMode'] as String?,
      lastKnownWorkLocation: json['lastKnownWorkLocation'] as String?,
      nfcTagId: json['nfcTagId'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      notes: json['notes'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$AttendanceEventImplToJson(
        _$AttendanceEventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'attendanceId': instance.attendanceId,
      'userId': instance.userId,
      'eventTime': instance.eventTime,
      'eventType': instance.eventType,
      'workMode': instance.workMode,
      'lastKnownWorkLocation': instance.lastKnownWorkLocation,
      'nfcTagId': instance.nfcTagId,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'notes': instance.notes,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt,
    };
