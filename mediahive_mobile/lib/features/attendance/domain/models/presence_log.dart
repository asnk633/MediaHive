import 'package:freezed_annotation/freezed_annotation.dart';

part 'presence_log.freezed.dart';
part 'presence_log.g.dart';

@freezed
class PresenceLog with _$PresenceLog {
  const factory PresenceLog({
    required String id,
    required String attendanceId,
    required String userId,
    required double latitude,
    required double longitude,
    double? accuracy,
    @Default(true) bool isWithinGeofence,
    @Default(false) bool isMockLocation,
    String? wifiSsid,
    @Default('gps') String verificationMethod, // 'gps', 'wifi', 'geofence', 'hybrid', 'failed'
    double? distanceFromOffice,
    @Default('online') String networkState,    // 'online', 'offline', 'weak'
    int? batteryLevel,
    required String createdAt,
  }) = _PresenceLog;

  factory PresenceLog.fromJson(Map<String, dynamic> json) =>
      _$PresenceLogFromJson(json);
}
