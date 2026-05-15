// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'equipment_booking.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

EquipmentBooking _$EquipmentBookingFromJson(Map<String, dynamic> json) {
  return _EquipmentBooking.fromJson(json);
}

/// @nodoc
mixin _$EquipmentBooking {
  int get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'equipment_id')
  String get equipmentId => throw _privateConstructorUsedError;
  @JsonKey(name: 'task_id')
  String? get taskId => throw _privateConstructorUsedError;
  @JsonKey(name: 'booked_by')
  String? get bookedBy => throw _privateConstructorUsedError;
  @JsonKey(name: 'start_time')
  DateTime get startTime => throw _privateConstructorUsedError;
  @JsonKey(name: 'end_time')
  DateTime get endTime => throw _privateConstructorUsedError;
  @JsonKey(name: 'units_requested')
  int get unitsRequested => throw _privateConstructorUsedError;
  @JsonKey(name: 'institution_id')
  String? get institutionId => throw _privateConstructorUsedError;
  @JsonKey(name: 'created_at')
  DateTime? get createdAt => throw _privateConstructorUsedError; // Joined data
  @JsonKey(name: 'equipment_name')
  String? get equipmentName => throw _privateConstructorUsedError;
  @JsonKey(name: 'booked_by_name')
  String? get bookedByName => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $EquipmentBookingCopyWith<EquipmentBooking> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EquipmentBookingCopyWith<$Res> {
  factory $EquipmentBookingCopyWith(
          EquipmentBooking value, $Res Function(EquipmentBooking) then) =
      _$EquipmentBookingCopyWithImpl<$Res, EquipmentBooking>;
  @useResult
  $Res call(
      {int id,
      @JsonKey(name: 'equipment_id') String equipmentId,
      @JsonKey(name: 'task_id') String? taskId,
      @JsonKey(name: 'booked_by') String? bookedBy,
      @JsonKey(name: 'start_time') DateTime startTime,
      @JsonKey(name: 'end_time') DateTime endTime,
      @JsonKey(name: 'units_requested') int unitsRequested,
      @JsonKey(name: 'institution_id') String? institutionId,
      @JsonKey(name: 'created_at') DateTime? createdAt,
      @JsonKey(name: 'equipment_name') String? equipmentName,
      @JsonKey(name: 'booked_by_name') String? bookedByName});
}

/// @nodoc
class _$EquipmentBookingCopyWithImpl<$Res, $Val extends EquipmentBooking>
    implements $EquipmentBookingCopyWith<$Res> {
  _$EquipmentBookingCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? equipmentId = null,
    Object? taskId = freezed,
    Object? bookedBy = freezed,
    Object? startTime = null,
    Object? endTime = null,
    Object? unitsRequested = null,
    Object? institutionId = freezed,
    Object? createdAt = freezed,
    Object? equipmentName = freezed,
    Object? bookedByName = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      equipmentId: null == equipmentId
          ? _value.equipmentId
          : equipmentId // ignore: cast_nullable_to_non_nullable
              as String,
      taskId: freezed == taskId
          ? _value.taskId
          : taskId // ignore: cast_nullable_to_non_nullable
              as String?,
      bookedBy: freezed == bookedBy
          ? _value.bookedBy
          : bookedBy // ignore: cast_nullable_to_non_nullable
              as String?,
      startTime: null == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endTime: null == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      unitsRequested: null == unitsRequested
          ? _value.unitsRequested
          : unitsRequested // ignore: cast_nullable_to_non_nullable
              as int,
      institutionId: freezed == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      equipmentName: freezed == equipmentName
          ? _value.equipmentName
          : equipmentName // ignore: cast_nullable_to_non_nullable
              as String?,
      bookedByName: freezed == bookedByName
          ? _value.bookedByName
          : bookedByName // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$EquipmentBookingImplCopyWith<$Res>
    implements $EquipmentBookingCopyWith<$Res> {
  factory _$$EquipmentBookingImplCopyWith(_$EquipmentBookingImpl value,
          $Res Function(_$EquipmentBookingImpl) then) =
      __$$EquipmentBookingImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      @JsonKey(name: 'equipment_id') String equipmentId,
      @JsonKey(name: 'task_id') String? taskId,
      @JsonKey(name: 'booked_by') String? bookedBy,
      @JsonKey(name: 'start_time') DateTime startTime,
      @JsonKey(name: 'end_time') DateTime endTime,
      @JsonKey(name: 'units_requested') int unitsRequested,
      @JsonKey(name: 'institution_id') String? institutionId,
      @JsonKey(name: 'created_at') DateTime? createdAt,
      @JsonKey(name: 'equipment_name') String? equipmentName,
      @JsonKey(name: 'booked_by_name') String? bookedByName});
}

