// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_mutation.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UploadMutationImpl _$$UploadMutationImplFromJson(Map<String, dynamic> json) =>
    _$UploadMutationImpl(
      id: json['id'] as String,
      filePath: json['filePath'] as String,
      bucketName: json['bucketName'] as String,
      destinationPath: json['destinationPath'] as String,
      metadata: json['metadata'] as Map<String, dynamic>,
      retryCount: (json['retryCount'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'queued',
      timestamp: DateTime.parse(json['timestamp'] as String),
    );

Map<String, dynamic> _$$UploadMutationImplToJson(
        _$UploadMutationImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'filePath': instance.filePath,
      'bucketName': instance.bucketName,
      'destinationPath': instance.destinationPath,
      'metadata': instance.metadata,
      'retryCount': instance.retryCount,
      'status': instance.status,
      'timestamp': instance.timestamp.toIso8601String(),
    };
