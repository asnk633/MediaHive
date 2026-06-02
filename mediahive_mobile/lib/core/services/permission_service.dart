import 'dart:io';
import 'package:permission_handler/permission_handler.dart';
import '../services/logger_service.dart';

class PermissionService {
  static final LoggerService _logger = LoggerService();

  /// Requests all necessary production permissions for MediaHive.
  static Future<bool> requestProductionPermissions() async {
    _logger.info('[PERMISSION_SERVICE] Requesting production permissions...');
    
    final permissions = [
      Permission.camera,
      Permission.notification,
    ];

    // Handle Media Permissions (Android 13+)
    if (Platform.isAndroid) {
      permissions.addAll([
        Permission.photos,
        Permission.videos,
      ]);
    }

    final statuses = await permissions.request();
    
    bool allGranted = true;
    statuses.forEach((permission, status) {
      if (!status.isGranted) {
        _logger.warning('[PERMISSION_SERVICE] Permission ${permission.toString()} was denied: $status');
        allGranted = false;
      }
    });

    return allGranted;
  }

  /// Specialized request for Camera access
  static Future<bool> requestCamera() async {
    final status = await Permission.camera.request();
    return status.isGranted;
  }

  /// Specialized request for Notifications
  static Future<bool> requestNotifications() async {
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  /// Specialized request for Media access
  static Future<bool> requestMediaLibrary() async {
    if (Platform.isAndroid) {
      final photos = await Permission.photos.request();
      final videos = await Permission.videos.request();
      return photos.isGranted && videos.isGranted;
    }
    return await Permission.photos.request().isGranted;
  }

  /// Opens App Settings if permissions are permanently denied
  static Future<void> openSettings() async {
    await openAppSettings();
  }
}
