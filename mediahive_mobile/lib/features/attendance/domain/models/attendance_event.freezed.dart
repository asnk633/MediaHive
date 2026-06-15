// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attendance_event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AttendanceEvent _$AttendanceEventFromJson(Map<String, dynamic> json) {
  return _AttendanceEvent.fromJson(json);
}

/// @nodoc
mixin _$AttendanceEvent {
  String get id => throw _privateConstructorUsedError;
  String get attendanceId => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get eventTime => throw _privateConstructorUsedError;
  String get eventType =>
      throw _privateConstructorUsedError; // 'check_in', 'check_out', 'work_mode_change', 'assignment_change', 'gps_verification_failed', 'biometric_failed', 'offline_queued', 'offline_synced', 'attendance_override', 'auto_closed', 'checkout_reminder_sent', 'device_changed', 'duplicate_scan_ignored', 'remote_checkout', 'mock_location_detected', 'attendance_during_leave'
  String? get workMode => throw _privateConstructorUsedError;
  String? get lastKnownWorkLocation => throw _privateConstructorUsedError;
  String? get nfcTagId => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get notes => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AttendanceEventCopyWith<AttendanceEvent> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceEventCopyWith<$Res> {
  factory $AttendanceEventCopyWith(
          AttendanceEvent value, $Res Function(AttendanceEvent) then) =
      _$AttendanceEventCopyWithImpl<$Res, AttendanceEvent>;
  @useResult
  $Res call(
      {String id,
      String attendanceId,
      String userId,
      String eventTime,
      String eventType,
      String? workMode,
      String? lastKnownWorkLocation,
      String? nfcTagId,
      double? latitude,
      double? longitude,
      String? notes,
      Map<String, dynamic>? metadata,
      String createdAt});
}

/// @nodoc
class _$AttendanceEventCopyWithImpl<$Res, $Val extends AttendanceEvent>
    implements $AttendanceEventCopyWith<$Res> {
  _$AttendanceEventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? attendanceId = null,
    Object? userId = null,
    Object? eventTime = null,
    Object? eventType = null,
    Object? workMode = freezed,
    Object? lastKnownWorkLocation = freezed,
    Object? nfcTagId = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? notes = freezed,
    Object? metadata = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      attendanceId: null == attendanceId
          ? _value.attendanceId
          : attendanceId // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      eventTime: null == eventTime
          ? _value.eventTime
          : eventTime // ignore: cast_nullable_to_non_nullable
              as String,
      eventType: null == eventType
          ? _value.eventType
          : eventType // ignore: cast_nullable_to_non_nullable
              as String,
      workMode: freezed == workMode
          ? _value.workMode
          : workMode // ignore: cast_nullable_to_non_nullable
              as String?,
      lastKnownWorkLocation: freezed == lastKnownWorkLocation
          ? _value.lastKnownWorkLocation
          : lastKnownWorkLocation // ignore: cast_nullable_to_non_nullable
              as String?,
      nfcTagId: freezed == nfcTagId
          ? _value.nfcTagId
          : nfcTagId // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceEventImplCopyWith<$Res>
    implements $AttendanceEventCopyWith<$Res> {
  factory _$$AttendanceEventImplCopyWith(_$AttendanceEventImpl value,
          $Res Function(_$AttendanceEventImpl) then) =
      __$$AttendanceEventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String attendanceId,
      String userId,
      String eventTime,
      String eventType,
      String? workMode,
      String? lastKnownWorkLocation,
      String? nfcTagId,
      double? latitude,
      double? longitude,
      String? notes,
      Map<String, dynamic>? metadata,
      String createdAt});
}

