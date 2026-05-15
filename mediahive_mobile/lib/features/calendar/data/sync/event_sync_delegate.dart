import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/models/sync_mutation.dart';
import '../../../../../core/models/sync_result.dart';
import '../../../../../core/services/sync_service.dart';
import '../../domain/models/event.dart';

class EventSyncDelegate implements SyncDelegate {
  final SupabaseClient _client;
  
  // The tenant ID for ThaiBa Garden (MediaHive)
  static const String _defaultTenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';

  EventSyncDelegate(this._client);

  @override
  Future<SyncResult> execute(SyncMutation mutation) async {
    try {
      final event = Event.fromJson(mutation.data);
      
      // Sanitize payload for Supabase
      final data = event.toJson();
      
      // Combine date and time for start_at
      final startAt = '${data['date']}T${data['time']}:00Z';
      
      final Map<String, dynamic> payload = {
        'id': data['id'],
        'title': data['title'],
        'description': data['description'],
        'location': data['location'],
        'start_at': startAt,
        'end_at': DateTime.parse(startAt).add(const Duration(hours: 1)).toIso8601String(),
        'status': data['type']?.toString().toLowerCase() ?? 'confirmed',
        'tenant_id': _defaultTenantId,
      };

      // Ensure created_by on creation
      if (mutation.type == 'create') {
        payload['created_by'] = _client.auth.currentUser?.id;
      }

      print('[EVENT_SYNC] Syncing ${mutation.type} for event ${event.id}');

      switch (mutation.type) {
        case 'create':
          await _client.from('events').insert(payload);
          break;
        case 'update':
          await _client.from('events').update(payload).eq('id', event.id);
          break;
        case 'delete':
          await _client.from('events').delete().eq('id', mutation.id);
          break;
      }
      return SyncResult.success;
    } on PostgrestException catch (e) {
      print('[EVENT_SYNC] Supabase error ${e.code}: ${e.message}');
      if (e.code == '23505' || e.code == '409') {
        return SyncResult.success;
      }
      final statusCode = int.tryParse(e.code ?? '');
      if (statusCode != null && statusCode >= 400 && statusCode < 500) {
        return SyncResult.discard;
      }
      return SyncResult.retry;
    } catch (e) {
      print('[EVENT_SYNC] Unexpected error: $e');
      return SyncResult.retry;
    }
  }
}
