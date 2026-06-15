// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attendance_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AttendanceRequest _$AttendanceRequestFromJson(Map<String, dynamic> json) {
  return _AttendanceRequest.fromJson(json);
}

/// @nodoc
mixin _$AttendanceRequest {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get userName => throw _privateConstructorUsedError;
  String get requestType =>
      throw _privateConstructorUsedError; // 'missed_checkin', 'remote_checkout'
  String get status =>
      throw _privateConstructorUsedError; // 'pending', 'approved', 'rejected', 'expired'
  String get requestedTime => throw _privateConstructorUsedError;
  String get reason => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  String? get assignmentId => throw _privateConstructorUsedError;
  String? get attendanceId => throw _privateConstructorUsedError;
  String? get adminUserId => throw _privateConstructorUsedError;
  String? get adminNotes => throw _privateConstructorUsedError;
  String? get resolvedAt => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AttendanceRequestCopyWith<AttendanceRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceRequestCopyWith<$Res> {
  factory $AttendanceRequestCopyWith(
          AttendanceRequest value, $Res Function(AttendanceRequest) then) =
      _$AttendanceRequestCopyWithImpl<$Res, AttendanceRequest>;
  @useResult
  $Res call(
      {String id,
      String userId,
      String userName,
      String requestType,
      String status,
      String requestedTime,
      String reason,
      double? latitude,
      double? longitude,
      String? assignmentId,
      String? attendanceId,
      String? adminUserId,
      String? adminNotes,
      String? resolvedAt,
      String createdAt});
}

/// @nodoc
class _$AttendanceRequestCopyWithImpl<$Res, $Val extends AttendanceRequest>
    implements $AttendanceRequestCopyWith<$Res> {
  _$AttendanceRequestCopyWithImpl(this._value, this._then);

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
    Object? requestType = null,
    Object? status = null,
    Object? requestedTime = null,
    Object? reason = null,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? assignmentId = freezed,
    Object? attendanceId = freezed,
    Object? adminUserId = freezed,
    Object? adminNotes = freezed,
    Object? resolvedAt = freezed,
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
      requestType: null == requestType
          ? _value.requestType
          : requestType // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      requestedTime: null == requestedTime
          ? _value.requestedTime
          : requestedTime // ignore: cast_nullable_to_non_nullable
              as String,
      reason: null == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      assignmentId: freezed == assignmentId
          ? _value.assignmentId
          : assignmentId // ignore: cast_nullable_to_non_nullable
              as String?,
      attendanceId: freezed == attendanceId
          ? _value.attendanceId
          : attendanceId // ignore: cast_nullable_to_non_nullable
              as String?,
      adminUserId: freezed == adminUserId
          ? _value.adminUserId
          : adminUserId // ignore: cast_nullable_to_non_nullable
              as String?,
      adminNotes: freezed == adminNotes
          ? _value.adminNotes
          : adminNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      resolvedAt: freezed == resolvedAt
          ? _value.resolvedAt
          : resolvedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceRequestImplCopyWith<$Res>
    implements $AttendanceRequestCopyWith<$Res> {
  factory _$$AttendanceRequestImplCopyWith(_$AttendanceRequestImpl value,
          $Res Function(_$AttendanceRequestImpl) then) =
      __$$AttendanceRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String userId,
      String userName,
      String requestType,
      String status,
      String requestedTime,
      String reason,
      double? latitude,
      double? longitude,
      String? assignmentId,
      String? attendanceId,
      String? adminUserId,
      String? adminNotes,
      String? resolvedAt,
      String createdAt});
}

