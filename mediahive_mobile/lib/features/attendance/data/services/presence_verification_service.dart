import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_record.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/nfc_tag.dart';
import 'mock_location_detector.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

/// Continuous background presence verification service.
///
/// Periodically checks GPS/WiFi to verify the team member is at their
/// check-in location. Logs every check to `presence_logs` table.
///
/// Key features:
/// - Configurable check intervals with battery-aware throttling
/// - Grace period before flagging geofence violations
/// - Offline buffering via Hive (syncs when connectivity resumes)
/// - Shadow mode: logs violations without enforcement for calibration
/// - Pauses during field work sessions
/// - WiFi SSID cross-check for indoor accuracy
class PresenceVerificationService {
  final SupabaseClient _client;
  final MockLocationDetector _mockDetector;
  final _logger = LoggerService();

  // Timers
  Timer? _verificationTimer;
  Timer? _graceTimer;

  // State
  bool _graceActive = false;
  int _consecutiveViolations = 0;
  String? _activeAttendanceId;
  String? _activeUserId;
  NfcTag? _activeTag;
  bool _isPaused = false;

  // Configuration (loaded from presence_verification_settings)
  int _checkIntervalMinutes = 10;
  int _gracePeriodMinutes = 5;
  bool _autoCheckoutOnViolation = false;
  bool _shadowMode = true; // Default: shadow mode ON for safe rollout
  int _lowBatteryIntervalMinutes = 15;
  bool _criticalBatterySuspend = true;

  // Offline buffer box name
  static const String _offlineBoxName = 'presence_log_buffer';

  PresenceVerificationService(this._client, this._mockDetector);

  // ─── Public API ───────────────────────────────────────────

  /// Start monitoring for an active attendance session.
  Future<void> start({
    required AttendanceRecord session,
    required NfcTag tag,
  }) async {
    stop();
    _activeAttendanceId = session.id;
    _activeUserId = session.userId;
    _activeTag = tag;
    _consecutiveViolations = 0;
    _graceActive = false;
    _isPaused = false;

    // Load org-level settings (fallback to defaults if not found)
    await _loadSettings();

    // Sync any buffered offline logs from previous sessions
    await _syncOfflineBuffer();

    // Start the periodic verification loop
    _startTimer(_checkIntervalMinutes);

    // Run initial check after a short delay
    Future.delayed(const Duration(seconds: 30), () => _performVerification());

    _logger.info('PRESENCE_VERIFY: Started monitoring for user ${session.userId} '
        '(interval: ${_checkIntervalMinutes}min, grace: ${_gracePeriodMinutes}min, shadow: $_shadowMode)');
  }

  /// Stop all monitoring and clean up timers.
  void stop() {
    _verificationTimer?.cancel();
    _graceTimer?.cancel();
    _verificationTimer = null;
    _graceTimer = null;
    _graceActive = false;
    _isPaused = false;
    _activeAttendanceId = null;
    _activeUserId = null;
    _activeTag = null;
    _logger.info('PRESENCE_VERIFY: Stopped');
  }

  /// Pause verification (e.g., during field work).
  /// Geofence checks stop but the service remembers its state for resumption.
  void pause() {
    _verificationTimer?.cancel();
    _graceTimer?.cancel();
    _graceActive = false;
    _isPaused = true;
    _logger.info('PRESENCE_VERIFY: Paused (field work mode)');
  }

  /// Resume verification after field work ends.
  void resume() {
    if (_activeAttendanceId == null || _activeTag == null) return;
    _isPaused = false;
    _consecutiveViolations = 0;
    _graceActive = false;
    _startTimer(_checkIntervalMinutes);
    _logger.info('PRESENCE_VERIFY: Resumed');
  }

  // Getters for UI/provider access
  bool get isActive => _verificationTimer != null && !_isPaused;
  bool get isPaused => _isPaused;
  bool get isGracePeriodActive => _graceActive;
  int get consecutiveViolations => _consecutiveViolations;
  bool get isShadowMode => _shadowMode;

