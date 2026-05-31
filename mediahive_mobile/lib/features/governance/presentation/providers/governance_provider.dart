import 'package:dartz/dartz.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/error/failure.dart';
import '../../domain/models/governance_models.dart';
import '../../domain/repositories/governance_repository.dart';

class SupabaseGovernanceRepository implements GovernanceRepository {
  final SupabaseClient _client;
  SupabaseGovernanceRepository(this._client);

  @override
  Future<Either<Failure, List<Policy>>> getPolicies() async {
    try {
      final response = await _client
          .from('governance_policies')
          .select()
          .order('created_at', ascending: true);
      
      final policies = (response as List).map((json) => Policy(
        id: json['id'].toString(),
        title: json['title'] ?? '',
        description: json['description'] ?? '',
        iconName: json['icon_name'] ?? 'shield',
        isActive: json['is_active'] ?? true,
      )).toList();
      
      return Right(policies);
    } catch (e) {
      return Left(ServerFailure('Failed to fetch policies: $e'));
    }
  }

  @override
  Future<Either<Failure, List<GovernanceLog>>> getLogs() async {
    try {
      final response = await _client
          .from('system_activity_logs')
          .select()
          .order('created_at', ascending: false)
          .limit(10);
      
      final logs = (response as List).map((json) {
        return GovernanceLog(
          id: json['id'].toString(),
          action: json['action_type'] ?? 'System Event',
          details: json['description'] ?? '',
          timestamp: _formatTimeAgo(DateTime.parse(json['created_at'].toString()).toLocal()),
        );
      }).toList();
      
      return Right(logs);
    } catch (e) {
      return Left(ServerFailure('Failed to fetch logs: $e'));
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inDays > 0) return '${diff.inDays}D AGO';
    if (diff.inHours > 0) return '${diff.inHours}H AGO';
    if (diff.inMinutes > 0) return '${diff.inMinutes}M AGO';
    return 'JUST NOW';
  }

  @override
  Future<Either<Failure, GovernanceStats>> getStats() async {
    try {
      final rulesResponse = await _client
          .from('governance_policies')
          .select('id')
          .eq('is_active', true);
      final activeRulesCount = (rulesResponse as List).length;

      final eventsResponse = await _client
          .from('system_activity_logs')
          .select('id');
      final auditEventsCount = (eventsResponse as List).length;

      final rolesResponse = await _client
          .from('profiles')
          .select('role');
      
      final profiles = rolesResponse as List;
      int total = profiles.length;
      if (total == 0) total = 1; 
      
      int admins = 0;
      int managers = 0;
      int members = 0;
      
      for (var p in profiles) {
        final role = p['role']?.toString().toLowerCase() ?? 'member';
        if (role.contains('admin')) admins++;
        else if (role.contains('manager')) managers++;
        else members++;
      }

      return Right(GovernanceStats(
        activeRulesCount: activeRulesCount,
        auditEventsCount: auditEventsCount,
        adminPercentage: admins / total,
        managerPercentage: managers / total,
        teamPercentage: members / total,
      ));
    } catch (e) {
      return Left(ServerFailure('Failed to fetch stats: $e'));
    }
  }
}

final governanceRepositoryProvider = Provider<GovernanceRepository>((ref) {
  return SupabaseGovernanceRepository(Supabase.instance.client);
});

final governancePoliciesProvider = FutureProvider<List<Policy>>((ref) async {
  final repo = ref.watch(governanceRepositoryProvider);
  final result = await repo.getPolicies();
  return result.fold((f) => throw f, (p) => p);
});

final governanceLogsProvider = FutureProvider<List<GovernanceLog>>((ref) async {
  final repo = ref.watch(governanceRepositoryProvider);
  final result = await repo.getLogs();
  return result.fold((f) => throw f, (l) => l);
});

final governanceStatsProvider = FutureProvider<GovernanceStats>((ref) async {
  final repo = ref.watch(governanceRepositoryProvider);
  final result = await repo.getStats();
  return result.fold((f) => throw f, (s) => s);
});
