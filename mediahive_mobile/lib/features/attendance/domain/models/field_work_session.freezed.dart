// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'field_work_session.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

FieldWorkSession _$FieldWorkSessionFromJson(Map<String, dynamic> json) {
  return _FieldWorkSession.fromJson(json);
}

/// @nodoc
mixin _$FieldWorkSession {
  String get id => throw _privateConstructorUsedError;
  String get attendanceId => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String? get nfcTagId => throw _privateConstructorUsedError;
  String get startedAt => throw _privateConstructorUsedError;
  String? get endedAt => throw _privateConstructorUsedError;
  String? get returnTime =>
      throw _privateConstructorUsedError; // When member physically returned (distinct from endedAt)
  String? get reason => throw _privateConstructorUsedError;
  String get status =>
      throw _privateConstructorUsedError; // 'pending_approval', 'approved', 'active', 'rejected', 'completed', 'auto_approved', 'cancelled'
  String? get approvedBy => throw _privateConstructorUsedError;
  String? get approvedAt => throw _privateConstructorUsedError;
  String? get rejectionReason => throw _privateConstructorUsedError;
  String? get managerNotifiedAt => throw _privateConstructorUsedError;
  List<Map<String, dynamic>> get locationSnapshots =>
      throw _privateConstructorUsedError; // Periodic GPS during field work
  String get createdAt => throw _privateConstructorUsedError;
  String? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $FieldWorkSessionCopyWith<FieldWorkSession> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FieldWorkSessionCopyWith<$Res> {
  factory $FieldWorkSessionCopyWith(
          FieldWorkSession value, $Res Function(FieldWorkSession) then) =
      _$FieldWorkSessionCopyWithImpl<$Res, FieldWorkSession>;
  @useResult
  $Res call(
      {String id,
      String attendanceId,
      String userId,
      String? nfcTagId,
      String startedAt,
      String? endedAt,
      String? returnTime,
      String? reason,
      String status,
      String? approvedBy,
      String? approvedAt,
      String? rejectionReason,
      String? managerNotifiedAt,
      List<Map<String, dynamic>> locationSnapshots,
      String createdAt,
      String? updatedAt});
}

/// @nodoc
class _$FieldWorkSessionCopyWithImpl<$Res, $Val extends FieldWorkSession>
    implements $FieldWorkSessionCopyWith<$Res> {
  _$FieldWorkSessionCopyWithImpl(this._value, this._then);

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
    Object? nfcTagId = freezed,
    Object? startedAt = null,
    Object? endedAt = freezed,
    Object? returnTime = freezed,
    Object? reason = freezed,
    Object? status = null,
    Object? approvedBy = freezed,
    Object? approvedAt = freezed,
    Object? rejectionReason = freezed,
    Object? managerNotifiedAt = freezed,
    Object? locationSnapshots = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
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
      nfcTagId: freezed == nfcTagId
          ? _value.nfcTagId
          : nfcTagId // ignore: cast_nullable_to_non_nullable
              as String?,
      startedAt: null == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as String,
      endedAt: freezed == endedAt
          ? _value.endedAt
          : endedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      returnTime: freezed == returnTime
          ? _value.returnTime
          : returnTime // ignore: cast_nullable_to_non_nullable
              as String?,
      reason: freezed == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String?,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      approvedBy: freezed == approvedBy
          ? _value.approvedBy
          : approvedBy // ignore: cast_nullable_to_non_nullable
              as String?,
      approvedAt: freezed == approvedAt
          ? _value.approvedAt
          : approvedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      rejectionReason: freezed == rejectionReason
          ? _value.rejectionReason
          : rejectionReason // ignore: cast_nullable_to_non_nullable
              as String?,
      managerNotifiedAt: freezed == managerNotifiedAt
          ? _value.managerNotifiedAt
          : managerNotifiedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      locationSnapshots: null == locationSnapshots
          ? _value.locationSnapshots
          : locationSnapshots // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$FieldWorkSessionImplCopyWith<$Res>
    implements $FieldWorkSessionCopyWith<$Res> {
  factory _$$FieldWorkSessionImplCopyWith(_$FieldWorkSessionImpl value,
          $Res Function(_$FieldWorkSessionImpl) then) =
      __$$FieldWorkSessionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String attendanceId,
      String userId,
      String? nfcTagId,
      String startedAt,
      String? endedAt,
      String? returnTime,
      String? reason,
      String status,
      String? approvedBy,
      String? approvedAt,
      String? rejectionReason,
      String? managerNotifiedAt,
      List<Map<String, dynamic>> locationSnapshots,
      String createdAt,
      String? updatedAt});
}

