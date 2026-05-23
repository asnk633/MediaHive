// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Event _$EventFromJson(Map<String, dynamic> json) {
  return _Event.fromJson(json);
}

/// @nodoc
mixin _$Event {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get time => throw _privateConstructorUsedError;
  String get type =>
      throw _privateConstructorUsedError; // DRESSING, COMMUNITY, RELIGIOUS, ADMIN, INVENTORY
  String get date =>
      throw _privateConstructorUsedError; // ISO string or standardized format
  int get colorValue =>
      throw _privateConstructorUsedError; // Store color as int for serialization
  String? get createdBy => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get location => throw _privateConstructorUsedError;
  List<String> get linkedTaskIds => throw _privateConstructorUsedError;
  List<String> get linkedInventoryIds => throw _privateConstructorUsedError;
  String? get institutionId => throw _privateConstructorUsedError;
  int? get departmentId => throw _privateConstructorUsedError;
  Map<String, dynamic>? get onBehalfOf => throw _privateConstructorUsedError;
  List<String> get mediaCoverage => throw _privateConstructorUsedError;
  List<Map<String, dynamic>> get assignedCrew =>
      throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $EventCopyWith<Event> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EventCopyWith<$Res> {
  factory $EventCopyWith(Event value, $Res Function(Event) then) =
      _$EventCopyWithImpl<$Res, Event>;
  @useResult
  $Res call(
      {String id,
      String title,
      String time,
      String type,
      String date,
      int colorValue,
      String? createdBy,
      String? description,
      String? location,
      List<String> linkedTaskIds,
      List<String> linkedInventoryIds,
      String? institutionId,
      int? departmentId,
      Map<String, dynamic>? onBehalfOf,
      List<String> mediaCoverage,
      List<Map<String, dynamic>> assignedCrew});
}

/// @nodoc
class _$EventCopyWithImpl<$Res, $Val extends Event>
    implements $EventCopyWith<$Res> {
  _$EventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? time = null,
    Object? type = null,
    Object? date = null,
    Object? colorValue = null,
    Object? createdBy = freezed,
    Object? description = freezed,
    Object? location = freezed,
    Object? linkedTaskIds = null,
    Object? linkedInventoryIds = null,
    Object? institutionId = freezed,
    Object? departmentId = freezed,
    Object? onBehalfOf = freezed,
    Object? mediaCoverage = null,
    Object? assignedCrew = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      time: null == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      colorValue: null == colorValue
          ? _value.colorValue
          : colorValue // ignore: cast_nullable_to_non_nullable
              as int,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      linkedTaskIds: null == linkedTaskIds
          ? _value.linkedTaskIds
          : linkedTaskIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      linkedInventoryIds: null == linkedInventoryIds
          ? _value.linkedInventoryIds
          : linkedInventoryIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      institutionId: freezed == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String?,
      departmentId: freezed == departmentId
          ? _value.departmentId
          : departmentId // ignore: cast_nullable_to_non_nullable
              as int?,
      onBehalfOf: freezed == onBehalfOf
          ? _value.onBehalfOf
          : onBehalfOf // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      mediaCoverage: null == mediaCoverage
          ? _value.mediaCoverage
          : mediaCoverage // ignore: cast_nullable_to_non_nullable
              as List<String>,
      assignedCrew: null == assignedCrew
          ? _value.assignedCrew
          : assignedCrew // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$EventImplCopyWith<$Res> implements $EventCopyWith<$Res> {
  factory _$$EventImplCopyWith(
          _$EventImpl value, $Res Function(_$EventImpl) then) =
      __$$EventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String time,
      String type,
      String date,
      int colorValue,
      String? createdBy,
      String? description,
      String? location,
      List<String> linkedTaskIds,
      List<String> linkedInventoryIds,
      String? institutionId,
      int? departmentId,
      Map<String, dynamic>? onBehalfOf,
      List<String> mediaCoverage,
      List<Map<String, dynamic>> assignedCrew});
}

