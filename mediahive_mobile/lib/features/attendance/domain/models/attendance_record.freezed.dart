// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attendance_record.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AttendanceRecord _$AttendanceRecordFromJson(Map<String, dynamic> json) {
  return _AttendanceRecord.fromJson(json);
}

/// @nodoc
mixin _$AttendanceRecord {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get userName => throw _privateConstructorUsedError;
  String? get nfcTagId => throw _privateConstructorUsedError;
  String get checkInTime => throw _privateConstructorUsedError;
  String? get checkOutTime => throw _privateConstructorUsedError;
  String get checkInSource =>
      throw _privateConstructorUsedError; // 'nfc', 'qr', 'manual', 'admin_override'
  String? get checkOutSource => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get deviceId => throw _privateConstructorUsedError;
  String? get deviceName => throw _privateConstructorUsedError;
  String? get checkOutDeviceId => throw _privateConstructorUsedError;
  String? get checkOutDeviceName => throw _privateConstructorUsedError;
  String? get campusId => throw _privateConstructorUsedError;
  String? get campusName => throw _privateConstructorUsedError;
  bool get isHoliday => throw _privateConstructorUsedError;
  bool get isWeekend => throw _privateConstructorUsedError;
  String get attendanceState =>
      throw _privateConstructorUsedError; // 'active', 'closed'
  String get workMode =>
      throw _privateConstructorUsedError; // 'office', 'field', 'remote'
  String? get lastKnownWorkLocation => throw _privateConstructorUsedError;
  String? get assignmentId => throw _privateConstructorUsedError;
  String? get closeReason =>
      throw _privateConstructorUsedError; // 'Forgotten Checkout', etc.
  String get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AttendanceRecordCopyWith<AttendanceRecord> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceRecordCopyWith<$Res> {
  factory $AttendanceRecordCopyWith(
          AttendanceRecord value, $Res Function(AttendanceRecord) then) =
      _$AttendanceRecordCopyWithImpl<$Res, AttendanceRecord>;
  @useResult
  $Res call(
      {String id,
      String userId,
      String userName,
      String? nfcTagId,
      String checkInTime,
      String? checkOutTime,
      String checkInSource,
      String? checkOutSource,
      double? latitude,
      double? longitude,
      String? deviceId,
      String? deviceName,
      String? checkOutDeviceId,
      String? checkOutDeviceName,
      String? campusId,
      String? campusName,
      bool isHoliday,
      bool isWeekend,
      String attendanceState,
      String workMode,
      String? lastKnownWorkLocation,
      String? assignmentId,
      String? closeReason,
      String createdAt});
}

/// @nodoc
class _$AttendanceRecordCopyWithImpl<$Res, $Val extends AttendanceRecord>
    implements $AttendanceRecordCopyWith<$Res> {
  _$AttendanceRecordCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? nfcTagId = freezed,
    Object? checkInTime = null,
    Object? checkOutTime = freezed,
    Object? checkInSource = null,
    Object? checkOutSource = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? deviceId = freezed,
    Object? deviceName = freezed,
    Object? checkOutDeviceId = freezed,
    Object? checkOutDeviceName = freezed,
    Object? campusId = freezed,
    Object? campusName = freezed,
    Object? isHoliday = null,
    Object? isWeekend = null,
    Object? attendanceState = null,
    Object? workMode = null,
    Object? lastKnownWorkLocation = freezed,
    Object? assignmentId = freezed,
    Object? closeReason = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      userName: null == userName
          ? _value.userName
          : userName // ignore: cast_nullable_to_non_nullable
              as String,
      nfcTagId: freezed == nfcTagId
          ? _value.nfcTagId
          : nfcTagId // ignore: cast_nullable_to_non_nullable
              as String?,
      checkInTime: null == checkInTime
          ? _value.checkInTime
          : checkInTime // ignore: cast_nullable_to_non_nullable
              as String,
      checkOutTime: freezed == checkOutTime
          ? _value.checkOutTime
          : checkOutTime // ignore: cast_nullable_to_non_nullable
              as String?,
      checkInSource: null == checkInSource
          ? _value.checkInSource
          : checkInSource // ignore: cast_nullable_to_non_nullable
              as String,
      checkOutSource: freezed == checkOutSource
          ? _value.checkOutSource
          : checkOutSource // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      deviceId: freezed == deviceId
          ? _value.deviceId
          : deviceId // ignore: cast_nullable_to_non_nullable
              as String?,
      deviceName: freezed == deviceName
          ? _value.deviceName
          : deviceName // ignore: cast_nullable_to_non_nullable
              as String?,
      checkOutDeviceId: freezed == checkOutDeviceId
          ? _value.checkOutDeviceId
          : checkOutDeviceId // ignore: cast_nullable_to_non_nullable
              as String?,
      checkOutDeviceName: freezed == checkOutDeviceName
          ? _value.checkOutDeviceName
          : checkOutDeviceName // ignore: cast_nullable_to_non_nullable
              as String?,
      campusId: freezed == campusId
          ? _value.campusId
          : campusId // ignore: cast_nullable_to_non_nullable
              as String?,
      campusName: freezed == campusName
          ? _value.campusName
          : campusName // ignore: cast_nullable_to_non_nullable
              as String?,
      isHoliday: null == isHoliday
          ? _value.isHoliday
          : isHoliday // ignore: cast_nullable_to_non_nullable
              as bool,
      isWeekend: null == isWeekend
          ? _value.isWeekend
          : isWeekend // ignore: cast_nullable_to_non_nullable
              as bool,
      attendanceState: null == attendanceState
          ? _value.attendanceState
          : attendanceState // ignore: cast_nullable_to_non_nullable
              as String,
      workMode: null == workMode
          ? _value.workMode
          : workMode // ignore: cast_nullable_to_non_nullable
              as String,
      lastKnownWorkLocation: freezed == lastKnownWorkLocation
          ? _value.lastKnownWorkLocation
          : lastKnownWorkLocation // ignore: cast_nullable_to_non_nullable
              as String?,
      assignmentId: freezed == assignmentId
          ? _value.assignmentId
          : assignmentId // ignore: cast_nullable_to_non_nullable
              as String?,
      closeReason: freezed == closeReason
          ? _value.closeReason
          : closeReason // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceRecordImplCopyWith<$Res>
    implements $AttendanceRecordCopyWith<$Res> {
  factory _$$AttendanceRecordImplCopyWith(_$AttendanceRecordImpl value,
          $Res Function(_$AttendanceRecordImpl) then) =
      __$$AttendanceRecordImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String userId,
      String userName,
      String? nfcTagId,
      String checkInTime,
      String? checkOutTime,
      String checkInSource,
      String? checkOutSource,
      double? latitude,
      double? longitude,
      String? deviceId,
      String? deviceName,
      String? checkOutDeviceId,
      String? checkOutDeviceName,
      String? campusId,
      String? campusName,
      bool isHoliday,
      bool isWeekend,
      String attendanceState,
      String workMode,
      String? lastKnownWorkLocation,
      String? assignmentId,
      String? closeReason,
      String createdAt});
}

