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
      description: json['description'] as String?,
      location: json['location'] as String?,
    );

Map<String, dynamic> _$$EventImplToJson(_$EventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'time': instance.time,
      'type': instance.type,
      'date': instance.date,
      'colorValue': instance.colorValue,
      'description': instance.description,
      'location': instance.location,
    };