/// @nodoc
class __$$EventImplCopyWithImpl<$Res>
    extends _$EventCopyWithImpl<$Res, _$EventImpl>
    implements _$$EventImplCopyWith<$Res> {
  __$$EventImplCopyWithImpl(
      _$EventImpl _value, $Res Function(_$EventImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? time = null,
    Object? type = null,
    Object? date = null,
    Object? colorValue = null,
    Object? createdBy = freezed,
    Object? description = freezed,
    Object? location = freezed,
    Object? linkedTaskIds = null,
    Object? linkedInventoryIds = null,
    Object? institutionId = freezed,
    Object? departmentId = freezed,
    Object? onBehalfOf = freezed,
    Object? mediaCoverage = null,
    Object? assignedCrew = null,
  }) {
    return _then(_$EventImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      time: null == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      colorValue: null == colorValue
          ? _value.colorValue
          : colorValue // ignore: cast_nullable_to_non_nullable
              as int,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      linkedTaskIds: null == linkedTaskIds
          ? _value._linkedTaskIds
          : linkedTaskIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      linkedInventoryIds: null == linkedInventoryIds
          ? _value._linkedInventoryIds
          : linkedInventoryIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      institutionId: freezed == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String?,
      departmentId: freezed == departmentId
          ? _value.departmentId
          : departmentId // ignore: cast_nullable_to_non_nullable
              as int?,
      onBehalfOf: freezed == onBehalfOf
          ? _value._onBehalfOf
          : onBehalfOf // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      mediaCoverage: null == mediaCoverage
          ? _value._mediaCoverage
          : mediaCoverage // ignore: cast_nullable_to_non_nullable
              as List<String>,
      assignedCrew: null == assignedCrew
          ? _value._assignedCrew
          : assignedCrew // ignore: cast_nullable_to_non_nullable
              as List<Map<String, dynamic>>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EventImpl implements _Event {
  const _$EventImpl(
      {required this.id,
      required this.title,
      required this.time,
      required this.type,
      required this.date,
      this.colorValue = 0xFF2563EB,
      this.createdBy,
      this.description,
      this.location,
      final List<String> linkedTaskIds = const [],
      final List<String> linkedInventoryIds = const [],
      this.institutionId,
      this.departmentId,
      final Map<String, dynamic>? onBehalfOf,
      final List<String> mediaCoverage = const [],
      final List<Map<String, dynamic>> assignedCrew = const []})
      : _linkedTaskIds = linkedTaskIds,
        _linkedInventoryIds = linkedInventoryIds,
        _onBehalfOf = onBehalfOf,
        _mediaCoverage = mediaCoverage,
        _assignedCrew = assignedCrew;

  factory _$EventImpl.fromJson(Map<String, dynamic> json) =>
      _$$EventImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String time;
  @override
  final String type;
// DRESSING, COMMUNITY, RELIGIOUS, ADMIN, INVENTORY
  @override
  final String date;
// ISO string or standardized format
  @override
  @JsonKey()
  final int colorValue;
// Store color as int for serialization
  @override
  final String? createdBy;
  @override
  final String? description;
  @override
  final String? location;
  final List<String> _linkedTaskIds;
  @override
  @JsonKey()
  List<String> get linkedTaskIds {
    if (_linkedTaskIds is EqualUnmodifiableListView) return _linkedTaskIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_linkedTaskIds);
  }

  final List<String> _linkedInventoryIds;
  @override
  @JsonKey()
  List<String> get linkedInventoryIds {
    if (_linkedInventoryIds is EqualUnmodifiableListView)
      return _linkedInventoryIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_linkedInventoryIds);
  }

  @override
  final String? institutionId;
  @override
  final int? departmentId;
  final Map<String, dynamic>? _onBehalfOf;
  @override
  Map<String, dynamic>? get onBehalfOf {
    final value = _onBehalfOf;
    if (value == null) return null;
    if (_onBehalfOf is EqualUnmodifiableMapView) return _onBehalfOf;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final List<String> _mediaCoverage;
  @override
  @JsonKey()
  List<String> get mediaCoverage {
    if (_mediaCoverage is EqualUnmodifiableListView) return _mediaCoverage;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_mediaCoverage);
  }

  final List<Map<String, dynamic>> _assignedCrew;
  @override
  @JsonKey()
  List<Map<String, dynamic>> get assignedCrew {
    if (_assignedCrew is EqualUnmodifiableListView) return _assignedCrew;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_assignedCrew);
  }

  @override
  String toString() {
    return 'Event(id: $id, title: $title, time: $time, type: $type, date: $date, colorValue: $colorValue, createdBy: $createdBy, description: $description, location: $location, linkedTaskIds: $linkedTaskIds, linkedInventoryIds: $linkedInventoryIds, institutionId: $institutionId, departmentId: $departmentId, onBehalfOf: $onBehalfOf, mediaCoverage: $mediaCoverage, assignedCrew: $assignedCrew)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.time, time) || other.time == time) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.colorValue, colorValue) ||
                other.colorValue == colorValue) &&
            (identical(other.createdBy, createdBy) ||
                other.createdBy == createdBy) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.location, location) ||
                other.location == location) &&
            const DeepCollectionEquality()
                .equals(other._linkedTaskIds, _linkedTaskIds) &&
            const DeepCollectionEquality()
                .equals(other._linkedInventoryIds, _linkedInventoryIds) &&
            (identical(other.institutionId, institutionId) ||
                other.institutionId == institutionId) &&
            (identical(other.departmentId, departmentId) ||
                other.departmentId == departmentId) &&
            const DeepCollectionEquality()
                .equals(other._onBehalfOf, _onBehalfOf) &&
            const DeepCollectionEquality()
                .equals(other._mediaCoverage, _mediaCoverage) &&
            const DeepCollectionEquality()
                .equals(other._assignedCrew, _assignedCrew));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      time,
      type,
      date,
      colorValue,
      createdBy,
      description,
      location,
      const DeepCollectionEquality().hash(_linkedTaskIds),
      const DeepCollectionEquality().hash(_linkedInventoryIds),
      institutionId,
      departmentId,
      const DeepCollectionEquality().hash(_onBehalfOf),
      const DeepCollectionEquality().hash(_mediaCoverage),
      const DeepCollectionEquality().hash(_assignedCrew));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$EventImplCopyWith<_$EventImpl> get copyWith =>
      __$$EventImplCopyWithImpl<_$EventImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EventImplToJson(
      this,
    );
  }
}

