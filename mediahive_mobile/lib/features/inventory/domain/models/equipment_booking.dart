import 'package:freezed_annotation/freezed_annotation.dart';

part 'equipment_booking.freezed.dart';
part 'equipment_booking.g.dart';

@freezed
class EquipmentBooking with _$EquipmentBooking {
  const factory EquipmentBooking({
    required int id,
    @JsonKey(name: 'equipment_id') required String equipmentId,
    @JsonKey(name: 'task_id') String? taskId,
    @JsonKey(name: 'booked_by') String? bookedBy,
    @JsonKey(name: 'start_time') required DateTime startTime,
    @JsonKey(name: 'end_time') required DateTime endTime,
    @JsonKey(name: 'units_requested') @Default(1) int unitsRequested,
    @JsonKey(name: 'institution_id') String? institutionId,
    @JsonKey(name: 'created_at') DateTime? createdAt,
    // Joined data
    @JsonKey(name: 'equipment_name') String? equipmentName,
    @JsonKey(name: 'booked_by_name') String? bookedByName,
  }) = _EquipmentBooking;

  factory EquipmentBooking.fromJson(Map<String, dynamic> json) => _$EquipmentBookingFromJson(json);
}
