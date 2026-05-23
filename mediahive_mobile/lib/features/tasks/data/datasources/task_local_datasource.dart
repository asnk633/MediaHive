import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/models/task.dart';

abstract class TaskLocalDataSource {
  Future<List<Task>> getTasks();
  Future<void> cacheTasks(List<Task> tasks);
  Future<void> addTask(Task task);
  Future<void> updateTask(Task task);
  Future<void> deleteTask(String id);
  Future<void> clearCache();
}

class HiveTaskLocalDataSource implements TaskLocalDataSource {
  static const String _boxName = 'tasks_cache';
  Box? _cachedBox;

  Future<Box> _openBox() async {
    if (_cachedBox != null && _cachedBox!.isOpen) {
      return _cachedBox!;
    }
    _cachedBox = await Hive.openBox(_boxName);
    return _cachedBox!;
  }

  @override
  Future<List<Task>> getTasks() async {
    final box = await _openBox();
    final List<dynamic> rawTasks = box.values.toList();
    return rawTasks.map((json) => Task.fromJson(Map<String, dynamic>.from(json))).toList();
  }

  @override
  Future<void> cacheTasks(List<Task> tasks) async {
    final box = await _openBox();
    await box.clear();
    final Map<String, dynamic> tasksMap = {
      for (var task in tasks) task.id: task.toJson()
    };
    await box.putAll(tasksMap);
  }

  @override
  Future<void> addTask(Task task) async {
    final box = await _openBox();
    await box.put(task.id, task.toJson());
  }

  @override
  Future<void> updateTask(Task task) async {
    final box = await _openBox();
    await box.put(task.id, task.toJson());
  }

  @override
  Future<void> deleteTask(String id) async {
    final box = await _openBox();
    await box.delete(id);
  }

  @override
  Future<void> clearCache() async {
    final box = await _openBox();
    await box.clear();
  }
}
