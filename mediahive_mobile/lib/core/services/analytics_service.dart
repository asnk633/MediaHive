import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';

class AnalyticsService {
  final LoggerService _logger;

  AnalyticsService(this._logger);

  void logScreenView(String screenName) {
    _logger.info('📊 SCREEN_VIEW: $screenName');
    // In real prod, this would also call FirebaseAnalytics.instance.logScreenView
  }

  void logEvent(String eventName, [Map<String, dynamic>? parameters]) {
    _logger.info('📈 EVENT: $eventName | PARAMS: $parameters');
  }

  void logError(String errorCode, String message) {
    _logger.error('📉 ERROR_ANALYTICS: [$errorCode] $message');
  }

  void logSyncMetric(bool success, int durationMs, int itemCount) {
    _logger.sync('⏱️ SYNC_METRIC: Success=$success | Duration=${durationMs}ms | Items=$itemCount');
  }
}

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final logger = ref.watch(loggerProvider.notifier);
  return AnalyticsService(logger);
});
