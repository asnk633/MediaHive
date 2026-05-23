import 'package:freezed_annotation/freezed_annotation.dart';

part 'event.freezed.dart';
part 'event.g.dart';

@freezed
class Event with _$Event {
  const factory Event({
    required String id,
    required String title,
    required String time,
    required String type, // DRESSING, COMMUNITY, RELIGIOUS, ADMIN, INVENTORY
    required String date, // ISO string or standardized format
    @Default(0xFF2563EB) int colorValue, // Store color as int for serialization
    String? createdBy,
    String? description,
    String? location,
    @Default([]) List<String> linkedTaskIds,
    @Default([]) List<String> linkedInventoryIds,
    String? institutionId,
    int? departmentId,
    Map<String, dynamic>? onBehalfOf,
    @Default([]) List<String> mediaCoverage,
    @Default([]) List<Map<String, dynamic>> assignedCrew,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}

