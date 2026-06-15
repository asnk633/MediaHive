import 'package:freezed_annotation/freezed_annotation.dart';

part 'presence_verification_settings.freezed.dart';
part 'presence_verification_settings.g.dart';

/// Organization-level settings for presence verification.
///
/// Configures check intervals, battery policy, shadow mode,
/// rejection grace periods, and manager fallback timeouts.
@freezed
class PresenceVerificationSettings with _$PresenceVerificationSettings {
  const PresenceVerificationSettings._();

  const factory PresenceVerificationSettings({
    required String id,
    required String organizationId,
    @Default(true) bool isEnabled,
    @Default(true) bool shadowMode,
    @Default(10) int checkIntervalMinutes,
    @Default(5) int gracePeriodMinutes,
    @Default(false) bool autoCheckoutOnViolation,
    @Default(4.0) double maxFieldWorkHours,
    @Default(150) int geofenceRadiusMeters,
    @Default(false) bool requireWifiVerification,
    List<String>? officeWifiSsids,
    // Battery management
    @Default(15) int lowBatteryIntervalMinutes,
    @Default(true) bool criticalBatterySuspend,
    // Manager fallback
    @Default(30) int autoApproveTimeoutMinutes,
    @Default(15) int rejectionGracePeriodMinutes,
    String? createdAt,
    String? updatedAt,
  }) = _PresenceVerificationSettings;

  factory PresenceVerificationSettings.fromJson(Map<String, dynamic> json) =>
      _$PresenceVerificationSettingsFromJson(json);

  /// Whether the system is in calibration mode (log-only, no enforcement)
  bool get isCalibrating => shadowMode;

  /// Effective check interval considering battery level
  int effectiveInterval({int? batteryLevel}) {
    if (batteryLevel != null && batteryLevel < 20) {
      return lowBatteryIntervalMinutes;
    }
    return checkIntervalMinutes;
  }

  /// Whether verification should be suspended due to critical battery
  bool shouldSuspend({int? batteryLevel}) {
    return criticalBatterySuspend && batteryLevel != null && batteryLevel < 10;
  }
}