/// @nodoc
class __$$FieldWorkSessionImplCopyWithImpl<$Res>
    extends _$FieldWorkSessionCopyWithImpl<$Res, _$FieldWorkSessionImpl>
    implements _$$FieldWorkSessionImplCopyWith<$Res> {
  __$$FieldWorkSessionImplCopyWithImpl(_$FieldWorkSessionImpl _value,
      $Res Function(_$FieldWorkSessionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? attendanceId = null,
    Object? userId = null,
    Object? nfcTagId = freezed,
    Object? startedAt = null,
    Object? endedAt = freezed,
    Object? returnTime = freezed,
    Object? reason = freezed,
    Object? status = null,
    Object? approvedBy = freezed,
    Object? approvedAt = freezed,
    Object? rejectionReason = freezed,
    Object? managerNotifiedAt = freezed,
    Object? locationSnapshots = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
  }) {
    return _then(_$FieldWorkSessionImpl(
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
      nfcTagId: freezed == nfcTagId
          ? _value.nfcTagId
          : nfcTagId // ignore: cast_nullable_to_non_nullable
              as String?,
      startedAt: null == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as String,
      endedAt: freezed == endedAt
          ? _value.endedAt
          : endedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      returnTime: freezed == returnTime
          ? _value.returnTime
          : returnTime // ignore: cast_nullable_to_non_nullable
              as String?,
      reason: freezed == reason
          ? _value.reason
          : reason // ignore: cast_nullable_to_non_nullable
              as String?,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      approvedBy: freezed == approvedBy
          ? _value.approvedBy
          : approvedBy // ignore: cast_nullable_to_non_nullable
              as String?,
      approvedAt: freezed == approvedAt
          ? _value.approvedAt
          : approvedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      rejectionReason: freezed == rejectionReason
          ? _value.rejectionReason
          : rejectionReason // ignore: cast_nullable_to_non_nullable
              as String?,
      managerNotifiedAt: freezed == managerNotifiedAt
          ? _value.managerNotifiedAt
          : managerNotifiedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      locationSnapshots: null == locationSnapshots
          ? _value._locationSnapshots
          : locationSnapshots // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$FieldWorkSessionImpl extends _FieldWorkSession {
  const _$FieldWorkSessionImpl(
      {required this.id,
      required this.attendanceId,
      required this.userId,
      this.nfcTagId,
      required this.startedAt,
      this.endedAt,
      this.returnTime,
      this.reason,
      this.status = 'pending_approval',
      this.approvedBy,
      this.approvedAt,
      this.rejectionReason,
      this.managerNotifiedAt,
      final List<Map<String, dynamic>> locationSnapshots = const [],
      required this.createdAt,
      this.updatedAt})
      : _locationSnapshots = locationSnapshots,
        super._();

  factory _$FieldWorkSessionImpl.fromJson(Map<String, dynamic> json) =>
      _$$FieldWorkSessionImplFromJson(json);

  @override
  final String id;
  @override
  final String attendanceId;
  @override
  final String userId;
  @override
  final String? nfcTagId;
  @override
  final String startedAt;
  @override
  final String? endedAt;
  @override
  final String? returnTime;
// When member physically returned (distinct from endedAt)
  @override
  final String? reason;
  @override
  @JsonKey()
  final String status;
// 'pending_approval', 'approved', 'active', 'rejected', 'completed', 'auto_approved', 'cancelled'
  @override
  final String? approvedBy;
  @override
  final String? approvedAt;
  @override
  final String? rejectionReason;
  @override
  final String? managerNotifiedAt;
  final List<Map<String, dynamic>> _locationSnapshots;
  @override
  @JsonKey()
  List<Map<String, dynamic>> get locationSnapshots {
    if (_locationSnapshots is EqualUnmodifiableListView)
      return _locationSnapshots;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_locationSnapshots);
  }

// Periodic GPS during field work
  @override
  final String createdAt;
  @override
  final String? updatedAt;

  @override
  String toString() {
    return 'FieldWorkSession(id: $id, attendanceId: $attendanceId, userId: $userId, nfcTagId: $nfcTagId, startedAt: $startedAt, endedAt: $endedAt, returnTime: $returnTime, reason: $reason, status: $status, approvedBy: $approvedBy, approvedAt: $approvedAt, rejectionReason: $rejectionReason, managerNotifiedAt: $managerNotifiedAt, locationSnapshots: $locationSnapshots, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FieldWorkSessionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.attendanceId, attendanceId) ||
                other.attendanceId == attendanceId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.nfcTagId, nfcTagId) ||
                other.nfcTagId == nfcTagId) &&
            (identical(other.startedAt, startedAt) ||
                other.startedAt == startedAt) &&
            (identical(other.endedAt, endedAt) || other.endedAt == endedAt) &&
            (identical(other.returnTime, returnTime) ||
                other.returnTime == returnTime) &&
            (identical(other.reason, reason) || other.reason == reason) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.approvedBy, approvedBy) ||
                other.approvedBy == approvedBy) &&
            (identical(other.approvedAt, approvedAt) ||
                other.approvedAt == approvedAt) &&
            (identical(other.rejectionReason, rejectionReason) ||
                other.rejectionReason == rejectionReason) &&
            (identical(other.managerNotifiedAt, managerNotifiedAt) ||
                other.managerNotifiedAt == managerNotifiedAt) &&
            const DeepCollectionEquality()
                .equals(other._locationSnapshots, _locationSnapshots) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      attendanceId,
      userId,
      nfcTagId,
      startedAt,
      endedAt,
      returnTime,
      reason,
      status,
      approvedBy,
      approvedAt,
      rejectionReason,
      managerNotifiedAt,
      const DeepCollectionEquality().hash(_locationSnapshots),
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$FieldWorkSessionImplCopyWith<_$FieldWorkSessionImpl> get copyWith =>
      __$$FieldWorkSessionImplCopyWithImpl<_$FieldWorkSessionImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$FieldWorkSessionImplToJson(
      this,
    );
  }
}

