// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'upload_mutation.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

UploadMutation _$UploadMutationFromJson(Map<String, dynamic> json) {
  return _UploadMutation.fromJson(json);
}

/// @nodoc
mixin _$UploadMutation {
  String get id => throw _privateConstructorUsedError;
  String get filePath => throw _privateConstructorUsedError;
  String get bucketName => throw _privateConstructorUsedError;
  String get destinationPath => throw _privateConstructorUsedError;
  Map<String, dynamic> get metadata => throw _privateConstructorUsedError;
  int get retryCount => throw _privateConstructorUsedError;
  String get status =>
      throw _privateConstructorUsedError; // queued, processing, failed
  DateTime get timestamp => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $UploadMutationCopyWith<UploadMutation> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UploadMutationCopyWith<$Res> {
  factory $UploadMutationCopyWith(
          UploadMutation value, $Res Function(UploadMutation) then) =
      _$UploadMutationCopyWithImpl<$Res, UploadMutation>;
  @useResult
  $Res call(
      {String id,
      String filePath,
      String bucketName,
      String destinationPath,
      Map<String, dynamic> metadata,
      int retryCount,
      String status,
      DateTime timestamp});
}

/// @nodoc
class _$UploadMutationCopyWithImpl<$Res, $Val extends UploadMutation>
    implements $UploadMutationCopyWith<$Res> {
  _$UploadMutationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? filePath = null,
    Object? bucketName = null,
    Object? destinationPath = null,
    Object? metadata = null,
    Object? retryCount = null,
    Object? status = null,
    Object? timestamp = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      filePath: null == filePath
          ? _value.filePath
          : filePath // ignore: cast_nullable_to_non_nullable
              as String,
      bucketName: null == bucketName
          ? _value.bucketName
          : bucketName // ignore: cast_nullable_to_non_nullable
              as String,
      destinationPath: null == destinationPath
          ? _value.destinationPath
          : destinationPath // ignore: cast_nullable_to_non_nullable
              as String,
      metadata: null == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      retryCount: null == retryCount
          ? _value.retryCount
          : retryCount // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UploadMutationImplCopyWith<$Res>
    implements $UploadMutationCopyWith<$Res> {
  factory _$$UploadMutationImplCopyWith(_$UploadMutationImpl value,
          $Res Function(_$UploadMutationImpl) then) =
      __$$UploadMutationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String filePath,
      String bucketName,
      String destinationPath,
      Map<String, dynamic> metadata,
      int retryCount,
      String status,
      DateTime timestamp});
}

/// @nodoc
class __$$UploadMutationImplCopyWithImpl<$Res>
    extends _$UploadMutationCopyWithImpl<$Res, _$UploadMutationImpl>
    implements _$$UploadMutationImplCopyWith<$Res> {
  __$$UploadMutationImplCopyWithImpl(
      _$UploadMutationImpl _value, $Res Function(_$UploadMutationImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? filePath = null,
    Object? bucketName = null,
    Object? destinationPath = null,
    Object? metadata = null,
    Object? retryCount = null,
    Object? status = null,
    Object? timestamp = null,
  }) {
    return _then(_$UploadMutationImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      filePath: null == filePath
          ? _value.filePath
          : filePath // ignore: cast_nullable_to_non_nullable
              as String,
      bucketName: null == bucketName
          ? _value.bucketName
          : bucketName // ignore: cast_nullable_to_non_nullable
              as String,
      destinationPath: null == destinationPath
          ? _value.destinationPath
          : destinationPath // ignore: cast_nullable_to_non_nullable
              as String,
      metadata: null == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      retryCount: null == retryCount
          ? _value.retryCount
          : retryCount // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UploadMutationImpl implements _UploadMutation {
  const _$UploadMutationImpl(
      {required this.id,
      required this.filePath,
      required this.bucketName,
      required this.destinationPath,
      required final Map<String, dynamic> metadata,
      this.retryCount = 0,
      this.status = 'queued',
      required this.timestamp})
      : _metadata = metadata;

  factory _$UploadMutationImpl.fromJson(Map<String, dynamic> json) =>
      _$$UploadMutationImplFromJson(json);

  @override
  final String id;
  @override
  final String filePath;
  @override
  final String bucketName;
  @override
  final String destinationPath;
  final Map<String, dynamic> _metadata;
  @override
  Map<String, dynamic> get metadata {
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_metadata);
  }

  @override
  @JsonKey()
  final int retryCount;
  @override
  @JsonKey()
  final String status;
// queued, processing, failed
  @override
  final DateTime timestamp;

  @override
  String toString() {
    return 'UploadMutation(id: $id, filePath: $filePath, bucketName: $bucketName, destinationPath: $destinationPath, metadata: $metadata, retryCount: $retryCount, status: $status, timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UploadMutationImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.filePath, filePath) ||
                other.filePath == filePath) &&
            (identical(other.bucketName, bucketName) ||
                other.bucketName == bucketName) &&
            (identical(other.destinationPath, destinationPath) ||
                other.destinationPath == destinationPath) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
            (identical(other.retryCount, retryCount) ||
                other.retryCount == retryCount) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.timestamp, timestamp) ||
                other.timestamp == timestamp));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      filePath,
      bucketName,
      destinationPath,
      const DeepCollectionEquality().hash(_metadata),
      retryCount,
      status,
      timestamp);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UploadMutationImplCopyWith<_$UploadMutationImpl> get copyWith =>
      __$$UploadMutationImplCopyWithImpl<_$UploadMutationImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UploadMutationImplToJson(
      this,
    );
  }
}

abstract class _UploadMutation implements UploadMutation {
  const factory _UploadMutation(
      {required final String id,
      required final String filePath,
      required final String bucketName,
      required final String destinationPath,
      required final Map<String, dynamic> metadata,
      final int retryCount,
      final String status,
      required final DateTime timestamp}) = _$UploadMutationImpl;

  factory _UploadMutation.fromJson(Map<String, dynamic> json) =
      _$UploadMutationImpl.fromJson;

  @override
  String get id;
  @override
  String get filePath;
  @override
  String get bucketName;
  @override
  String get destinationPath;
  @override
  Map<String, dynamic> get metadata;
  @override
  int get retryCount;
  @override
  String get status;
  @override // queued, processing, failed
  DateTime get timestamp;
  @override
  @JsonKey(ignore: true)
  _$$UploadMutationImplCopyWith<_$UploadMutationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
