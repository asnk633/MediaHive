import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/logger_service.dart';

class NotificationRepository {
  final SupabaseClient _supabase;
  final LoggerService _logger;

  NotificationRepository(this._supabase, this._logger);

  Stream<List<Map<String, dynamic>>> getNotifications() {
    final user = _supabase.auth.currentUser;
    if (user == null) return Stream.value([]);

    return _supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', user.id)
        .order('created_at', ascending: false);
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await _supabase
          .from('notifications')
          .update({'read': true})
          .eq('id', notificationId);
      _logger.info('Notification $notificationId marked as read');
    } catch (e) {
      _logger.error('Error marking notification as read', e);
    }
  }

  Future<void> markAllAsRead() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    try {
      await _supabase
          .from('notifications')
          .update({'read': true})
          .eq('user_id', user.id);
      _logger.info('All notifications marked as read');
    } catch (e) {
      _logger.error('Error marking all notifications as read', e);
    }
  }

  Future<void> deleteNotification(String notificationId) async {
    try {
      await _supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);
      _logger.info('Notification $notificationId deleted');
    } catch (e) {
      _logger.error('Error deleting notification', e);
    }
  }

  Future<void> broadcastNotification({
    required String title,
    required String body,
    required String type,
    String? institutionId,
    int? departmentId,
    String? targetType, // 'all', 'institution', 'department'
    DateTime? scheduledAt,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser == null) return;

      // 1. Fetch target user IDs based on audience
      var query = _supabase.from('profiles').select('id');
      
      if (targetType == 'institution' && institutionId != null) {
        query = query.eq('institution_id', institutionId);
      } else if (targetType == 'department' && departmentId != null) {
        query = query.eq('department_id', departmentId);
      }
      
      final users = await query;
      final userIds = (users as List).map((u) => u['id'] as String).toList();

      if (userIds.isEmpty) return;

      // 2. Dispatch notifications via Edge Function (for FCM native push)
      for (final uid in userIds) {
        try {
          await _supabase.functions.invoke(
            'dispatch-notification',
            body: {
              'user_id': uid,
              'type': type,
              'title': title,
              'body': body,
              'created_by': currentUser.id,
              'institution_id': institutionId,
              'department_id': departmentId,
              'tenant_id': '7bc0bbe7-1943-4929-a769-5fdfbc487446',
              'scheduled_at': scheduledAt?.toUtc().toIso8601String(),
              'metadata': metadata ?? {},
            },
          );
        } catch (funcError) {
          _logger.error('Failed to dispatch push notification via Edge Function for user $uid, falling back to direct DB insert', funcError);
          // Fallback to direct DB insert so they still see it in the app
          await _supabase.from('notifications').insert({
            'user_id': uid,
            'title': title,
            'body': body,
            'type': type,
            'created_by': currentUser.id,
            'read': false,
            'institution_id': institutionId,
            'department_id': departmentId,
            'tenant_id': '7bc0bbe7-1943-4929-a769-5fdfbc487446',
            'scheduled_at': scheduledAt?.toUtc().toIso8601String(),
            'metadata': metadata ?? {},
          });
        }
      }
      _logger.info('Broadcast dispatch process completed for ${userIds.length} users${scheduledAt != null ? " (Scheduled for $scheduledAt)" : ""}');
    } catch (e) {
      _logger.error('Error broadcasting notification', e);
      rethrow;
    }
  }
}
