import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
