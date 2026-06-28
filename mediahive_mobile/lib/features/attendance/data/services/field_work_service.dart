import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';
import 'background_presence_service.dart';
import 'field_work_notification_service.dart';

/// Service for managing field work sessions.
///
/// Handles the full lifecycle: start → (manager approval) → end/reject.
/// State machine: pending_approval → approved → completed
///                pending_approval → rejected
///                pending_approval → auto_approved (timeout)
class FieldWorkService {
  final SupabaseClient _client;
  final _logger = LoggerService();
  late final FieldWorkNotificationService _notificationService;

  FieldWorkService(this._client) {
    _notificationService = FieldWorkNotificationService(_client);
  }

  /// Start a field work session for a checked-in user.
  ///
  /// 1. Checks for existing pending/active sessions (blocks duplicates)
  /// 2. Creates field_work_sessions record
  /// 3. Updates attendance workMode to 'field' and presence_status to 'field_work'
  /// 4. Logs a 'work_mode_change' event in attendance_events
  Future<Map<String, dynamic>> startFieldWork({
    required String attendanceId,
    required String userId,
    String? nfcTagId,
    String? reason,
  }) async {
    try {
      // Block duplicate requests: check if user already has a pending/approved session
      final existing = await getActiveFieldWorkSession(userId);
      if (existing != null) {
        final existingStatus = existing['status'] as String?;
        throw Exception(
          'You already have an active field work session (status: $existingStatus). '
          'Please end it before starting a new one.',
        );
      }

      // Create the field work session
      final now = DateTime.now().toUtc().toIso8601String();
      final session = await _client.from('field_work_sessions').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'nfcTagId': nfcTagId,
        'startedAt': now,
        'status': 'pending_approval',
        'reason': reason,
        'createdAt': now,
      }).select().single();

      // Update attendance record: workMode → field, presence_status → field_work
      await _client.from('attendance').update({
        'workMode': 'field',
        'presenceStatus': 'field_work',
      }).eq('id', attendanceId);

