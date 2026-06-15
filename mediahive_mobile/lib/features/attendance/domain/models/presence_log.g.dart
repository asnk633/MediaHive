// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'presence_log.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PresenceLogImpl _$$PresenceLogImplFromJson(Map<String, dynamic> json) =>
    _$PresenceLogImpl(
      id: json['id'] as String,
      attendanceId: json['attendanceId'] as String,
      userId: json['userId'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num?)?.toDouble(),
      isWithinGeofence: json['isWithinGeofence'] as bool? ?? true,
      isMockLocation: json['isMockLocation'] as bool? ?? false,
      wifiSsid: json['wifiSsid'] as String?,
      verificationMethod: json['verificationMethod'] as String? ?? 'gps',
      distanceFromOffice: (json['distanceFromOffice'] as num?)?.toDouble(),
      networkState: json['networkState'] as String? ?? 'online',
      batteryLevel: (json['batteryLevel'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$PresenceLogImplToJson(_$PresenceLogImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'attendanceId': instance.attendanceId,
      'userId': instance.userId,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'accuracy': instance.accuracy,
      'isWithinGeofence': instance.isWithinGeofence,
      'isMockLocation': instance.isMockLocation,
      'wifiSsid': instance.wifiSsid,
      'verificationMethod': instance.verificationMethod,
      'distanceFromOffice': instance.distanceFromOffice,
      'networkState': instance.networkState,
      'batteryLevel': instance.batteryLevel,
      'createdAt': instance.createdAt,
    };
