import 'package:freezed_annotation/freezed_annotation.dart';

part 'sync_mutation.freezed.dart';
part 'sync_mutation.g.dart';

@freezed
class SyncMutation with _$SyncMutation {
  const factory SyncMutation({
    required String id,
    required String type, // 'create', 'update', 'delete'
    required String feature, // 'tasks', 'inventory', etc.
    required Map<String, dynamic> data,
    required DateTime timestamp,
    @Default(0) int retryCount,
  }) = _SyncMutation;

  factory SyncMutation.fromJson(Map<String, dynamic> json) => _$SyncMutationFromJson(json);
}