  // ─── Private: Timer Management ────────────────────────────

  void _startTimer(int intervalMinutes) {
    _verificationTimer?.cancel();
    _verificationTimer = Timer.periodic(
      Duration(minutes: intervalMinutes),
      (_) => _performVerification(),
    );
  }

  // ─── Private: Core Verification ───────────────────────────

  /// Main verification cycle — called every N minutes.
  Future<void> _performVerification() async {
    if (_activeAttendanceId == null || _activeTag == null || _isPaused) return;

    try {
      // ─── Battery check: throttle or suspend if low ───
      final battery = Battery();
      int? batteryLevel;
      try {
        batteryLevel = await battery.batteryLevel;
      } catch (_) {
        // Battery read can fail on some devices/emulators
        batteryLevel = null;
      }

      // Apply battery throttling
      if (batteryLevel != null && batteryLevel < 10 && _criticalBatterySuspend) {
        _logger.info('PRESENCE_VERIFY: Battery critical ($batteryLevel%). Skipping verification.');
        return;
      }

      // ─── Network state check ───
      final connectivityResult = await Connectivity().checkConnectivity();
      final String networkState;
      if (connectivityResult == ConnectivityResult.none) {
        networkState = 'offline';
      } else if (connectivityResult == ConnectivityResult.mobile) {
        networkState = 'weak'; // Mobile data can be spotty
      } else {
        networkState = 'online';
      }

      // ─── GPS check ───
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        await _logPresence(
          latitude: 0,
          longitude: 0,
          isWithinGeofence: false,
          verificationMethod: 'failed',
          distanceFromOffice: -1,
          networkState: networkState,
          batteryLevel: batteryLevel,
        );
        return;
      }

      Position position;
      try {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.low, // Low accuracy for battery savings
          timeLimit: const Duration(seconds: 10),
        );
      } on TimeoutException {
        _logger.warning('PRESENCE_VERIFY: GPS timeout. Logging as failed.');
        await _logPresence(
          latitude: 0,
          longitude: 0,
          isWithinGeofence: false,
          verificationMethod: 'failed',
          distanceFromOffice: -1,
          networkState: networkState,
          batteryLevel: batteryLevel,
        );
        return;
      }

      // ─── Mock location detection ───
      final isMocked = _mockDetector.isMockedLocation(position);

