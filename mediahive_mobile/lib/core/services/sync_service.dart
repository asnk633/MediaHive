import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/sync_mutation.dart';
import '../services/network_service.dart';
import '../services/logger_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sync_result.dart';
import 'notification_service.dart';



abstract class SyncDelegate {
  Future<SyncResult> execute(SyncMutation mutation);
}

class SyncService {
  final NetworkService _networkService;
  final LoggerService _logger;
  final NotificationService _notifications;
  final Map<String, SyncDelegate> _delegates = {};
  static const String _boxName = 'sync_queue_v2';
  
  final _processingMutex = <String, bool>{};

  SyncService(this._networkService, this._logger, this._notifications) {
    _networkService.statusStream.listen((status) {
      if (status == NetworkStatus.online) {
        _logger.sync('Network online: Resuming all queues');
        processAllQueues();
      } else {
        _logger.sync('Network offline: Pausing sync');
      }
    });
    
    // Process on startup if already online
    _networkService.isConnected.then((connected) {
      if (connected) {
        _logger.sync('Startup sync: Device is online');
        processAllQueues();
      }
    });
  }

  void registerDelegate(String feature, SyncDelegate delegate) {
    _delegates[feature] = delegate;
    _logger.sync('Delegate registered for: $feature');
    processQueue(feature);
  }

  Future<void> addMutation(SyncMutation mutation) async {
    final box = await Hive.openBox<Map>(_boxName);
    await box.put(mutation.id, mutation.toJson());
    
    _logger.sync('📝 Queued: ${mutation.type} for ${mutation.feature} (${mutation.id})');
    
    if (await _networkService.isConnected) {
      processQueue(mutation.feature);
    }
  }

  Future<void> processAllQueues() async {
    for (var feature in _delegates.keys) {
      processQueue(feature);
    }
  }

  Future<void> processQueue(String feature) async {
    if (_processingMutex[feature] == true) return;
    _processingMutex[feature] = true;

    try {
      final delegate = _delegates[feature];
      if (delegate == null) {
        _logger.warning('No delegate for feature: $feature');
        return;
      }

      final box = await Hive.openBox<Map>(_boxName);
      
      final mutations = box.values
          .map((json) => SyncMutation.fromJson(Map<String, dynamic>.from(json)))
          .where((m) => m.feature == feature)
          .toList()
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

      if (mutations.isEmpty) return;
      
      _logger.sync('🔄 Syncing $feature: ${mutations.length} items');

      for (var mutation in mutations) {
        if (!await _networkService.isConnected) {
          _logger.sync('🚫 Sync paused: Connection lost');
          break;
        }

        try {
          final result = await delegate.execute(mutation);
          
          if (result == SyncResult.success) {
            await box.delete(mutation.id);
            _logger.sync('✅ Success: ${mutation.feature}/${mutation.type} (${mutation.id})');
          } else if (result == SyncResult.discard) {
            await box.delete(mutation.id);
            _logger.warning('⚠️ Discarded (Permanent Error): ${mutation.id}');
            _notifications.showSyncError('Permanent sync error on ${mutation.feature}. Data discarded.');
          } else {
            _handleRetry(box, mutation);
            break; 
          }
        } catch (e) {
          _logger.error('❌ Failed: ${mutation.id}', e);
          _handleRetry(box, mutation);
          break;
        }
      }
    } finally {
      _processingMutex[feature] = false;
    }
  }

  Future<void> _handleRetry(Box<Map> box, SyncMutation mutation) async {
    if (mutation.retryCount < 5) {
      final updated = mutation.copyWith(retryCount: mutation.retryCount + 1);
      await box.put(updated.id, updated.toJson());
      _logger.sync('⏳ Retry: ${mutation.id} (Attempt ${updated.retryCount})');
    } else {
      await box.delete(mutation.id);
      _logger.error('🚨 Max retries reached for ${mutation.id}. Discarded.');
      _notifications.showSyncError('Sync failed after 5 retries. Some changes may be lost.');
    }
  }

  Future<int> getPendingCount() async {
    final box = await Hive.openBox<Map>(_boxName);
    return box.length;
  }

  Future<List<SyncMutation>> getPendingMutations() async {
    final box = await Hive.openBox<Map>(_boxName);
    return box.values
        .map((json) => SyncMutation.fromJson(Map<String, dynamic>.from(json)))
        .toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }
}

final syncServiceProvider = Provider<SyncService>((ref) {
  final networkService = ref.watch(networkServiceProvider);
  final logger = ref.watch(loggerProvider.notifier);
  final notifications = ref.watch(notificationServiceProvider);
  return SyncService(networkService, logger, notifications);
});

final pendingSyncCountProvider = StreamProvider<int>((ref) async* {
  final box = await Hive.openBox<Map>(SyncService._boxName);
  
  // Initial count
  yield box.length;
  
  // Watch for changes
  await for (final _ in box.watch()) {
    yield box.length;
  }
});
