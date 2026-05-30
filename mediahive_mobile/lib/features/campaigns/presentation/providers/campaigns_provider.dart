import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/repositories/campaign_repository.dart';
import '../../../../core/services/logger_service.dart';

final campaignRepositoryProvider = Provider<CampaignRepository>((ref) {
  final logger = ref.watch(loggerProvider.notifier);
  return CampaignRepository(Supabase.instance.client, logger);
});

final campaignsStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repository = ref.watch(campaignRepositoryProvider);
  return repository.getCampaigns();
});
