import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/logger_service.dart';

class LeaveRepository {
  final SupabaseClient _supabase;
  final LoggerService _logger;

  LeaveRepository(this._supabase, this._logger);

  Future<List<Map<String, dynamic>>> getMyLeaveRequests() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return [];

    try {
      final response = await _supabase
          .from('leave_requests')
          .select('*')
          .eq('requested_by_id', user.id)
          .order('requested_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      _logger.error('Error fetching leave requests', e);
      return [];
    }
  }

  Future<void> submitLeaveRequest({
    required String type,
    required DateTime startDate,
    required DateTime endDate,
    required double totalDays,
    String? reason,
    String? institutionId,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    try {
      await _supabase.from('leave_requests').insert({
        'type': type,
        'start_date': startDate.toIso8601String(),
        'end_date': endDate.toIso8601String(),
        'total_days': totalDays,
        'reason': reason,
        'requested_by_id': user.id,
        'institution_id': institutionId,
        'status': 'pending',
        'requested_at': DateTime.now().toIso8601String(),
      });
      _logger.info('Leave request submitted successfully');
    } catch (e) {
      _logger.error('Error submitting leave request', e);
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> getLeaveBalance() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return null;

    try {
      final year = DateTime.now().year;
      final response = await _supabase
          .from('user_leave_balances')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', year)
          .maybeSingle();
      return response;
    } catch (e) {
      _logger.error('Error fetching leave balance', e);
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getTeamLeaveRequests() async {
    try {
      final response = await _supabase
          .from('leave_requests')
          .select('*, requested_by:profiles!requested_by_id(full_name, avatar_url, email)')
          .order('requested_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      _logger.error('Error fetching team leave requests', e);
      return [];
    }
  }

  Future<void> updateLeaveStatus(String requestId, String status) async {
    try {
      await _supabase
          .from('leave_requests')
          .update({'status': status})
          .eq('id', requestId);
      _logger.info('Leave request $requestId updated to $status');
    } catch (e) {
      _logger.error('Error updating leave status', e);
      rethrow;
    }
  }
}
