// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'presence_verification_settings.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

PresenceVerificationSettings _$PresenceVerificationSettingsFromJson(
    Map<String, dynamic> json) {
  return _PresenceVerificationSettings.fromJson(json);
}

/// @nodoc
mixin _$PresenceVerificationSettings {
  String get id => throw _privateConstructorUsedError;
  String get organizationId => throw _privateConstructorUsedError;
  bool get isEnabled => throw _privateConstructorUsedError;
  bool get shadowMode => throw _privateConstructorUsedError;
  int get checkIntervalMinutes => throw _privateConstructorUsedError;
  int get gracePeriodMinutes => throw _privateConstructorUsedError;
  bool get autoCheckoutOnViolation => throw _privateConstructorUsedError;
  double get maxFieldWorkHours => throw _privateConstructorUsedError;
  int get geofenceRadiusMeters => throw _privateConstructorUsedError;
  bool get requireWifiVerification => throw _privateConstructorUsedError;
  List<String>? get officeWifiSsids =>
      throw _privateConstructorUsedError; // Battery management
  int get lowBatteryIntervalMinutes => throw _privateConstructorUsedError;
  bool get criticalBatterySuspend =>
      throw _privateConstructorUsedError; // Manager fallback
  int get autoApproveTimeoutMinutes => throw _privateConstructorUsedError;
  int get rejectionGracePeriodMinutes => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PresenceVerificationSettingsCopyWith<PresenceVerificationSettings>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PresenceVerificationSettingsCopyWith<$Res> {
  factory $PresenceVerificationSettingsCopyWith(
          PresenceVerificationSettings value,
          $Res Function(PresenceVerificationSettings) then) =
      _$PresenceVerificationSettingsCopyWithImpl<$Res,
          PresenceVerificationSettings>;
  @useResult
  $Res call(
      {String id,
      String organizationId,
      bool isEnabled,
      bool shadowMode,
      int checkIntervalMinutes,
      int gracePeriodMinutes,
      bool autoCheckoutOnViolation,
      double maxFieldWorkHours,
      int geofenceRadiusMeters,
      bool requireWifiVerification,
      List<String>? officeWifiSsids,
      int lowBatteryIntervalMinutes,
      bool criticalBatterySuspend,
      int autoApproveTimeoutMinutes,
      int rejectionGracePeriodMinutes,
      String? createdAt,
      String? updatedAt});
}

/// @nodoc
class _$PresenceVerificationSettingsCopyWithImpl<$Res,
        $Val extends PresenceVerificationSettings>
    implements $PresenceVerificationSettingsCopyWith<$Res> {
  _$PresenceVerificationSettingsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? organizationId = null,
    Object? isEnabled = null,
    Object? shadowMode = null,
    Object? checkIntervalMinutes = null,
    Object? gracePeriodMinutes = null,
    Object? autoCheckoutOnViolation = null,
    Object? maxFieldWorkHours = null,
    Object? geofenceRadiusMeters = null,
    Object? requireWifiVerification = null,
    Object? officeWifiSsids = freezed,
    Object? lowBatteryIntervalMinutes = null,
    Object? criticalBatterySuspend = null,
    Object? autoApproveTimeoutMinutes = null,
    Object? rejectionGracePeriodMinutes = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      organizationId: null == organizationId
          ? _value.organizationId
          : organizationId // ignore: cast_nullable_to_non_nullable
              as String,
      isEnabled: null == isEnabled
          ? _value.isEnabled
          : isEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      shadowMode: null == shadowMode
          ? _value.shadowMode
          : shadowMode // ignore: cast_nullable_to_non_nullable
              as bool,
      checkIntervalMinutes: null == checkIntervalMinutes
          ? _value.checkIntervalMinutes
          : checkIntervalMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      gracePeriodMinutes: null == gracePeriodMinutes
          ? _value.gracePeriodMinutes
          : gracePeriodMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      autoCheckoutOnViolation: null == autoCheckoutOnViolation
          ? _value.autoCheckoutOnViolation
          : autoCheckoutOnViolation // ignore: cast_nullable_to_non_nullable
              as bool,
      maxFieldWorkHours: null == maxFieldWorkHours
          ? _value.maxFieldWorkHours
          : maxFieldWorkHours // ignore: cast_nullable_to_non_nullable
              as double,
      geofenceRadiusMeters: null == geofenceRadiusMeters
          ? _value.geofenceRadiusMeters
          : geofenceRadiusMeters // ignore: cast_nullable_to_non_nullable
              as int,
      requireWifiVerification: null == requireWifiVerification
          ? _value.requireWifiVerification
          : requireWifiVerification // ignore: cast_nullable_to_non_nullable
              as bool,
      officeWifiSsids: freezed == officeWifiSsids
          ? _value.officeWifiSsids
          : officeWifiSsids // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      lowBatteryIntervalMinutes: null == lowBatteryIntervalMinutes
          ? _value.lowBatteryIntervalMinutes
          : lowBatteryIntervalMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      criticalBatterySuspend: null == criticalBatterySuspend
          ? _value.criticalBatterySuspend
          : criticalBatterySuspend // ignore: cast_nullable_to_non_nullable
              as bool,
      autoApproveTimeoutMinutes: null == autoApproveTimeoutMinutes
          ? _value.autoApproveTimeoutMinutes
          : autoApproveTimeoutMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      rejectionGracePeriodMinutes: null == rejectionGracePeriodMinutes
          ? _value.rejectionGracePeriodMinutes
          : rejectionGracePeriodMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PresenceVerificationSettingsImplCopyWith<$Res>
    implements $PresenceVerificationSettingsCopyWith<$Res> {
  factory _$$PresenceVerificationSettingsImplCopyWith(
          _$PresenceVerificationSettingsImpl value,
          $Res Function(_$PresenceVerificationSettingsImpl) then) =
      __$$PresenceVerificationSettingsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String organizationId,
      bool isEnabled,
      bool shadowMode,
      int checkIntervalMinutes,
      int gracePeriodMinutes,
      bool autoCheckoutOnViolation,
      double maxFieldWorkHours,
      int geofenceRadiusMeters,
      bool requireWifiVerification,
      List<String>? officeWifiSsids,
      int lowBatteryIntervalMinutes,
      bool criticalBatterySuspend,
      int autoApproveTimeoutMinutes,
      int rejectionGracePeriodMinutes,
      String? createdAt,
      String? updatedAt});
}

