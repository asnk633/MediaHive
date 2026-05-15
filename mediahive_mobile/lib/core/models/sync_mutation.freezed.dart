// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'sync_mutation.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

SyncMutation _$SyncMutationFromJson(Map<String, dynamic> json) {
  return _SyncMutation.fromJson(json);
}

/// @nodoc
mixin _$SyncMutation {
  String get id => throw _privateConstructorUsedError;
  String get type =>
      throw _privateConstructorUsedError; // 'create', 'update', 'delete'
  String get feature =>
      throw _privateConstructorUsedError; // 'tasks', 'inventory', etc.
  Map<String, dynamic> get data => throw _privateConstructorUsedError;
  DateTime get timestamp => throw _privateConstructorUsedError;
  int get retryCount => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SyncMutationCopyWith<SyncMutation> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SyncMutationCopyWith<$Res> {
  factory $SyncMutationCopyWith(
          SyncMutation value, $Res Function(SyncMutation) then) =
      _$SyncMutationCopyWithImpl<$Res, SyncMutation>;
  @useResult
  $Res call(
      {String id,
      String type,
      String feature,
      Map<String, dynamic> data,
      DateTime timestamp,
      int retryCount});
}

/// @nodoc
class _$SyncMutationCopyWithImpl<$Res, $Val extends SyncMutation>
    implements $SyncMutationCopyWith<$Res> {
  _$SyncMutationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? feature = null,
    Object? data = null,
    Object? timestamp = null,
    Object? retryCount = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      feature: null == feature
          ? _value.feature
          : feature // ignore: cast_nullable_to_non_nullable
              as String,
      data: null == data
          ? _value.data
          : data // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime,
      retryCount: null == retryCount
          ? _value.retryCount
          : retryCount // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SyncMutationImplCopyWith<$Res>
    implements $SyncMutationCopyWith<$Res> {
  factory _$$SyncMutationImplCopyWith(
          _$SyncMutationImpl value, $Res Function(_$SyncMutationImpl) then) =
      __$$SyncMutationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String type,
      String feature,
      Map<String, dynamic> data,
      DateTime timestamp,
      int retryCount});
}

/// @nodoc
class __$$SyncMutationImplCopyWithImpl<$Res>
    extends _$SyncMutationCopyWithImpl<$Res, _$SyncMutationImpl>
    implements _$$SyncMutationImplCopyWith<$Res> {
  __$$SyncMutationImplCopyWithImpl(
      _$SyncMutationImpl _value, $Res Function(_$SyncMutationImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? feature = null,
    Object? data = null,
    Object? timestamp = null,
    Object? retryCount = null,
  }) {
    return _then(_$SyncMutationImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      feature: null == feature
          ? _value.feature
          : feature // ignore: cast_nullable_to_non_nullable
              as String,
      data: null == data
          ? _value._data
          : data // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime,
      retryCount: null == retryCount
          ? _value.retryCount
          : retryCount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$SyncMutationImpl implements _SyncMutation {
  const _$SyncMutationImpl(
      {required this.id,
      required this.type,
      required this.feature,
      required final Map<String, dynamic> data,
      required this.timestamp,
      this.retryCount = 0})
      : _data = data;

  factory _$SyncMutationImpl.fromJson(Map<String, dynamic> json) =>
      _$$SyncMutationImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
// 'create', 'update', 'delete'
  @override
  final String feature;
// 'tasks', 'inventory', etc.
  final Map<String, dynamic> _data;
// 'tasks', 'inventory', etc.
  @override
  Map<String, dynamic> get data {
    if (_data is EqualUnmodifiableMapView) return _data;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_data);
  }

  @override
  final DateTime timestamp;
  @override
  @JsonKey()
  final int retryCount;

  @override
  String toString() {
    return 'SyncMutation(id: $id, type: $type, feature: $feature, data: $data, timestamp: $timestamp, retryCount: $retryCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SyncMutationImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.feature, feature) || other.feature == feature) &&
            const DeepCollectionEquality().equals(other._data, _data) &&
            (identical(other.timestamp, timestamp) ||
                other.timestamp == timestamp) &&
            (identical(other.retryCount, retryCount) ||
                other.retryCount == retryCount));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, type, feature,
      const DeepCollectionEquality().hash(_data), timestamp, retryCount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SyncMutationImplCopyWith<_$SyncMutationImpl> get copyWith =>
      __$$SyncMutationImplCopyWithImpl<_$SyncMutationImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SyncMutationImplToJson(
      this,
    );
  }
}

abstract class _SyncMutation implements SyncMutation {
  const factory _SyncMutation(
      {required final String id,
      required final String type,
      required final String feature,
      required final Map<String, dynamic> data,
      required final DateTime timestamp,
      final int retryCount}) = _$SyncMutationImpl;

  factory _SyncMutation.fromJson(Map<String, dynamic> json) =
      _$SyncMutationImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override // 'create', 'update', 'delete'
  String get feature;
  @override // 'tasks', 'inventory', etc.
  Map<String, dynamic> get data;
  @override
  DateTime get timestamp;
  @override
  int get retryCount;
  @override
  @JsonKey(ignore: true)
  _$$SyncMutationImplCopyWith<_$SyncMutationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
