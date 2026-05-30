import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/logger_service.dart';

class CampaignRepository {
  final SupabaseClient _supabase;
  final LoggerService _logger;

  CampaignRepository(this._supabase, this._logger);

  Future<void> createCampaign({
    required String name,
    required String description,
    required DateTime startDate,
    required DateTime endDate,
    required String tenantId,
    String? institutionId,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _supabase.from('campaigns').insert({
        'name': name,
        'description': description,
        'start_date': startDate.toIso8601String().split('T')[0],
        'end_date': endDate.toIso8601String().split('T')[0],
        'institution_id': institutionId,
        'owner_id': user.id,
        'tenant_id': tenantId,
        'phase': 'planning',
      });

      _logger.info('✅ Campaign created: $name');
    } catch (e) {
      _logger.error('❌ Error creating campaign', e);
      rethrow;
    }
  }

  Stream<List<Map<String, dynamic>>> getCampaigns() {
    return _supabase
        .from('campaigns')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false);
  }
}
