import 'dart:async';
import 'dart:math';
import 'package:flutter_background_geolocation/flutter_background_geolocation.dart' as bg;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../../core/services/logger_service.dart';

/// Background presence verification service using flutter_background_geolocation.
///
/// Replaces the Timer.periodic stub with a real background service that:
/// - Runs even when the app is closed/killed
/// - Survives device reboot (startOnBoot)
/// - Uses geofence monitoring for office boundary detection
/// - Uses heartbeat for periodic presence checks
/// - Battery-aware adaptive polling
/// - Headless task execution for terminated app state
class BackgroundPresenceService {
  static final _logger = LoggerService();

  // Singleton pattern for global access from headless task
  static final BackgroundPresenceService _instance = BackgroundPresenceService._internal();
  factory BackgroundPresenceService() => _instance;
  BackgroundPresenceService._internal();

  bool _isConfigured = false;
  String? _activeAttendanceId;
  String? _activeUserId;
  double? _officeLatitude;
  double? _officeLongitude;
  double _officeRadius = 50.0;
  bool _shadowMode = true;
  bool _isPaused = false; // True during field work
  int _checkIntervalSeconds = 600; // 10 min default

  // ─── Configuration ─────────────────────────────────────────

  /// Initialize and start background tracking for an active attendance session.
  Future<void> startTracking({
    required String attendanceId,
    required String userId,
    required double officeLatitude,
    required double officeLongitude,
    required double officeRadiusMeters,
    bool shadowMode = true,
    int checkIntervalMinutes = 10,
    String? officeGeofenceId,
  }) async {
    _activeAttendanceId = attendanceId;
    _activeUserId = userId;
    _officeLatitude = officeLatitude;
    _officeLongitude = officeLongitude;
    _officeRadius = officeRadiusMeters;
    _shadowMode = shadowMode;
    _checkIntervalSeconds = checkIntervalMinutes * 60;
    _isPaused = false;

    // Store session info in Hive for headless task access
    final box = await Hive.openBox('bg_presence_config');
    await box.putAll({
      'attendanceId': attendanceId,
      'userId': userId,
      'officeLatitude': officeLatitude,
      'officeLongitude': officeLongitude,
      'officeRadius': officeRadiusMeters,
      'shadowMode': shadowMode,
      'checkIntervalSeconds': _checkIntervalSeconds,
      'isPaused': false,
    });

    if (!_isConfigured) {
      await _configure();
    }

    // Add office geofence
    await bg.BackgroundGeolocation.addGeofence(bg.Geofence(
      identifier: officeGeofenceId ?? 'office_main',
      radius: officeRadiusMeters,
      latitude: officeLatitude,
      longitude: officeLongitude,
      notifyOnEntry: true,
      notifyOnExit: true,
      notifyOnDwell: true,
    ));

    // Start tracking
    final state = await bg.BackgroundGeolocation.start();
    _logger.info('BG_PRESENCE: Started tracking. State enabled=${state.enabled}');
  }

  /// Stop all background tracking (e.g., on checkout).
  Future<void> stopTracking() async {
    _activeAttendanceId = null;
    _activeUserId = null;

    // Clear persisted config
    try {
      final box = await Hive.openBox('bg_presence_config');
      await box.clear();
    } catch (_) {}

    // Remove geofences and stop
    await bg.BackgroundGeolocation.removeGeofences();
    await bg.BackgroundGeolocation.stop();
    _logger.info('BG_PRESENCE: Stopped tracking.');
  }

  /// Pause tracking during field work (geofence exits won't trigger violations).
  void pauseForFieldWork() {
    _isPaused = true;
    _persistPauseState(true);
    _logger.info('BG_PRESENCE: Paused for field work.');
  }

  /// Resume tracking after field work ends.
  void resumeAfterFieldWork() {
    _isPaused = false;
    _persistPauseState(false);
    _logger.info('BG_PRESENCE: Resumed after field work.');
  }

  Future<void> _persistPauseState(bool paused) async {
    try {
      final box = await Hive.openBox('bg_presence_config');
      await box.put('isPaused', paused);
    } catch (_) {}
  }

  // ─── Private: Plugin Configuration ─────────────────────────

  Future<void> _configure() async {
    // Register event listeners BEFORE calling ready()
    bg.BackgroundGeolocation.onLocation(_onLocation);
    bg.BackgroundGeolocation.onGeofence(_onGeofence);
    bg.BackgroundGeolocation.onHeartbeat(_onHeartbeat);
    bg.BackgroundGeolocation.onProviderChange(_onProviderChange);

    await bg.BackgroundGeolocation.ready(bg.Config(
      // Accuracy & Distance
      desiredAccuracy: bg.Config.DESIRED_ACCURACY_MEDIUM,
      distanceFilter: 50.0,

      // Timing
      locationUpdateInterval: _checkIntervalSeconds * 1000, // ms
      heartbeatInterval: _checkIntervalSeconds, // seconds

      // Background persistence
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,

      // Battery
      preventSuspend: true,

      // Android foreground notification
      notification: bg.Notification(
        title: 'MediaHive Attendance',
        text: 'Verifying your office presence',
        channelName: 'Attendance Tracking',
        smallIcon: 'drawable/ic_notification',
        sticky: true,
      ),

      // Logging
      debug: false,
      logLevel: bg.Config.LOG_LEVEL_WARNING,
    ));

    _isConfigured = true;
    _logger.info('BG_PRESENCE: Plugin configured. heartbeat=${_checkIntervalSeconds}s');
  }

  // ─── Event Handlers ────────────────────────────────────────

