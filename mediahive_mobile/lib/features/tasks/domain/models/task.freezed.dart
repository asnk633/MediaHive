// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'task.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Task _$TaskFromJson(Map<String, dynamic> json) {
  return _Task.fromJson(json);
}

/// @nodoc
mixin _$Task {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get priority => throw _privateConstructorUsedError;
  String get requester => throw _privateConstructorUsedError;
  String get assignee => throw _privateConstructorUsedError;
  String get dueDate => throw _privateConstructorUsedError;
  String? get createdBy => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get completionDate => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get onBehalfOf => throw _privateConstructorUsedError;
  String? get completedByName => throw _privateConstructorUsedError;
  List<String> get attachments => throw _privateConstructorUsedError;
  String? get eventId => throw _privateConstructorUsedError;
  bool get isBlocked => throw _privateConstructorUsedError;
  String? get blockedBy => throw _privateConstructorUsedError;
  bool get requiresReview => throw _privateConstructorUsedError;
  String? get department => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $TaskCopyWith<Task> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TaskCopyWith<$Res> {
  factory $TaskCopyWith(Task value, $Res Function(Task) then) =
      _$TaskCopyWithImpl<$Res, Task>;
  @useResult
  $Res call(
      {String id,
      String title,
      String status,
      String priority,
      String requester,
      String assignee,
      String dueDate,
      String? createdBy,
      String? createdAt,
      String? completionDate,
      String? description,
      String? onBehalfOf,
      String? completedByName,
      List<String> attachments,
      String? eventId,
      bool isBlocked,
      String? blockedBy,
      bool requiresReview,
      String? department});
}

/// @nodoc
class _$TaskCopyWithImpl<$Res, $Val extends Task>
    implements $TaskCopyWith<$Res> {
  _$TaskCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? status = null,
    Object? priority = null,
    Object? requester = null,
    Object? assignee = null,
    Object? dueDate = null,
    Object? createdBy = freezed,
    Object? createdAt = freezed,
    Object? completionDate = freezed,
    Object? description = freezed,
    Object? onBehalfOf = freezed,
    Object? completedByName = freezed,
    Object? attachments = null,
    Object? eventId = freezed,
    Object? isBlocked = null,
    Object? blockedBy = freezed,
    Object? requiresReview = null,
    Object? department = freezed,
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
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      priority: null == priority
          ? _value.priority
          : priority // ignore: cast_nullable_to_non_nullable
              as String,
      requester: null == requester
          ? _value.requester
          : requester // ignore: cast_nullable_to_non_nullable
              as String,
      assignee: null == assignee
          ? _value.assignee
          : assignee // ignore: cast_nullable_to_non_nullable
              as String,
      dueDate: null == dueDate
          ? _value.dueDate
          : dueDate // ignore: cast_nullable_to_non_nullable
              as String,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      completionDate: freezed == completionDate
          ? _value.completionDate
          : completionDate // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      onBehalfOf: freezed == onBehalfOf
          ? _value.onBehalfOf
          : onBehalfOf // ignore: cast_nullable_to_non_nullable
              as String?,
      completedByName: freezed == completedByName
          ? _value.completedByName
          : completedByName // ignore: cast_nullable_to_non_nullable
              as String?,
      attachments: null == attachments
          ? _value.attachments
          : attachments // ignore: cast_nullable_to_non_nullable
              as List<String>,
      eventId: freezed == eventId
          ? _value.eventId
          : eventId // ignore: cast_nullable_to_non_nullable
              as String?,
      isBlocked: null == isBlocked
          ? _value.isBlocked
          : isBlocked // ignore: cast_nullable_to_non_nullable
              as bool,
      blockedBy: freezed == blockedBy
          ? _value.blockedBy
          : blockedBy // ignore: cast_nullable_to_non_nullable
              as String?,
      requiresReview: null == requiresReview
          ? _value.requiresReview
          : requiresReview // ignore: cast_nullable_to_non_nullable
              as bool,
      department: freezed == department
          ? _value.department
          : department // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TaskImplCopyWith<$Res> implements $TaskCopyWith<$Res> {
  factory _$$TaskImplCopyWith(
          _$TaskImpl value, $Res Function(_$TaskImpl) then) =
      __$$TaskImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String status,
      String priority,
      String requester,
      String assignee,
      String dueDate,
      String? createdBy,
      String? createdAt,
      String? completionDate,
      String? description,
      String? onBehalfOf,
      String? completedByName,
      List<String> attachments,
      String? eventId,
      bool isBlocked,
      String? blockedBy,
      bool requiresReview,
      String? department});
}

