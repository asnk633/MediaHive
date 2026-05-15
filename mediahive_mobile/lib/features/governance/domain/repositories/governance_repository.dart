import 'package:dartz/dartz.dart';
import '../../../../core/error/failure.dart';
import '../models/governance_models.dart';

abstract class GovernanceRepository {
  Future<Either<Failure, List<Policy>>> getPolicies();
  Future<Either<Failure, List<GovernanceLog>>> getLogs();
}
