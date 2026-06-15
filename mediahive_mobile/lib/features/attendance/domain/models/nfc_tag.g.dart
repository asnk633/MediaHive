// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'nfc_tag.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$NfcTagImpl _$$NfcTagImplFromJson(Map<String, dynamic> json) => _$NfcTagImpl(
      id: json['id'] as String,
      tagName: json['tagName'] as String,
      tagId: json['tagId'] as String,
      tagType: json['tagType'] as String? ?? 'attendance',
      entityId: json['entityId'] as String?,
      entityType: json['entityType'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radius: (json['radius'] as num?)?.toDouble() ?? 50.0,
      active: json['active'] as bool? ?? true,
      deletedAt: json['deletedAt'] as String?,
      campusId: json['campusId'] as String?,
      campusName: json['campusName'] as String?,
      locationGroup: json['locationGroup'] as String?,
      accuracy: (json['accuracy'] as num?)?.toDouble(),
      wifiSsids: json['wifi_ssids'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$NfcTagImplToJson(_$NfcTagImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'tagName': instance.tagName,
      'tagId': instance.tagId,
      'tagType': instance.tagType,
      'entityId': instance.entityId,
      'entityType': instance.entityType,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'radius': instance.radius,
      'active': instance.active,
      'deletedAt': instance.deletedAt,
      'campusId': instance.campusId,
      'campusName': instance.campusName,
      'locationGroup': instance.locationGroup,
      'accuracy': instance.accuracy,
      'wifi_ssids': instance.wifiSsids,
      'createdAt': instance.createdAt,
    };