      // Log timeline event
      await _client.from('attendance_events').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': 'work_mode_change',
        'eventTime': now,
        'workMode': 'field',
        'notes': 'Field work started. Reason: ${reason ?? "Not specified"}. Pending manager approval.',
        'metadata': {
          'field_work_session_id': session['id'],
          'previous_mode': 'office',
          'new_mode': 'field',
        },
      });

      _logger.info('FIELD_WORK: Session started for user $userId (session: ${session['id']})');

      // Pause background presence verification during field work
      BackgroundPresenceService().pauseForFieldWork();

      // Notify manager(s) about the field work request
      _notificationService.notifyManagerOfFieldWorkRequest(
        userId: userId,
        userName: await _getUserName(userId),
        reason: reason,
        sessionId: session['id'] as String,
      );

      return session;
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to start session: $e');
      rethrow;
    }
  }

  /// End a field work session normally (member returned to office).
  ///
  /// Sets ended_at and return_time, updates attendance workMode back to 'office'.
  Future<void> endFieldWork({
    required String sessionId,
    required String attendanceId,
    required String userId,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();

      // Update field work session
      await _client.from('field_work_sessions').update({
        'endedAt': now,
        'returnTime': now,
        'status': 'completed',
        'updatedAt': now,
      }).eq('id', sessionId);

      // Reset attendance workMode to office
      await _client.from('attendance').update({
        'workMode': 'office',
        'presenceStatus': 'verified',
      }).eq('id', attendanceId);

      // Log timeline event
      await _client.from('attendance_events').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': 'work_mode_change',
        'eventTime': now,
        'workMode': 'office',
        'notes': 'Field work completed. Member returned to office.',
        'metadata': {
          'field_work_session_id': sessionId,
          'previous_mode': 'field',
          'new_mode': 'office',
        },
      });

      _logger.info('FIELD_WORK: Session $sessionId ended normally for user $userId');

      // Resume background presence verification after field work
      BackgroundPresenceService().resumeAfterFieldWork();
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to end session: $e');
      rethrow;
    }
  }

  /// Get active (not ended) field work session for a user.
  Future<Map<String, dynamic>?> getActiveFieldWorkSession(String userId) async {
    try {
      final result = await _client
          .from('field_work_sessions')
          .select()
          .eq('userId', userId)
          .isFilter('endedAt', null)
          .inFilter('status', ['pending_approval', 'approved', 'auto_approved', 'active'])
          .order('createdAt', ascending: false)
          .limit(1)
          .maybeSingle();
      return result;
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to get active session: $e');
      return null;
    }
  }

  /// Manager approves a field work session.
  Future<void> approveFieldWork({
    required String sessionId,
    required String managerId,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();
      await _client.from('field_work_sessions').update({
        'status': 'approved',
        'approvedBy': managerId,
        'approvedAt': now,
        'updatedAt': now,
      }).eq('id', sessionId);

      _logger.info('FIELD_WORK: Session $sessionId approved by manager $managerId');

      // Notify the member that their request was approved
      final session = await _client
          .from('field_work_sessions')
          .select('userId')
          .eq('id', sessionId)
          .single();
      _notificationService.notifyMemberApproved(
        userId: session['userId'] as String,
        sessionId: sessionId,
      );
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to approve session: $e');
      rethrow;
    }
  }

  /// Member cancels their own field work request before manager acts.
  ///
  /// Only valid when status == 'pending_approval'.
  Future<void> cancelFieldWork({
    required String sessionId,
    required String attendanceId,
    required String userId,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();

      // Verify the session is still pending
      final session = await _client
          .from('field_work_sessions')
          .select('status')
          .eq('id', sessionId)
          .single();

      if (session['status'] != 'pending_approval') {
        throw Exception(
          'Cannot cancel: session is already ${session['status']}.',
        );
      }

      await _client.from('field_work_sessions').update({
        'status': 'cancelled',
        'endedAt': now,
        'updatedAt': now,
      }).eq('id', sessionId);

      // Reset attendance workMode to office
      await _client.from('attendance').update({
        'workMode': 'office',
        'presenceStatus': 'verified',
      }).eq('id', attendanceId);

      await _client.from('attendance_events').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': 'work_mode_change',
        'eventTime': now,
        'workMode': 'office',
        'notes': 'Field work request cancelled by member.',
        'metadata': {
          'field_work_session_id': sessionId,
          'previous_mode': 'field',
          'new_mode': 'office',
        },
      });

      _logger.info('FIELD_WORK: Session $sessionId cancelled by member $userId');
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to cancel session: $e');
      rethrow;
    }
  }

  /// Transition an approved session to active (member actually departs).
  ///
  /// Distinguishes "approved but waiting" from "currently in the field".
  Future<void> activateFieldWork({
    required String sessionId,
    required String attendanceId,
    required String userId,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();

      // Verify the session is in approved or auto_approved state
      final session = await _client
          .from('field_work_sessions')
          .select('status')
          .eq('id', sessionId)
          .single();

      final currentStatus = session['status'] as String;
      if (currentStatus != 'approved' && currentStatus != 'auto_approved') {
        throw Exception(
          'Cannot activate: session is $currentStatus (expected approved/auto_approved).',
        );
      }

      await _client.from('field_work_sessions').update({
        'status': 'active',
        'updatedAt': now,
      }).eq('id', sessionId);

      await _client.from('attendance_events').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': 'field_work_activated',
        'eventTime': now,
        'notes': 'Member departed for field work.',
        'metadata': {
          'field_work_session_id': sessionId,
        },
      });

      _logger.info('FIELD_WORK: Session $sessionId activated (member departed)');
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to activate session: $e');
      rethrow;
    }
  }

  /// Manager rejects a field work session.
  ///
  /// Does NOT auto-checkout immediately. Instead, the rejection triggers a
  /// grace period notification to the user ("Return to office within 15 min").
  /// Auto-checkout happens after the rejection grace period expires.
  Future<void> rejectFieldWork({
    required String sessionId,
    required String attendanceId,
    required String userId,
    required String managerId,
    String? rejectionReason,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();

      // Update field work session status to rejected
      await _client.from('field_work_sessions').update({
        'status': 'rejected',
        'approvedBy': managerId,
        'approvedAt': now,
        'rejectionReason': rejectionReason,
        'updatedAt': now,
        // Don't set endedAt yet — the grace period handles final closure
      }).eq('id', sessionId);

      // Log rejection event (the grace period + auto-checkout is handled client-side)
      await _client.from('attendance_events').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': 'field_work_rejected',
        'eventTime': now,
        'notes': 'Field work request rejected by manager. '
            'Reason: ${rejectionReason ?? "Not specified"}. '
            'Grace period started for return to office.',
        'metadata': {
          'field_work_session_id': sessionId,
          'rejected_by': managerId,
          'rejection_reason': rejectionReason,
        },
      });

      _logger.info('FIELD_WORK: Session $sessionId rejected by manager $managerId');

      // Notify the member about rejection with grace period
      _notificationService.notifyMemberRejected(
        userId: userId,
        sessionId: sessionId,
        gracePeriodMinutes: 15, // Default grace period
        rejectionReason: rejectionReason,
      );
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to reject session: $e');
      rethrow;
    }
  }

  /// Force checkout after rejection grace period expires.
  /// Called by the client-side timer after rejection_grace_period_minutes.
  Future<void> forceCheckoutAfterRejection({
    required String sessionId,
    required String attendanceId,
    required String userId,
  }) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();

      // Close the field work session
      await _client.from('field_work_sessions').update({
        'endedAt': now,
        'updatedAt': now,
      }).eq('id', sessionId);

      // Close the attendance record (checkout)
      await _client.from('attendance').update({
        'checkOutTime': now,
        'checkOutSource': 'system',
        'attendanceState': 'closed',
        'closeReason': 'Field work rejected - auto checkout',
        'presenceStatus': 'absent',
      }).eq('id', attendanceId);

      // Log auto-checkout event
      await _client.from('attendance_events').insert({
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': 'auto_closed',
        'eventTime': now,
        'notes': 'Auto-checkout after field work rejection grace period expired.',
        'metadata': {
          'field_work_session_id': sessionId,
          'close_trigger': 'field_work_rejection_grace_expired',
        },
      });

      _logger.info('FIELD_WORK: Forced checkout for user $userId after rejection grace period');
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to force checkout: $e');
      rethrow;
    }
  }

  /// Get all pending field work sessions (for manager approval view).
  Future<List<Map<String, dynamic>>> getPendingFieldWorkSessions() async {
    try {
      final result = await _client
          .from('field_work_sessions')
          .select()
          .eq('status', 'pending_approval')
          .isFilter('endedAt', null)
          .order('createdAt', ascending: false);
      return List<Map<String, dynamic>>.from(result);
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to fetch pending sessions: $e');
      return [];
    }
  }

  /// Get field work session history for a specific user.
  Future<List<Map<String, dynamic>>> getFieldWorkHistory(
    String userId, {
    int limit = 20,
  }) async {
    try {
      final result = await _client
          .from('field_work_sessions')
          .select()
          .eq('userId', userId)
          .order('createdAt', ascending: false)
          .limit(limit);
      return List<Map<String, dynamic>>.from(result);
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to fetch history: $e');
      return [];
    }
  }

  /// Append a location snapshot during an active field work session.
  /// Called periodically since geofence monitoring is paused during field work.
  Future<void> appendLocationSnapshot({
    required String sessionId,
    required double latitude,
    required double longitude,
    double? accuracy,
  }) async {
    try {
      // Read current snapshots
      final session = await _client
          .from('field_work_sessions')
          .select('locationSnapshots')
          .eq('id', sessionId)
          .single();

      final List<dynamic> snapshots = List.from(session['locationSnapshots'] ?? []);
      snapshots.add({
        'lat': latitude,
        'lng': longitude,
        'time': DateTime.now().toUtc().toIso8601String(),
        'accuracy': accuracy,
      });

      await _client.from('field_work_sessions').update({
        'locationSnapshots': snapshots,
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', sessionId);
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to append location snapshot: $e');
    }
  }

  /// Auto-approve field work session after manager timeout.
  Future<void> autoApproveFieldWork(String sessionId) async {
    try {
      final now = DateTime.now().toUtc().toIso8601String();
      await _client.from('field_work_sessions').update({
        'status': 'auto_approved',
        'approvedAt': now,
        'updatedAt': now,
      }).eq('id', sessionId);

      _logger.info('FIELD_WORK: Session $sessionId auto-approved (manager timeout)');

      // Notify the member about auto-approval
      final session = await _client
          .from('field_work_sessions')
          .select('userId')
          .eq('id', sessionId)
          .single();
      _notificationService.notifyMemberAutoApproved(
        userId: session['userId'] as String,
        sessionId: sessionId,
      );
    } catch (e) {
      _logger.error('FIELD_WORK: Failed to auto-approve session: $e');
    }
  }

  /// Helper: get user display name from profiles table.
  Future<String> _getUserName(String userId) async {
    try {
      final profile = await _client
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .single();
      return profile['name'] as String? ?? 'Team Member';
    } catch (_) {
      return 'Team Member';
    }
  }
}