/// @nodoc
class __$$AttendanceEventImplCopyWithImpl<$Res>
    extends _$AttendanceEventCopyWithImpl<$Res, _$AttendanceEventImpl>
    implements _$$AttendanceEventImplCopyWith<$Res> {
  __$$AttendanceEventImplCopyWithImpl(
      _$AttendanceEventImpl _value, $Res Function(_$AttendanceEventImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? attendanceId = null,
    Object? userId = null,
    Object? eventTime = null,
    Object? eventType = null,
    Object? workMode = freezed,
    Object? lastKnownWorkLocation = freezed,
    Object? nfcTagId = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? notes = freezed,
    Object? metadata = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$AttendanceEventImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      attendanceId: null == attendanceId
          ? _value.attendanceId
          : attendanceId // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      eventTime: null == eventTime
          ? _value.eventTime
          : eventTime // ignore: cast_nullable_to_non_nullable
              as String,
      eventType: null == eventType
          ? _value.eventType
          : eventType // ignore: cast_nullable_to_non_nullable
              as String,
      workMode: freezed == workMode
          ? _value.workMode
          : workMode // ignore: cast_nullable_to_non_nullable
              as String?,
      lastKnownWorkLocation: freezed == lastKnownWorkLocation
          ? _value.lastKnownWorkLocation
          : lastKnownWorkLocation // ignore: cast_nullable_to_non_nullable
              as String?,
      nfcTagId: freezed == nfcTagId
          ? _value.nfcTagId
          : nfcTagId // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AttendanceEventImpl implements _AttendanceEvent {
  const _$AttendanceEventImpl(
      {required this.id,
      required this.attendanceId,
      required this.userId,
      required this.eventTime,
      required this.eventType,
      this.workMode,
      this.lastKnownWorkLocation,
      this.nfcTagId,
      this.latitude,
      this.longitude,
      this.notes,
      final Map<String, dynamic>? metadata,
      required this.createdAt})
      : _metadata = metadata;

  factory _$AttendanceEventImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceEventImplFromJson(json);

  @override
  final String id;
  @override
  final String attendanceId;
  @override
  final String userId;
  @override
  final String eventTime;
  @override
  final String eventType;
// 'check_in', 'check_out', 'work_mode_change', 'assignment_change', 'gps_verification_failed', 'biometric_failed', 'offline_queued', 'offline_synced', 'attendance_override', 'auto_closed', 'checkout_reminder_sent', 'device_changed', 'duplicate_scan_ignored', 'remote_checkout', 'mock_location_detected', 'attendance_during_leave'
  @override
  final String? workMode;
  @override
  final String? lastKnownWorkLocation;
  @override
  final String? nfcTagId;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final String? notes;
  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  final String createdAt;

  @override
  String toString() {
    return 'AttendanceEvent(id: $id, attendanceId: $attendanceId, userId: $userId, eventTime: $eventTime, eventType: $eventType, workMode: $workMode, lastKnownWorkLocation: $lastKnownWorkLocation, nfcTagId: $nfcTagId, latitude: $latitude, longitude: $longitude, notes: $notes, metadata: $metadata, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceEventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.attendanceId, attendanceId) ||
                other.attendanceId == attendanceId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.eventTime, eventTime) ||
                other.eventTime == eventTime) &&
            (identical(other.eventType, eventType) ||
                other.eventType == eventType) &&
            (identical(other.workMode, workMode) ||
                other.workMode == workMode) &&
            (identical(other.lastKnownWorkLocation, lastKnownWorkLocation) ||
                other.lastKnownWorkLocation == lastKnownWorkLocation) &&
            (identical(other.nfcTagId, nfcTagId) ||
                other.nfcTagId == nfcTagId) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      attendanceId,
      userId,
      eventTime,
      eventType,
      workMode,
      lastKnownWorkLocation,
      nfcTagId,
      latitude,
      longitude,
      notes,
      const DeepCollectionEquality().hash(_metadata),
      createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceEventImplCopyWith<_$AttendanceEventImpl> get copyWith =>
      __$$AttendanceEventImplCopyWithImpl<_$AttendanceEventImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceEventImplToJson(
      this,
    );
  }
}

abstract class _AttendanceEvent implements AttendanceEvent {
  const factory _AttendanceEvent(
      {required final String id,
      required final String attendanceId,
      required final String userId,
      required final String eventTime,
      required final String eventType,
      final String? workMode,
      final String? lastKnownWorkLocation,
      final String? nfcTagId,
      final double? latitude,
      final double? longitude,
      final String? notes,
      final Map<String, dynamic>? metadata,
      required final String createdAt}) = _$AttendanceEventImpl;

  factory _AttendanceEvent.fromJson(Map<String, dynamic> json) =
      _$AttendanceEventImpl.fromJson;

  @override
  String get id;
  @override
  String get attendanceId;
  @override
  String get userId;
  @override
  String get eventTime;
  @override
  String get eventType;
  @override // 'check_in', 'check_out', 'work_mode_change', 'assignment_change', 'gps_verification_failed', 'biometric_failed', 'offline_queued', 'offline_synced', 'attendance_override', 'auto_closed', 'checkout_reminder_sent', 'device_changed', 'duplicate_scan_ignored', 'remote_checkout', 'mock_location_detected', 'attendance_during_leave'
  String? get workMode;
  @override
  String? get lastKnownWorkLocation;
  @override
  String? get nfcTagId;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  String? get notes;
  @override
  Map<String, dynamic>? get metadata;
  @override
  String get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$AttendanceEventImplCopyWith<_$AttendanceEventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
