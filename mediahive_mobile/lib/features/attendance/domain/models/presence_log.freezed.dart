// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'presence_log.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

PresenceLog _$PresenceLogFromJson(Map<String, dynamic> json) {
  return _PresenceLog.fromJson(json);
}

/// @nodoc
mixin _$PresenceLog {
  String get id => throw _privateConstructorUsedError;
  String get attendanceId => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  double get latitude => throw _privateConstructorUsedError;
  double get longitude => throw _privateConstructorUsedError;
  double? get accuracy => throw _privateConstructorUsedError;
  bool get isWithinGeofence => throw _privateConstructorUsedError;
  bool get isMockLocation => throw _privateConstructorUsedError;
  String? get wifiSsid => throw _privateConstructorUsedError;
  String get verificationMethod =>
      throw _privateConstructorUsedError; // 'gps', 'wifi', 'geofence', 'hybrid', 'failed'
  double? get distanceFromOffice => throw _privateConstructorUsedError;
  String get networkState =>
      throw _privateConstructorUsedError; // 'online', 'offline', 'weak'
  int? get batteryLevel => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PresenceLogCopyWith<PresenceLog> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PresenceLogCopyWith<$Res> {
  factory $PresenceLogCopyWith(
          PresenceLog value, $Res Function(PresenceLog) then) =
      _$PresenceLogCopyWithImpl<$Res, PresenceLog>;
  @useResult
  $Res call(
      {String id,
      String attendanceId,
      String userId,
      double latitude,
      double longitude,
      double? accuracy,
      bool isWithinGeofence,
      bool isMockLocation,
      String? wifiSsid,
      String verificationMethod,
      double? distanceFromOffice,
      String networkState,
      int? batteryLevel,
      String createdAt});
}

/// @nodoc
class _$PresenceLogCopyWithImpl<$Res, $Val extends PresenceLog>
    implements $PresenceLogCopyWith<$Res> {
  _$PresenceLogCopyWithImpl(this._value, this._then);

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
    Object? latitude = null,
    Object? longitude = null,
    Object? accuracy = freezed,
    Object? isWithinGeofence = null,
    Object? isMockLocation = null,
    Object? wifiSsid = freezed,
    Object? verificationMethod = null,
    Object? distanceFromOffice = freezed,
    Object? networkState = null,
    Object? batteryLevel = freezed,
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
      latitude: null == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double,
      longitude: null == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double,
      accuracy: freezed == accuracy
          ? _value.accuracy
          : accuracy // ignore: cast_nullable_to_non_nullable
              as double?,
      isWithinGeofence: null == isWithinGeofence
          ? _value.isWithinGeofence
          : isWithinGeofence // ignore: cast_nullable_to_non_nullable
              as bool,
      isMockLocation: null == isMockLocation
          ? _value.isMockLocation
          : isMockLocation // ignore: cast_nullable_to_non_nullable
              as bool,
      wifiSsid: freezed == wifiSsid
          ? _value.wifiSsid
          : wifiSsid // ignore: cast_nullable_to_non_nullable
              as String?,
      verificationMethod: null == verificationMethod
          ? _value.verificationMethod
          : verificationMethod // ignore: cast_nullable_to_non_nullable
              as String,
      distanceFromOffice: freezed == distanceFromOffice
          ? _value.distanceFromOffice
          : distanceFromOffice // ignore: cast_nullable_to_non_nullable
              as double?,
      networkState: null == networkState
          ? _value.networkState
          : networkState // ignore: cast_nullable_to_non_nullable
              as String,
      batteryLevel: freezed == batteryLevel
          ? _value.batteryLevel
          : batteryLevel // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PresenceLogImplCopyWith<$Res>
    implements $PresenceLogCopyWith<$Res> {
  factory _$$PresenceLogImplCopyWith(
          _$PresenceLogImpl value, $Res Function(_$PresenceLogImpl) then) =
      __$$PresenceLogImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String attendanceId,
      String userId,
      double latitude,
      double longitude,
      double? accuracy,
      bool isWithinGeofence,
      bool isMockLocation,
      String? wifiSsid,
      String verificationMethod,
      double? distanceFromOffice,
      String networkState,
      int? batteryLevel,
      String createdAt});
}

