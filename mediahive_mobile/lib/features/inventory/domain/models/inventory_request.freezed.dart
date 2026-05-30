// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'inventory_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

InventoryRequest _$InventoryRequestFromJson(Map<String, dynamic> json) {
  return _InventoryRequest.fromJson(json);
}

/// @nodoc
mixin _$InventoryRequest {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'tenant_id')
  String get tenantId => throw _privateConstructorUsedError;
  @JsonKey(name: 'user_id')
  String get userId => throw _privateConstructorUsedError;
  @JsonKey(name: 'institution_id')
  String get institutionId => throw _privateConstructorUsedError;
  @JsonKey(name: 'item_name')
  String get itemName => throw _privateConstructorUsedError;
  int get quantity => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get notes => throw _privateConstructorUsedError;
  @JsonKey(name: 'reject_reason')
  String? get rejectReason => throw _privateConstructorUsedError;
  @JsonKey(name: 'issue_id')
  String? get issueId => throw _privateConstructorUsedError;
  @JsonKey(name: 'created_at')
  DateTime get createdAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'updated_at')
  DateTime? get updatedAt => throw _privateConstructorUsedError; // Joined data
  @JsonKey(name: 'requester_name')
  String? get requesterName => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $InventoryRequestCopyWith<InventoryRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InventoryRequestCopyWith<$Res> {
  factory $InventoryRequestCopyWith(
          InventoryRequest value, $Res Function(InventoryRequest) then) =
      _$InventoryRequestCopyWithImpl<$Res, InventoryRequest>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'tenant_id') String tenantId,
      @JsonKey(name: 'user_id') String userId,
      @JsonKey(name: 'institution_id') String institutionId,
      @JsonKey(name: 'item_name') String itemName,
      int quantity,
      String status,
      String? notes,
      @JsonKey(name: 'reject_reason') String? rejectReason,
      @JsonKey(name: 'issue_id') String? issueId,
      @JsonKey(name: 'created_at') DateTime createdAt,
      @JsonKey(name: 'updated_at') DateTime? updatedAt,
      @JsonKey(name: 'requester_name') String? requesterName});
}

/// @nodoc
class _$InventoryRequestCopyWithImpl<$Res, $Val extends InventoryRequest>
    implements $InventoryRequestCopyWith<$Res> {
  _$InventoryRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tenantId = null,
    Object? userId = null,
    Object? institutionId = null,
    Object? itemName = null,
    Object? quantity = null,
    Object? status = null,
    Object? notes = freezed,
    Object? rejectReason = freezed,
    Object? issueId = freezed,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? requesterName = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      tenantId: null == tenantId
          ? _value.tenantId
          : tenantId // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      institutionId: null == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String,
      itemName: null == itemName
          ? _value.itemName
          : itemName // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      rejectReason: freezed == rejectReason
          ? _value.rejectReason
          : rejectReason // ignore: cast_nullable_to_non_nullable
              as String?,
      issueId: freezed == issueId
          ? _value.issueId
          : issueId // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      requesterName: freezed == requesterName
          ? _value.requesterName
          : requesterName // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InventoryRequestImplCopyWith<$Res>
    implements $InventoryRequestCopyWith<$Res> {
  factory _$$InventoryRequestImplCopyWith(_$InventoryRequestImpl value,
          $Res Function(_$InventoryRequestImpl) then) =
      __$$InventoryRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'tenant_id') String tenantId,
      @JsonKey(name: 'user_id') String userId,
      @JsonKey(name: 'institution_id') String institutionId,
      @JsonKey(name: 'item_name') String itemName,
      int quantity,
      String status,
      String? notes,
      @JsonKey(name: 'reject_reason') String? rejectReason,
      @JsonKey(name: 'issue_id') String? issueId,
      @JsonKey(name: 'created_at') DateTime createdAt,
      @JsonKey(name: 'updated_at') DateTime? updatedAt,
      @JsonKey(name: 'requester_name') String? requesterName});
}

