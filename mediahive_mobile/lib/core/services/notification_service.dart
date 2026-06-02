import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'logger_service.dart';
import 'notification_router.dart';

class NotificationService {
  final Ref _ref;
  final LoggerService _logger;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  NotificationService(this._ref, this._logger);

  Future<void> initialize() async {
    if (_initialized) return;

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('ic_stat_notification');

    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsDarwin,
    );

    try {
      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
        onDidReceiveBackgroundNotificationResponse: _onNotificationTappedBackground,
      );
      _initialized = true;
      _logger.info('NotificationService initialized successfully with flutter_local_notifications');
    } catch (e, stack) {
      _logger.error('Failed to initialize NotificationService', e, stack);
    }
  }

  // Handle notification tap when app is in foreground/background
  void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null || payload.isEmpty) return;

    try {
      _logger.info('Notification tapped in foreground with payload: $payload');
      _ref.read(notificationRouterProvider).routeTo(payload);
    } catch (e, stack) {
      _logger.error('Error handling notification tap', e, stack);
    }
  }

  // Static or global handler for background taps (FCM / Local Background)
  static void _onNotificationTappedBackground(NotificationResponse response) {
    // Background taps are registered here if the OS kills/suspends the main Dart isolate.
    // Logging can be performed if needed, or state recovered on resume.
  }

  Future<void> showTaskNotification(String title, String body, {String? payload}) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'mediahive_tasks_v2',
      'Task Updates',
      channelDescription: 'Notifications for task assignments and status changes',
      importance: Importance.max,
      priority: Priority.high,
      sound: RawResourceAndroidNotificationSound('task_added'),
      playSound: true,
      largeIcon: DrawableResourceAndroidBitmap('ic_launcher_drawable'),
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      sound: 'task_added.wav',
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload ?? '/tasks',
    );
  }

  Future<void> showEventNotification(String title, String body, {String? payload}) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'mediahive_events_v2',
      'Event Alerts',
      channelDescription: 'Notifications for event updates and reminders',
      importance: Importance.high,
      priority: Priority.high,
      sound: RawResourceAndroidNotificationSound('event_alert'),
      playSound: true,
      largeIcon: DrawableResourceAndroidBitmap('ic_launcher_drawable'),
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      sound: 'event_alert.wav',
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload ?? '/calendar',
    );
  }

  Future<void> showAssetNotification(String title, String body, {String? payload}) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'mediahive_assets_v2',
      'Asset Management',
      channelDescription: 'Notifications for inventory and asset check-ins/outs',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      playSound: true,
      largeIcon: DrawableResourceAndroidBitmap('ic_launcher_drawable'),
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload ?? '/inventory',
    );
  }

  Future<void> showSystemNotification(String title, String body, {String? payload}) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'mediahive_system_v2',
      'System Alerts',
      channelDescription: 'Notifications for platform status and warnings',
      importance: Importance.high,
      priority: Priority.high,
      sound: RawResourceAndroidNotificationSound('warning'),
      playSound: true,
      largeIcon: DrawableResourceAndroidBitmap('ic_launcher_drawable'),
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      sound: 'warning.wav',
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload ?? '/notifications',
    );
  }

  Future<void> showChatNotification(String title, String body, {String? payload, required String roomId}) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'mediahive_chats_v2',
      'Chat Messages',
      channelDescription: 'Notifications for secure incoming chat room messages',
      importance: Importance.max,
      priority: Priority.high,
      sound: RawResourceAndroidNotificationSound('message_received'),
      playSound: true,
      largeIcon: DrawableResourceAndroidBitmap('ic_launcher_drawable'),
      enableVibration: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      sound: 'message_received.wav',
      presentSound: true,
      presentAlert: true,
      presentBadge: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _show(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload ?? '/chat/$roomId',
    );
  }

  // --- API PARITY HELPERS ---

  Future<void> showSyncError(String message) async {
    await showSystemNotification('SYNC FAILURE', message);
  }

  Future<void> showTaskAssignment(String taskTitle, String institution) async {
    await showTaskNotification(
      'NEW TASK ASSIGNED',
      'You have a new task: "$taskTitle" from $institution',
    );
  }

  Future<bool> checkPermission() async {
    try {
      final androidImplementation = _localNotifications.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      if (androidImplementation != null) {
        final bool? granted = await androidImplementation.areNotificationsEnabled();
        return granted ?? false;
      }
      return true; // Fallback or iOS default if permission status is unknown
    } catch (e) {
      _logger.error('Error checking notification permissions', e);
      return false;
    }
  }

  Future<void> requestPermission() async {
    try {
      final androidImplementation = _localNotifications.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      if (androidImplementation != null) {
        await androidImplementation.requestNotificationsPermission();
      }
      
      // Request permission on iOS/macOS
      await _localNotifications
          .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
          ?.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          );
      _logger.info('Notification permission request sent');
    } catch (e) {
      _logger.error('Error requesting notification permissions', e);
    }
  }

  Future<void> openSettings() async {
    _logger.info('openSettings called: opening system notifications settings');
    try {
      await openAppSettings();
    } catch (e) {
      _logger.error('Error opening system settings: $e');
    }
  }

  // --- PRIVATE GENERAL SHOW METHOD ---

  Future<void> _show({
    required int id,
    required String title,
    required String body,
    required NotificationDetails notificationDetails,
    required String payload,
  }) async {
    try {
      await _localNotifications.show(
        id,
        title,
        body,
        notificationDetails,
        payload: payload,
      );
      _logger.debug('Local notification shown: ID=$id, Title=$title');
    } catch (e, stack) {
      _logger.error('Error showing local notification', e, stack);
    }
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final logger = ref.watch(loggerServiceProvider);
  return NotificationService(ref, logger);
});
