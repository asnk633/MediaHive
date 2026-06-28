import 'package:dartz/dartz.dart' hide Task;
import '../../../../../core/error/failure.dart';
import 'package:mediahive_mobile/features/tasks/domain/models/task.dart';

abstract class TaskRepository {
  Future<Either<Failure, List<Task>>> getTasks();
  Future<Either<Failure, void>> addTask(Task task);
  Future<Either<Failure, void>> updateTask(Task task);
  Future<Either<Failure, void>> deleteTask(String id);
}
