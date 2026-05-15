import 'package:dartz/dartz.dart' hide Task;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import '../../../../../core/error/failure.dart';
import '../../../../../core/models/sync_mutation.dart';
import '../../../../../core/services/sync_service.dart';
import '../../domain/models/task.dart';
import '../../domain/repositories/task_repository.dart';
import '../datasources/task_local_datasource.dart';

class SupabaseTaskRepository implements TaskRepository {
  final SupabaseClient _supabaseClient;
  final TaskLocalDataSource _localDataSource;
  final SyncService _syncService;

  SupabaseTaskRepository(
    this._supabaseClient,
    this._localDataSource,
    this._syncService,
  );

  @override
  Future<Either<Failure, List<Task>>> getTasks() async {
    try {
      // 1. Get from local cache immediately
      final localTasks = await _localDataSource.getTasks();
      
      // 2. Fetch from remote and update cache
      try {
        final response = await _supabaseClient
            .from('tasks')
            .select('''
              *,
              creator:profiles!created_by(full_name),
              assigner:profiles!assigned_by(full_name)
            ''')
            .eq('deleted', false)
            .order('created_at', ascending: false);
        
        final remoteTasks = (response as List).map((json) {
          // Flatten names into requester and assignee fields
          final creator = json['creator'] as Map<String, dynamic>?;
          final assigner = json['assigner'] as Map<String, dynamic>?;
          
          final DateTime? dueDateTime = json['due_date'] != null ? DateTime.parse(json['due_date'].toString()).toLocal() : null;
          
          final Map<String, dynamic> mapped = {
            ...json,
            'requester': creator?['full_name'] ?? json['created_by'] ?? 'Unknown',
            'assignee': assigner?['full_name'] ?? json['assigned_by'] ?? 'Unassigned',
            'dueDate': dueDateTime != null ? DateFormat('yyyy-MM-dd').format(dueDateTime) : '',
            'completionDate': json['completed_at'],
            'onBehalfOf': json['on_behalf_of']?.toString(),
            'attachments': (json['files'] as List?)?.map((e) => e.toString()).toList() ?? [],
          };
          
          return Task.fromJson(mapped);
        }).toList();
            
        await _localDataSource.cacheTasks(remoteTasks);
        return Right(remoteTasks);
      } catch (e) {
        // If remote fails, return local tasks if available
        if (localTasks.isNotEmpty) {
          return Right(localTasks);
        }
        return Left(ServerFailure('Remote fetch failed and cache is empty: $e'));
      }
    } catch (e) {
      return Left(CacheFailure('Local cache read failed: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> addTask(Task task) async {
    try {
      // 1. Update local cache immediately (Optimistic)
      await _localDataSource.addTask(task);
      
      // 2. Queue sync mutation
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'create',
        feature: 'tasks',
        data: task.toJson(),
        timestamp: DateTime.now(),
      );
      
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue task: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> updateTask(Task task) async {
    try {
      // 1. Update local cache immediately (Optimistic)
      await _localDataSource.updateTask(task);
      
      // 2. Queue sync mutation
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'update',
        feature: 'tasks',
        data: task.toJson(),
        timestamp: DateTime.now(),
      );
      
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue update: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteTask(String id) async {
    try {
      // 1. Delete from local cache immediately (Optimistic)
      await _localDataSource.deleteTask(id);
      
      // 2. Queue sync mutation
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'delete',
        feature: 'tasks',
        data: {'id': id},
        timestamp: DateTime.now(),
      );
      
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue deletion: $e'));
    }
  }
}
