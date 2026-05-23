// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tasks_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$taskRepositoryHash() => r'dfe73bf14db4edd4a9ccdf2ced7d378f310130d3';

/// See also [taskRepository].
@ProviderFor(taskRepository)
final taskRepositoryProvider = AutoDisposeProvider<TaskRepository>.internal(
  taskRepository,
  name: r'taskRepositoryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$taskRepositoryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef TaskRepositoryRef = AutoDisposeProviderRef<TaskRepository>;
String _$tasksListHash() => r'6799b22dd1efb70bba6058c97b86c8ed0c224b60';

/// See also [TasksList].
@ProviderFor(TasksList)
final tasksListProvider =
    AutoDisposeAsyncNotifierProvider<TasksList, List<Task>>.internal(
  TasksList.new,
  name: r'tasksListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$tasksListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$TasksList = AutoDisposeAsyncNotifier<List<Task>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
