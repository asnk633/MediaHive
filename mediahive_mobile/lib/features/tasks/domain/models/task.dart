import 'package:freezed_annotation/freezed_annotation.dart';

part 'task.freezed.dart';
part 'task.g.dart';

@freezed
class Task with _$Task {
  const factory Task({
    required String id,
    required String title,
    required String status,
    required String priority,
    required String requester,
    required String assignee,
    required String dueDate,
    String? completionDate,
    String? description,
    String? onBehalfOf,
    @Default([]) List<String> attachments,
  }) = _Task;

  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}