/// @nodoc
class __$$InventoryRequestImplCopyWithImpl<$Res>
    extends _$InventoryRequestCopyWithImpl<$Res, _$InventoryRequestImpl>
    implements _$$InventoryRequestImplCopyWith<$Res> {
  __$$InventoryRequestImplCopyWithImpl(_$InventoryRequestImpl _value,
      $Res Function(_$InventoryRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tenantId = null,
    Object? userId = null,
    Object? institutionId = null,
    Object? itemName = null,
    Object? quantity = null,
    Object? status = null,
    Object? notes = freezed,
    Object? rejectReason = freezed,
    Object? issueId = freezed,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? requesterName = freezed,
  }) {
    return _then(_$InventoryRequestImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      tenantId: null == tenantId
          ? _value.tenantId
          : tenantId // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      institutionId: null == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String,
      itemName: null == itemName
          ? _value.itemName
          : itemName // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      rejectReason: freezed == rejectReason
          ? _value.rejectReason
          : rejectReason // ignore: cast_nullable_to_non_nullable
              as String?,
      issueId: freezed == issueId
          ? _value.issueId
          : issueId // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      requesterName: freezed == requesterName
          ? _value.requesterName
          : requesterName // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InventoryRequestImpl implements _InventoryRequest {
  const _$InventoryRequestImpl(
      {required this.id,
      @JsonKey(name: 'tenant_id') required this.tenantId,
      @JsonKey(name: 'user_id') required this.userId,
      @JsonKey(name: 'institution_id') required this.institutionId,
      @JsonKey(name: 'item_name') required this.itemName,
      required this.quantity,
      required this.status,
      this.notes,
      @JsonKey(name: 'reject_reason') this.rejectReason,
      @JsonKey(name: 'issue_id') this.issueId,
      @JsonKey(name: 'created_at') required this.createdAt,
      @JsonKey(name: 'updated_at') this.updatedAt,
      @JsonKey(name: 'requester_name') this.requesterName});

  factory _$InventoryRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$InventoryRequestImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'tenant_id')
  final String tenantId;
  @override
  @JsonKey(name: 'user_id')
  final String userId;
  @override
  @JsonKey(name: 'institution_id')
  final String institutionId;
  @override
  @JsonKey(name: 'item_name')
  final String itemName;
  @override
  final int quantity;
  @override
  final String status;
  @override
  final String? notes;
  @override
  @JsonKey(name: 'reject_reason')
  final String? rejectReason;
  @override
  @JsonKey(name: 'issue_id')
  final String? issueId;
  @override
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @override
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;
// Joined data
  @override
  @JsonKey(name: 'requester_name')
  final String? requesterName;

  @override
  String toString() {
    return 'InventoryRequest(id: $id, tenantId: $tenantId, userId: $userId, institutionId: $institutionId, itemName: $itemName, quantity: $quantity, status: $status, notes: $notes, rejectReason: $rejectReason, issueId: $issueId, createdAt: $createdAt, updatedAt: $updatedAt, requesterName: $requesterName)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InventoryRequestImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.tenantId, tenantId) ||
                other.tenantId == tenantId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.institutionId, institutionId) ||
                other.institutionId == institutionId) &&
            (identical(other.itemName, itemName) ||
                other.itemName == itemName) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            (identical(other.rejectReason, rejectReason) ||
                other.rejectReason == rejectReason) &&
            (identical(other.issueId, issueId) || other.issueId == issueId) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.requesterName, requesterName) ||
                other.requesterName == requesterName));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      tenantId,
      userId,
      institutionId,
      itemName,
      quantity,
      status,
      notes,
      rejectReason,
      issueId,
      createdAt,
      updatedAt,
      requesterName);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$InventoryRequestImplCopyWith<_$InventoryRequestImpl> get copyWith =>
      __$$InventoryRequestImplCopyWithImpl<_$InventoryRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InventoryRequestImplToJson(
      this,
    );
  }
}

abstract class _InventoryRequest implements InventoryRequest {
  const factory _InventoryRequest(
          {required final String id,
          @JsonKey(name: 'tenant_id') required final String tenantId,
          @JsonKey(name: 'user_id') required final String userId,
          @JsonKey(name: 'institution_id') required final String institutionId,
          @JsonKey(name: 'item_name') required final String itemName,
          required final int quantity,
          required final String status,
          final String? notes,
          @JsonKey(name: 'reject_reason') final String? rejectReason,
          @JsonKey(name: 'issue_id') final String? issueId,
          @JsonKey(name: 'created_at') required final DateTime createdAt,
          @JsonKey(name: 'updated_at') final DateTime? updatedAt,
          @JsonKey(name: 'requester_name') final String? requesterName}) =
      _$InventoryRequestImpl;

  factory _InventoryRequest.fromJson(Map<String, dynamic> json) =
      _$InventoryRequestImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'tenant_id')
  String get tenantId;
  @override
  @JsonKey(name: 'user_id')
  String get userId;
  @override
  @JsonKey(name: 'institution_id')
  String get institutionId;
  @override
  @JsonKey(name: 'item_name')
  String get itemName;
  @override
  int get quantity;
  @override
  String get status;
  @override
  String? get notes;
  @override
  @JsonKey(name: 'reject_reason')
  String? get rejectReason;
  @override
  @JsonKey(name: 'issue_id')
  String? get issueId;
  @override
  @JsonKey(name: 'created_at')
  DateTime get createdAt;
  @override
  @JsonKey(name: 'updated_at')
  DateTime? get updatedAt;
  @override // Joined data
  @JsonKey(name: 'requester_name')
  String? get requesterName;
  @override
  @JsonKey(ignore: true)
  _$$InventoryRequestImplCopyWith<_$InventoryRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
