import 'dart:math';
import 'package:flutter_background_geolocation/flutter_background_geolocation.dart' as bg;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Headless task handler for when the app is terminated.
///
/// This is a TOP-LEVEL function registered in main.dart via:
/// `BackgroundGeolocation.registerHeadlessTask(backgroundGeolocationHeadlessTask)`
///
/// It runs in a separate isolate — NO access to UI, Providers, or widget tree.
/// Uses direct Supabase client and Hive for data access.
@pragma('vm:entry-point')
void backgroundGeolocationHeadlessTask(bg.HeadlessEvent headlessEvent) async {
  final name = headlessEvent.name;

  // Load config from Hive (persisted by the foreground service)
  await Hive.initFlutter();
  final box = await Hive.openBox('bg_presence_config');
  final attendanceId = box.get('attendanceId') as String?;
  final userId = box.get('userId') as String?;
  final isPaused = box.get('isPaused', defaultValue: false) as bool;

  if (attendanceId == null || userId == null || isPaused) return;

  final officeLatitude = box.get('officeLatitude') as double?;
  final officeLongitude = box.get('officeLongitude') as double?;
  final officeRadius = box.get('officeRadius', defaultValue: 50.0) as double;

  switch (name) {
    case bg.Event.LOCATION:
      final location = headlessEvent.event as bg.Location;
      if (officeLatitude != null && officeLongitude != null) {
        await _headlessLogPresence(
          attendanceId: attendanceId,
          userId: userId,
          location: location,
          officeLatitude: officeLatitude,
          officeLongitude: officeLongitude,
          officeRadius: officeRadius,
        );
      }
      break;

    case bg.Event.HEARTBEAT:
      try {
        final location = await bg.BackgroundGeolocation.getCurrentPosition(
          samples: 1,
          persist: true,
        );
        if (officeLatitude != null && officeLongitude != null) {
          await _headlessLogPresence(
            attendanceId: attendanceId,
            userId: userId,
            location: location,
            officeLatitude: officeLatitude,
            officeLongitude: officeLongitude,
            officeRadius: officeRadius,
          );
        }
      } catch (_) {}
      break;

    case bg.Event.GEOFENCE:
      final event = headlessEvent.event as bg.GeofenceEvent;
      if (event.action == 'EXIT') {
        // Buffer the exit event — will be processed when app opens
        try {
          final eventBox = await Hive.openBox('bg_geofence_events');
          await eventBox.add({
            'action': 'EXIT',
            'identifier': event.identifier,
            'timestamp': DateTime.now().toUtc().toIso8601String(),
            'attendanceId': attendanceId,
          });
        } catch (_) {}
      }
      break;
  }
}

/// Log presence from headless context — direct Supabase call.
Future<void> _headlessLogPresence({
  required String attendanceId,
  required String userId,
  required bg.Location location,
  required double officeLatitude,
  required double officeLongitude,
  required double officeRadius,
}) async {
  final coords = location.coords;

  // Simple haversine distance
  final distance = _haversineDistance(
    coords.latitude, coords.longitude,
    officeLatitude, officeLongitude,
  );
  final isInside = distance <= officeRadius;

  try {
    // Initialize Supabase if not already (headless context)
    try {
      Supabase.instance.client;
    } catch (_) {
      // Supabase not initialized in headless — buffer to Hive instead
      final buffer = await Hive.openBox('presence_log_buffer');
      await buffer.add({
        'attendanceId': attendanceId,
        'userId': userId,
        'latitude': coords.latitude,
        'longitude': coords.longitude,
        'accuracy': coords.accuracy,
        'isWithinGeofence': isInside,
        'isMockLocation': location.mock,
        'verificationMethod': 'headless_gps',
        'distanceFromOffice': distance,
        'networkState': 'online',
        'batteryLevel': (location.battery.level * 100).round(),
        'createdAt': DateTime.now().toUtc().toIso8601String(),
      });
      return;
    }

    final client = Supabase.instance.client;
    await client.from('presence_logs').insert({
      'attendanceId': attendanceId,
      'userId': userId,
      'latitude': coords.latitude,
      'longitude': coords.longitude,
      'accuracy': coords.accuracy,
      'isWithinGeofence': isInside,
      'isMockLocation': location.mock,
      'verificationMethod': 'headless_gps',
      'distanceFromOffice': distance,
      'networkState': 'online',
      'batteryLevel': (location.battery.level * 100).round(),
      'createdAt': DateTime.now().toUtc().toIso8601String(),
    });

    await client.from('attendance').update({
      'lastVerifiedAt': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', attendanceId);
  } catch (_) {
    // Silently fail in headless — will retry on next heartbeat
  }
}

/// Haversine distance calculation (meters)
double _haversineDistance(double lat1, double lon1, double lat2, double lon2) {
  const p = 0.017453292519943295; // Pi/180
  final a = 0.5
      - cos((lat2 - lat1) * p) / 2
      + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
  return 12742000 * asin(sqrt(a)); // 2 * R * asin(sqrt(a))
}

