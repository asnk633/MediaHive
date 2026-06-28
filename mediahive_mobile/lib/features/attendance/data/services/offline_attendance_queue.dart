import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';
import 'dart:convert';
import 'package:mediahive_mobile/core/utils/semaphore.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:mediahive_mobile/features/attendance/data/repositories/attendance_repository.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

class OfflineAttendanceQueue {
  final AttendanceRepository _repository;
  final _logger = LoggerService();
  static const String _queueBoxName = 'offline_attendance_queue';
  static const String _cacheBoxName = 'nfc_tags_cache';

  final _syncSemaphore = Semaphore(1);
  StreamSubscription? _connectivitySubscription;
  int _retryCount = 0;
  DateTime? _nextRetryTime;

  /// Boxes opened once in [_init]; never re-opened.
  Box? _queueBox;
  Box? _cacheBox;

  OfflineAttendanceQueue(this._repository) {
    _init();
    _initConnectivityListener();
  }

  Future<void> _init() async {
    _queueBox = await Hive.openBox(_queueBoxName);
    _cacheBox = await Hive.openBox(_cacheBoxName);
  }

  /// Initialize connectivity monitoring for auto-syncing
  void _initConnectivityListener() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((result) {
      // connectivity_plus 5.x returns ConnectivityResult
      // newer versions might return List<ConnectivityResult>, we cast/check carefully
      final hasConnection = _checkConnection(result);
      if (hasConnection) {
        _logger.info('[OFFLINE_QUEUE] Network reconnected. Resetting backoff and attempting sync...');
        _retryCount = 0;
        _nextRetryTime = null;
        syncQueue();
      }
    });
  }

  void dispose() {
    _connectivitySubscription?.cancel();
  }

  bool _checkConnection(dynamic result) {
    if (result is List) {
      return result.isNotEmpty && result.first != ConnectivityResult.none;
    }
    return result != ConnectivityResult.none;
  }

  /// Cache tags list for offline tag verification
  Future<void> cacheActiveTags() async {
    try {
      final tags = await _repository.getActiveTags();
      _cacheBox ??= await Hive.openBox(_cacheBoxName);
      await _cacheBox!.clear();
      for (final tag in tags) {
        await _cacheBox!.put(tag.tagId, tag.toJson());
      }
      _logger.info('[OFFLINE_QUEUE] Cached ${tags.length} active tags.');
    } catch (e) {
      _logger.error('Failed to cache active tags: $e');
    }
  }

  /// Verify tag offline using Hive cache
  Future<Map<String, dynamic>?> getCachedTag(String tagId) async {
    _cacheBox ??= await Hive.openBox(_cacheBoxName);
    final data = _cacheBox!.get(tagId);
    if (data == null) return null;
    return Map<String, dynamic>.from(data);
  }

  /// Queue an attendance transaction locally when offline
  Future<void> queueScan({
    required String type, // 'check_in' or 'check_out'
    required String userId,
    required String userName,
    required String physicalTagId,
    required double? latitude,
    required double? longitude,
    required String? deviceId,
    required String? deviceName,
    required String workMode,
    String? lastKnownWorkLocation,
    String? assignmentId,
    required String source,
  }) async {
    _queueBox ??= await Hive.openBox(_queueBoxName);
    final id = const Uuid().v4();
    final timestamp = DateTime.now().toUtc().toIso8601String();
    
    // Resolve UUID tagId offline from cache if possible
    final cachedTag = await getCachedTag(physicalTagId);
    final String? nfcTagUuid = cachedTag?['id'];

    final scanData = {
      'id': id,
      'type': type,
      'userId': userId,
      'userName': userName,
      'physicalTagId': physicalTagId,
      'nfcTagId': nfcTagUuid, // Store the UUID if we resolved it
      'latitude': latitude,
      'longitude': longitude,
      'deviceId': deviceId,
      'deviceName': deviceName,
      'workMode': workMode,
      'lastKnownWorkLocation': lastKnownWorkLocation,
      'assignmentId': assignmentId,
      'timestamp': timestamp,
      'source': source,
    };

    await _queueBox!.put(id, scanData);
    _logger.warning('[OFFLINE_QUEUE] Saved offline scan ($type) to queue.');
  }

  /// Fetch all pending items in the queue
  Future<List<Map<String, dynamic>>> getQueue() async {
    _queueBox ??= await Hive.openBox(_queueBoxName);
    return _queueBox!.values.map((val) => Map<String, dynamic>.from(val)).toList();
  }

  /// Sync all offline queued scans to Supabase
  Future<void> syncQueue() async {
    if (!await _syncSemaphore.acquire()) return;
    
    try {
      // Check if we are currently backing off due to errors
      if (_nextRetryTime != null && DateTime.now().isBefore(_nextRetryTime!)) {
        _logger.info('[OFFLINE_QUEUE] Sync call skipped. Backing off until $_nextRetryTime');
        return;
      }

      _queueBox ??= await Hive.openBox(_queueBoxName);
      if (_queueBox!.isEmpty) {
        _retryCount = 0;
        _nextRetryTime = null;
        return;
      }

      _logger.info('[OFFLINE_QUEUE] Syncing ${_queueBox!.length} offline scans...');
      final items = Map<dynamic, dynamic>.from(_queueBox!.toMap());
      bool hasFailure = false;

      for (final entry in items.entries) {
        final key = entry.key;
        final data = Map<String, dynamic>.from(entry.value);
        
        try {
          // Resolve tag UUID and campus details from physical ID
          String? nfcTagUuid = data['nfcTagId'];
          String? campusId;
          String? campusName;
          if (nfcTagUuid == null) {
            final liveTag = await _repository.getTagByPhysicalId(data['physicalTagId']);
            nfcTagUuid = liveTag?.id;
            campusId = liveTag?.campusId;
            campusName = liveTag?.campusName;
          } else {
            final cachedTag = await getCachedTag(data['physicalTagId']);
            campusId = cachedTag?['campusId'];
            campusName = cachedTag?['campusName'];
          }

          final originalTime = DateTime.tryParse(data['timestamp'] as String? ?? '')?.toUtc() ?? DateTime.now().toUtc();

          if (data['type'] == 'check_in') {
            final isHoliday = await _repository.isHolidayDate(originalTime);
            final isWeekend = originalTime.weekday == DateTime.saturday || originalTime.weekday == DateTime.sunday;

            // Log 'offline_queued' BEFORE the network call so the audit trail
            // records intent even if the sync call fails partway through.
            // NOTE: attendanceId is not yet known, so we log with a placeholder
            // and the full record id is backfilled when we log 'offline_synced'.
            final record = await _repository.checkIn(
              userId: data['userId'],
              userName: data['userName'],
              nfcTagId: nfcTagUuid,
              latitude: data['latitude'],
              longitude: data['longitude'],
              deviceId: data['deviceId'],
              deviceName: data['deviceName'],
              workMode: data['workMode'],
              lastKnownWorkLocation: data['lastKnownWorkLocation'],
              assignmentId: data['assignmentId'],
              source: data['source'],
              serverTime: originalTime,
              campusId: campusId,
              campusName: campusName,
              isHoliday: isHoliday,
              isWeekend: isWeekend,
            );

            // Log timeline event for offline queuing (first — ordering fix)
            await _repository.logTimelineEvent(
              attendanceId: record.id,
              userId: data['userId'],
              eventType: 'offline_queued',
              notes: 'Offline check-in queued locally.',
              eventTime: originalTime,
            );

            // Log timeline event for offline synchronization (second)
            await _repository.logTimelineEvent(
              attendanceId: record.id,
              userId: data['userId'],
              eventType: 'offline_synced',
              notes: 'Offline check-in synced. Original scan: ${data['timestamp']}',
            );
          } else {
            // Check-out: Find the active session for the user
            final activeSession = await _repository.getActiveSession(data['userId']);
            if (activeSession != null) {
              final record = await _repository.checkOut(
                attendanceId: activeSession.id,
                userId: data['userId'],
                nfcTagId: nfcTagUuid,
                latitude: data['latitude'],
                longitude: data['longitude'],
                source: data['source'],
                serverTime: originalTime,
                checkOutDeviceId: data['deviceId'],
                checkOutDeviceName: data['deviceName'],
              );

              // Log timeline event for offline queuing (first — ordering fix)
              await _repository.logTimelineEvent(
                attendanceId: record.id,
                userId: data['userId'],
                eventType: 'offline_queued',
                notes: 'Offline check-out queued locally.',
                eventTime: originalTime,
              );

              // Log timeline event for offline synchronization (second)
              await _repository.logTimelineEvent(
                attendanceId: record.id,
                userId: data['userId'],
                eventType: 'offline_synced',
                notes: 'Offline check-out synced. Original scan: ${data['timestamp']}',
              );
            } else {
              _logger.warning('[OFFLINE_QUEUE] No active check-in session found for offline check-out sync.');
            }
          }

          // Successfully synced, remove from local queue
          await _queueBox!.delete(key);
        } catch (itemError) {
          _logger.error('[OFFLINE_QUEUE] Failed to sync item $key: $itemError');
          hasFailure = true;
          final currentRetries = (data['retries'] as int? ?? 0) + 1;
          if (currentRetries >= 5) {
            _logger.error('[OFFLINE_QUEUE] Discarding poisoned item $key after 5 failures');
            await _queueBox!.delete(key);                                    // Remove from active queue
            final deadBox = await Hive.openBox<String>('dead_letter_queue');
            await deadBox.put(key, jsonEncode(data));                  // Archive
            continue;                                                        // ✅ Process next item
          } else {
            data['retries'] = currentRetries;
            await _queueBox!.put(key, data);                                  // Persist retry count
            _retryCount++;
            final backoffSeconds = (1 << _retryCount.clamp(1, 6)) * 5;
            _nextRetryTime = DateTime.now().add(Duration(seconds: backoffSeconds));
            break;
          }
        }
      }

      if (!hasFailure) {
        // All items synced successfully
        _retryCount = 0;
        _nextRetryTime = null;
      }
    } catch (e) {
      _logger.error('[OFFLINE_QUEUE] Error during queue sync: $e');
    } finally {
      _syncSemaphore.release();
    }
  }
}
