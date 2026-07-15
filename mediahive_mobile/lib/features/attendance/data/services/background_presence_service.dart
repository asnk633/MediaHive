import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:ui';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';
import 'package:hive/hive.dart';
import 'package:mediahive_mobile/core/config/env_config.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';
import 'package:mediahive_mobile/core/services/notification_service.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Background presence verification service using flutter_background_service & geolocator.
class BackgroundPresenceService {
  static final _logger = LoggerService();

  // Singleton pattern for global access
  static final BackgroundPresenceService _instance = BackgroundPresenceService._internal();
  factory BackgroundPresenceService() => _instance;
  BackgroundPresenceService._internal();

  String? _activeAttendanceId;
  String? _activeUserId;

  // ─── Public Interface ──────────────────────────────────────

  /// Initialize the background service at app startup (called in main.dart).
  Future<void> initializeService() async {
    final service = FlutterBackgroundService();

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false, // Started explicitly during check-in or auto-resumed on boot if active
        isForegroundMode: true,
        notificationChannelId: 'mediahive_bg_presence',
        initialNotificationTitle: 'MediaHive Presence Tracker',
        initialNotificationContent: 'Monitoring active session presence...',
        foregroundServiceTypes: [AndroidForegroundType.location],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
      ),
    );

    _logger.info('BG_PRESENCE: Service initialized.');
  }

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

    try {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'active_attendance_id', value: attendanceId);
      await storage.write(key: 'active_user_id', value: userId);
      await storage.write(key: 'office_latitude', value: officeLatitude.toString());
      await storage.write(key: 'office_longitude', value: officeLongitude.toString());
      await storage.write(key: 'office_radius', value: officeRadiusMeters.toString());
      await storage.write(key: 'is_paused', value: 'false');

      // Save Supabase config so isolate can connect
      final config = EnvConfig.current;
      await storage.write(key: 'supabase_url', value: config.supabaseUrl);
      await storage.write(key: 'supabase_anon_key', value: config.supabaseAnonKey);

      // Save tokens
      final session = Supabase.instance.client.auth.currentSession;
      if (session != null) {
        await storage.write(key: 'access_token', value: session.accessToken);
        await storage.write(key: 'refresh_token', value: session.refreshToken);
        final expiresAt = DateTime.now().add(Duration(seconds: session.expiresIn ?? 3600));
        await storage.write(key: 'token_expires_at', value: expiresAt.toIso8601String());
      }

      final isRunning = await FlutterBackgroundService().isRunning();
      if (!isRunning) {
        await FlutterBackgroundService().startService();
      } else {
        FlutterBackgroundService().invoke('sessionUpdated');
      }

      _logger.info('BG_PRESENCE: Started tracking for attendanceId=$attendanceId');
    } catch (e) {
      _logger.error('BG_PRESENCE: Failed to start tracking: $e');
    }
  }

  /// Stop all background tracking (e.g., on checkout).
  Future<void> stopTracking() async {
    _activeAttendanceId = null;
    _activeUserId = null;

    try {
      const storage = FlutterSecureStorage();
      await storage.delete(key: 'active_attendance_id');
      await storage.delete(key: 'active_user_id');
      await storage.delete(key: 'office_latitude');
      await storage.delete(key: 'office_longitude');
      await storage.delete(key: 'office_radius');
      await storage.delete(key: 'is_paused');
      await storage.delete(key: 'access_token');
      await storage.delete(key: 'refresh_token');
      await storage.delete(key: 'token_expires_at');

      FlutterBackgroundService().invoke('stopService');
      _logger.info('BG_PRESENCE: Stopped tracking.');
    } catch (e) {
      _logger.warning('BG_PRESENCE: Failed to clear config: $e');
    }
  }

  /// Pause tracking during field work.
  void pauseForFieldWork() async {
    try {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'is_paused', value: 'true');
      FlutterBackgroundService().invoke('pauseTracking');
      _logger.info('BG_PRESENCE: Paused tracking.');
    } catch (_) {}
  }

  /// Resume tracking after field work ends.
  void resumeAfterFieldWork() async {
    try {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'is_paused', value: 'false');
      FlutterBackgroundService().invoke('resumeTracking');
      _logger.info('BG_PRESENCE: Resumed tracking.');
    } catch (_) {}
  }

  /// Sync any presence logs buffered during offline/headless sessions.
  Future<void> syncBufferedLogs() async {
    // Legacy sync method: main isolate can also trigger cleanup of main's local buffers if any
    try {
      final buffer = await Hive.openBox('presence_log_buffer');
      if (buffer.isEmpty) return;

      final client = Supabase.instance.client;
      final keys = buffer.keys.toList();

      for (final key in keys) {
        try {
          final entry = Map<String, dynamic>.from(buffer.get(key) as Map);
          await client.from('presence_logs').insert({
            'attendanceId': entry['attendanceId'],
            'userId': entry['userId'],
            'latitude': entry['latitude'],
            'longitude': entry['longitude'],
            'accuracy': entry['accuracy'],
            'isWithinGeofence': entry['isWithinGeofence'],
            'isMockLocation': entry['isMockLocation'],
            'verificationMethod': entry['verificationMethod'] ?? 'background_polling',
            'distanceFromOffice': entry['distanceFromOffice'],
          });
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

  // ─── Utilities ────────────────────────────────────────────

  /// Haversine distance calculation (meters)
  static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295; // Pi/180
    final a = 0.5
        - cos((lat2 - lat1) * p) / 2
        + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742000 * asin(sqrt(a)); // 2 * R * asin(sqrt(a))
  }
}

// ─── Headless Background Entry Point ────────────────────────

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  try {
    DartPluginRegistrant.ensureInitialized();

    if (service is AndroidServiceInstance) {
      service.on('setAsForeground').listen((event) {
        service.setAsForegroundService();
      });

      service.on('setAsBackground').listen((event) {
        service.setAsBackgroundService();
      });
    }

    const storage = FlutterSecureStorage();

    // 1. Check if we have an active attendance session stored
    final attendanceId = await storage.read(key: 'active_attendance_id');
    if (attendanceId == null) {
      debugPrint('BG_PRESENCE_ISOLATE: No active session. Terminating background service.');
      service.stopSelf();
      return;
    }

    // 2. Initialize Hive in private subdirectory
    final appDir = await getApplicationDocumentsDirectory();
    Hive.init(path.join(appDir.path, 'bg_presence'));
    final privateBox = await Hive.openBox('bg_presence_private');
    final bufferBox = await Hive.openBox('presence_log_buffer_bg');

    Completer<Map<String, String>?>? refreshCompleter;
    SupabaseClient? supabaseClient;

    // Listen to response for token refreshes from main isolate
    service.on('tokenRefreshResponse').listen((event) {
      if (event != null && refreshCompleter != null && !refreshCompleter!.isCompleted) {
        final data = Map<String, String>.from(event);
        refreshCompleter!.complete(data);
      }
    });

    service.on('stopService').listen((event) {
      service.stopSelf();
    });

    service.on('sessionUpdated').listen((event) async {
      await privateBox.put('next_scheduled_check', DateTime.now().millisecondsSinceEpoch);
    });

    Future<SupabaseClient?> getSupabaseClient() async {
      if (supabaseClient != null) return supabaseClient;
      final url = await storage.read(key: 'supabase_url');
      final anonKey = await storage.read(key: 'supabase_anon_key');
      if (url == null || anonKey == null) return null;
      supabaseClient = SupabaseClient(url, anonKey);
      return supabaseClient;
    }

    Future<String?> getValidAccessToken() async {
      final storedAccessToken = await storage.read(key: 'access_token');
      final storedRefreshToken = await storage.read(key: 'refresh_token');
      final expiresAtStr = await storage.read(key: 'token_expires_at');

      if (storedAccessToken == null || storedRefreshToken == null) return null;

      final expiresAt = expiresAtStr != null ? DateTime.tryParse(expiresAtStr) : null;
      if (expiresAt != null && expiresAt.difference(DateTime.now()).inMinutes > 5) {
        return storedAccessToken;
      }

      // Handshake token refresh with main app
      debugPrint('BG_PRESENCE_ISOLATE: Token expired or expiring soon. Requesting refresh.');
      refreshCompleter = Completer<Map<String, String>?>();
      service.invoke('requestRefresh');

      Map<String, String>? refreshed;
      try {
        refreshed = await refreshCompleter!.future.timeout(const Duration(seconds: 5));
      } catch (_) {}
      refreshCompleter = null;

      if (refreshed != null) {
        return refreshed['accessToken'];
      }

      // Main app not active or failed to respond -> refresh directly via Supabase client
      debugPrint('BG_PRESENCE_ISOLATE: Handshake failed/timed out. Refreshing session directly.');
      try {
        final client = await getSupabaseClient();
        if (client == null) return null;

        final res = await client.auth.setSession(storedRefreshToken);
        final session = res.session;
        if (session != null) {
          final newAccess = session.accessToken;
          final newRefresh = session.refreshToken;
          final newExpiresAt = DateTime.now().add(Duration(seconds: session.expiresIn ?? 3600));

          await storage.write(key: 'access_token', value: newAccess);
          await storage.write(key: 'refresh_token', value: newRefresh);
          await storage.write(key: 'token_expires_at', value: newExpiresAt.toIso8601String());

          return newAccess;
        }
      } catch (e) {
        debugPrint('BG_PRESENCE_ISOLATE: Direct refresh failed: $e');
      }

      return null;
    }

    Future<void> runPresenceCheck() async {
      try {
        final isPausedStr = await storage.read(key: 'is_paused');
        if (isPausedStr == 'true') {
          debugPrint('BG_PRESENCE_ISOLATE: Skipped (tracking is paused for field work).');
          return;
        }

        final activeAttendanceId = await storage.read(key: 'active_attendance_id');
        final activeUserId = await storage.read(key: 'active_user_id');
        final officeLatStr = await storage.read(key: 'office_latitude');
        final officeLngStr = await storage.read(key: 'office_longitude');
        final officeRadiusStr = await storage.read(key: 'office_radius');

        if (activeAttendanceId == null || activeUserId == null || officeLatStr == null || officeLngStr == null || officeRadiusStr == null) {
          debugPrint('BG_PRESENCE_ISOLATE: Missing config. Stopping service.');
          service.stopSelf();
          return;
        }

        final officeLatitude = double.parse(officeLatStr);
        final officeLongitude = double.parse(officeLngStr);
        final officeRadius = double.parse(officeRadiusStr);

        // Check network connectivity
        final connectivityResult = await Connectivity().checkConnectivity();
        if (connectivityResult == ConnectivityResult.none) {
          debugPrint('BG_PRESENCE_ISOLATE: Offline. Scheduling retry in 1 minute.');
          await privateBox.put('next_scheduled_check', DateTime.now().add(const Duration(minutes: 1)).millisecondsSinceEpoch);
          return;
        }

        // Query location
        Position? position;
        try {
          position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 15),
          );
        } catch (e) {
          debugPrint('BG_PRESENCE_ISOLATE: Location error: $e. Scheduling retry in 1 minute.');
          await privateBox.put('next_scheduled_check', DateTime.now().add(const Duration(minutes: 1)).millisecondsSinceEpoch);
          return;
        }

        final distance = BackgroundPresenceService.haversineDistance(
          position.latitude,
          position.longitude,
          officeLatitude,
          officeLongitude,
        );
        final isWithinGeofence = distance <= officeRadius;
        final now = DateTime.now();

        if (isWithinGeofence) {
          final graceStartVal = privateBox.get('grace_start_timestamp');
          if (graceStartVal != null) {
            await privateBox.delete('grace_start_timestamp');
            await NotificationService.showNotificationDirect(
              title: 'Welcome Back',
              body: 'Presence verified. You are back within the office geofence.',
            );
          }
          await privateBox.put('next_scheduled_check', now.add(const Duration(minutes: 10)).millisecondsSinceEpoch);
        } else {
          final graceStartVal = privateBox.get('grace_start_timestamp');
          if (graceStartVal == null) {
            await privateBox.put('grace_start_timestamp', now.millisecondsSinceEpoch);
            await NotificationService.showNotificationDirect(
              title: 'Geofence Exit Warning',
              body: 'You have left the office geofence. Please return or check out within 15 minutes.',
            );
          } else {
            final graceStart = DateTime.fromMillisecondsSinceEpoch(graceStartVal as int);
            final elapsedGraceMinutes = now.difference(graceStart).inMinutes;
            if (elapsedGraceMinutes >= 15) {
              await NotificationService.showNotificationDirect(
                title: 'Geofence Exit Alert',
                body: 'You have been outside the office for over 15 minutes. Please check in again when you return.',
              );
            }
          }
          await privateBox.put('next_scheduled_check', now.add(const Duration(minutes: 10)).millisecondsSinceEpoch);
        }

        final logData = {
          'attendanceId': activeAttendanceId,
          'userId': activeUserId,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'isWithinGeofence': isWithinGeofence,
          'isMockLocation': position.isMocked,
          'distanceFromOffice': distance,
          'timestamp': now.toIso8601String(),
        };

        bool uploaded = false;
        final token = await getValidAccessToken();
        if (token != null) {
          final client = await getSupabaseClient();
          if (client != null) {
            try {
              // Set session string or recovery parameters
              final sessionJson = jsonEncode({
                'access_token': token,
                'refresh_token': await storage.read(key: 'refresh_token') ?? '',
                'expires_in': 3600,
                'token_type': 'bearer',
                'user': {
                  'id': activeUserId,
                  'email': '',
                }
              });
              await client.auth.recoverSession(sessionJson);

              await client.from('presence_logs').insert({
                'attendanceId': activeAttendanceId,
                'userId': activeUserId,
                'latitude': position.latitude,
                'longitude': position.longitude,
                'accuracy': position.accuracy,
                'isWithinGeofence': isWithinGeofence,
                'isMockLocation': position.isMocked,
                'verificationMethod': 'background_polling',
                'distanceFromOffice': distance,
              });
              uploaded = true;
              debugPrint('BG_PRESENCE_ISOLATE: Presence log uploaded.');
            } catch (e) {
              debugPrint('BG_PRESENCE_ISOLATE: Log upload failed: $e. Buffering.');
            }
          }
        }

        if (!uploaded) {
          final key = DateTime.now().millisecondsSinceEpoch.toString();
          await bufferBox.put(key, logData);
        }

        // Sync background buffer box
        if (token != null && bufferBox.isNotEmpty) {
          final client = await getSupabaseClient();
          if (client != null) {
            final sessionJson = jsonEncode({
              'access_token': token,
              'refresh_token': await storage.read(key: 'refresh_token') ?? '',
              'expires_in': 3600,
              'token_type': 'bearer',
              'user': {
                'id': activeUserId,
                'email': '',
              }
            });
            await client.auth.recoverSession(sessionJson);

            final keys = bufferBox.keys.toList();
            for (final key in keys) {
              try {
                final entry = Map<String, dynamic>.from(bufferBox.get(key) as Map);
                await client.from('presence_logs').insert({
                  'attendance_id': entry['attendanceId'],
                  'user_id': entry['userId'],
                  'latitude': entry['latitude'],
                  'longitude': entry['longitude'],
                  'accuracy': entry['accuracy'],
                  'is_within_geofence': entry['isWithinGeofence'],
                  'is_mock_location': entry['isMockLocation'],
                  'verification_method': 'background_polling',
                  'distance_from_office': entry['distanceFromOffice'],
                });
                await bufferBox.delete(key);
              } catch (e) {
                debugPrint('BG_PRESENCE_ISOLATE: Failed to sync buffered log $key: $e');
                break;
              }
            }
          }
        }
      } catch (e) {
        debugPrint('BG_PRESENCE_ISOLATE: Unhandled check error: $e');
      }
    }

    // 1-minute ticker setup
    Timer.periodic(const Duration(minutes: 1), (timer) async {
      try {
        final activeId = await storage.read(key: 'active_attendance_id');
        if (activeId == null) {
          timer.cancel();
          service.stopSelf();
          return;
        }

        final nextVal = privateBox.get('next_scheduled_check');
        final nextScheduledCheck = nextVal != null ? nextVal as int : null;
        final now = DateTime.now().millisecondsSinceEpoch;
        if (nextScheduledCheck == null || now >= nextScheduledCheck) {
          await runPresenceCheck();
        }
      } catch (e) {
        debugPrint('BG_PRESENCE_ISOLATE: Ticker check error: $e');
      }
    });

    // Run first check immediately
    await runPresenceCheck();
  } catch (e, stack) {
    debugPrint('BG_PRESENCE_ISOLATE_FATAL_ERROR: $e\n$stack');
    try {
      final base = await getApplicationDocumentsDirectory();
      final logDir = Directory(path.join(base.path, 'crash_logs'));
      if (!logDir.existsSync()) {
        logDir.createSync(recursive: true);
      }
      final now = DateTime.now();
      final ts = now.toIso8601String().replaceAll(':', '-');
      final file = File(path.join(logDir.path, 'crash_bg_$ts.log'));
      file.writeAsStringSync(jsonEncode({
        'timestamp': now.toIso8601String(),
        'tag': 'BACKGROUND_SERVICE_CRASH',
        'appVersion': 'unknown_bg',
        'osVersion': 'Android Isolate',
        'deviceModel': 'Isolate',
        'error': e.toString(),
        'stackTrace': stack.toString(),
      }));
    } catch (_) {}
  }
}