abstract class _FieldWorkSession extends FieldWorkSession {
  const factory _FieldWorkSession(
      {required final String id,
      required final String attendanceId,
      required final String userId,
      final String? nfcTagId,
      required final String startedAt,
      final String? endedAt,
      final String? returnTime,
      final String? reason,
      final String status,
      final String? approvedBy,
      final String? approvedAt,
      final String? rejectionReason,
      final String? managerNotifiedAt,
      final List<Map<String, dynamic>> locationSnapshots,
      required final String createdAt,
      final String? updatedAt}) = _$FieldWorkSessionImpl;
  const _FieldWorkSession._() : super._();

  factory _FieldWorkSession.fromJson(Map<String, dynamic> json) =
      _$FieldWorkSessionImpl.fromJson;

  @override
  String get id;
  @override
  String get attendanceId;
  @override
  String get userId;
  @override
  String? get nfcTagId;
  @override
  String get startedAt;
  @override
  String? get endedAt;
  @override
  String? get returnTime;
  @override // When member physically returned (distinct from endedAt)
  String? get reason;
  @override
  String get status;
  @override // 'pending_approval', 'approved', 'active', 'rejected', 'completed', 'auto_approved', 'cancelled'
  String? get approvedBy;
  @override
  String? get approvedAt;
  @override
  String? get rejectionReason;
  @override
  String? get managerNotifiedAt;
  @override
  List<Map<String, dynamic>> get locationSnapshots;
  @override // Periodic GPS during field work
  String get createdAt;
  @override
  String? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$FieldWorkSessionImplCopyWith<_$FieldWorkSessionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
