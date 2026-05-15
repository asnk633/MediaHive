import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/models/sync_mutation.dart';
import '../../../../../core/models/sync_result.dart';
import '../../../../../core/services/sync_service.dart';
import '../../domain/models/task.dart';

class TaskSyncDelegate implements SyncDelegate {
  final SupabaseClient _client;

  // The tenant ID for ThaiBa Garden (MediaHive)
  static const String _defaultTenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';

  TaskSyncDelegate(this._client);

  @override
  Future<SyncResult> execute(SyncMutation mutation) async {
    try {
      final task = Task.fromJson(mutation.data);
      
      // Sanitize payload for Supabase
      final data = task.toJson();
      final Map<String, dynamic> payload = {
        'id': data['id'],
        'title': data['title'],
        'status': data['status']?.toString().toLowerCase().replaceAll(' ', '_'),
        'priority': data['priority']?.toString().toLowerCase(),
        'description': data['description'],
        'due_date': data['dueDate'],
        'completed_at': data['completionDate'],
        'on_behalf_of': data['onBehalfOf'],
        'files': data['attachments'],
      };
      
      // 2. Ensure mandatory fields for RLS and constraints
      payload['tenant_id'] = _defaultTenantId;
      
      // 3. Handle created_by/assigned_by (Use UUIDs from metadata if possible, or fallback)
      // Since task.requester/assignee now contain NAMES (from repository), 
      // we shouldn't send them as UUIDs.
      // For creation, we'll use the current user as creator.
      if (mutation.type == 'create') {
        payload['created_by'] = _client.auth.currentUser?.id;
      }
      
      // Remove nulls to let DB defaults work or avoid errors
      payload.removeWhere((key, value) => value == null);

      print('[TASK_SYNC] Syncing ${mutation.type} for task ${task.id}');

      switch (mutation.type) {
        case 'create':
          await _client.from('tasks').insert(payload);
          break;
        case 'update':
          // Don't update created_by on updates
          payload.remove('created_by');
          await _client.from('tasks').update(payload).eq('id', task.id);
          break;
        case 'delete':
          await _client.from('tasks').delete().eq('id', mutation.id);
          break;
      }
      return SyncResult.success;
    } on PostgrestException catch (e) {
      print('[TASK_SYNC] Supabase error ${e.code}: ${e.message}');
      
      // 409 Conflict or 23505 Unique Violation means it's already there
      if (e.code == '23505' || e.code == '409') {
        return SyncResult.success;
      }
      
      final statusCode = int.tryParse(e.code ?? '');
      // If it's a 4xx error (other than conflict), it's likely a permanent error (schema mismatch)
      // so we discard it to prevent blocking the queue.
      if (statusCode != null && statusCode >= 400 && statusCode < 500) {
        return SyncResult.discard;
      }
      return SyncResult.retry;
    } catch (e) {
      print('[TASK_SYNC] Unexpected error: $e');
      return SyncResult.retry;
    }
  }

  bool _isValidUuid(String uuid) {
    final uuidRegex = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      caseSensitive: false,
    );
    return uuidRegex.hasMatch(uuid);
  }
}