/// @nodoc
class __$$TaskImplCopyWithImpl<$Res>
    extends _$TaskCopyWithImpl<$Res, _$TaskImpl>
    implements _$$TaskImplCopyWith<$Res> {
  __$$TaskImplCopyWithImpl(_$TaskImpl _value, $Res Function(_$TaskImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? status = null,
    Object? priority = null,
    Object? requester = null,
    Object? assignee = null,
    Object? dueDate = null,
    Object? createdBy = freezed,
    Object? createdAt = freezed,
    Object? completionDate = freezed,
    Object? description = freezed,
    Object? onBehalfOf = freezed,
    Object? completedByName = freezed,
    Object? attachments = null,
    Object? eventId = freezed,
    Object? isBlocked = null,
    Object? blockedBy = freezed,
    Object? requiresReview = null,
    Object? department = freezed,
  }) {
    return _then(_$TaskImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      priority: null == priority
          ? _value.priority
          : priority // ignore: cast_nullable_to_non_nullable
              as String,
      requester: null == requester
          ? _value.requester
          : requester // ignore: cast_nullable_to_non_nullable
              as String,
      assignee: null == assignee
          ? _value.assignee
          : assignee // ignore: cast_nullable_to_non_nullable
              as String,
      dueDate: null == dueDate
          ? _value.dueDate
          : dueDate // ignore: cast_nullable_to_non_nullable
              as String,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      completionDate: freezed == completionDate
          ? _value.completionDate
          : completionDate // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      onBehalfOf: freezed == onBehalfOf
          ? _value.onBehalfOf
          : onBehalfOf // ignore: cast_nullable_to_non_nullable
              as String?,
      completedByName: freezed == completedByName
          ? _value.completedByName
          : completedByName // ignore: cast_nullable_to_non_nullable
              as String?,
      attachments: null == attachments
          ? _value._attachments
          : attachments // ignore: cast_nullable_to_non_nullable
              as List<String>,
      eventId: freezed == eventId
          ? _value.eventId
          : eventId // ignore: cast_nullable_to_non_nullable
              as String?,
      isBlocked: null == isBlocked
          ? _value.isBlocked
          : isBlocked // ignore: cast_nullable_to_non_nullable
              as bool,
      blockedBy: freezed == blockedBy
          ? _value.blockedBy
          : blockedBy // ignore: cast_nullable_to_non_nullable
              as String?,
      requiresReview: null == requiresReview
          ? _value.requiresReview
          : requiresReview // ignore: cast_nullable_to_non_nullable
              as bool,
      department: freezed == department
          ? _value.department
          : department // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TaskImpl implements _Task {
  const _$TaskImpl(
      {required this.id,
      required this.title,
      required this.status,
      required this.priority,
      required this.requester,
      required this.assignee,
      required this.dueDate,
      this.createdBy,
      this.createdAt,
      this.completionDate,
      this.description,
      this.onBehalfOf,
      this.completedByName,
      final List<String> attachments = const [],
      this.eventId,
      this.isBlocked = false,
      this.blockedBy,
      this.requiresReview = false,
      this.department})
      : _attachments = attachments;

  factory _$TaskImpl.fromJson(Map<String, dynamic> json) =>
      _$$TaskImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String status;
  @override
  final String priority;
  @override
  final String requester;
  @override
  final String assignee;
  @override
  final String dueDate;
  @override
  final String? createdBy;
  @override
  final String? createdAt;
  @override
  final String? completionDate;
  @override
  final String? description;
  @override
  final String? onBehalfOf;
  @override
  final String? completedByName;
  final List<String> _attachments;
  @override
  @JsonKey()
  List<String> get attachments {
    if (_attachments is EqualUnmodifiableListView) return _attachments;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_attachments);
  }

  @override
  final String? eventId;
  @override
  @JsonKey()
  final bool isBlocked;
  @override
  final String? blockedBy;
  @override
  @JsonKey()
  final bool requiresReview;
  @override
  final String? department;

  @override
  String toString() {
    return 'Task(id: $id, title: $title, status: $status, priority: $priority, requester: $requester, assignee: $assignee, dueDate: $dueDate, createdBy: $createdBy, createdAt: $createdAt, completionDate: $completionDate, description: $description, onBehalfOf: $onBehalfOf, completedByName: $completedByName, attachments: $attachments, eventId: $eventId, isBlocked: $isBlocked, blockedBy: $blockedBy, requiresReview: $requiresReview, department: $department)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TaskImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.priority, priority) ||
                other.priority == priority) &&
            (identical(other.requester, requester) ||
                other.requester == requester) &&
            (identical(other.assignee, assignee) ||
                other.assignee == assignee) &&
            (identical(other.dueDate, dueDate) || other.dueDate == dueDate) &&
            (identical(other.createdBy, createdBy) ||
                other.createdBy == createdBy) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.completionDate, completionDate) ||
                other.completionDate == completionDate) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.onBehalfOf, onBehalfOf) ||
                other.onBehalfOf == onBehalfOf) &&
            (identical(other.completedByName, completedByName) ||
                other.completedByName == completedByName) &&
            const DeepCollectionEquality()
                .equals(other._attachments, _attachments) &&
            (identical(other.eventId, eventId) || other.eventId == eventId) &&
            (identical(other.isBlocked, isBlocked) ||
                other.isBlocked == isBlocked) &&
            (identical(other.blockedBy, blockedBy) ||
                other.blockedBy == blockedBy) &&
            (identical(other.requiresReview, requiresReview) ||
                other.requiresReview == requiresReview) &&
            (identical(other.department, department) ||
                other.department == department));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        title,
        status,
        priority,
        requester,
        assignee,
        dueDate,
        createdBy,
        createdAt,
        completionDate,
        description,
        onBehalfOf,
        completedByName,
        const DeepCollectionEquality().hash(_attachments),
        eventId,
        isBlocked,
        blockedBy,
        requiresReview,
        department
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$TaskImplCopyWith<_$TaskImpl> get copyWith =>
      __$$TaskImplCopyWithImpl<_$TaskImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TaskImplToJson(
      this,
    );
  }
}

abstract class _Task implements Task {
  const factory _Task(
      {required final String id,
      required final String title,
      required final String status,
      required final String priority,
      required final String requester,
      required final String assignee,
      required final String dueDate,
      final String? createdBy,
      final String? createdAt,
      final String? completionDate,
      final String? description,
      final String? onBehalfOf,
      final String? completedByName,
      final List<String> attachments,
      final String? eventId,
      final bool isBlocked,
      final String? blockedBy,
      final bool requiresReview,
      final String? department}) = _$TaskImpl;

  factory _Task.fromJson(Map<String, dynamic> json) = _$TaskImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get status;
  @override
  String get priority;
  @override
  String get requester;
  @override
  String get assignee;
  @override
  String get dueDate;
  @override
  String? get createdBy;
  @override
  String? get createdAt;
  @override
  String? get completionDate;
  @override
  String? get description;
  @override
  String? get onBehalfOf;
  @override
  String? get completedByName;
  @override
  List<String> get attachments;
  @override
  String? get eventId;
  @override
  bool get isBlocked;
  @override
  String? get blockedBy;
  @override
  bool get requiresReview;
  @override
  String? get department;
  @override
  @JsonKey(ignore: true)
  _$$TaskImplCopyWith<_$TaskImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
