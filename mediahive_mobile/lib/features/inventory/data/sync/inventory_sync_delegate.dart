import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/models/sync_mutation.dart';
import '../../../../../core/models/sync_result.dart';
import '../../../../../core/services/sync_service.dart';
import '../../domain/models/inventory_item.dart';

class InventorySyncDelegate implements SyncDelegate {
  final SupabaseClient _client;
  
  // The tenant ID for ThaiBa Garden (MediaHive)
  static const String _defaultTenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';
  // Default institution ID (Thaiba Garden Main)
  static const String _defaultInstitutionId = '2db97c34-c1c7-4c03-9485-8e8e2721cb06';

  InventorySyncDelegate(this._client);

  @override
  Future<SyncResult> execute(SyncMutation mutation) async {
    try {
      final item = InventoryItem.fromJson(mutation.data);
      
      // Sanitize payload for Supabase
      final data = item.toJson();
      
      final Map<String, dynamic> payload = {
        'id': data['id'],
        'name': data['name'],
        'description': data['description'],
        'category': data['category']?.toString().toUpperCase() ?? 'GENERAL',
        'quantity': data['quantity'],
        'condition': data['condition']?.toString().toUpperCase() ?? 'GOOD',
        'status': data['status']?.toString().toUpperCase() ?? 'AVAILABLE',
        'unit': data['metadata']?['unit'] ?? 'piece', // Mandatory in DB
        'image_url': data['imageUrl'],
        'drive_file_id': data['metadata']?['drive_file_id'],
        'serial_number': data['metadata']?['serial_number'],
        'purchase_price': data['metadata']?['purchase_price'],
        'brand': data['metadata']?['brand'],
        'model': data['metadata']?['model'],
        'tenant_id': _defaultTenantId,
        'institution_id': _defaultInstitutionId,
        'updated_at': DateTime.now().toIso8601String(),
      };

      // Ensure created_by on creation
      if (mutation.type == 'create') {
        payload['created_by'] = _client.auth.currentUser?.id;
      }

      print('[INVENTORY_SYNC] Syncing ${mutation.type} for item ${item.id}');

      switch (mutation.type) {
        case 'create':
          await _client.from('inventory').insert(payload);
          break;
        case 'update':
          await _client.from('inventory').update(payload).eq('id', item.id);
          break;
        case 'delete':
          await _client.from('inventory').delete().eq('id', item.id);
          break;
      }
      return SyncResult.success;
    } on PostgrestException catch (e) {
      print('[INVENTORY_SYNC] Supabase error ${e.code}: ${e.message}');
      if (e.code == '23505' || e.code == '409') {
        return SyncResult.success;
      }
      final statusCode = int.tryParse(e.code ?? '');
      if (statusCode != null && statusCode >= 400 && statusCode < 500) {
        return SyncResult.discard;
      }
      return SyncResult.retry;
    } catch (e) {
      print('[INVENTORY_SYNC] Unexpected error: $e');
      return SyncResult.retry;
    }
  }
}