/// @nodoc
class __$$AttendanceRequestImplCopyWithImpl<$Res>
    extends _$AttendanceRequestCopyWithImpl<$Res, _$AttendanceRequestImpl>
    implements _$$AttendanceRequestImplCopyWith<$Res> {
  __$$AttendanceRequestImplCopyWithImpl(_$AttendanceRequestImpl _value,
      $Res Function(_$AttendanceRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? userName = null,
    Object? requestType = null,
    Object? status = null,
    Object? requestedTime = null,
    Object? reason = null,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? assignmentId = freezed,
    Object? attendanceId = freezed,
    Object? adminUserId = freezed,
    Object? adminNotes = freezed,
    Object? resolvedAt = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$AttendanceRequestImpl(
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
      requestType: null == requestType
          ? _value.requestType
          : requestType // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      requestedTime: null == requestedTime
          ? _value.requestedTime
          : requestedTime // ignore: cast_nullable_to_non_nullable
              as String,
      reason: null == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      assignmentId: freezed == assignmentId
          ? _value.assignmentId
          : assignmentId // ignore: cast_nullable_to_non_nullable
              as String?,
      attendanceId: freezed == attendanceId
          ? _value.attendanceId
          : attendanceId // ignore: cast_nullable_to_non_nullable
              as String?,
      adminUserId: freezed == adminUserId
          ? _value.adminUserId
          : adminUserId // ignore: cast_nullable_to_non_nullable
              as String?,
      adminNotes: freezed == adminNotes
          ? _value.adminNotes
          : adminNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      resolvedAt: freezed == resolvedAt
          ? _value.resolvedAt
          : resolvedAt // ignore: cast_nullable_to_non_nullable
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
class _$AttendanceRequestImpl extends _AttendanceRequest {
  const _$AttendanceRequestImpl(
      {required this.id,
      required this.userId,
      required this.userName,
      required this.requestType,
      this.status = 'pending',
      required this.requestedTime,
      required this.reason,
      this.latitude,
      this.longitude,
      this.assignmentId,
      this.attendanceId,
      this.adminUserId,
      this.adminNotes,
      this.resolvedAt,
      required this.createdAt})
      : super._();

  factory _$AttendanceRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceRequestImplFromJson(json);

  @override
  final String id;
  @override
  final String userId;
  @override
  final String userName;
  @override
  final String requestType;
// 'missed_checkin', 'remote_checkout'
  @override
  @JsonKey()
  final String status;
// 'pending', 'approved', 'rejected', 'expired'
  @override
  final String requestedTime;
  @override
  final String reason;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final String? assignmentId;
  @override
  final String? attendanceId;
  @override
  final String? adminUserId;
  @override
  final String? adminNotes;
  @override
  final String? resolvedAt;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'AttendanceRequest(id: $id, userId: $userId, userName: $userName, requestType: $requestType, status: $status, requestedTime: $requestedTime, reason: $reason, latitude: $latitude, longitude: $longitude, assignmentId: $assignmentId, attendanceId: $attendanceId, adminUserId: $adminUserId, adminNotes: $adminNotes, resolvedAt: $resolvedAt, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceRequestImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.userName, userName) ||
                other.userName == userName) &&
            (identical(other.requestType, requestType) ||
                other.requestType == requestType) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.requestedTime, requestedTime) ||
                other.requestedTime == requestedTime) &&
            (identical(other.reason, reason) || other.reason == reason) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.assignmentId, assignmentId) ||
                other.assignmentId == assignmentId) &&
            (identical(other.attendanceId, attendanceId) ||
                other.attendanceId == attendanceId) &&
            (identical(other.adminUserId, adminUserId) ||
                other.adminUserId == adminUserId) &&
            (identical(other.adminNotes, adminNotes) ||
                other.adminNotes == adminNotes) &&
            (identical(other.resolvedAt, resolvedAt) ||
                other.resolvedAt == resolvedAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      userId,
      userName,
      requestType,
      status,
      requestedTime,
      reason,
      latitude,
      longitude,
      assignmentId,
      attendanceId,
      adminUserId,
      adminNotes,
      resolvedAt,
      createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceRequestImplCopyWith<_$AttendanceRequestImpl> get copyWith =>
      __$$AttendanceRequestImplCopyWithImpl<_$AttendanceRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceRequestImplToJson(
      this,
    );
  }
}

abstract class _AttendanceRequest extends AttendanceRequest {
  const factory _AttendanceRequest(
      {required final String id,
      required final String userId,
      required final String userName,
      required final String requestType,
      final String status,
      required final String requestedTime,
      required final String reason,
      final double? latitude,
      final double? longitude,
      final String? assignmentId,
      final String? attendanceId,
      final String? adminUserId,
      final String? adminNotes,
      final String? resolvedAt,
      required final String createdAt}) = _$AttendanceRequestImpl;
  const _AttendanceRequest._() : super._();

  factory _AttendanceRequest.fromJson(Map<String, dynamic> json) =
      _$AttendanceRequestImpl.fromJson;

  @override
  String get id;
  @override
  String get userId;
  @override
  String get userName;
  @override
  String get requestType;
  @override // 'missed_checkin', 'remote_checkout'
  String get status;
  @override // 'pending', 'approved', 'rejected', 'expired'
  String get requestedTime;
  @override
  String get reason;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  String? get assignmentId;
  @override
  String? get attendanceId;
  @override
  String? get adminUserId;
  @override
  String? get adminNotes;
  @override
  String? get resolvedAt;
  @override
  String get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$AttendanceRequestImplCopyWith<_$AttendanceRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
