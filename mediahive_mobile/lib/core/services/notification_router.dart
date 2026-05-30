import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../router/router.dart';
import 'logger_service.dart';

class NotificationRouter {
  final Ref _ref;
  final LoggerService _logger;

  NotificationRouter(this._ref, this._logger);

  void routeTo(String? payload) {
    if (payload == null || payload.isEmpty) {
      _logger.warning('NotificationRouter: Received null or empty payload, defaulting to /notifications');
      _navigateTo('/notifications');
      return;
    }

    _logger.info('NotificationRouter: Routing payload -> $payload');
    
    // 1. Direct path routing
    if (payload.startsWith('/')) {
      _navigateTo(payload);
      return;
    }

    // 2. Structured JSON parsing
    try {
      final Map<String, dynamic> data = jsonDecode(payload);
      final String? route = data['route'] as String?;
      if (route != null && route.isNotEmpty) {
        _navigateTo(route);
      } else {
        _navigateTo('/notifications');
      }
    } catch (e) {
      _logger.error('NotificationRouter: Failed parsing JSON payload', e);
      
      // 3. Fallback: query string split
      try {
        final Map<String, dynamic> data = Uri.splitQueryString(payload);
        final String? route = data['route'] as String?;
        if (route != null && route.isNotEmpty) {
          _navigateTo(route);
        } else {
          _navigateTo('/notifications');
        }
      } catch (_) {
        _navigateTo('/notifications');
      }
    }
  }

  void _navigateTo(String path) {
    try {
      final router = _ref.read(routerProvider);
      router.push(path);
    } catch (e, stack) {
      _logger.error('NotificationRouter: Contextless push failed for route $path', e, stack);
    }
  }
}

final notificationRouterProvider = Provider<NotificationRouter>((ref) {
  final logger = ref.watch(loggerServiceProvider);
  return NotificationRouter(ref, logger);
});
