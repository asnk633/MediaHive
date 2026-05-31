import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logging/logging.dart';

class SystemRepository {
  final SupabaseClient _client;
  final _logger = Logger('SystemRepository');

  SystemRepository(this._client);

  Future<Map<String, int>> getCommandCenterMetrics() async {
    try {
      // 1. Total Users
      final userCountResponse = await _client
          .from('profiles')
          .select('id')
          .count(CountOption.exact);
      final totalUsers = userCountResponse.count;

      // 2. Active Nodes (Institutions + Departments)
      final institutionsResponse = await _client
          .from('institutions')
          .select('id')
          .count(CountOption.exact);
          
      int departmentsCount = 0;
      try {
        final departmentsResponse = await _client
            .from('departments')
            .select('id')
            .count(CountOption.exact);
        departmentsCount = departmentsResponse.count;
      } catch (_) {}

      final activeNodes = institutionsResponse.count + departmentsCount;

      // 3. Pending (Leave Requests + Tasks 'todo')
      final pendingLeavesResponse = await _client
          .from('leave_requests')
          .select('id')
          .eq('status', 'pending')
          .count(CountOption.exact);
      
      final pendingTasksResponse = await _client
          .from('tasks')
          .select('id')
          .eq('status', 'todo')
          .eq('deleted', false)
          .count(CountOption.exact);
      
      final totalPending = pendingLeavesResponse.count + pendingTasksResponse.count;

      return {
        'totalUsers': totalUsers,
        'activeNodes': activeNodes,
        'pending': totalPending,
      };
    } catch (e) {
      _logger.severe('Error fetching command center metrics: $e');
      return {
        'totalUsers': 0,
        'activeNodes': 0,
        'pending': 0,
      };
    }
  }

  Stream<Map<String, int>> watchCommandCenterMetrics() {
    // For simplicity, we'll return a periodic stream that fetches data
    // In a real app, you might use Supabase Realtime for each table
    return Stream.periodic(const Duration(seconds: 30)).asyncMap((_) => getCommandCenterMetrics());
  }
}
