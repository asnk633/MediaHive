// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'equipment_booking.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EquipmentBookingImpl _$$EquipmentBookingImplFromJson(
        Map<String, dynamic> json) =>
    _$EquipmentBookingImpl(
      id: (json['id'] as num).toInt(),
      equipmentId: json['equipment_id'] as String,
      taskId: json['task_id'] as String?,
      bookedBy: json['booked_by'] as String?,
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: DateTime.parse(json['end_time'] as String),
      unitsRequested: (json['units_requested'] as num?)?.toInt() ?? 1,
      institutionId: json['institution_id'] as String?,
      createdAt: json['created_at'] == null
          ? null
          : DateTime.parse(json['created_at'] as String),
      equipmentName: json['equipment_name'] as String?,
      bookedByName: json['booked_by_name'] as String?,
    );

Map<String, dynamic> _$$EquipmentBookingImplToJson(
        _$EquipmentBookingImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'equipment_id': instance.equipmentId,
      'task_id': instance.taskId,
      'booked_by': instance.bookedBy,
      'start_time': instance.startTime.toIso8601String(),
      'end_time': instance.endTime.toIso8601String(),
      'units_requested': instance.unitsRequested,
      'institution_id': instance.institutionId,
      'created_at': instance.createdAt?.toIso8601String(),
      'equipment_name': instance.equipmentName,
      'booked_by_name': instance.bookedByName,
    };
