// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'nfc_tag.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

NfcTag _$NfcTagFromJson(Map<String, dynamic> json) {
  return _NfcTag.fromJson(json);
}

/// @nodoc
mixin _$NfcTag {
  String get id => throw _privateConstructorUsedError;
  String get tagName => throw _privateConstructorUsedError;
  String get tagId => throw _privateConstructorUsedError;
  String get tagType =>
      throw _privateConstructorUsedError; // 'attendance', 'equipment', 'location', 'vehicle', 'field_work', 'mixed'
  String? get entityId => throw _privateConstructorUsedError;
  String? get entityType =>
      throw _privateConstructorUsedError; // 'attendance', 'equipment', 'room', 'vehicle', 'location', 'mixed'
  double get latitude => throw _privateConstructorUsedError;
  double get longitude => throw _privateConstructorUsedError;
  double get radius => throw _privateConstructorUsedError;
  bool get active => throw _privateConstructorUsedError;
  String? get deletedAt => throw _privateConstructorUsedError;
  String? get campusId => throw _privateConstructorUsedError;
  String? get campusName => throw _privateConstructorUsedError;
  String? get locationGroup => throw _privateConstructorUsedError;
  double? get accuracy => throw _privateConstructorUsedError;
  @JsonKey(name: 'wifi_ssids')
  String? get wifiSsids => throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $NfcTagCopyWith<NfcTag> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NfcTagCopyWith<$Res> {
  factory $NfcTagCopyWith(NfcTag value, $Res Function(NfcTag) then) =
      _$NfcTagCopyWithImpl<$Res, NfcTag>;
  @useResult
  $Res call(
      {String id,
      String tagName,
      String tagId,
      String tagType,
      String? entityId,
      String? entityType,
      double latitude,
      double longitude,
      double radius,
      bool active,
      String? deletedAt,
      String? campusId,
      String? campusName,
      String? locationGroup,
      double? accuracy,
      @JsonKey(name: 'wifi_ssids') String? wifiSsids,
      String createdAt});
}

/// @nodoc
class _$NfcTagCopyWithImpl<$Res, $Val extends NfcTag>
    implements $NfcTagCopyWith<$Res> {
  _$NfcTagCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tagName = null,
    Object? tagId = null,
    Object? tagType = null,
    Object? entityId = freezed,
    Object? entityType = freezed,
    Object? latitude = null,
    Object? longitude = null,
    Object? radius = null,
    Object? active = null,
    Object? deletedAt = freezed,
    Object? campusId = freezed,
    Object? campusName = freezed,
    Object? locationGroup = freezed,
    Object? accuracy = freezed,
    Object? wifiSsids = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      tagName: null == tagName
          ? _value.tagName
          : tagName // ignore: cast_nullable_to_non_nullable
              as String,
      tagId: null == tagId
          ? _value.tagId
          : tagId // ignore: cast_nullable_to_non_nullable
              as String,
      tagType: null == tagType
          ? _value.tagType
          : tagType // ignore: cast_nullable_to_non_nullable
              as String,
      entityId: freezed == entityId
          ? _value.entityId
          : entityId // ignore: cast_nullable_to_non_nullable
              as String?,
      entityType: freezed == entityType
          ? _value.entityType
          : entityType // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: null == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double,
      longitude: null == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double,
      radius: null == radius
          ? _value.radius
          : radius // ignore: cast_nullable_to_non_nullable
              as double,
      active: null == active
          ? _value.active
          : active // ignore: cast_nullable_to_non_nullable
              as bool,
      deletedAt: freezed == deletedAt
          ? _value.deletedAt
          : deletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      campusId: freezed == campusId
          ? _value.campusId
          : campusId // ignore: cast_nullable_to_non_nullable
              as String?,
      campusName: freezed == campusName
          ? _value.campusName
          : campusName // ignore: cast_nullable_to_non_nullable
              as String?,
      locationGroup: freezed == locationGroup
          ? _value.locationGroup
          : locationGroup // ignore: cast_nullable_to_non_nullable
              as String?,
      accuracy: freezed == accuracy
          ? _value.accuracy
          : accuracy // ignore: cast_nullable_to_non_nullable
              as double?,
      wifiSsids: freezed == wifiSsids
          ? _value.wifiSsids
          : wifiSsids // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$NfcTagImplCopyWith<$Res> implements $NfcTagCopyWith<$Res> {
  factory _$$NfcTagImplCopyWith(
          _$NfcTagImpl value, $Res Function(_$NfcTagImpl) then) =
      __$$NfcTagImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String tagName,
      String tagId,
      String tagType,
      String? entityId,
      String? entityType,
      double latitude,
      double longitude,
      double radius,
      bool active,
      String? deletedAt,
      String? campusId,
      String? campusName,
      String? locationGroup,
      double? accuracy,
      @JsonKey(name: 'wifi_ssids') String? wifiSsids,
      String createdAt});
}

