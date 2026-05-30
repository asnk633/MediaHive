import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'logger_service.dart';
import 'notification_service.dart';
import 'notification_router.dart';

class FCMService {
  final Ref _ref;
  final LoggerService _logger;
  bool _initialized = false;

  FCMService(this._ref, this._logger);

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // 1. Request OS-level notification permission (crucial for Android 13+)
      await _ref.read(notificationServiceProvider).requestPermission();

      final messaging = FirebaseMessaging.instance;

      // 2. Request Notification Permissions via Firebase
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      _logger.info('FCM Permission Status: ${settings.authorizationStatus}');

      // 2. Register foreground message handler
      FirebaseMessaging.onMessage.listen(_onForegroundMessage);

      // 3. Register background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Register background click handler (when app is in background but not terminated)
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        _logger.info('FCM Message Opened App (from background): ${message.messageId}');
        _handleNotificationClick(message);
      });

      // Handle terminated app launch from notification click
      messaging.getInitialMessage().then((message) {
        if (message != null) {
          _logger.info('FCM Message Opened App (from terminated): ${message.messageId}');
          _handleNotificationClick(message);
        }
      });

      // 4. Set up token refresh listener
      messaging.onTokenRefresh.listen((token) async {
        _logger.info('FCM Token refreshed: $token');
        try {
          await _uploadToken(token);
        } catch (e) {
          _logger.warning('Failed to upload refreshed token: $e');
        }
      });

      // 5. Fetch current token and upload immediately
      try {
        final currentToken = await messaging.getToken();
        if (currentToken != null) {
          _logger.info('FCM Initial Token: $currentToken');
          await _uploadToken(currentToken);
        }
      } catch (tokenError) {
        _logger.warning('FCM Token generation bypassed (development mode): ${tokenError.toString().split('\n').first}');
      }

      _initialized = true;
    } catch (e, stack) {
      _logger.error('Error initializing FCMService', e, stack);
    }
  }

  Future<void> uploadTokenForCurrentUser() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _uploadToken(token);
      }
    } catch (e) {
      _logger.warning('Failed to fetch/upload token on demand: $e');
    }
  }

  Future<void> _uploadToken(String token) async {
    final currentUser = Supabase.instance.client.auth.currentUser;
    if (currentUser == null) {
      _logger.info('FCM Token registration skipped: User not logged in');
      return;
    }

    try {
      final platform = Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'unknown');
      await Supabase.instance.client.from('device_tokens').upsert({
        'user_id': currentUser.id,
        'token': token,
        'platform': platform,
      }, onConflict: 'token');
      _logger.info('FCM Token successfully uploaded to Supabase for user ${currentUser.id}');
    } catch (e) {
      _logger.error('Error uploading FCM token to Supabase', e);
    }
  }

  // De-register token on auth sign-out
  Future<void> deregisterToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await Supabase.instance.client.from('device_tokens').delete().eq('token', token);
        _logger.info('FCM Token de-registered from Supabase successfully');
      }
    } catch (e) {
      _logger.error('Error deregistering FCM token from Supabase', e);
    }
  }

  void _handleNotificationClick(RemoteMessage message) {
    final route = message.data['route'] as String? ?? '';
    final type = message.data['type'] as String? ?? '';
    
    _logger.info('FCM Notification tapped: type=$type, route=$route');
    
    String finalRoute = '/notifications';
    if (route.isNotEmpty) {
      finalRoute = route;
    } else {
      switch (type) {
        case 'task':
          finalRoute = '/tasks';
          break;
        case 'event':
          finalRoute = '/calendar';
          break;
        case 'asset':
          finalRoute = '/inventory';
          break;
        default:
          finalRoute = '/notifications';
          break;
      }
    }
    
    _ref.read(notificationRouterProvider).routeTo(finalRoute);
  }

  void _onForegroundMessage(RemoteMessage message) {
    _logger.info('Foreground FCM message received: ${message.messageId}');
    final notification = message.notification;
    if (notification == null) return;

    final notificationService = _ref.read(notificationServiceProvider);
    
    // Check type and route appropriately with custom sounds
    final type = message.data['type'] as String? ?? 'system';
    final payload = message.data['route'] as String? ?? '';

    switch (type) {
      case 'task':
        notificationService.showTaskNotification(notification.title ?? '', notification.body ?? '', payload: payload);
        break;
      case 'event':
        notificationService.showEventNotification(notification.title ?? '', notification.body ?? '', payload: payload);
        break;
      case 'asset':
        notificationService.showAssetNotification(notification.title ?? '', notification.body ?? '', payload: payload);
        break;
      case 'system':
      default:
        notificationService.showSystemNotification(notification.title ?? '', notification.body ?? '', payload: payload);
        break;
    }
  }
}

// Background handler must be a top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Let the background pipeline handle push banner UI natively
}

final fcmServiceProvider = Provider<FCMService>((ref) {
  final logger = ref.watch(loggerServiceProvider);
  return FCMService(ref, logger);
});
