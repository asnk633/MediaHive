import 'dart:io';
import 'package:geolocator/geolocator.dart';
import '../../../../core/services/logger_service.dart';

class MockLocationDetector {
  final _logger = LoggerService();

  /// Detects if the given [Position] is spoofed or mocked on Android.
  /// On iOS, mock location APIs are not exposed by the OS, so it returns false.
  bool isMockedLocation(Position position) {
    try {
      if (Platform.isAndroid) {
        // Position.isMocked is a boolean flag indicating if the location was mocked.
        return position.isMocked;
      }
    } catch (e) {
      _logger.error('Error checking mock location status: $e');
    }
    return false;
  }
}
