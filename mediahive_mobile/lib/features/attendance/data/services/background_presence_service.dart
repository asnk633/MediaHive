import 'dart:math';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:workmanager/workmanager.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/services/logger_service.dart';
import '../../../../core/config/env_config.dart';

class BackgroundPresenceService {
  static final _logger = LoggerService();

  // Singleton pattern for global access
  static final BackgroundPresenceService _instance = BackgroundPresenceService._internal();
  factory BackgroundPresenceService() => _instance;
  BackgroundPresenceService._internal();

  String? _activeAttendanceId;
  String? _activeUserId;

  static const String presenceTaskName = 'bg_presence_ping';

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

    // Request Location Permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    
    // Attempt to request Always permission if supported
    if (permission == LocationPermission.whileInUse) {
      // Geolocator requires a separate request for 'always' in some cases, 
      // but whileInUse is enough to schedule Workmanager (though actual access in bg may vary by OS version)
      // Usually you request always permission explicitly if needed.
    }

    try {
      final config = EnvConfig.current;
      final box = await Hive.openBox('bg_presence_config');
      await box.putAll({
        'attendanceId': attendanceId,
        'userId': userId,
        'officeLat': officeLatitude,
        'officeLng': officeLongitude,
        'officeRadius': officeRadiusMeters,
        'shadowMode': shadowMode,
        'checkIntervalSeconds': checkIntervalMinutes * 60,
        'isPaused': false,
        'supabaseUrl': config.supabaseUrl,
        'supabaseAnonKey': config.supabaseAnonKey,
      });
      
      // Register periodic task
      await Workmanager().registerPeriodicTask(
        presenceTaskName,
        presenceTaskName,
        frequency: Duration(minutes: checkIntervalMinutes > 15 ? checkIntervalMinutes : 15),
        constraints: Constraints(
          networkType: NetworkType.connected,
        ),
        existingWorkPolicy: ExistingPeriodicWorkPolicy.update,
      );
      
      _logger.info('BG_PRESENCE: Started Workmanager tracking for attendanceId=$attendanceId');
    } catch (e) {
      _logger.warning('BG_PRESENCE: Failed to persist config or start workmanager: $e');
    }
  }

  Future<void> stopTracking() async {
    _activeAttendanceId = null;
    _activeUserId = null;

    try {
      final box = await Hive.openBox('bg_presence_config');
      await box.clear();
      await Workmanager().cancelByUniqueName(presenceTaskName);
    } catch (_) {}

    _logger.info('BG_PRESENCE: Stopped tracking.');
  }

  void pauseForFieldWork() {
    _persistPauseState(true);
    _logger.info('BG_PRESENCE: Paused for field work.');
  }

  void resumeAfterFieldWork() {
    _persistPauseState(false);
    _logger.info('BG_PRESENCE: Resumed after field work.');
  }

  Future<void> _persistPauseState(bool paused) async {
    try {
      final box = await Hive.openBox('bg_presence_config');
      await box.put('isPaused', paused);
    } catch (_) {}
  }

  Future<void> syncBufferedLogs() async {
    try {
      final buffer = await Hive.openBox<Map>('presence_log_buffer');
      if (buffer.isEmpty) return;

      final client = Supabase.instance.client;
      final keys = buffer.keys.toList();

      for (final key in keys) {
        try {
          final entry = Map<String, dynamic>.from(buffer.get(key) as Map);
          await client.from('presence_logs').insert(entry);
          await buffer.delete(key);
        } catch (e) {
          _logger.warning('BG_PRESENCE: Failed to sync buffered log: $e');
          break; 
        }
      }

      if (keys.isNotEmpty) {
        _logger.info('BG_PRESENCE: Synced ${keys.length} buffered presence logs.');
      }
    } catch (e) {
      _logger.warning('BG_PRESENCE: Buffer sync error: $e');
    }
  }

  static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // Pi/180
    final a = 0.5
        - cos((lat2 - lat1) * p) / 2
        + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742000 * asin(sqrt(a)); 
  }
}