/// @nodoc
class __$$PresenceLogImplCopyWithImpl<$Res>
    extends _$PresenceLogCopyWithImpl<$Res, _$PresenceLogImpl>
    implements _$$PresenceLogImplCopyWith<$Res> {
  __$$PresenceLogImplCopyWithImpl(
      _$PresenceLogImpl _value, $Res Function(_$PresenceLogImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? attendanceId = null,
    Object? userId = null,
    Object? latitude = null,
    Object? longitude = null,
    Object? accuracy = freezed,
    Object? isWithinGeofence = null,
    Object? isMockLocation = null,
    Object? wifiSsid = freezed,
    Object? verificationMethod = null,
    Object? distanceFromOffice = freezed,
    Object? networkState = null,
    Object? batteryLevel = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$PresenceLogImpl(
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
      latitude: null == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double,
      longitude: null == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double,
      accuracy: freezed == accuracy
          ? _value.accuracy
          : accuracy // ignore: cast_nullable_to_non_nullable
              as double?,
      isWithinGeofence: null == isWithinGeofence
          ? _value.isWithinGeofence
          : isWithinGeofence // ignore: cast_nullable_to_non_nullable
              as bool,
      isMockLocation: null == isMockLocation
          ? _value.isMockLocation
          : isMockLocation // ignore: cast_nullable_to_non_nullable
              as bool,
      wifiSsid: freezed == wifiSsid
          ? _value.wifiSsid
          : wifiSsid // ignore: cast_nullable_to_non_nullable
              as String?,
      verificationMethod: null == verificationMethod
          ? _value.verificationMethod
          : verificationMethod // ignore: cast_nullable_to_non_nullable
              as String,
      distanceFromOffice: freezed == distanceFromOffice
          ? _value.distanceFromOffice
          : distanceFromOffice // ignore: cast_nullable_to_non_nullable
              as double?,
      networkState: null == networkState
          ? _value.networkState
          : networkState // ignore: cast_nullable_to_non_nullable
              as String,
      batteryLevel: freezed == batteryLevel
          ? _value.batteryLevel
          : batteryLevel // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PresenceLogImpl implements _PresenceLog {
  const _$PresenceLogImpl(
      {required this.id,
      required this.attendanceId,
      required this.userId,
      required this.latitude,
      required this.longitude,
      this.accuracy,
      this.isWithinGeofence = true,
      this.isMockLocation = false,
      this.wifiSsid,
      this.verificationMethod = 'gps',
      this.distanceFromOffice,
      this.networkState = 'online',
      this.batteryLevel,
      required this.createdAt});

  factory _$PresenceLogImpl.fromJson(Map<String, dynamic> json) =>
      _$$PresenceLogImplFromJson(json);

  @override
  final String id;
  @override
  final String attendanceId;
  @override
  final String userId;
  @override
  final double latitude;
  @override
  final double longitude;
  @override
  final double? accuracy;
  @override
  @JsonKey()
  final bool isWithinGeofence;
  @override
  @JsonKey()
  final bool isMockLocation;
  @override
  final String? wifiSsid;
  @override
  @JsonKey()
  final String verificationMethod;
// 'gps', 'wifi', 'geofence', 'hybrid', 'failed'
  @override
  final double? distanceFromOffice;
  @override
  @JsonKey()
  final String networkState;
// 'online', 'offline', 'weak'
  @override
  final int? batteryLevel;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'PresenceLog(id: $id, attendanceId: $attendanceId, userId: $userId, latitude: $latitude, longitude: $longitude, accuracy: $accuracy, isWithinGeofence: $isWithinGeofence, isMockLocation: $isMockLocation, wifiSsid: $wifiSsid, verificationMethod: $verificationMethod, distanceFromOffice: $distanceFromOffice, networkState: $networkState, batteryLevel: $batteryLevel, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PresenceLogImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.attendanceId, attendanceId) ||
                other.attendanceId == attendanceId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.accuracy, accuracy) ||
                other.accuracy == accuracy) &&
            (identical(other.isWithinGeofence, isWithinGeofence) ||
                other.isWithinGeofence == isWithinGeofence) &&
            (identical(other.isMockLocation, isMockLocation) ||
                other.isMockLocation == isMockLocation) &&
            (identical(other.wifiSsid, wifiSsid) ||
                other.wifiSsid == wifiSsid) &&
            (identical(other.verificationMethod, verificationMethod) ||
                other.verificationMethod == verificationMethod) &&
            (identical(other.distanceFromOffice, distanceFromOffice) ||
                other.distanceFromOffice == distanceFromOffice) &&
            (identical(other.networkState, networkState) ||
                other.networkState == networkState) &&
            (identical(other.batteryLevel, batteryLevel) ||
                other.batteryLevel == batteryLevel) &&
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
      latitude,
      longitude,
      accuracy,
      isWithinGeofence,
      isMockLocation,
      wifiSsid,
      verificationMethod,
      distanceFromOffice,
      networkState,
      batteryLevel,
      createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PresenceLogImplCopyWith<_$PresenceLogImpl> get copyWith =>
      __$$PresenceLogImplCopyWithImpl<_$PresenceLogImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PresenceLogImplToJson(
      this,
    );
  }
}

abstract class _PresenceLog implements PresenceLog {
  const factory _PresenceLog(
      {required final String id,
      required final String attendanceId,
      required final String userId,
      required final double latitude,
      required final double longitude,
      final double? accuracy,
      final bool isWithinGeofence,
      final bool isMockLocation,
      final String? wifiSsid,
      final String verificationMethod,
      final double? distanceFromOffice,
      final String networkState,
      final int? batteryLevel,
      required final String createdAt}) = _$PresenceLogImpl;

  factory _PresenceLog.fromJson(Map<String, dynamic> json) =
      _$PresenceLogImpl.fromJson;

  @override
  String get id;
  @override
  String get attendanceId;
  @override
  String get userId;
  @override
  double get latitude;
  @override
  double get longitude;
  @override
  double? get accuracy;
  @override
  bool get isWithinGeofence;
  @override
  bool get isMockLocation;
  @override
  String? get wifiSsid;
  @override
  String get verificationMethod;
  @override // 'gps', 'wifi', 'geofence', 'hybrid', 'failed'
  double? get distanceFromOffice;
  @override
  String get networkState;
  @override // 'online', 'offline', 'weak'
  int? get batteryLevel;
  @override
  String get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$PresenceLogImplCopyWith<_$PresenceLogImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
