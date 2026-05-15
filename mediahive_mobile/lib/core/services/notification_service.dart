import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';

class NotificationService {
  final LoggerService _logger;

  NotificationService(this._logger);

  Future<void> initialize() async {
    await AwesomeNotifications().initialize(
      null, // Default icon
      [
        NotificationChannel(
          channelGroupKey: 'mediahive_group',
          channelKey: 'sync_alerts',
          channelName: 'Sync Alerts',
          channelDescription: 'Notifications for synchronization events',
          defaultColor: const Color(0xFF3B82F6),
          ledColor: Colors.white,
          importance: NotificationImportance.High,
        ),
        NotificationChannel(
          channelGroupKey: 'mediahive_group',
          channelKey: 'task_updates',
          channelName: 'Task Updates',
          channelDescription: 'Notifications for task assignments and status changes',
          defaultColor: const Color(0xFFF59E0B),
          importance: NotificationImportance.Max,
        ),
      ],
      channelGroups: [
        NotificationChannelGroup(channelGroupKey: 'mediahive_group', channelGroupName: 'MediaHive Notifications')
      ],
      debug: true,
    );

    // Request permissions
    bool isAllowed = await AwesomeNotifications().isNotificationAllowed();
    if (!isAllowed) {
      await AwesomeNotifications().requestPermissionToSendNotifications();
    }
  }

  Future<void> showSyncError(String message) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: 1,
        channelKey: 'sync_alerts',
        title: 'SYNC FAILURE',
        body: message,
        notificationLayout: NotificationLayout.Default,
        backgroundColor: Colors.red,
      ),
    );
    _logger.warning('Notification sent: Sync Error');
  }

  Future<void> showTaskAssignment(String taskTitle, String institution) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
        channelKey: 'task_updates',
        title: 'NEW TASK ASSIGNED',
        body: 'You have a new task: "$taskTitle" from $institution',
        notificationLayout: NotificationLayout.BigText,
      ),
    );
    _logger.info('Notification sent: Task Assignment');
  }

  Future<bool> checkPermission() async {
    return await AwesomeNotifications().isNotificationAllowed();
  }

  Future<void> requestPermission() async {
    await AwesomeNotifications().requestPermissionToSendNotifications();
  }

  Future<void> openSettings() async {
    await AwesomeNotifications().showAlarmPage();
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  final logger = ref.watch(loggerProvider.notifier);
  return NotificationService(logger);
});