/// @nodoc
class __$$AttendanceRecordImplCopyWithImpl<$Res>
    extends _$AttendanceRecordCopyWithImpl<$Res, _$AttendanceRecordImpl>
    implements _$$AttendanceRecordImplCopyWith<$Res> {
  __$$AttendanceRecordImplCopyWithImpl(_$AttendanceRecordImpl _value,
      $Res Function(_$AttendanceRecordImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? nfcTagId = freezed,
    Object? checkInTime = null,
    Object? checkOutTime = freezed,
    Object? checkInSource = null,
    Object? checkOutSource = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? deviceId = freezed,
    Object? deviceName = freezed,
    Object? checkOutDeviceId = freezed,
    Object? checkOutDeviceName = freezed,
    Object? campusId = freezed,
    Object? campusName = freezed,
    Object? isHoliday = null,
    Object? isWeekend = null,
    Object? attendanceState = null,
    Object? workMode = null,
    Object? lastKnownWorkLocation = freezed,
    Object? assignmentId = freezed,
    Object? closeReason = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$AttendanceRecordImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      userName: null == userName
          ? _value.userName
          : userName // ignore: cast_nullable_to_non_nullable
              as String,
      nfcTagId: freezed == nfcTagId
          ? _value.nfcTagId
          : nfcTagId // ignore: cast_nullable_to_non_nullable
              as String?,
      checkInTime: null == checkInTime
          ? _value.checkInTime
          : checkInTime // ignore: cast_nullable_to_non_nullable
              as String,
      checkOutTime: freezed == checkOutTime
          ? _value.checkOutTime
          : checkOutTime // ignore: cast_nullable_to_non_nullable
              as String?,
      checkInSource: null == checkInSource
          ? _value.checkInSource
          : checkInSource // ignore: cast_nullable_to_non_nullable
              as String,
      checkOutSource: freezed == checkOutSource
          ? _value.checkOutSource
          : checkOutSource // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      deviceId: freezed == deviceId
          ? _value.deviceId
          : deviceId // ignore: cast_nullable_to_non_nullable
              as String?,
      deviceName: freezed == deviceName
          ? _value.deviceName
          : deviceName // ignore: cast_nullable_to_non_nullable
              as String?,
      checkOutDeviceId: freezed == checkOutDeviceId
          ? _value.checkOutDeviceId
          : checkOutDeviceId // ignore: cast_nullable_to_non_nullable
              as String?,
      checkOutDeviceName: freezed == checkOutDeviceName
          ? _value.checkOutDeviceName
          : checkOutDeviceName // ignore: cast_nullable_to_non_nullable
              as String?,
      campusId: freezed == campusId
          ? _value.campusId
          : campusId // ignore: cast_nullable_to_non_nullable
              as String?,
      campusName: freezed == campusName
          ? _value.campusName
          : campusName // ignore: cast_nullable_to_non_nullable
              as String?,
      isHoliday: null == isHoliday
          ? _value.isHoliday
          : isHoliday // ignore: cast_nullable_to_non_nullable
              as bool,
      isWeekend: null == isWeekend
          ? _value.isWeekend
          : isWeekend // ignore: cast_nullable_to_non_nullable
              as bool,
      attendanceState: null == attendanceState
          ? _value.attendanceState
          : attendanceState // ignore: cast_nullable_to_non_nullable
              as String,
      workMode: null == workMode
          ? _value.workMode
          : workMode // ignore: cast_nullable_to_non_nullable
              as String,
      lastKnownWorkLocation: freezed == lastKnownWorkLocation
          ? _value.lastKnownWorkLocation
          : lastKnownWorkLocation // ignore: cast_nullable_to_non_nullable
              as String?,
      assignmentId: freezed == assignmentId
          ? _value.assignmentId
          : assignmentId // ignore: cast_nullable_to_non_nullable
              as String?,
      closeReason: freezed == closeReason
          ? _value.closeReason
          : closeReason // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AttendanceRecordImpl extends _AttendanceRecord {
  const _$AttendanceRecordImpl(
      {required this.id,
      required this.userId,
      required this.userName,
      this.nfcTagId,
      required this.checkInTime,
      this.checkOutTime,
      this.checkInSource = 'nfc',
      this.checkOutSource,
      this.latitude,
      this.longitude,
      this.deviceId,
      this.deviceName,
      this.checkOutDeviceId,
      this.checkOutDeviceName,
      this.campusId,
      this.campusName,
      this.isHoliday = false,
      this.isWeekend = false,
      this.attendanceState = 'active',
      this.workMode = 'office',
      this.lastKnownWorkLocation,
      this.assignmentId,
      this.closeReason,
      required this.createdAt})
      : super._();

  factory _$AttendanceRecordImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceRecordImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String userName;
  @override
  final String? nfcTagId;
  @override
  final String checkInTime;
  @override
  final String? checkOutTime;
  @override
  @JsonKey()
  final String checkInSource;
// 'nfc', 'qr', 'manual', 'admin_override'
  @override
  final String? checkOutSource;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final String? deviceId;
  @override
  final String? deviceName;
  @override
  final String? checkOutDeviceId;
  @override
  final String? checkOutDeviceName;
  @override
  final String? campusId;
  @override
  final String? campusName;
  @override
  @JsonKey()
  final bool isHoliday;
  @override
  @JsonKey()
  final bool isWeekend;
  @override
  @JsonKey()
  final String attendanceState;
// 'active', 'closed'
  @override
  @JsonKey()
  final String workMode;
// 'office', 'field', 'remote'
  @override
  final String? lastKnownWorkLocation;
  @override
  final String? assignmentId;
  @override
  final String? closeReason;
// 'Forgotten Checkout', etc.
  @override
  final String createdAt;

  @override
  String toString() {
    return 'AttendanceRecord(id: $id, userId: $userId, userName: $userName, nfcTagId: $nfcTagId, checkInTime: $checkInTime, checkOutTime: $checkOutTime, checkInSource: $checkInSource, checkOutSource: $checkOutSource, latitude: $latitude, longitude: $longitude, deviceId: $deviceId, deviceName: $deviceName, checkOutDeviceId: $checkOutDeviceId, checkOutDeviceName: $checkOutDeviceName, campusId: $campusId, campusName: $campusName, isHoliday: $isHoliday, isWeekend: $isWeekend, attendanceState: $attendanceState, workMode: $workMode, lastKnownWorkLocation: $lastKnownWorkLocation, assignmentId: $assignmentId, closeReason: $closeReason, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceRecordImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.userName, userName) ||
                other.userName == userName) &&
            (identical(other.nfcTagId, nfcTagId) ||
                other.nfcTagId == nfcTagId) &&
            (identical(other.checkInTime, checkInTime) ||
                other.checkInTime == checkInTime) &&
            (identical(other.checkOutTime, checkOutTime) ||
                other.checkOutTime == checkOutTime) &&
            (identical(other.checkInSource, checkInSource) ||
                other.checkInSource == checkInSource) &&
            (identical(other.checkOutSource, checkOutSource) ||
                other.checkOutSource == checkOutSource) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.deviceId, deviceId) ||
                other.deviceId == deviceId) &&
            (identical(other.deviceName, deviceName) ||
                other.deviceName == deviceName) &&
            (identical(other.checkOutDeviceId, checkOutDeviceId) ||
                other.checkOutDeviceId == checkOutDeviceId) &&
            (identical(other.checkOutDeviceName, checkOutDeviceName) ||
                other.checkOutDeviceName == checkOutDeviceName) &&
            (identical(other.campusId, campusId) ||
                other.campusId == campusId) &&
            (identical(other.campusName, campusName) ||
                other.campusName == campusName) &&
            (identical(other.isHoliday, isHoliday) ||
                other.isHoliday == isHoliday) &&
            (identical(other.isWeekend, isWeekend) ||
                other.isWeekend == isWeekend) &&
            (identical(other.attendanceState, attendanceState) ||
                other.attendanceState == attendanceState) &&
            (identical(other.workMode, workMode) ||
                other.workMode == workMode) &&
            (identical(other.lastKnownWorkLocation, lastKnownWorkLocation) ||
                other.lastKnownWorkLocation == lastKnownWorkLocation) &&
            (identical(other.assignmentId, assignmentId) ||
                other.assignmentId == assignmentId) &&
            (identical(other.closeReason, closeReason) ||
                other.closeReason == closeReason) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        userId,
        userName,
        nfcTagId,
        checkInTime,
        checkOutTime,
        checkInSource,
        checkOutSource,
        latitude,
        longitude,
        deviceId,
        deviceName,
        checkOutDeviceId,
        checkOutDeviceName,
        campusId,
        campusName,
        isHoliday,
        isWeekend,
        attendanceState,
        workMode,
        lastKnownWorkLocation,
        assignmentId,
        closeReason,
        createdAt
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceRecordImplCopyWith<_$AttendanceRecordImpl> get copyWith =>
      __$$AttendanceRecordImplCopyWithImpl<_$AttendanceRecordImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceRecordImplToJson(
      this,
    );
  }
}

