import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/models/system_activity_log.dart';
import '../../../system/data/repositories/system_repository.dart';
import '../../../../core/services/logger_service.dart';

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
  final controller = StreamController<List<SystemActivityLog>>();
  StreamSubscription? realtimeSubscription;
  Timer? fallbackTimer;
  final logger = LoggerService();

  Future<void> fetchFallback() async {
    try {
      final response = await Supabase.instance.client
          .from('system_activity_logs')
          .select()
          .order('created_at', ascending: false)
          .limit(10);
      final logs = (response as List).map((item) => SystemActivityLog.fromJson(item)).toList();
      if (!controller.isClosed) {
        controller.add(logs);
      }
    } catch (e) {
      logger.error('Activity fallback REST fetch failed: $e');
    }
  }

  void startFallbackPolling() {
    realtimeSubscription?.cancel();
    realtimeSubscription = null;
    
    if (fallbackTimer != null) return;
    logger.info('Starting REST polling fallback for system activity logs...');
    
    // Fetch immediately
    fetchFallback();
    // Poll every 10 seconds
    fallbackTimer = Timer.periodic(const Duration(seconds: 10), (_) => fetchFallback());
  }

  try {
    final stream = Supabase.instance.client
        .from('system_activity_logs')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .limit(10)
        .map((data) => data.map((item) => SystemActivityLog.fromJson(item)).toList());

    realtimeSubscription = stream.listen(
      (data) {
        if (!controller.isClosed) {
          controller.add(data);
        }
      },
      onError: (err) {
        logger.warning('Realtime subscription error in system activity logs: $err. Switching to REST polling.');
        startFallbackPolling();
      },
      cancelOnError: false,
    );
  } catch (e) {
    logger.error('Failed to initialize Realtime subscription: $e. Starting REST polling.');
    startFallbackPolling();
  }

  ref.onDispose(() {
    realtimeSubscription?.cancel();
    fallbackTimer?.cancel();
    controller.close();
  });

  return controller.stream;
});
