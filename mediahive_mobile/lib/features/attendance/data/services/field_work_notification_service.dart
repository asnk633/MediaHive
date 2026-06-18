import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/logger_service.dart';

/// Service for sending push notifications related to field work and presence verification.
///
/// Sends notifications via Supabase → device_tokens → FCM.
/// Uses a database function to look up FCM tokens and send via Firebase Admin SDK.
class FieldWorkNotificationService {
  final SupabaseClient _client;
  final _logger = LoggerService();

  static FieldWorkNotificationService? _instance;
  static FieldWorkNotificationService get instance {
    _instance ??= FieldWorkNotificationService(Supabase.instance.client);
    return _instance!;
  }

  FieldWorkNotificationService(this._client);

  /// Notify the user's manager(s) about a new field work request.
  ///
  /// Looks up managers for the user's organization, then sends FCM push.
  /// Falls back to manager_deputies if primary manager has no FCM token.
  Future<void> notifyManagerOfFieldWorkRequest({
    required String userId,
    required String userName,
    required String? reason,
    required String sessionId,
  }) async {
    try {
      // Find the user's organization managers
      final profile = await _client
          .from('profiles')
          .select('organizationId')
          .eq('id', userId)
          .single();

      final orgId = profile['organizationId'] as String?;
      if (orgId == null) return;

      // Get managers for this organization
      final managers = await _client
          .from('profiles')
          .select('id')
          .eq('organizationId', orgId)
          .inFilter('role', ['manager', 'admin', 'owner'])
          .eq('status', 'active');

      if (managers.isEmpty) {
        _logger.warning('FIELD_WORK_NOTIFY: No managers found for org $orgId');
        return;
      }

      final managerIds = (managers as List).map((m) => m['id'] as String).toList();

      // Get FCM tokens for these managers
      final tokens = await _client
          .from('device_tokens')
          .select('token, user_id')
          .inFilter('user_id', managerIds);

      if ((tokens as List).isEmpty) {
        // Try deputy fallback
        await _notifyDeputies(managerIds, userName, reason, sessionId);
        return;
      }

      // Store notification in database for each manager
      for (final managerId in managerIds) {
        await _client.from('notifications').insert({
          'user_id': managerId,
          'title': 'Field Work Request',
          'body': '$userName has requested field work${reason != null ? ': $reason' : ''}',
          'type': 'field_work',
          'read': false,
          'metadata': {
            'route': '/attendance',
            'sessionId': sessionId,
            'requesterId': userId,
            'action': 'field_work_request',
          },
        });
      }

      _logger.info('FIELD_WORK_NOTIFY: Notified ${managerIds.length} managers about field work request');
    } catch (e) {
      _logger.error('FIELD_WORK_NOTIFY: Failed to notify managers: $e');
    }
  }

  /// Notify a member that their field work was approved.
  Future<void> notifyMemberApproved({
    required String userId,
    required String sessionId,
  }) async {
    try {
      await _client.from('notifications').insert({
        'user_id': userId,
        'title': 'Field Work Approved',
        'body': 'Your field work request has been approved. You may now depart.',
        'type': 'field_work',
        'read': false,
        'metadata': {
          'route': '/attendance',
          'sessionId': sessionId,
          'action': 'field_work_approved',
        },
      });
      _logger.info('FIELD_WORK_NOTIFY: Approval notification sent to user $userId');
    } catch (e) {
      _logger.error('FIELD_WORK_NOTIFY: Failed to notify member: $e');
    }
  }

  /// Notify a member that their field work was rejected.
  ///
  /// Includes grace period countdown info.
  Future<void> notifyMemberRejected({
    required String userId,
    required String sessionId,
    required int gracePeriodMinutes,
    String? rejectionReason,
  }) async {
    try {
      final graceMsg = gracePeriodMinutes > 0
          ? ' You have $gracePeriodMinutes minutes to return to the office.'
          : '';

      await _client.from('notifications').insert({
        'user_id': userId,
        'title': 'Field Work Rejected',
        'body': 'Your field work request was rejected.${rejectionReason != null ? ' Reason: $rejectionReason.' : ''}$graceMsg',
        'type': 'field_work',
        'read': false,
        'metadata': {
          'route': '/attendance',
          'sessionId': sessionId,
          'action': 'field_work_rejected',
          'gracePeriodMinutes': gracePeriodMinutes,
          'rejectionReason': rejectionReason,
        },
      });
      _logger.info('FIELD_WORK_NOTIFY: Rejection notification sent to user $userId');
    } catch (e) {
      _logger.error('FIELD_WORK_NOTIFY: Failed to notify member rejection: $e');
    }
  }

  /// Notify a member that their field work was auto-approved due to manager timeout.
  Future<void> notifyMemberAutoApproved({
    required String userId,
    required String sessionId,
  }) async {
    try {
      await _client.from('notifications').insert({
        'user_id': userId,
        'title': 'Field Work Auto-Approved',
        'body': 'Your field work request was automatically approved (manager timeout).',
        'type': 'field_work',
        'read': false,
        'metadata': {
          'route': '/attendance',
          'sessionId': sessionId,
          'action': 'field_work_auto_approved',
        },
      });
      _logger.info('FIELD_WORK_NOTIFY: Auto-approve notification sent to user $userId');
    } catch (e) {
      _logger.error('FIELD_WORK_NOTIFY: Failed to notify auto-approve: $e');
    }
  }

  /// Fallback: notify deputies when primary managers have no FCM tokens.
  Future<void> _notifyDeputies(
    List<String> managerIds,
    String userName,
    String? reason,
    String sessionId,
  ) async {
    try {
      final deputies = await _client
          .from('manager_deputies')
          .select('deputyId')
          .inFilter('managerId', managerIds)
          .eq('isActive', true);

      if ((deputies as List).isEmpty) {
        _logger.warning('FIELD_WORK_NOTIFY: No deputies found for managers $managerIds');
        return;
      }

      for (final deputy in deputies) {
        final deputyId = deputy['deputyId'] as String;
        await _client.from('notifications').insert({
          'user_id': deputyId,
          'title': 'Field Work Request (Deputy)',
          'body': '$userName has requested field work${reason != null ? ': $reason' : ''} (routed to you as deputy)',
          'type': 'field_work',
          'read': false,
          'metadata': {
            'route': '/attendance',
            'sessionId': sessionId,
            'action': 'field_work_request_deputy',
          },
        });
      }

      _logger.info('FIELD_WORK_NOTIFY: Notified ${deputies.length} deputies');
    } catch (e) {
      _logger.error('FIELD_WORK_NOTIFY: Deputy notification failed: $e');
    }
  }

  /// Send a notification to the user about exiting a geofence.
  Future<void> sendGeofenceExitAlert(
    String userId,
    String locationName,
    DateTime exitTime,
  ) async {
    try {
      await _client.from('notifications').insert({
        'user_id': userId,
        'title': 'Geofence Exit Alert',
        'body': 'You departed from $locationName at ${exitTime.toLocal().toString().substring(11, 16)}.',
        'type': 'geofence_exit',
        'read': false,
        'metadata': {
          'route': '/attendance',
          'locationName': locationName,
          'exitTime': exitTime.toIso8601String(),
          'action': 'geofence_exit',
        },
      });
      _logger.info('FIELD_WORK_NOTIFY: Geofence exit alert sent to user $userId');
    } catch (e) {
      _logger.error('FIELD_WORK_NOTIFY: Failed to send geofence exit alert: $e');
    }
  }
}
