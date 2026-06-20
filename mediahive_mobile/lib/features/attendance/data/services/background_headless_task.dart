import 'dart:ui';
import 'package:flutter/widgets.dart';
import 'package:workmanager/workmanager.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';

/// Headless task handler for Workmanager.
/// This must remain a top-level function.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    try {
      WidgetsFlutterBinding.ensureInitialized();
      DartPluginRegistrant.ensureInitialized();

      // Initialize Hive properly for the headless isolate
      await Hive.initFlutter();
      
      // Note: Hive boxes are unencrypted on disk by default. 
      // The Supabase anon key stored here is meant to be public-safe 
      // (it is shipped in the app bundle), so this is not a security regression.
      // Do NOT store service-role keys or sensitive user secrets here.
      final configBox = await Hive.openBox('bg_presence_config');
      
      final String? supabaseUrl = configBox.get('supabaseUrl');
      final String? supabaseAnonKey = configBox.get('supabaseAnonKey');
      final String? attendanceId = configBox.get('attendanceId');
      final String? userId = configBox.get('userId');
      final double? officeLat = configBox.get('officeLat');
      final double? officeLng = configBox.get('officeLng');

      if (supabaseUrl == null || supabaseAnonKey == null || attendanceId == null || userId == null) {
        // Missing configuration, abort
        return Future.value(true);
      }

      // Initialize lightweight SupabaseClient directly to avoid singleton collisions
      final supabase = SupabaseClient(supabaseUrl, supabaseAnonKey);

      // Fetch current location
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return Future.value(true);
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return Future.value(true);
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      );

      // Re-read config after fetching location to ensure session hasn't ended.
      // Note: this narrows the race window to milliseconds rather than eliminating it.
      // This is acceptable for a presence log, but not for safety/payroll critical systems.
      final String? reReadAttendanceId = configBox.get('attendanceId');
      if (reReadAttendanceId == null) {
        // Session ended while fetching location
        return Future.value(true);
      }

      // Calculate distance
      double? distance;
      if (officeLat != null && officeLng != null) {
        distance = Geolocator.distanceBetween(
          officeLat, officeLng, 
          position.latitude, position.longitude
        );
      }

      final logData = {
        'attendance_id': attendanceId,
        'user_id': userId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy': position.accuracy,
        'is_mock_location': position.isMocked,
        'verification_method': 'gps',
        'distance_from_office': distance,
      };

      // Sync existing buffered logs safely. 
      // If buffer flush fails, leave those entries in the buffer untouched 
      // and proceed to attempt the new ping separately.
      final bufferBox = await Hive.openBox<Map>('presence_log_buffer');
      if (bufferBox.isNotEmpty) {
        final keys = bufferBox.keys.toList();
        for (var key in keys) {
          try {
            final oldLog = bufferBox.get(key);
            if (oldLog != null) {
              await supabase.from('presence_logs').insert(Map<String, dynamic>.from(oldLog));
              await bufferBox.delete(key);
            }
          } catch (_) {
            // Leave entry in buffer on failure
          }
        }
      }

      // Insert new log
      try {
        await supabase.from('presence_logs').insert(logData);
      } catch (e) {
        // Handle failures by writing to buffer
        await bufferBox.add(logData);
      }

      return Future.value(true);
    } catch (err) {
      return Future.value(false);
    }
  });
}
