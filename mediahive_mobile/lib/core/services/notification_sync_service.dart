import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';

class NotificationSyncService {
  final LoggerService _logger;
  final Set<String> _processedNotificationIds = {};
  final Map<String, Timer> _activeDebounces = {};

  NotificationSyncService(this._logger);

  /// Validates whether an incoming notification should be displayed.
  /// Deduplicates between simultaneous Supabase Realtime alerts and FCM pushes.
  bool shouldProcess(String? notificationId) {
    if (notificationId == null || notificationId.isEmpty) return true;

    if (_processedNotificationIds.contains(notificationId)) {
      _logger.info('NotificationSyncService: Suppressed duplicate notification alert for ID $notificationId');
      return false;
    }

    _processedNotificationIds.add(notificationId);

    // Maintain a bounded sliding window cache of 100 elements to protect memory
    if (_processedNotificationIds.length > 100) {
      final first = _processedNotificationIds.first;
      _processedNotificationIds.remove(first);
    }

    return true;
  }

  /// Collapses rapid repeated alerts under a unique key using a cooling debounce window.
  void debounceAction(String collapseKey, Duration cooldown, void Function() action) {
    _activeDebounces[collapseKey]?.cancel();
    _activeDebounces[collapseKey] = Timer(cooldown, () {
      _activeDebounces.remove(collapseKey);
      action();
    });
  }

  void dispose() {
    for (final timer in _activeDebounces.values) {
      timer.cancel();
    }
    _activeDebounces.clear();
  }
}

final notificationSyncServiceProvider = Provider<NotificationSyncService>((ref) {
  final logger = ref.watch(loggerServiceProvider);
  return NotificationSyncService(logger);
});