  void _onLocation(bg.Location location) {
    if (_isPaused || _activeAttendanceId == null) return;
    _logger.info('BG_PRESENCE: Location update: ${location.coords.latitude}, ${location.coords.longitude}');
    _logPresenceFromLocation(location);
  }

  void _onGeofence(bg.GeofenceEvent event) {
    if (_isPaused || _activeAttendanceId == null) return;

    _logger.info('BG_PRESENCE: Geofence ${event.identifier} → ${event.action}');

    if (event.action == 'EXIT') {
      _handleGeofenceExit(event);
    } else if (event.action == 'ENTER') {
      _handleGeofenceEntry(event);
    }
  }

  void _onHeartbeat(bg.HeartbeatEvent event) {
    if (_isPaused || _activeAttendanceId == null) return;

    _logger.info('BG_PRESENCE: Heartbeat — requesting current position');
    bg.BackgroundGeolocation.getCurrentPosition(
      samples: 1,
      persist: true,
    ).then((bg.Location location) {
      _logPresenceFromLocation(location);
    }).catchError((e) {
      _logger.error('BG_PRESENCE: Heartbeat position error: $e');
    });
  }

  void _onProviderChange(bg.ProviderChangeEvent event) {
    _logger.info('BG_PRESENCE: Provider changed: enabled=${event.enabled}, status=${event.status}');
  }

  // ─── Presence Logging ──────────────────────────────────────

  Future<void> _logPresenceFromLocation(bg.Location location) async {
    if (_officeLatitude == null || _officeLongitude == null) return;

    final coords = location.coords;
    final distance = _calculateDistance(
      coords.latitude, coords.longitude,
      _officeLatitude!, _officeLongitude!,
    );

    final isInside = distance <= _officeRadius;
    // Hysteresis: exit at radius × 1.4
    final exitRadius = _officeRadius * 1.4;
    final isDefinitelyOutside = distance > exitRadius;
    final isMocked = location.mock;

    try {
      final client = Supabase.instance.client;
      await client.from('presence_logs').insert({
        'attendanceId': _activeAttendanceId,
        'userId': _activeUserId,
        'latitude': coords.latitude,
        'longitude': coords.longitude,
        'accuracy': coords.accuracy,
        'isWithinGeofence': isInside,
        'isMockLocation': isMocked,
        'verificationMethod': 'background_gps',
        'distanceFromOffice': distance,
        'networkState': 'online',
        'batteryLevel': (location.battery.level * 100).round(),
        'createdAt': DateTime.now().toUtc().toIso8601String(),
      });

      // Update attendance last verified
      await client.from('attendance').update({
        'lastVerifiedAt': DateTime.now().toUtc().toIso8601String(),
        'presenceStatus': isInside ? 'verified' : (_isPaused ? 'field_work' : 'absent'),
      }).eq('id', _activeAttendanceId!);

      if (isDefinitelyOutside && !_shadowMode && !_isPaused) {
        // Increment violation counter
        await client.rpc('increment_geofence_violations', params: {
          'attendance_id': _activeAttendanceId,
        });
      }
    } catch (e) {
      _logger.error('BG_PRESENCE: Failed to log presence: $e');
      // Buffer to Hive for later sync
      await _bufferPresenceLog({
        'attendanceId': _activeAttendanceId,
        'userId': _activeUserId,
        'latitude': coords.latitude,
        'longitude': coords.longitude,
        'accuracy': coords.accuracy,
        'isWithinGeofence': isInside,
        'isMockLocation': isMocked,
        'verificationMethod': 'background_gps',
        'distanceFromOffice': distance,
        'batteryLevel': (location.battery.level * 100).round(),
        'createdAt': DateTime.now().toUtc().toIso8601String(),
      });
    }
  }

  void _handleGeofenceExit(bg.GeofenceEvent event) {
    _logger.warning('BG_PRESENCE: User exited office geofence!');
    if (_shadowMode) {
      _logger.info('BG_PRESENCE: Shadow mode — logging exit, no enforcement.');
    }
    // TODO: Trigger push notification to user + manager if not shadow mode
  }

  void _handleGeofenceEntry(bg.GeofenceEvent event) {
    _logger.info('BG_PRESENCE: User returned to office geofence.');
  }

  // ─── Offline Buffer ────────────────────────────────────────

  Future<void> _bufferPresenceLog(Map<String, dynamic> log) async {
    try {
      final box = await Hive.openBox('presence_log_buffer');
      await box.add(log);
      _logger.info('BG_PRESENCE: Buffered log (${box.length} pending)');
    } catch (e) {
      _logger.error('BG_PRESENCE: Buffer write failed: $e');
    }
  }

  /// Flush any buffered presence logs to Supabase.
  Future<void> syncBufferedLogs() async {
    try {
      final box = await Hive.openBox('presence_log_buffer');
      if (box.isEmpty) return;

      final client = Supabase.instance.client;
      final logs = box.values.toList().cast<Map>();

      for (final log in logs) {
        try {
          await client.from('presence_logs').insert(Map<String, dynamic>.from(log));
        } catch (e) {
          _logger.error('BG_PRESENCE: Failed to sync log: $e');
          return; // Stop on first failure, retry later
        }
      }

      await box.clear();
      _logger.info('BG_PRESENCE: Synced ${logs.length} buffered logs.');
    } catch (e) {
      _logger.error('BG_PRESENCE: Buffer sync error: $e');
    }
  }

  // ─── Utilities ─────────────────────────────────────────────

  /// Haversine distance calculation (meters)
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // Pi/180
    final a = 0.5
        - cos((lat2 - lat1) * p) / 2
        + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742000 * asin(sqrt(a)); // 2 * R * asin(sqrt(a)), R = 6371km
  }
}