/// @nodoc
class __$$EquipmentBookingImplCopyWithImpl<$Res>
    extends _$EquipmentBookingCopyWithImpl<$Res, _$EquipmentBookingImpl>
    implements _$$EquipmentBookingImplCopyWith<$Res> {
  __$$EquipmentBookingImplCopyWithImpl(_$EquipmentBookingImpl _value,
      $Res Function(_$EquipmentBookingImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? equipmentId = null,
    Object? taskId = freezed,
    Object? bookedBy = freezed,
    Object? startTime = null,
    Object? endTime = null,
    Object? unitsRequested = null,
    Object? institutionId = freezed,
    Object? createdAt = freezed,
    Object? equipmentName = freezed,
    Object? bookedByName = freezed,
  }) {
    return _then(_$EquipmentBookingImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      equipmentId: null == equipmentId
          ? _value.equipmentId
          : equipmentId // ignore: cast_nullable_to_non_nullable
              as String,
      taskId: freezed == taskId
          ? _value.taskId
          : taskId // ignore: cast_nullable_to_non_nullable
              as String?,
      bookedBy: freezed == bookedBy
          ? _value.bookedBy
          : bookedBy // ignore: cast_nullable_to_non_nullable
              as String?,
      startTime: null == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endTime: null == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      unitsRequested: null == unitsRequested
          ? _value.unitsRequested
          : unitsRequested // ignore: cast_nullable_to_non_nullable
              as int,
      institutionId: freezed == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      equipmentName: freezed == equipmentName
          ? _value.equipmentName
          : equipmentName // ignore: cast_nullable_to_non_nullable
              as String?,
      bookedByName: freezed == bookedByName
          ? _value.bookedByName
          : bookedByName // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EquipmentBookingImpl implements _EquipmentBooking {
  const _$EquipmentBookingImpl(
      {required this.id,
      @JsonKey(name: 'equipment_id') required this.equipmentId,
      @JsonKey(name: 'task_id') this.taskId,
      @JsonKey(name: 'booked_by') this.bookedBy,
      @JsonKey(name: 'start_time') required this.startTime,
      @JsonKey(name: 'end_time') required this.endTime,
      @JsonKey(name: 'units_requested') this.unitsRequested = 1,
      @JsonKey(name: 'institution_id') this.institutionId,
      @JsonKey(name: 'created_at') this.createdAt,
      @JsonKey(name: 'equipment_name') this.equipmentName,
      @JsonKey(name: 'booked_by_name') this.bookedByName});

  factory _$EquipmentBookingImpl.fromJson(Map<String, dynamic> json) =>
      _$$EquipmentBookingImplFromJson(json);

  @override
  final int id;
  @override
  @JsonKey(name: 'equipment_id')
  final String equipmentId;
  @override
  @JsonKey(name: 'task_id')
  final String? taskId;
  @override
  @JsonKey(name: 'booked_by')
  final String? bookedBy;
  @override
  @JsonKey(name: 'start_time')
  final DateTime startTime;
  @override
  @JsonKey(name: 'end_time')
  final DateTime endTime;
  @override
  @JsonKey(name: 'units_requested')
  final int unitsRequested;
  @override
  @JsonKey(name: 'institution_id')
  final String? institutionId;
  @override
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
// Joined data
  @override
  @JsonKey(name: 'equipment_name')
  final String? equipmentName;
  @override
  @JsonKey(name: 'booked_by_name')
  final String? bookedByName;

  @override
  String toString() {
    return 'EquipmentBooking(id: $id, equipmentId: $equipmentId, taskId: $taskId, bookedBy: $bookedBy, startTime: $startTime, endTime: $endTime, unitsRequested: $unitsRequested, institutionId: $institutionId, createdAt: $createdAt, equipmentName: $equipmentName, bookedByName: $bookedByName)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EquipmentBookingImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.equipmentId, equipmentId) ||
                other.equipmentId == equipmentId) &&
            (identical(other.taskId, taskId) || other.taskId == taskId) &&
            (identical(other.bookedBy, bookedBy) ||
                other.bookedBy == bookedBy) &&
            (identical(other.startTime, startTime) ||
                other.startTime == startTime) &&
            (identical(other.endTime, endTime) || other.endTime == endTime) &&
            (identical(other.unitsRequested, unitsRequested) ||
                other.unitsRequested == unitsRequested) &&
            (identical(other.institutionId, institutionId) ||
                other.institutionId == institutionId) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.equipmentName, equipmentName) ||
                other.equipmentName == equipmentName) &&
            (identical(other.bookedByName, bookedByName) ||
                other.bookedByName == bookedByName));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      equipmentId,
      taskId,
      bookedBy,
      startTime,
      endTime,
      unitsRequested,
      institutionId,
      createdAt,
      equipmentName,
      bookedByName);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$EquipmentBookingImplCopyWith<_$EquipmentBookingImpl> get copyWith =>
      __$$EquipmentBookingImplCopyWithImpl<_$EquipmentBookingImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EquipmentBookingImplToJson(
      this,
    );
  }
}

