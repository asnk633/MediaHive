import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';
import '../repositories/attendance_repository.dart';
import '../../../../core/services/logger_service.dart';

class OfflineAttendanceQueue {
  final AttendanceRepository _repository;
  final _logger = LoggerService();
  static const String _queueBoxName = 'offline_attendance_queue';
  static const String _cacheBoxName = 'nfc_tags_cache';
  
  bool _isSyncing = false;
  int _retryCount = 0;
  DateTime? _nextRetryTime;

  OfflineAttendanceQueue(this._repository) {
    _initConnectivityListener();
  }

  /// Initialize connectivity monitoring for auto-syncing
  void _initConnectivityListener() {
    Connectivity().onConnectivityChanged.listen((result) {
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
      final box = await Hive.openBox(_cacheBoxName);
      await box.clear();
      for (final tag in tags) {
        await box.put(tag.tagId, tag.toJson());
      }
      _logger.info('[OFFLINE_QUEUE] Cached ${tags.length} active tags.');
    } catch (e) {
      _logger.error('Failed to cache active tags: $e');
    }
  }

  /// Verify tag offline using Hive cache
  Future<Map<String, dynamic>?> getCachedTag(String tagId) async {
    final box = await Hive.openBox(_cacheBoxName);
    final data = box.get(tagId);
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
    final box = await Hive.openBox(_queueBoxName);
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

    await box.put(id, scanData);
    _logger.warning('[OFFLINE_QUEUE] Saved offline scan ($type) to queue.');
  }

  /// Fetch all pending items in the queue
  Future<List<Map<String, dynamic>>> getQueue() async {
    final box = await Hive.openBox(_queueBoxName);
    return box.values.map((val) => Map<String, dynamic>.from(val)).toList();
  }

  /// Sync all offline queued scans to Supabase
  Future<void> syncQueue() async {
    if (_isSyncing) return;
    
    // Check if we are currently backing off due to errors
    if (_nextRetryTime != null && DateTime.now().isBefore(_nextRetryTime!)) {
      _logger.info('[OFFLINE_QUEUE] Sync call skipped. Backing off until $_nextRetryTime');
      return;
    }

    _isSyncing = true;

    try {
      final box = await Hive.openBox(_queueBoxName);
      if (box.isEmpty) {
        _isSyncing = false;
        _retryCount = 0;
        _nextRetryTime = null;
        return;
      }

      _logger.info('[OFFLINE_QUEUE] Syncing ${box.length} offline scans...');
      final items = Map<dynamic, dynamic>.from(box.toMap());
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

            // Log timeline event for offline queuing
            await _repository.logTimelineEvent(
              attendanceId: record.id,
              userId: data['userId'],
              eventType: 'offline_queued',
              notes: 'Offline check-in queued locally.',
              eventTime: originalTime,
            );

            // Log timeline event for offline synchronization
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

              // Log timeline event for offline queuing
              await _repository.logTimelineEvent(
                attendanceId: record.id,
                userId: data['userId'],
                eventType: 'offline_queued',
                notes: 'Offline check-out queued locally.',
                eventTime: originalTime,
              );

              // Log timeline event for offline synchronization
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
          await box.delete(key);
        } catch (itemError) {
          _logger.error('[OFFLINE_QUEUE] Failed to sync scan item: $itemError');
          hasFailure = true;
          _retryCount++;
          // Exponential backoff: 5s, 10s, 20s, 40s, 80s, maxing out at 320s
          final backoffSeconds = (1 << _retryCount.clamp(1, 6)) * 5;
          _nextRetryTime = DateTime.now().add(Duration(seconds: backoffSeconds));
          _logger.warning('[OFFLINE_QUEUE] Failure detected. Next retry allowed in $backoffSeconds seconds.');
          break; // Stop loop to avoid spamming calls during connection issues
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
      _isSyncing = false;
    }
  }
}
