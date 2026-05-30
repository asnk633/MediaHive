import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/repositories/leave_repository.dart';
import '../../../../core/services/logger_service.dart';

final leaveRepositoryProvider = Provider<LeaveRepository>((ref) {
  final logger = ref.watch(loggerProvider.notifier);
  return LeaveRepository(Supabase.instance.client, logger);
});

final myLeaveRequestsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(leaveRepositoryProvider);
  return repository.getMyLeaveRequests();
});

final myLeaveBalanceProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final repository = ref.watch(leaveRepositoryProvider);
  return repository.getLeaveBalance();
});

final teamLeaveRequestsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(leaveRepositoryProvider);
  return repository.getTeamLeaveRequests();
});

final leaveSearchQueryProvider = StateProvider<String>((ref) => '');
final leaveTabProvider = StateProvider<int>((ref) => 0); // 0: ALL, 1: PENDING, 2: APPROVED