/// @nodoc
class __$$PresenceVerificationSettingsImplCopyWithImpl<$Res>
    extends _$PresenceVerificationSettingsCopyWithImpl<$Res,
        _$PresenceVerificationSettingsImpl>
    implements _$$PresenceVerificationSettingsImplCopyWith<$Res> {
  __$$PresenceVerificationSettingsImplCopyWithImpl(
      _$PresenceVerificationSettingsImpl _value,
      $Res Function(_$PresenceVerificationSettingsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? organizationId = null,
    Object? isEnabled = null,
    Object? shadowMode = null,
    Object? checkIntervalMinutes = null,
    Object? gracePeriodMinutes = null,
    Object? autoCheckoutOnViolation = null,
    Object? maxFieldWorkHours = null,
    Object? geofenceRadiusMeters = null,
    Object? requireWifiVerification = null,
    Object? officeWifiSsids = freezed,
    Object? lowBatteryIntervalMinutes = null,
    Object? criticalBatterySuspend = null,
    Object? autoApproveTimeoutMinutes = null,
    Object? rejectionGracePeriodMinutes = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$PresenceVerificationSettingsImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      organizationId: null == organizationId
          ? _value.organizationId
          : organizationId // ignore: cast_nullable_to_non_nullable
              as String,
      isEnabled: null == isEnabled
          ? _value.isEnabled
          : isEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      shadowMode: null == shadowMode
          ? _value.shadowMode
          : shadowMode // ignore: cast_nullable_to_non_nullable
              as bool,
      checkIntervalMinutes: null == checkIntervalMinutes
          ? _value.checkIntervalMinutes
          : checkIntervalMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      gracePeriodMinutes: null == gracePeriodMinutes
          ? _value.gracePeriodMinutes
          : gracePeriodMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      autoCheckoutOnViolation: null == autoCheckoutOnViolation
          ? _value.autoCheckoutOnViolation
          : autoCheckoutOnViolation // ignore: cast_nullable_to_non_nullable
              as bool,
      maxFieldWorkHours: null == maxFieldWorkHours
          ? _value.maxFieldWorkHours
          : maxFieldWorkHours // ignore: cast_nullable_to_non_nullable
              as double,
      geofenceRadiusMeters: null == geofenceRadiusMeters
          ? _value.geofenceRadiusMeters
          : geofenceRadiusMeters // ignore: cast_nullable_to_non_nullable
              as int,
      requireWifiVerification: null == requireWifiVerification
          ? _value.requireWifiVerification
          : requireWifiVerification // ignore: cast_nullable_to_non_nullable
              as bool,
      officeWifiSsids: freezed == officeWifiSsids
          ? _value._officeWifiSsids
          : officeWifiSsids // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      lowBatteryIntervalMinutes: null == lowBatteryIntervalMinutes
          ? _value.lowBatteryIntervalMinutes
          : lowBatteryIntervalMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      criticalBatterySuspend: null == criticalBatterySuspend
          ? _value.criticalBatterySuspend
          : criticalBatterySuspend // ignore: cast_nullable_to_non_nullable
              as bool,
      autoApproveTimeoutMinutes: null == autoApproveTimeoutMinutes
          ? _value.autoApproveTimeoutMinutes
          : autoApproveTimeoutMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      rejectionGracePeriodMinutes: null == rejectionGracePeriodMinutes
          ? _value.rejectionGracePeriodMinutes
          : rejectionGracePeriodMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PresenceVerificationSettingsImpl extends _PresenceVerificationSettings {
  const _$PresenceVerificationSettingsImpl(
      {required this.id,
      required this.organizationId,
      this.isEnabled = true,
      this.shadowMode = true,
      this.checkIntervalMinutes = 10,
      this.gracePeriodMinutes = 5,
      this.autoCheckoutOnViolation = false,
      this.maxFieldWorkHours = 4.0,
      this.geofenceRadiusMeters = 150,
      this.requireWifiVerification = false,
      final List<String>? officeWifiSsids,
      this.lowBatteryIntervalMinutes = 15,
      this.criticalBatterySuspend = true,
      this.autoApproveTimeoutMinutes = 30,
      this.rejectionGracePeriodMinutes = 15,
      this.createdAt,
      this.updatedAt})
      : _officeWifiSsids = officeWifiSsids,
        super._();

  factory _$PresenceVerificationSettingsImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$PresenceVerificationSettingsImplFromJson(json);

  @override
  final String id;
  @override
  final String organizationId;
  @override
  @JsonKey()
  final bool isEnabled;
  @override
  @JsonKey()
  final bool shadowMode;
  @override
  @JsonKey()
  final int checkIntervalMinutes;
  @override
  @JsonKey()
  final int gracePeriodMinutes;
  @override
  @JsonKey()
  final bool autoCheckoutOnViolation;
  @override
  @JsonKey()
  final double maxFieldWorkHours;
  @override
  @JsonKey()
  final int geofenceRadiusMeters;
  @override
  @JsonKey()
  final bool requireWifiVerification;
  final List<String>? _officeWifiSsids;
  @override
  List<String>? get officeWifiSsids {
    final value = _officeWifiSsids;
    if (value == null) return null;
    if (_officeWifiSsids is EqualUnmodifiableListView) return _officeWifiSsids;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

// Battery management
  @override
  @JsonKey()
  final int lowBatteryIntervalMinutes;
  @override
  @JsonKey()
  final bool criticalBatterySuspend;
// Manager fallback
  @override
  @JsonKey()
  final int autoApproveTimeoutMinutes;
  @override
  @JsonKey()
  final int rejectionGracePeriodMinutes;
  @override
  final String? createdAt;
  @override
  final String? updatedAt;

  @override
  String toString() {
    return 'PresenceVerificationSettings(id: $id, organizationId: $organizationId, isEnabled: $isEnabled, shadowMode: $shadowMode, checkIntervalMinutes: $checkIntervalMinutes, gracePeriodMinutes: $gracePeriodMinutes, autoCheckoutOnViolation: $autoCheckoutOnViolation, maxFieldWorkHours: $maxFieldWorkHours, geofenceRadiusMeters: $geofenceRadiusMeters, requireWifiVerification: $requireWifiVerification, officeWifiSsids: $officeWifiSsids, lowBatteryIntervalMinutes: $lowBatteryIntervalMinutes, criticalBatterySuspend: $criticalBatterySuspend, autoApproveTimeoutMinutes: $autoApproveTimeoutMinutes, rejectionGracePeriodMinutes: $rejectionGracePeriodMinutes, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PresenceVerificationSettingsImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.organizationId, organizationId) ||
                other.organizationId == organizationId) &&
            (identical(other.isEnabled, isEnabled) ||
                other.isEnabled == isEnabled) &&
            (identical(other.shadowMode, shadowMode) ||
                other.shadowMode == shadowMode) &&
            (identical(other.checkIntervalMinutes, checkIntervalMinutes) ||
                other.checkIntervalMinutes == checkIntervalMinutes) &&
            (identical(other.gracePeriodMinutes, gracePeriodMinutes) ||
                other.gracePeriodMinutes == gracePeriodMinutes) &&
            (identical(
                    other.autoCheckoutOnViolation, autoCheckoutOnViolation) ||
                other.autoCheckoutOnViolation == autoCheckoutOnViolation) &&
            (identical(other.maxFieldWorkHours, maxFieldWorkHours) ||
                other.maxFieldWorkHours == maxFieldWorkHours) &&
            (identical(other.geofenceRadiusMeters, geofenceRadiusMeters) ||
                other.geofenceRadiusMeters == geofenceRadiusMeters) &&
            (identical(
                    other.requireWifiVerification, requireWifiVerification) ||
                other.requireWifiVerification == requireWifiVerification) &&
            const DeepCollectionEquality()
                .equals(other._officeWifiSsids, _officeWifiSsids) &&
            (identical(other.lowBatteryIntervalMinutes,
                    lowBatteryIntervalMinutes) ||
                other.lowBatteryIntervalMinutes == lowBatteryIntervalMinutes) &&
            (identical(other.criticalBatterySuspend, criticalBatterySuspend) ||
                other.criticalBatterySuspend == criticalBatterySuspend) &&
            (identical(other.autoApproveTimeoutMinutes,
                    autoApproveTimeoutMinutes) ||
                other.autoApproveTimeoutMinutes == autoApproveTimeoutMinutes) &&
            (identical(other.rejectionGracePeriodMinutes,
                    rejectionGracePeriodMinutes) ||
                other.rejectionGracePeriodMinutes ==
                    rejectionGracePeriodMinutes) &&
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
      organizationId,
      isEnabled,
      shadowMode,
      checkIntervalMinutes,
      gracePeriodMinutes,
      autoCheckoutOnViolation,
      maxFieldWorkHours,
      geofenceRadiusMeters,
      requireWifiVerification,
      const DeepCollectionEquality().hash(_officeWifiSsids),
      lowBatteryIntervalMinutes,
      criticalBatterySuspend,
      autoApproveTimeoutMinutes,
      rejectionGracePeriodMinutes,
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PresenceVerificationSettingsImplCopyWith<
          _$PresenceVerificationSettingsImpl>
      get copyWith => __$$PresenceVerificationSettingsImplCopyWithImpl<
          _$PresenceVerificationSettingsImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PresenceVerificationSettingsImplToJson(
      this,
    );
  }
}

abstract class _PresenceVerificationSettings
    extends PresenceVerificationSettings {
  const factory _PresenceVerificationSettings(
      {required final String id,
      required final String organizationId,
      final bool isEnabled,
      final bool shadowMode,
      final int checkIntervalMinutes,
      final int gracePeriodMinutes,
      final bool autoCheckoutOnViolation,
      final double maxFieldWorkHours,
      final int geofenceRadiusMeters,
      final bool requireWifiVerification,
      final List<String>? officeWifiSsids,
      final int lowBatteryIntervalMinutes,
      final bool criticalBatterySuspend,
      final int autoApproveTimeoutMinutes,
      final int rejectionGracePeriodMinutes,
      final String? createdAt,
      final String? updatedAt}) = _$PresenceVerificationSettingsImpl;
  const _PresenceVerificationSettings._() : super._();

  factory _PresenceVerificationSettings.fromJson(Map<String, dynamic> json) =
      _$PresenceVerificationSettingsImpl.fromJson;

  @override
  String get id;
  @override
  String get organizationId;
  @override
  bool get isEnabled;
  @override
  bool get shadowMode;
  @override
  int get checkIntervalMinutes;
  @override
  int get gracePeriodMinutes;
  @override
  bool get autoCheckoutOnViolation;
  @override
  double get maxFieldWorkHours;
  @override
  int get geofenceRadiusMeters;
  @override
  bool get requireWifiVerification;
  @override
  List<String>? get officeWifiSsids;
  @override // Battery management
  int get lowBatteryIntervalMinutes;
  @override
  bool get criticalBatterySuspend;
  @override // Manager fallback
  int get autoApproveTimeoutMinutes;
  @override
  int get rejectionGracePeriodMinutes;
  @override
  String? get createdAt;
  @override
  String? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$PresenceVerificationSettingsImplCopyWith<
          _$PresenceVerificationSettingsImpl>
      get copyWith => throw _privateConstructorUsedError;
}
