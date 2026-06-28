import 'dart:math';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

/// Background presence verification service — STUB implementation.
///
/// The original implementation used `flutter_background_geolocation` (Transistorsoft),
/// which is a paid plugin that blocks release builds with a license validation dialog.
///
/// This stub preserves the public interface so callers (attendance check-in/out flows)
/// continue to work without changes. Background presence verification is disabled
/// until Phase 2 replaces this with `geolocator` + `workmanager`.
class BackgroundPresenceService {
  static final _logger = LoggerService();

  // Singleton pattern for global access
  static final BackgroundPresenceService _instance = BackgroundPresenceService._internal();
  factory BackgroundPresenceService() => _instance;
  BackgroundPresenceService._internal();

  String? _activeAttendanceId;
  String? _activeUserId;

  // ─── Public Interface (unchanged signatures) ──────────────

  /// Initialize and start background tracking for an active attendance session.
  /// STUB: Stores config in Hive for future use but does NOT start background tracking.
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

    // Store session info in Hive (will be used by Phase 2 WorkManager implementation)
    try {
      final box = await Hive.openBox('bg_presence_config');
      await box.putAll({
        'attendanceId': attendanceId,
        'userId': userId,
        'officeLatitude': officeLatitude,
        'officeLongitude': officeLongitude,
        'officeRadius': officeRadiusMeters,
        'shadowMode': shadowMode,
        'checkIntervalSeconds': checkIntervalMinutes * 60,
        'isPaused': false,
      });
    } catch (e) {
      _logger.warning('BG_PRESENCE: Failed to persist config: $e');
    }

    _logger.warning(
      'BG_PRESENCE: Background geolocation plugin removed (paid license required). '
      'Presence verification is temporarily disabled. '
      'Session stored for attendanceId=$attendanceId',
    );
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

    _logger.info('BG_PRESENCE: Stopped tracking (stub).');
  }

  /// Pause tracking during field work.
  void pauseForFieldWork() {
    _persistPauseState(true);
    _logger.info('BG_PRESENCE: Paused for field work (stub).');
  }

  /// Resume tracking after field work ends.
  void resumeAfterFieldWork() {
    _persistPauseState(false);
    _logger.info('BG_PRESENCE: Resumed after field work (stub).');
  }

  Future<void> _persistPauseState(bool paused) async {
    try {
      final box = await Hive.openBox('bg_presence_config');
      await box.put('isPaused', paused);
    } catch (_) {}
  }

  // ─── Buffered Log Sync ────────────────────────────────────

  /// Sync any presence logs buffered during offline/headless sessions.
  /// This reads from the Hive 'presence_log_buffer' box and uploads to Supabase.
  Future<void> syncBufferedLogs() async {
    try {
      final buffer = await Hive.openBox('presence_log_buffer');
      if (buffer.isEmpty) return;

      final client = Supabase.instance.client;
      final keys = buffer.keys.toList();

      for (final key in keys) {
        try {
          final entry = Map<String, dynamic>.from(buffer.get(key) as Map);
          // Map camelCase keys to snake_case for Supabase
          await client.from('presence_logs').insert({
            'attendance_id': entry['attendanceId'],
            'user_id': entry['userId'],
            'latitude': entry['latitude'],
            'longitude': entry['longitude'],
            'accuracy': entry['accuracy'],
            'is_within_geofence': entry['isWithinGeofence'],
            'is_mock_location': entry['isMockLocation'],
            'verification_method': entry['verificationMethod'],
            'distance_from_office': entry['distanceFromOffice'],
          });
          await buffer.delete(key);
        } catch (e) {
          _logger.warning('BG_PRESENCE: Failed to sync buffered log: $e');
          break; // Stop on first failure, retry later
        }
      }

      if (keys.isNotEmpty) {
        _logger.info('BG_PRESENCE: Synced ${keys.length} buffered presence logs.');
      }
    } catch (e) {
      _logger.warning('BG_PRESENCE: Buffer sync error: $e');
    }
  }

  // ─── Utilities ────────────────────────────────────────────

  /// Haversine distance calculation (meters) — kept for Phase 2
  static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // Pi/180
    final a = 0.5
        - cos((lat2 - lat1) * p) / 2
        + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742000 * asin(sqrt(a)); // 2 * R * asin(sqrt(a))
  }
}
