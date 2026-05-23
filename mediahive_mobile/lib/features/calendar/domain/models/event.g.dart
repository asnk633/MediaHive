// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EventImpl _$$EventImplFromJson(Map<String, dynamic> json) => _$EventImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      time: json['time'] as String,
      type: json['type'] as String,
      date: json['date'] as String,
      colorValue: (json['colorValue'] as num?)?.toInt() ?? 0xFF2563EB,
      createdBy: json['createdBy'] as String?,
      description: json['description'] as String?,
      location: json['location'] as String?,
      linkedTaskIds: (json['linkedTaskIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      linkedInventoryIds: (json['linkedInventoryIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      institutionId: json['institutionId'] as String?,
      departmentId: (json['departmentId'] as num?)?.toInt(),
      onBehalfOf: json['onBehalfOf'] as Map<String, dynamic>?,
      mediaCoverage: (json['mediaCoverage'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      assignedCrew: (json['assignedCrew'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$EventImplToJson(_$EventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'time': instance.time,
      'type': instance.type,
      'date': instance.date,
      'colorValue': instance.colorValue,
      'createdBy': instance.createdBy,
      'description': instance.description,
      'location': instance.location,
      'linkedTaskIds': instance.linkedTaskIds,
      'linkedInventoryIds': instance.linkedInventoryIds,
      'institutionId': instance.institutionId,
      'departmentId': instance.departmentId,
      'onBehalfOf': instance.onBehalfOf,
      'mediaCoverage': instance.mediaCoverage,
      'assignedCrew': instance.assignedCrew,
    };
