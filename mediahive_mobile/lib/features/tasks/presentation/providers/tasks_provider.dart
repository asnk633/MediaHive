import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/services/sync_service.dart';
import '../../data/datasources/task_local_datasource.dart';
import '../../data/repositories/supabase_task_repository.dart';
import '../../data/sync/task_sync_delegate.dart';
import '../../domain/models/task.dart';
import '../../domain/repositories/task_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'tasks_provider.g.dart';

@riverpod
TaskRepository taskRepository(TaskRepositoryRef ref) {
  final supabaseClient = Supabase.instance.client;
  final localDataSource = HiveTaskLocalDataSource();
  final syncService = ref.watch(syncServiceProvider);
  
  // Register Task Delegate
  syncService.registerDelegate('tasks', TaskSyncDelegate(supabaseClient));
  
  return SupabaseTaskRepository(
    supabaseClient,
    localDataSource,
    syncService,
  );
}

@riverpod
class TasksList extends _$TasksList {
  @override
  Future<List<Task>> build() async {
    final repository = ref.watch(taskRepositoryProvider);
    final result = await repository.getTasks();
    return result.fold(
      (failure) => throw failure,
      (tasks) => tasks,
    );
  }

  Future<void> addTask(Task task) async {
    final repository = ref.watch(taskRepositoryProvider);
    
    // Optimistic Update
    final previousState = state;
    state = AsyncValue.data([task, ...state.value ?? []]);
    
    final result = await repository.addTask(task);
    result.fold(
      (failure) {
        // Rollback on failure
        state = previousState;
      },
      (_) => null,
    );
  }

  Future<void> updateTask(Task task) async {
    final repository = ref.watch(taskRepositoryProvider);
    
    // Optimistic Update
    final previousState = state;
    state = AsyncValue.data(
      (state.value ?? []).map((t) => t.id == task.id ? task : t).toList(),
    );
    
    final result = await repository.updateTask(task);
    result.fold(
      (failure) {
        state = previousState;
      },
      (_) => null,
    );
  }

  Future<void> deleteTask(String id) async {
    final repository = ref.watch(taskRepositoryProvider);
    
    // Optimistic Update
    final previousState = state;
    state = AsyncValue.data(
      (state.value ?? []).where((t) => t.id != id).toList(),
    );
    
    final result = await repository.deleteTask(id);
    result.fold(
      (failure) {
        state = previousState;
      },
      (_) => null,
    );
  }
}
