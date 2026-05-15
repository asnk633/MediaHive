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
    String? description,
    String? location,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}
