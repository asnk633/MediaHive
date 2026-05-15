import 'package:freezed_annotation/freezed_annotation.dart';

part 'upload_mutation.freezed.dart';
part 'upload_mutation.g.dart';

@freezed
class UploadMutation with _$UploadMutation {
  const factory UploadMutation({
    required String id,
    required String filePath,
    required String bucketName,
    required String destinationPath,
    required Map<String, dynamic> metadata,
    @Default(0) int retryCount,
    @Default('queued') String status, // queued, processing, failed
    required DateTime timestamp,
  }) = _UploadMutation;

  factory UploadMutation.fromJson(Map<String, dynamic> json) => _$UploadMutationFromJson(json);
}
