import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:dartz/dartz.dart' hide Task;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../../../core/error/failure.dart';
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
      debugPrint('[TASK_REPO] Fetching tasks from remote...');
      
      // 1. Fetch from remote and update cache
      try {
        final query = _supabaseClient
            .from('tasks')
            .select('''
              *,
              creator:profiles!tasks_created_by_fkey(full_name),
              assigner:profiles!tasks_assigned_by_fkey(full_name, role),
              task_assignments(
                profile:profiles(full_name)
              )
            ''')
            .eq('deleted', false)
            .order('created_at', ascending: false);
            
        debugPrint('[TASK_REPO] Executing query: ${query.toString()}');
        
        final response = await query;
        debugPrint('[TASK_REPO] Received response from Supabase. Count: ${(response as List).length}');
        
        final remoteTasks = (response).map((json) {
          // Flatten names into requester and assignee fields
          final creator = json['creator'] as Map<String, dynamic>?;
          final assigner = json['assigner'] as Map<String, dynamic>?;
          
          // Get actual assignee from task_assignments
          final assignments = json['task_assignments'] as List?;
          String assigneeName = 'Unassigned';
          if (assignments != null && assignments.isNotEmpty) {
            final names = assignments
                .map((a) => (a as Map)['profile']?['full_name'] as String?)
                .where((name) => name != null && name.isNotEmpty)
                .toList();
            if (names.isNotEmpty) {
              assigneeName = names.join(', ');
              
              // If the assigner is a member/guest, prefix as 'Proposed: '
              final assignerRole = assigner?['role']?.toString().toLowerCase() ?? '';
              if (assignerRole == 'member' || assignerRole == 'guest') {
                assigneeName = 'Proposed: $assigneeName';
              }
            }
          } else {
            assigneeName = 'Unassigned';
          }
          
          final DateTime? dueDateTime = json['due_date'] != null ? DateTime.parse(json['due_date'].toString()).toLocal() : null;
          
          Map<String, dynamic> onBehalfOfMap = json['on_behalf_of'] != null && json['on_behalf_of'] is Map 
              ? Map<String, dynamic>.from(json['on_behalf_of']) 
              : {};
              
          if (assignments != null && assignments.isNotEmpty) {
            final ids = assignments.map((a) => (a as Map)['user_id'] as String?).where((id) => id != null).toList();
            if (ids.isNotEmpty) {
              onBehalfOfMap['assignee_ids'] = ids;
            }
          }

          final Map<String, dynamic> mapped = {
            ...json,
            'requester': creator?['full_name'] ?? json['created_by'] ?? 'Unknown',
            'createdBy': json['created_by'],
            'createdAt': json['created_at'],
            'assignee': assigneeName,
            'dueDate': dueDateTime != null ? DateFormat('yyyy-MM-dd').format(dueDateTime) : '',
            'completionDate': json['completed_at'],
            'completedByName': onBehalfOfMap['completed_by_name'],
            'onBehalfOf': onBehalfOfMap.isNotEmpty ? jsonEncode(onBehalfOfMap) : null,
            'attachments': (json['files'] as List?)?.map((e) => e.toString()).toList() ?? [],
          };
          
          return Task.fromJson(mapped);
        }).toList();
            
        await _localDataSource.cacheTasks(remoteTasks);
        debugPrint('[TASK_REPO] Successfully mapped and cached ${remoteTasks.length} tasks');
        return Right(remoteTasks);
      } catch (e, stack) {
        debugPrint('[TASK_REPO] Remote fetch failed: $e');
        debugPrint('[TASK_REPO] Stack: $stack');
        
        // Return local tasks as fallback if remote fails
        final localTasks = await _localDataSource.getTasks();
        if (localTasks.isNotEmpty) {
          debugPrint('[TASK_REPO] Returning ${localTasks.length} cached tasks as fallback');
          return Right(localTasks);
        }
        return Left(ServerFailure('Remote fetch failed: $e'));
      }
    } catch (e) {
      debugPrint('[TASK_REPO] Fatal error: $e');
      return Left(CacheFailure('Repository error: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> addTask(Task task) async {
    final success = await _syncService.executeImmediate(
      'tasks',
      'create',
      task.toJson(),
      () async {
        final payload = _mapTaskToPayload(task);
        
        // Add tenant and creator info for new tasks
        final userMetadata = _supabaseClient.auth.currentUser?.userMetadata ?? {};
        final currentUserId = _supabaseClient.auth.currentUser?.id;
        
        payload['created_by'] = currentUserId;
        payload['assigned_by'] = currentUserId;
        payload['tenant_id'] = userMetadata['tenant_id'] ?? '7bc0bbe7-1943-4929-a769-5fdfbc487446';
        if (payload['institution_id'] == null && currentUserId != null) {
          try {
            final profile = await _supabaseClient.from('profiles').select('institution_id').eq('id', currentUserId).single();
            payload['institution_id'] = profile['institution_id'];
          } catch (_) {
            payload['institution_id'] = userMetadata['institution_id'];
          }
        }

        await _supabaseClient.from('tasks').insert(payload);
        await _syncAssignments(task);
        await _localDataSource.addTask(task);
      },
    );

    return success ? const Right(null) : Left(ServerFailure('Failed to add task'));
  }

  @override
  Future<Either<Failure, void>> updateTask(Task task) async {
    // 1. Optimistic update
    final previousTask = (await _localDataSource.getTasks()).firstWhere((t) => t.id == task.id);
    await _localDataSource.updateTask(task);

    final success = await _syncService.executeImmediate(
      'tasks',
      'update',
      task.toJson(),
      () async {
        final payload = _mapTaskToPayload(task);
        // Remove immutable fields
        payload.remove('created_by');
        payload.remove('tenant_id');
        payload.remove('institution_id');

        await _supabaseClient.from('tasks').update(payload).eq('id', task.id);
        await _syncAssignments(task);
      },
    );

    if (!success) {
      // Rollback
      await _localDataSource.updateTask(previousTask);
      return Left(ServerFailure('Failed to update task'));
    }

    return const Right(null);
  }

  @override
  Future<Either<Failure, void>> deleteTask(String id) async {
    final success = await _syncService.executeImmediate(
      'tasks',
      'delete',
      {'id': id},
      () async {
        await _supabaseClient.from('task_assignments').delete().eq('task_id', id);
        await _supabaseClient.from('tasks').delete().eq('id', id);
        await _localDataSource.deleteTask(id);
      },
    );

    return success ? const Right(null) : Left(ServerFailure('Failed to delete task'));
  }

  Map<String, dynamic> _mapTaskToPayload(Task task) {
    final data = task.toJson();
    final payload = {
      'id': data['id'],
      'title': data['title'],
      'status': data['status']?.toString().toLowerCase() == 'to do' ? 'todo' : data['status']?.toString().toLowerCase().replaceAll(' ', '_'),
      'priority': data['priority']?.toString().toLowerCase(),
      'description': data['description'],
      'due_date': data['dueDate'],
      'completed_at': data['completionDate'],
      'on_behalf_of': data['onBehalfOf'] is String ? jsonDecode(data['onBehalfOf']) : data['onBehalfOf'],
      'files': data['attachments'],
      'department': data['department'],
      'event_id': data['eventId'],
    };

    // Auto-timestamp completion
    if (payload['status'] == 'done' && (payload['completed_at'] == null || payload['completed_at'].toString().isEmpty)) {
      payload['completed_at'] = DateTime.now().toUtc().toIso8601String();
    }

    // Extract organizational metadata and completion name
    if (payload['on_behalf_of'] != null && payload['on_behalf_of'] is Map) {
      final meta = payload['on_behalf_of'] as Map;
      if (meta['institution_id'] != null) payload['institution_id'] = meta['institution_id'];
      if (meta['department_id'] != null) payload['department_id'] = meta['department_id'];
    }

    if (task.completedByName != null) {
      if (payload['on_behalf_of'] is! Map) {
        payload['on_behalf_of'] = {};
      }
      (payload['on_behalf_of'] as Map)['completed_by_name'] = task.completedByName;
    }

    payload.removeWhere((key, value) => value == null);
    return payload;
  }

  Future<void> _syncAssignments(Task task) async {
    final data = task.toJson();
    if (data['onBehalfOf'] != null) {
      try {
        final meta = data['onBehalfOf'] is String ? jsonDecode(data['onBehalfOf']) : data['onBehalfOf'];
        final assigneeId = meta['assignee_id'];
        final assigneeIds = meta['assignee_ids'] as List<dynamic>?;
        
        final userMetadata = _supabaseClient.auth.currentUser?.userMetadata ?? {};
        final tenantId = userMetadata['tenant_id'] ?? '7bc0bbe7-1943-4929-a769-5fdfbc487446';

        if (assigneeIds != null) {
          await _supabaseClient.from('task_assignments').delete().eq('task_id', task.id);
          if (assigneeIds.isNotEmpty) {
            final insertData = assigneeIds.map((id) => {
              'task_id': task.id,
              'user_id': id.toString(),
              'tenant_id': tenantId,
              'role': 'assignee'
            }).toList();
            await _supabaseClient.from('task_assignments').insert(insertData);
          }
        } else if (assigneeId != null) {
          await _supabaseClient.from('task_assignments').delete().eq('task_id', task.id);
          await _supabaseClient.from('task_assignments').insert({
            'task_id': task.id,
            'user_id': assigneeId,
            'tenant_id': tenantId,
            'role': 'assignee'
          });
        }
      } catch (e) {
        debugPrint('[TASK_REPO] Failed to sync assignments: $e');
      }
    }
  }
}