abstract class _EquipmentBooking implements EquipmentBooking {
  const factory _EquipmentBooking(
          {required final int id,
          @JsonKey(name: 'equipment_id') required final String equipmentId,
          @JsonKey(name: 'task_id') final String? taskId,
          @JsonKey(name: 'booked_by') final String? bookedBy,
          @JsonKey(name: 'start_time') required final DateTime startTime,
          @JsonKey(name: 'end_time') required final DateTime endTime,
          @JsonKey(name: 'units_requested') final int unitsRequested,
          @JsonKey(name: 'institution_id') final String? institutionId,
          @JsonKey(name: 'created_at') final DateTime? createdAt,
          @JsonKey(name: 'equipment_name') final String? equipmentName,
          @JsonKey(name: 'booked_by_name') final String? bookedByName}) =
      _$EquipmentBookingImpl;

  factory _EquipmentBooking.fromJson(Map<String, dynamic> json) =
      _$EquipmentBookingImpl.fromJson;

  @override
  int get id;
  @override
  @JsonKey(name: 'equipment_id')
  String get equipmentId;
  @override
  @JsonKey(name: 'task_id')
  String? get taskId;
  @override
  @JsonKey(name: 'booked_by')
  String? get bookedBy;
  @override
  @JsonKey(name: 'start_time')
  DateTime get startTime;
  @override
  @JsonKey(name: 'end_time')
  DateTime get endTime;
  @override
  @JsonKey(name: 'units_requested')
  int get unitsRequested;
  @override
  @JsonKey(name: 'institution_id')
  String? get institutionId;
  @override
  @JsonKey(name: 'created_at')
  DateTime? get createdAt;
  @override // Joined data
  @JsonKey(name: 'equipment_name')
  String? get equipmentName;
  @override
  @JsonKey(name: 'booked_by_name')
  String? get bookedByName;
  @override
  @JsonKey(ignore: true)
  _$$EquipmentBookingImplCopyWith<_$EquipmentBookingImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
