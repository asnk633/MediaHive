// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'presence_verification_settings.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PresenceVerificationSettingsImpl _$$PresenceVerificationSettingsImplFromJson(
        Map<String, dynamic> json) =>
    _$PresenceVerificationSettingsImpl(
      id: json['id'] as String,
      organizationId: json['organizationId'] as String,
      isEnabled: json['isEnabled'] as bool? ?? true,
      shadowMode: json['shadowMode'] as bool? ?? true,
      checkIntervalMinutes:
          (json['checkIntervalMinutes'] as num?)?.toInt() ?? 10,
      gracePeriodMinutes: (json['gracePeriodMinutes'] as num?)?.toInt() ?? 5,
      autoCheckoutOnViolation:
          json['autoCheckoutOnViolation'] as bool? ?? false,
      maxFieldWorkHours: (json['maxFieldWorkHours'] as num?)?.toDouble() ?? 4.0,
      geofenceRadiusMeters:
          (json['geofenceRadiusMeters'] as num?)?.toInt() ?? 150,
      requireWifiVerification:
          json['requireWifiVerification'] as bool? ?? false,
      officeWifiSsids: (json['officeWifiSsids'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      lowBatteryIntervalMinutes:
          (json['lowBatteryIntervalMinutes'] as num?)?.toInt() ?? 15,
      criticalBatterySuspend: json['criticalBatterySuspend'] as bool? ?? true,
      autoApproveTimeoutMinutes:
          (json['autoApproveTimeoutMinutes'] as num?)?.toInt() ?? 30,
      rejectionGracePeriodMinutes:
          (json['rejectionGracePeriodMinutes'] as num?)?.toInt() ?? 15,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );

Map<String, dynamic> _$$PresenceVerificationSettingsImplToJson(
        _$PresenceVerificationSettingsImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'organizationId': instance.organizationId,
      'isEnabled': instance.isEnabled,
      'shadowMode': instance.shadowMode,
      'checkIntervalMinutes': instance.checkIntervalMinutes,
      'gracePeriodMinutes': instance.gracePeriodMinutes,
      'autoCheckoutOnViolation': instance.autoCheckoutOnViolation,
      'maxFieldWorkHours': instance.maxFieldWorkHours,
      'geofenceRadiusMeters': instance.geofenceRadiusMeters,
      'requireWifiVerification': instance.requireWifiVerification,
      'officeWifiSsids': instance.officeWifiSsids,
      'lowBatteryIntervalMinutes': instance.lowBatteryIntervalMinutes,
      'criticalBatterySuspend': instance.criticalBatterySuspend,
      'autoApproveTimeoutMinutes': instance.autoApproveTimeoutMinutes,
      'rejectionGracePeriodMinutes': instance.rejectionGracePeriodMinutes,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };
