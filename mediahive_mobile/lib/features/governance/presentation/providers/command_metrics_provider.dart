import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/models/system_activity_log.dart';
import '../../../system/data/repositories/system_repository.dart';

final systemRepositoryProvider = Provider<SystemRepository>((ref) {
  return SystemRepository(Supabase.instance.client);
});

final commandCenterMetricsProvider = FutureProvider<Map<String, int>>((ref) async {
  final repository = ref.watch(systemRepositoryProvider);
  return repository.getCommandCenterMetrics();
});

// A stream version for near real-time updates
final commandCenterMetricsStreamProvider = StreamProvider<Map<String, int>>((ref) {
  final repository = ref.watch(systemRepositoryProvider);
  // Initial fetch combined with periodic updates
  return Stream.fromFuture(repository.getCommandCenterMetrics()).asyncExpand((initial) {
    return repository.watchCommandCenterMetrics();
  });
});

final systemActivityStreamProvider = StreamProvider<List<SystemActivityLog>>((ref) {
  return Supabase.instance.client
      .from('system_activity_logs')
      .stream(primaryKey: ['id'])
      .order('created_at', ascending: false)
      .limit(10)
      .map((data) => data.map((item) => SystemActivityLog.fromJson(item)).toList());
});