/// @nodoc
class __$$NfcTagImplCopyWithImpl<$Res>
    extends _$NfcTagCopyWithImpl<$Res, _$NfcTagImpl>
    implements _$$NfcTagImplCopyWith<$Res> {
  __$$NfcTagImplCopyWithImpl(
      _$NfcTagImpl _value, $Res Function(_$NfcTagImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? tagName = null,
    Object? tagId = null,
    Object? tagType = null,
    Object? entityId = freezed,
    Object? entityType = freezed,
    Object? latitude = null,
    Object? longitude = null,
    Object? radius = null,
    Object? active = null,
    Object? deletedAt = freezed,
    Object? campusId = freezed,
    Object? campusName = freezed,
    Object? locationGroup = freezed,
    Object? accuracy = freezed,
    Object? wifiSsids = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$NfcTagImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      tagName: null == tagName
          ? _value.tagName
          : tagName // ignore: cast_nullable_to_non_nullable
              as String,
      tagId: null == tagId
          ? _value.tagId
          : tagId // ignore: cast_nullable_to_non_nullable
              as String,
      tagType: null == tagType
          ? _value.tagType
          : tagType // ignore: cast_nullable_to_non_nullable
              as String,
      entityId: freezed == entityId
          ? _value.entityId
          : entityId // ignore: cast_nullable_to_non_nullable
              as String?,
      entityType: freezed == entityType
          ? _value.entityType
          : entityType // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: null == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double,
      longitude: null == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double,
      radius: null == radius
          ? _value.radius
          : radius // ignore: cast_nullable_to_non_nullable
              as double,
      active: null == active
          ? _value.active
          : active // ignore: cast_nullable_to_non_nullable
              as bool,
      deletedAt: freezed == deletedAt
          ? _value.deletedAt
          : deletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      campusId: freezed == campusId
          ? _value.campusId
          : campusId // ignore: cast_nullable_to_non_nullable
              as String?,
      campusName: freezed == campusName
          ? _value.campusName
          : campusName // ignore: cast_nullable_to_non_nullable
              as String?,
      locationGroup: freezed == locationGroup
          ? _value.locationGroup
          : locationGroup // ignore: cast_nullable_to_non_nullable
              as String?,
      accuracy: freezed == accuracy
          ? _value.accuracy
          : accuracy // ignore: cast_nullable_to_non_nullable
              as double?,
      wifiSsids: freezed == wifiSsids
          ? _value.wifiSsids
          : wifiSsids // ignore: cast_nullable_to_non_nullable
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
class _$NfcTagImpl implements _NfcTag {
  const _$NfcTagImpl(
      {required this.id,
      required this.tagName,
      required this.tagId,
      this.tagType = 'attendance',
      this.entityId,
      this.entityType,
      required this.latitude,
      required this.longitude,
      this.radius = 50.0,
      this.active = true,
      this.deletedAt,
      this.campusId,
      this.campusName,
      this.locationGroup,
      this.accuracy,
      @JsonKey(name: 'wifi_ssids') this.wifiSsids,
      required this.createdAt});

  factory _$NfcTagImpl.fromJson(Map<String, dynamic> json) =>
      _$$NfcTagImplFromJson(json);

  @override
  final String id;
  @override
  final String tagName;
  @override
  final String tagId;
  @override
  @JsonKey()
  final String tagType;
// 'attendance', 'equipment', 'location', 'vehicle', 'field_work', 'mixed'
  @override
  final String? entityId;
  @override
  final String? entityType;
// 'attendance', 'equipment', 'room', 'vehicle', 'location', 'mixed'
  @override
  final double latitude;
  @override
  final double longitude;
  @override
  @JsonKey()
  final double radius;
  @override
  @JsonKey()
  final bool active;
  @override
  final String? deletedAt;
  @override
  final String? campusId;
  @override
  final String? campusName;
  @override
  final String? locationGroup;
  @override
  final double? accuracy;
  @override
  @JsonKey(name: 'wifi_ssids')
  final String? wifiSsids;
  @override
  final String createdAt;

  @override
  String toString() {
    return 'NfcTag(id: $id, tagName: $tagName, tagId: $tagId, tagType: $tagType, entityId: $entityId, entityType: $entityType, latitude: $latitude, longitude: $longitude, radius: $radius, active: $active, deletedAt: $deletedAt, campusId: $campusId, campusName: $campusName, locationGroup: $locationGroup, accuracy: $accuracy, wifiSsids: $wifiSsids, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NfcTagImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.tagName, tagName) || other.tagName == tagName) &&
            (identical(other.tagId, tagId) || other.tagId == tagId) &&
            (identical(other.tagType, tagType) || other.tagType == tagType) &&
            (identical(other.entityId, entityId) ||
                other.entityId == entityId) &&
            (identical(other.entityType, entityType) ||
                other.entityType == entityType) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.radius, radius) || other.radius == radius) &&
            (identical(other.active, active) || other.active == active) &&
            (identical(other.deletedAt, deletedAt) ||
                other.deletedAt == deletedAt) &&
            (identical(other.campusId, campusId) ||
                other.campusId == campusId) &&
            (identical(other.campusName, campusName) ||
                other.campusName == campusName) &&
            (identical(other.locationGroup, locationGroup) ||
                other.locationGroup == locationGroup) &&
            (identical(other.accuracy, accuracy) ||
                other.accuracy == accuracy) &&
            (identical(other.wifiSsids, wifiSsids) ||
                other.wifiSsids == wifiSsids) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      tagName,
      tagId,
      tagType,
      entityId,
      entityType,
      latitude,
      longitude,
      radius,
      active,
      deletedAt,
      campusId,
      campusName,
      locationGroup,
      accuracy,
      wifiSsids,
      createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$NfcTagImplCopyWith<_$NfcTagImpl> get copyWith =>
      __$$NfcTagImplCopyWithImpl<_$NfcTagImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$NfcTagImplToJson(
      this,
    );
  }
}

abstract class _NfcTag implements NfcTag {
  const factory _NfcTag(
      {required final String id,
      required final String tagName,
      required final String tagId,
      final String tagType,
      final String? entityId,
      final String? entityType,
      required final double latitude,
      required final double longitude,
      final double radius,
      final bool active,
      final String? deletedAt,
      final String? campusId,
      final String? campusName,
      final String? locationGroup,
      final double? accuracy,
      @JsonKey(name: 'wifi_ssids') final String? wifiSsids,
      required final String createdAt}) = _$NfcTagImpl;

  factory _NfcTag.fromJson(Map<String, dynamic> json) = _$NfcTagImpl.fromJson;

  @override
  String get id;
  @override
  String get tagName;
  @override
  String get tagId;
  @override
  String get tagType;
  @override // 'attendance', 'equipment', 'location', 'vehicle', 'field_work', 'mixed'
  String? get entityId;
  @override
  String? get entityType;
  @override // 'attendance', 'equipment', 'room', 'vehicle', 'location', 'mixed'
  double get latitude;
  @override
  double get longitude;
  @override
  double get radius;
  @override
  bool get active;
  @override
  String? get deletedAt;
  @override
  String? get campusId;
  @override
  String? get campusName;
  @override
  String? get locationGroup;
  @override
  double? get accuracy;
  @override
  @JsonKey(name: 'wifi_ssids')
  String? get wifiSsids;
  @override
  String get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$NfcTagImplCopyWith<_$NfcTagImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
