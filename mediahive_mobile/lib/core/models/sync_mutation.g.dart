// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_mutation.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SyncMutationImpl _$$SyncMutationImplFromJson(Map<String, dynamic> json) =>
    _$SyncMutationImpl(
      id: json['id'] as String,
      type: json['type'] as String,
      feature: json['feature'] as String,
      data: json['data'] as Map<String, dynamic>,
      timestamp: DateTime.parse(json['timestamp'] as String),
      retryCount: (json['retryCount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$SyncMutationImplToJson(_$SyncMutationImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'feature': instance.feature,
      'data': instance.data,
      'timestamp': instance.timestamp.toIso8601String(),
      'retryCount': instance.retryCount,
    };
