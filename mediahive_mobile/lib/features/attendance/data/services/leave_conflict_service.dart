import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

class LeaveConflictService {
  final SupabaseClient _client;
  final _logger = LoggerService();

  LeaveConflictService(this._client);

  /// Checks if the user has an approved leave record that covers the specified date.
  /// Falls back to false if the leave requests table does not exist or fails to query.
  Future<bool> hasApprovedLeave(String userId, DateTime date) async {
    try {
      final dateIsoStr = date.toIso8601String().split('T')[0]; // "YYYY-MM-DD"
      
      final response = await _client
          .from('leave_requests')
          .select('id')
          .eq('requested_by_id', userId)
          .eq('status', 'approved')
          .lte('start_date', dateIsoStr)
          .gte('end_date', dateIsoStr)
          .limit(1);
      
      final list = response as List?;
      return list != null && list.isNotEmpty;
    } catch (e) {
      _logger.warning('Graceful skip: Could not query leave conflicts (HR leave_requests table setup pending): $e');
      return false;
    }
  }
}