abstract class _AttendanceRecord extends AttendanceRecord {
  const factory _AttendanceRecord(
      {required final String id,
      required final String userId,
      required final String userName,
      final String? nfcTagId,
      required final String checkInTime,
      final String? checkOutTime,
      final String checkInSource,
      final String? checkOutSource,
      final double? latitude,
      final double? longitude,
      final String? deviceId,
      final String? deviceName,
      final String? checkOutDeviceId,
      final String? checkOutDeviceName,
      final String? campusId,
      final String? campusName,
      final bool isHoliday,
      final bool isWeekend,
      final String attendanceState,
      final String workMode,
      final String? lastKnownWorkLocation,
      final String? assignmentId,
      final String? closeReason,
      required final String createdAt}) = _$AttendanceRecordImpl;
  const _AttendanceRecord._() : super._();

  factory _AttendanceRecord.fromJson(Map<String, dynamic> json) =
      _$AttendanceRecordImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  String get userName;
  @override
  String? get nfcTagId;
  @override
  String get checkInTime;
  @override
  String? get checkOutTime;
  @override
  String get checkInSource;
  @override // 'nfc', 'qr', 'manual', 'admin_override'
  String? get checkOutSource;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  String? get deviceId;
  @override
  String? get deviceName;
  @override
  String? get checkOutDeviceId;
  @override
  String? get checkOutDeviceName;
  @override
  String? get campusId;
  @override
  String? get campusName;
  @override
  bool get isHoliday;
  @override
  bool get isWeekend;
  @override
  String get attendanceState;
  @override // 'active', 'closed'
  String get workMode;
  @override // 'office', 'field', 'remote'
  String? get lastKnownWorkLocation;
  @override
  String? get assignmentId;
  @override
  String? get closeReason;
  @override // 'Forgotten Checkout', etc.
  String get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$AttendanceRecordImplCopyWith<_$AttendanceRecordImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
