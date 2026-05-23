import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/providers/user_provider.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/realtime_service.dart';
import '../../data/datasources/task_local_datasource.dart';
import '../../data/repositories/supabase_task_repository.dart';
import '../../domain/models/task.dart';
import '../../domain/repositories/task_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'tasks_provider.g.dart';

@riverpod
TaskRepository taskRepository(TaskRepositoryRef ref) {
  // Watch auth state to ensure repository is aware of user changes
  ref.watch(authStateProvider);
  
  final supabaseClient = Supabase.instance.client;
  final localDataSource = HiveTaskLocalDataSource();
  final syncService = ref.watch(syncServiceProvider);
  
  
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
    
    // Listen for realtime updates via centralized service
    // This ensures we don't recreate the subscription on every data refresh
    ref.listen(tableUpdateProvider('tasks'), (_, __) {
      ref.invalidateSelf();
    });

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
