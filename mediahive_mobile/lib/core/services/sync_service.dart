import 'dart:async';
import 'dart:convert';
import '../utils/semaphore.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/env_config.dart';
import '../models/sync_queue_item.dart';
import '../services/network_service.dart';
import '../services/logger_service.dart';
import 'notification_service.dart';
import 'auth_helper.dart';

class SyncService with WidgetsBindingObserver {
  final NetworkService _networkService;
  final LoggerService _logger;
  final NotificationService _notifications;
  final Ref? _ref;
  static const _boxName = 'sync_queue';
  final _syncSemaphore = Semaphore(1);
  Timer? _syncTimer;
  Box<String>? _box; // Opened once in _init(); never re-opened

  final _syncCompleteController = StreamController<String>.broadcast();
  Stream<String> get syncCompleteStream => _syncCompleteController.stream;

  SyncService(this._networkService, this._logger, this._notifications, [this._ref]) {
    _init();
  }

  Future<void> _init() async {
    WidgetsBinding.instance.addObserver(this);
    _box = await Hive.openBox<String>(_boxName);

    if (_box!.isNotEmpty) {
      _startSyncTimer();
    }

    // Initial process
    if (await _isConnected()) {
      processQueue();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _logger.info('SyncService: App lifecycle state changed to $state');
    if (state == AppLifecycleState.resumed) {
      try {
        final box = Hive.box<String>(_boxName);
        if (box.isNotEmpty) {
          _startSyncTimer();
        }
      } catch (_) {}
      processQueue();
    }
  }

  void _startSyncTimer() {
    if (_syncTimer != null && _syncTimer!.isActive) return;
    _logger.info('⏳ Starting periodic offline sync queue timer');
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      try {
        final box = Hive.box<String>(_boxName);
        if (box.isEmpty) {
          _logger.info('✅ Offline sync queue is empty. Stopping timer.');
          timer.cancel();
          _syncTimer = null;
        } else {
          _logger.info('⏳ Queue has ${box.length} pending item(s). Triggering sync check...');
          processQueue();
        }
      } catch (e) {
        _logger.error('Error in sync timer callback', e);
      }
    });
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _syncCompleteController.close();
    _syncTimer?.cancel();
  }

  Future<bool> _isConnected() async {
    if (_ref != null) {
      final status = _ref!.read(networkStatusProvider).valueOrNull;
      _logger.debug('SyncService: networkStatusProvider status is $status');
      if (status != null) {
        return status == NetworkStatus.online;
      }
    }
    final isConnected = await _networkService.isConnected;
    _logger.debug('SyncService: fallback networkService.isConnected is $isConnected');
    return isConnected;
  }

  Future<bool> executeImmediate(String feature, String type, Map<String, dynamic> data, Future<void> Function() action) async {
    if (!await _isConnected()) {
      _logger.warning('🚫 Action deferred to offline queue: $feature/$type');
      await _enqueue(feature, data['id'] ?? '', type, data);
      return true; // Optimistic return
    }

    try {
      await action();
      _logger.sync('✅ Success: $feature/$type');
      return true;
    } catch (e) {
      _logger.error('❌ Action failed, deferring to queue: $feature/$type', e);
      await _enqueue(feature, data['id'] ?? '', type, data);
      return true; // Still return true optimistically
    }
  }

  Future<void> _enqueue(String entity, String entityId, String mutationType, Map<String, dynamic> payload) async {
    // _box is guaranteed non-null after _init() completes; fall back to opening
    // if called before init finishes (e.g., during cold-start race).
    _box ??= await Hive.openBox<String>(_boxName);
    final id = const Uuid().v4();
    final mutation = Map<String, dynamic>.from(payload);
    mutation['type'] = mutationType; // inject so processor knows

    final item = SyncQueueItem(
      id: id,
      entity: entity,
      entityId: entityId,
      mutation: mutation,
      timestamp: DateTime.now(),
      status: 'pending',
      retries: 0,
    );
    await _box!.put(id, jsonEncode(item.toJson()));
    _startSyncTimer();
    processQueue(); // Try processing immediately
  }

  Future<void> processQueue() async {
    if (!await _syncSemaphore.acquire()) {
      _logger.debug('SyncService: processQueue already processing, skipping');
      return;
    }
    try {
      final connected = await _isConnected();
      _logger.debug('SyncService: processQueue check connected = $connected');
      if (!connected) return;

      _logger.info('🔄 SyncService: Starting processing queue...');
      _box ??= await Hive.openBox<String>(_boxName);
      final itemsJson = _box!.values.toList();
      final items = itemsJson.map((e) => SyncQueueItem.fromJson(jsonDecode(e))).toList();
      
      // Sort by timestamp ASC
      items.sort((a, b) => a.timestamp.compareTo(b.timestamp));

      // Group by entityId
      final groups = <String, List<SyncQueueItem>>{};
      for (final item in items) {
        if (item.status == 'done') continue; // Should be deleted, but just in case
        groups.putIfAbsent(item.entityId, () => []).add(item);
      }

      for (final entry in groups.entries) {
        final entityId = entry.key;
        final groupItems = entry.value;

        for (final item in groupItems) {
          if (item.status == 'done') continue;

          // Process item
          try {
            await _box!.put(item.id, jsonEncode(item.copyWith(status: 'syncing').toJson()));
            
            // Wait! Since closure is lost, we must perform the REST call!
            if (item.entity == 'tasks' && (item.mutation['type'] == 'update' || item.mutation['type'] == 'create')) {
              await _syncTaskMutation(item);
            } else {
              // Fallback to Supabase direct for generic things where conflict resolution isn't strict yet
              if (item.mutation['type'] == 'delete') {
                 await Supabase.instance.client.from(item.entity).delete().eq('id', item.entityId);
              }
            }

            // Success, remove from queue
            await _box!.delete(item.id);

          } catch (e) {
            // Other errors: retry logic
            _logger.error('Failed to sync item ${item.id}', e);
            final newRetries = item.retries + 1;
            if (newRetries >= 5) {
               await _box!.put(item.id, jsonEncode(item.copyWith(status: 'failed', retries: newRetries).toJson()));
            } else {
               await _box!.put(item.id, jsonEncode(item.copyWith(status: 'pending', retries: newRetries).toJson()));
            }
          }
        }
      }
    } finally {
      _syncSemaphore.release();
    }
  }

  Future<void> _syncTaskMutation(SyncQueueItem item) async {
    final token = await getFreshAccessToken();
    if (token == null) throw Exception('Session expired — user must re-login');

    final apiBaseUrl = EnvConfig.current.apiBaseUrl;
    final uri = Uri.parse('$apiBaseUrl/api/tasks/${item.entityId}');
    
    final payload = Map<String, dynamic>.from(item.mutation);
    payload['client_timestamp'] = item.timestamp.toUtc().toIso8601String();

    final response = await http.put(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
        'Idempotency-Key': item.id,
      },
      body: jsonEncode(payload),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      // Success
      final data = jsonDecode(response.body);
      if (data is Map && data['updated_by_server'] == true) {
        final notificationsBox = Hive.box<bool>('sync_notifications');
        await notificationsBox.put(item.entityId, true);
        _logger.warning('Task ${item.entityId} was auto-merged and updated by server offline');
      }
      _logger.sync('✅ Queue item synced successfully: tasks/update for ${item.entityId}');
      _syncCompleteController.add('tasks');
      return;
    } else {
      throw Exception('HTTP ${response.statusCode}');
    }
  }
}

final syncServiceProvider = Provider<SyncService>((ref) {
  final networkService = ref.watch(networkServiceProvider);
  final logger = ref.watch(loggerProvider.notifier);
  final notifications = ref.watch(notificationServiceProvider);
  final service = SyncService(networkService, logger, notifications, ref);

  // Listen to network status changes to trigger processing
  ref.listen<AsyncValue<NetworkStatus>>(networkStatusProvider, (previous, next) {
    if (next.valueOrNull == NetworkStatus.online) {
      service.processQueue();
    }
  });

  ref.onDispose(() => service.dispose());
  return service;
});
