import 'package:dartz/dartz.dart';
import 'package:mediahive_mobile/core/error/failure.dart';
import 'package:mediahive_mobile/features/governance/domain/models/governance_models.dart';

abstract class GovernanceRepository {
  Future<Either<Failure, List<Policy>>> getPolicies();
  Future<Either<Failure, List<GovernanceLog>>> getLogs();
  Future<Either<Failure, GovernanceStats>> getStats();
}
