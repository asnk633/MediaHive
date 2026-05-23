import 'dart:async';
import '../services/network_service.dart';
import '../services/logger_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notification_service.dart';




class SyncService {
  final NetworkService _networkService;
  final LoggerService _logger;
  final NotificationService _notifications;
  
  SyncService(this._networkService, this._logger, this._notifications);

  Future<bool> executeImmediate(String feature, String type, Map<String, dynamic> data, Future<void> Function() action) async {
    if (!await _networkService.isConnected) {
      _logger.warning('🚫 Action failed: No internet connection');
      return false;
    }

    int retryCount = 0;
    while (retryCount < 3) {
      try {
        await action();
        _logger.sync('✅ Success: $feature/$type');
        return true;
      } catch (e) {
        retryCount++;
        _logger.error('❌ Attempt $retryCount failed for $feature/$type', e);
        if (retryCount < 3) {
          await Future.delayed(Duration(seconds: retryCount * 2));
        }
      }
    }

    _notifications.showSyncError('Failed to $type $feature. Please check your connection.');
    return false;
  }
}

final syncServiceProvider = Provider<SyncService>((ref) {
  final networkService = ref.watch(networkServiceProvider);
  final logger = ref.watch(loggerProvider.notifier);
  final notifications = ref.watch(notificationServiceProvider);
  return SyncService(networkService, logger, notifications);
});

// Removed pendingSyncCountProvider as we are now internet-first