abstract class _Event implements Event {
  const factory _Event(
      {required final String id,
      required final String title,
      required final String time,
      required final String type,
      required final String date,
      final int colorValue,
      final String? createdBy,
      final String? description,
      final String? location,
      final List<String> linkedTaskIds,
      final List<String> linkedInventoryIds,
      final String? institutionId,
      final int? departmentId,
      final Map<String, dynamic>? onBehalfOf,
      final List<String> mediaCoverage,
      final List<Map<String, dynamic>> assignedCrew}) = _$EventImpl;

  factory _Event.fromJson(Map<String, dynamic> json) = _$EventImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get time;
  @override
  String get type;
  @override // DRESSING, COMMUNITY, RELIGIOUS, ADMIN, INVENTORY
  String get date;
  @override // ISO string or standardized format
  int get colorValue;
  @override // Store color as int for serialization
  String? get createdBy;
  @override
  String? get description;
  @override
  String? get location;
  @override
  List<String> get linkedTaskIds;
  @override
  List<String> get linkedInventoryIds;
  @override
  String? get institutionId;
  @override
  int? get departmentId;
  @override
  Map<String, dynamic>? get onBehalfOf;
  @override
  List<String> get mediaCoverage;
  @override
  List<Map<String, dynamic>> get assignedCrew;
  @override
  @JsonKey(ignore: true)
  _$$EventImplCopyWith<_$EventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