      // ─── Distance calculation ───
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        _activeTag!.latitude,
        _activeTag!.longitude,
      );
      final isInside = distance <= _activeTag!.radius;

      // ─── Geofence hysteresis ───
      // Prevents boundary oscillation on cheap GPS devices (±20-50m accuracy).
      // Enter threshold: configured radius (e.g. 50m)
      // Exit threshold: radius × 1.4 (e.g. 70m for a 50m geofence)
      // This means we only trigger "exit" when definitively outside, not during
      // GPS drift at the boundary edge.
      final double exitRadius = _activeTag!.radius * 1.4;
      final bool isDefinitelyOutside = distance > exitRadius;

      // ─── WiFi cross-check (supplementary indoor signal) ───
      String? wifiSsid;
      String verificationMethod = 'gps';
      try {
        final info = NetworkInfo();
        wifiSsid = await info.getWifiName();
        if (wifiSsid != null && _activeTag!.wifiSsids != null && _activeTag!.wifiSsids!.isNotEmpty) {
          final approvedList = _activeTag!.wifiSsids!
              .split(',')
              .map((s) => s.replaceAll('"', '').trim().toUpperCase());
          final normalizedActive = wifiSsid.replaceAll('"', '').trim().toUpperCase();
          if (approvedList.contains(normalizedActive)) {
            verificationMethod = isInside ? 'hybrid' : 'wifi';
          }
        }
      } catch (_) {
        // WiFi check is supplementary — don't fail verification for it
      }

      // ─── Log the verification ───
      await _logPresence(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        isWithinGeofence: isInside,
        isMockLocation: isMocked,
        wifiSsid: wifiSsid,
        verificationMethod: verificationMethod,
        distanceFromOffice: distance,
        networkState: networkState,
        batteryLevel: batteryLevel,
      );

      // ─── Handle geofence violations with hysteresis ───
      // "Present" = inside GPS radius OR connected to approved WiFi
      // "Exit" = outside hysteresis exit radius AND not on approved WiFi
      final bool isOnApprovedWifi = verificationMethod == 'wifi' || verificationMethod == 'hybrid';
      final bool isPresent = isInside || isOnApprovedWifi;

      if (isDefinitelyOutside && !isOnApprovedWifi) {
        // Definitively outside the exit radius with no WiFi rescue
        _handleGeofenceExit(distance);
      } else if (isPresent) {
        // Inside enter radius or on approved WiFi — cancel any grace
        _handleGeofenceEntry();
      }
      // Note: if distance is between radius and exitRadius (hysteresis zone),
      // we do nothing — maintain the current state. This prevents oscillation.

    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Error during verification: $e');
    }
  }

  // ─── Private: Geofence Event Handlers ─────────────────────

  void _handleGeofenceExit(double distance) {
    if (!_graceActive) {
      _graceActive = true;
      _logger.info('PRESENCE_VERIFY: User outside geofence '
          '(${distance.toStringAsFixed(0)}m). Grace period started '
          '($_gracePeriodMinutes min).');

      _graceTimer = Timer(Duration(minutes: _gracePeriodMinutes), () {
        _consecutiveViolations++;
        _logger.warning('PRESENCE_VERIFY: Grace period expired. '
            'Violation #$_consecutiveViolations');

        // Update attendance record with violation count
        _updateViolationCount();

        // In shadow mode, only log — don't notify or enforce
        if (!_shadowMode) {
          _logViolationEvent();
        } else {
          _logShadowViolationEvent();
        }
      });
    }
  }

  void _handleGeofenceEntry() {
    if (_graceActive) {
      _graceTimer?.cancel();
      _graceActive = false;
      _logger.info('PRESENCE_VERIFY: User returned inside geofence. Grace period cancelled.');
    }
  }

  // ─── Private: Logging to Supabase ─────────────────────────

  Future<void> _logPresence({
    required double latitude,
    required double longitude,
    double? accuracy,
    required bool isWithinGeofence,
    bool isMockLocation = false,
    String? wifiSsid,
    required String verificationMethod,
    required double distanceFromOffice,
    required String networkState,
    int? batteryLevel,
  }) async {
    final logEntry = {
      'attendanceId': _activeAttendanceId,
      'userId': _activeUserId,
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'isWithinGeofence': isWithinGeofence,
      'isMockLocation': isMockLocation,
      'wifiSsid': wifiSsid,
      'verificationMethod': verificationMethod,
      'distanceFromOffice': distanceFromOffice,
      'networkState': networkState,
      'batteryLevel': batteryLevel,
    };

    // Check connectivity — if offline, buffer locally
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult == ConnectivityResult.none) {
      await _bufferOffline(logEntry);
      return;
    }

    try {
      await _client.from('presence_logs').insert(logEntry);

      // Also update last_verified_at on the attendance record
      await _client.from('attendance').update({
        'lastVerifiedAt': DateTime.now().toUtc().toIso8601String(),
        'presenceStatus': isWithinGeofence ? 'verified' : 'absent',
      }).eq('id', _activeAttendanceId!);
    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Failed to log presence to Supabase. Buffering locally: $e');
      await _bufferOffline(logEntry);
    }
  }

  Future<void> _updateViolationCount() async {
    try {
      await _client.from('attendance').update({
        'geofenceViolations': _consecutiveViolations,
        'presenceStatus': 'absent',
      }).eq('id', _activeAttendanceId!);
    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Failed to update violation count: $e');
    }
  }

  Future<void> _logViolationEvent() async {
    try {
      await _client.from('attendance_events').insert({
        'attendanceId': _activeAttendanceId,
        'userId': _activeUserId,
        'eventType': 'presence_violation',
        'eventTime': DateTime.now().toUtc().toIso8601String(),
        'notes': 'User was outside geofence for $_gracePeriodMinutes minutes. '
            'Violation #$_consecutiveViolations. ENFORCEMENT MODE.',
      });
    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Failed to log violation event: $e');
    }
  }

  Future<void> _logShadowViolationEvent() async {
    try {
      await _client.from('attendance_events').insert({
        'attendanceId': _activeAttendanceId,
        'userId': _activeUserId,
        'eventType': 'presence_violation_shadow',
        'eventTime': DateTime.now().toUtc().toIso8601String(),
        'notes': 'SHADOW MODE: User was outside geofence for $_gracePeriodMinutes minutes. '
            'Violation #$_consecutiveViolations. No enforcement action taken.',
      });
    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Failed to log shadow violation: $e');
    }
  }

  // ─── Private: Offline Buffer (Hive) ───────────────────────
  // Stores presence logs locally when device is offline, then syncs
  // to Supabase when connectivity resumes.

  Future<void> _bufferOffline(Map<String, dynamic> logEntry) async {
    try {
      final box = await Hive.openBox(_offlineBoxName);
      final key = 'log_${DateTime.now().millisecondsSinceEpoch}';
      await box.put(key, jsonEncode(logEntry));
      _logger.info('PRESENCE_VERIFY: Buffered log offline (${box.length} pending)');
    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Failed to buffer offline: $e');
    }
  }

  /// Sync any buffered offline presence logs to Supabase.
  /// Called on service start and can be called manually.
  Future<void> _syncOfflineBuffer() async {
    try {
      final box = await Hive.openBox(_offlineBoxName);
      if (box.isEmpty) return;

      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult == ConnectivityResult.none) return;

      _logger.info('PRESENCE_VERIFY: Syncing ${box.length} buffered logs...');

      final keysToDelete = <dynamic>[];
      for (final key in box.keys) {
        try {
          final jsonStr = box.get(key) as String?;
          if (jsonStr == null) continue;

          final logEntry = jsonDecode(jsonStr) as Map<String, dynamic>;
          await _client.from('presence_logs').insert(logEntry);
          keysToDelete.add(key);
        } catch (e) {
          _logger.error('PRESENCE_VERIFY: Failed to sync buffered log $key: $e');
          // Don't delete — will retry next time
        }
      }

      // Delete successfully synced entries
      for (final key in keysToDelete) {
        await box.delete(key);
      }

      _logger.info('PRESENCE_VERIFY: Synced ${keysToDelete.length}/${box.length + keysToDelete.length} buffered logs');
    } catch (e) {
      _logger.error('PRESENCE_VERIFY: Failed to sync offline buffer: $e');
    }
  }

  // ─── Private: Settings ────────────────────────────────────

  Future<void> _loadSettings() async {
    try {
      final result = await _client
          .from('presence_verification_settings')
          .select()
          .limit(1)
          .maybeSingle();

      if (result != null) {
        _checkIntervalMinutes = result['checkIntervalMinutes'] ?? 10;
        _gracePeriodMinutes = result['gracePeriodMinutes'] ?? 5;
        _autoCheckoutOnViolation = result['autoCheckoutOnViolation'] ?? false;
        _shadowMode = result['shadowMode'] ?? true;
        _lowBatteryIntervalMinutes = result['lowBatteryIntervalMinutes'] ?? 15;
        _criticalBatterySuspend = result['criticalBatterySuspend'] ?? true;
      }
    } catch (e) {
      _logger.info('PRESENCE_VERIFY: Using default settings (table may not exist yet)');
    }
  }
}
