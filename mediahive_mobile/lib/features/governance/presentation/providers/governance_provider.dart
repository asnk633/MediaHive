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
    // Mock for now until table exists
    return const Right([
      Policy(
        id: 'p1', 
        title: 'DETERMINISTIC CONFLICT RESOLUTION', 
        description: 'Ensures no silent overwrites by comparing user seniority and field context.', 
        iconName: 'gitMerge', 
        isActive: true
      ),
      Policy(
        id: 'p2', 
        title: 'INSTITUTIONAL BOUNDARY GUARD', 
        description: 'Prevents unassigned asset exposure across non-affiliated departments.', 
        iconName: 'lock', 
        isActive: true
      ),
    ]);
  }

  @override
  Future<Either<Failure, List<GovernanceLog>>> getLogs() async {
    return const Right([
      GovernanceLog(id: 'l1', action: 'Policy Update', details: 'System-wide conflict resolution parameters adjusted by Root.', timestamp: '2H AGO'),
      GovernanceLog(id: 'l2', action: 'Authority Grant', details: 'Manager role assigned to user @rahman for Media Inst.', timestamp: '5H AGO'),
      GovernanceLog(id: 'l3', action: 'Conflict Resolved', details: 'Task #142 field "Priority" resolved by seniority (Admin > Team).', timestamp: '8H AGO'),
    ]);
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
