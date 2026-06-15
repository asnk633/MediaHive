import 'dart:io';
import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:geolocator/geolocator.dart';
import 'package:local_auth/local_auth.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:network_info_plus/network_info_plus.dart';

import '../../domain/models/attendance_record.dart';
import '../../domain/models/attendance_event.dart';
import '../../domain/models/attendance_policy.dart';
import '../../domain/models/nfc_tag.dart' as domain;
import '../../domain/models/attendance_request.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/services/offline_attendance_queue.dart';
import '../../data/services/server_time_service.dart';
import '../../data/services/scan_cooldown_service.dart';
import '../../data/services/mock_location_detector.dart';
import '../../data/services/leave_conflict_service.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/services/logger_service.dart';
import '../../../../core/services/notification_service.dart';
import '../../data/services/qr_signature_service.dart';
import '../../data/services/background_presence_service.dart';

enum NfcScanStatus { idle, scanning, success, error, nfcNotAvailable, nfcDisabled, leaveConflict, fieldWork }

class NfcScanState {
  final NfcScanStatus status;
  final String? message;
  final AttendanceRecord? record;
  final String? physicalTagId;
  final String? tagName;
  final double? registeredLatitude;
  final double? registeredLongitude;
  final double? currentLatitude;
  final double? currentLongitude;
  final double? registeredRadius;
  final double? calculatedDistance;
  final double? gpsAccuracy;
  final String? locationProvider;
  final int? attempts;
  final int pointsNfcOrQr;
  final int pointsWifi;
  final int pointsGps;
  final int pointsBiometrics;
  final int totalPoints;
  final String? ssidsChecked;
  final String? activeSsid;
  final String? gpsFailureReason;
  final Map<String, dynamic>? data; // Generic data payload (used for field work tag metadata)

  NfcScanState({
    required this.status,
    this.message,
    this.record,
    this.physicalTagId,
    this.tagName,
    this.registeredLatitude,
    this.registeredLongitude,
    this.currentLatitude,
    this.currentLongitude,
    this.registeredRadius,
    this.calculatedDistance,
    this.gpsAccuracy,
    this.locationProvider,
    this.attempts,
    this.pointsNfcOrQr = 0,
    this.pointsWifi = 0,
    this.pointsGps = 0,
    this.pointsBiometrics = 0,
    this.totalPoints = 0,
    this.ssidsChecked,
    this.activeSsid,
    this.gpsFailureReason,
    this.data,
  });

  factory NfcScanState.idle() => NfcScanState(status: NfcScanStatus.idle);
}

// Repository Provider
final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(Supabase.instance.client);
});

// Service Providers
final serverTimeServiceProvider = Provider<ServerTimeService>((ref) {
  return ServerTimeService(Supabase.instance.client);
});

final scanCooldownServiceProvider = Provider<ScanCooldownService>((ref) {
  return ScanCooldownService();
});

final mockLocationDetectorProvider = Provider<MockLocationDetector>((ref) {
  return MockLocationDetector();
});

final leaveConflictServiceProvider = Provider<LeaveConflictService>((ref) {
  return LeaveConflictService(Supabase.instance.client);
});

// Offline Queue Provider
final offlineAttendanceQueueProvider = Provider<OfflineAttendanceQueue>((ref) {
  final repo = ref.watch(attendanceRepositoryProvider);
  return OfflineAttendanceQueue(repo);
});

// User Attendance Requests Provider
final attendanceRequestsProvider = FutureProvider<List<AttendanceRequest>>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  final authState = ref.watch(authStateProvider);
  final userId = authState.value?.session?.user.id ?? Supabase.instance.client.auth.currentUser?.id;
  if (userId == null) return [];
  return repo.getAttendanceRequests(userId: userId);
});

// Admin Attendance Requests Provider (Pending)
final adminAttendanceRequestsProvider = FutureProvider<List<AttendanceRequest>>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.getAttendanceRequests(status: 'pending');
});

// Active Session Provider
final activeAttendanceSessionProvider = StateNotifierProvider<ActiveAttendanceSessionNotifier, AsyncValue<AttendanceRecord?>>((ref) {
  final repo = ref.watch(attendanceRepositoryProvider);
  final authState = ref.watch(authStateProvider);
  final userId = authState.value?.session?.user.id ?? Supabase.instance.client.auth.currentUser?.id;
  return ActiveAttendanceSessionNotifier(repo, userId);
});

class ActiveAttendanceSessionNotifier extends StateNotifier<AsyncValue<AttendanceRecord?>> {
  final AttendanceRepository _repo;
  final String? _userId;

  ActiveAttendanceSessionNotifier(this._repo, this._userId) : super(const AsyncValue.loading()) {
    refresh();
  }

  Future<void> refresh() async {
    if (_userId == null) {
      if (mounted) state = const AsyncValue.data(null);
      return;
    }
    try {
      if (mounted) state = const AsyncValue.loading();
      final session = await _repo.getActiveSession(_userId!);
      if (mounted) state = AsyncValue.data(session);
    } catch (e, stack) {
      if (mounted) state = AsyncValue.error(e, stack);
    }
  }

  void setSession(AttendanceRecord? record) {
    state = AsyncValue.data(record);
  }
}

// Personal History Provider
final personalAttendanceHistoryProvider = FutureProvider<List<AttendanceRecord>>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  final authState = ref.watch(authStateProvider);
  final userId = authState.value?.session?.user.id ?? Supabase.instance.client.auth.currentUser?.id;
  if (userId == null) return [];
  ref.watch(activeAttendanceSessionProvider); // Re-run when active session changes
  return repo.getPersonalHistory(userId);
});

// Active Timeline Events Provider
final activeSessionTimelineProvider = FutureProvider.family<List<AttendanceEvent>, String>((ref, attendanceId) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.getTimelineEvents(attendanceId);
});

// All tags for admin view
final allNfcTagsProvider = FutureProvider<List<domain.NfcTag>>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.getAllTagsAdmin();
});

// Active tags cached
final activeNfcTagsProvider = FutureProvider<List<domain.NfcTag>>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.getActiveTags();
});

// Biometrics requirement setting
final attendanceBiometricsRequiredProvider = FutureProvider<bool>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.isBiometricsRequired();
});

// Attendance Policy Provider
final attendancePolicyProvider = FutureProvider<AttendancePolicy>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.getAttendancePolicy();
});

// Location Monitor Provider
final attendanceLocationMonitorProvider = Provider<AttendanceLocationMonitor>((ref) {
  final monitor = AttendanceLocationMonitor(ref);
  
  // Start/stop location monitor when active session shifts
  ref.listen<AsyncValue<AttendanceRecord?>>(activeAttendanceSessionProvider, (prev, next) {
    next.whenData((session) {
      if (session != null && session.attendanceState == 'active' && session.workMode == 'office') {
        monitor.start(session);
      } else {
        monitor.stop();
      }
    });
  });

  ref.onDispose(() => monitor.stop());
  return monitor;
});

class AttendanceLocationMonitor {
  final Ref _ref;
  Timer? _timer;
  Timer? _graceTimer;
  bool _graceActive = false;
  bool _reminderSent = false;
  final _logger = LoggerService();

  AttendanceLocationMonitor(this._ref);

  void start(AttendanceRecord record) async {
    stop();
    _reminderSent = false;
    _graceActive = false;
    _graceTimer?.cancel();

    final policy = await _ref.read(attendanceRepositoryProvider).getAttendancePolicy();
    if (!policy.checkoutReminderEnabled) return;

    // Periodically checks position using a low battery-use low-accuracy scan
    _timer = Timer.periodic(const Duration(minutes: 5), (timer) async {
      await _checkLocation(record);
    });

    // Run an initial check shortly after start
    Future.delayed(const Duration(seconds: 10), () => _checkLocation(record));
  }

  void stop() {
    _timer?.cancel();
    _graceTimer?.cancel();
    _timer = null;
    _graceTimer = null;
    _graceActive = false;
  }

  Future<void> _checkLocation(AttendanceRecord record) async {
    if (_reminderSent) return;

    try {
      final activeSession = _ref.read(activeAttendanceSessionProvider).value;
      if (activeSession == null || activeSession.id != record.id || activeSession.attendanceState != 'active') {
        stop();
        return;
      }

      if (activeSession.workMode != 'office' || activeSession.nfcTagId == null) {
        return;
      }

      final tag = await _ref.read(attendanceRepositoryProvider).getTagByUuid(activeSession.nfcTagId!);
      if (tag == null) return;

      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return;
      }

      final currentPos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      );

      final distance = Geolocator.distanceBetween(
        currentPos.latitude,
        currentPos.longitude,
        tag.latitude,
        tag.longitude,
      );

      if (distance > tag.radius) {
        if (!_graceActive) {
          _logger.info('ATTENDANCE_MONITOR: User left radius. Starting 15-minute grace period...');
          _graceActive = true;
          _graceTimer = Timer(const Duration(minutes: 15), () async {
            await _triggerReminder(activeSession);
          });
        }
      } else {
        if (_graceActive) {
          _logger.info('ATTENDANCE_MONITOR: User returned inside radius. Cancelling grace period.');
          _graceTimer?.cancel();
          _graceActive = false;
        }
      }
    } catch (e) {
      _logger.error('Error checking geofence: $e');
    }
  }

  Future<void> _triggerReminder(AttendanceRecord session) async {
    try {
      final activeSession = _ref.read(activeAttendanceSessionProvider).value;
      if (activeSession == null || activeSession.id != session.id || activeSession.attendanceState != 'active') {
        return;
      }

      if (activeSession.nfcTagId == null) return;
      final tag = await _ref.read(attendanceRepositoryProvider).getTagByUuid(activeSession.nfcTagId!);
      if (tag == null) return;

      final currentPos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.low);
      final distance = Geolocator.distanceBetween(
        currentPos.latitude,
        currentPos.longitude,
        tag.latitude,
        tag.longitude,
      );

      if (distance <= tag.radius) {
        _graceActive = false;
        return;
      }

      _reminderSent = true;
      _graceActive = false;

      // Trigger notification
      await _ref.read(notificationServiceProvider).showSystemNotification(
        'LEAVING OFFICE AREA',
        'You appear to have left the office area. Did you forget to check out?',
        payload: '/attendance?triggerCheckoutReminder=true',
      );

      // Log timeline event: checkout_reminder_sent
      await _ref.read(attendanceRepositoryProvider).logTimelineEvent(
        attendanceId: activeSession.id,
        userId: activeSession.userId,
        eventType: 'checkout_reminder_sent',
        notes: 'Checkout reminder notification sent after 15-minute grace period.',
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
      );

      _logger.info('Checkout reminder sent for user ${activeSession.userId}');
    } catch (e) {
      _logger.error('Error triggering reminder: $e');
    }
  }
}

// Demo mode is OFF in production — app uses real NFC hardware and real camera
final attendanceDemoModeProvider = StateProvider<bool>((ref) => false);

// Global NFC Scanning Controller
final globalNfcScanningProvider = StateNotifierProvider<NfcScanningNotifier, NfcScanState>((ref) {
  final repo = ref.watch(attendanceRepositoryProvider);
  final queue = ref.watch(offlineAttendanceQueueProvider);
  final localAuth = LocalAuthentication();
  return NfcScanningNotifier(ref, repo, queue, localAuth);
});

class NfcScanningNotifier extends StateNotifier<NfcScanState> {
  final Ref _ref;
  final AttendanceRepository _repo;
  final OfflineAttendanceQueue _queue;
  final LocalAuthentication _localAuth;
  final _logger = LoggerService();

  NfcScanningNotifier(this._ref, this._repo, this._queue, this._localAuth) : super(NfcScanState.idle());

  /// Reset the scan state back to idle
  void reset() {
    state = NfcScanState.idle();
  }

  /// Trigger foreground scanning session on demand
  Future<void> startScan({
    required String workMode,
    String? lastKnownWorkLocation,
    String? assignmentId,
    String? assignmentName,
    String? mockPhysicalTagId, // Kept for leave-conflict bypass (real tag ID passed through)
    bool bypassLeaveCheck = false,
    String source = 'nfc',
    String? qrPayload,
  }) async {
    state = NfcScanState(status: NfcScanStatus.scanning, message: source == 'qr' ? 'Ready to Scan QR Code...' : 'Ready to Scan NFC Tag...');

    if (source == 'qr') {
      if (qrPayload == null) {
        state = NfcScanState(
          status: NfcScanStatus.error,
          message: 'No QR payload captured.',
        );
        return;
      }
      final tagId = QrSignatureService.verifyPayload(qrPayload);
      if (tagId == null) {
        state = NfcScanState(
          status: NfcScanStatus.error,
          message: 'Attendance denied. Invalid QR signature or malformed payload.',
        );
        return;
      }
      await _processTagScan(
        physicalTagId: tagId,
        workMode: workMode,
        lastKnownWorkLocation: lastKnownWorkLocation,
        assignmentId: assignmentId,
        assignmentName: assignmentName,
        bypassLeaveCheck: bypassLeaveCheck,
        source: 'qr',
      );
      return;
    }

    // If a physical tag ID is passed directly (e.g. leave-conflict bypass with the real scanned tag),
    // process it immediately without re-scanning NFC.
    if (mockPhysicalTagId != null) {
      await _processTagScan(
        physicalTagId: mockPhysicalTagId,
        workMode: workMode,
        lastKnownWorkLocation: lastKnownWorkLocation,
        assignmentId: assignmentId,
        assignmentName: assignmentName,
        bypassLeaveCheck: bypassLeaveCheck,
        source: 'nfc',
      );
      return;
    }

    // Real device NFC scan initialization
    try {
      final availability = await NfcManager.instance.checkAvailability();
      if (availability != NfcAvailability.enabled) {
        state = NfcScanState(
          status: NfcScanStatus.nfcNotAvailable,
          message: availability == NfcAvailability.disabled
              ? 'NFC is disabled. Please enable it in Settings.'
              : 'NFC hardware is not supported on this device.',
        );
        return;
      }

      await NfcManager.instance.startSession(
        pollingOptions: {
          NfcPollingOption.iso14443,
          NfcPollingOption.iso15693,
          NfcPollingOption.iso18092,
        },
        onDiscovered: (NfcTag tag) {
          // onDiscovered must be synchronous; use microtask for async work
          Future.microtask(() async {
            final identifier = _extractTagIdentifier(tag);
            await NfcManager.instance.stopSession();
            await _processTagScan(
              physicalTagId: identifier,
              workMode: workMode,
              lastKnownWorkLocation: lastKnownWorkLocation,
              assignmentId: assignmentId,
              assignmentName: assignmentName,
              bypassLeaveCheck: bypassLeaveCheck,
              source: 'nfc',
            );
          });
        },
        alertMessageIos: 'Hold your iPhone near the NFC tag.',
      );
    } catch (e) {
      _logger.error('Failed to start NFC session: $e');
      state = NfcScanState(
        status: NfcScanStatus.error,
        message: 'NFC initialization failed: $e',
      );
    }
  }

  /// Extract raw serial identifier from NFC Tag using nfc_manager v4 API
  String _extractTagIdentifier(NfcTag tag) {
    // Use the tag's data map to extract the UID bytes cross-platform.
    // nfc_manager v4: tag.data is @protected but accessible via dynamic cast.
    try {
      // ignore: invalid_use_of_protected_member
      final dynamic rawData = tag.data;
      // Android TagPigeon exposes 'id' as Uint8List
      if (rawData != null) {
        final dynamic id = (rawData as dynamic).id;
        if (id is Uint8List) {
          return id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
        }
      }
    } catch (_) {
      // Fallback if internal structure changes
    }
    return 'TAG_${tag.hashCode}';
  }

  /// Process tag scan from deep-link URI directly
  Future<void> processDirectTagScan({
    required String physicalTagId,
    String source = 'nfc',
  }) async {
    return _processTagScan(
      physicalTagId: physicalTagId,
      workMode: 'office',
      source: source,
    );
  }

  /// Verify and process tag scan (GPS + biometrics + local/cloud db writes)
  Future<void> _processTagScan({
    required String physicalTagId,
    required String workMode,
    String? lastKnownWorkLocation,
    String? assignmentId,
    String? assignmentName,
    bool bypassLeaveCheck = false,
    String source = 'nfc',
  }) async {
    try {
      final profileAsync = _ref.read(currentUserProfileProvider);
      final profile = profileAsync.value;
      if (profile == null) {
        state = NfcScanState(status: NfcScanStatus.error, message: 'User is not authenticated.');
        return;
      }

      final userId = profile['id'] as String;
      final userName = profile['full_name'] as String;

      // ─── Phase 2: Fetch Server Time Source of Truth ───
      final serverTime = await _ref.read(serverTimeServiceProvider).getServerTime();
      final activeSession = _ref.read(activeAttendanceSessionProvider).value;

      // ─── Phase 2: NFC Scan Cooldown Check ───
      final cooldownService = _ref.read(scanCooldownServiceProvider);
      if (cooldownService.isInCooldown(userId, physicalTagId, cooldownSeconds: 30)) {
        if (activeSession != null) {
          await _repo.logTimelineEvent(
            attendanceId: activeSession.id,
            userId: userId,
            eventType: 'duplicate_scan_ignored',
            notes: 'Duplicate scan attempt ignored by cooldown protection.',
            eventTime: serverTime,
          );
        }
        state = NfcScanState(
          status: NfcScanStatus.error,
          message: 'Scan ignored. Cooldown active (30s).',
        );
        return;
      }
      // Record scan in cooldown tracker
      cooldownService.recordScan(userId, physicalTagId);

      // ─── Step 1: Connectivity Check & Tag Existence Check ───
      final connectivityResult = await Connectivity().checkConnectivity();
      final isOffline = connectivityResult == ConnectivityResult.none;

      Map<String, dynamic>? tagData;
      if (isOffline) {
        tagData = await _queue.getCachedTag(physicalTagId);
        if (tagData == null) {
          state = NfcScanState(
            status: NfcScanStatus.error,
            message: 'NFC tag unrecognized. Tag must be verified online once before offline use.',
          );
          return;
        }
      } else {
        final tag = await _repo.getTagByPhysicalId(physicalTagId);
        if (tag == null) {
          state = NfcScanState(
            status: NfcScanStatus.error,
            message: 'NFC tag not registered or is inactive in MediaHive.',
          );
          return;
        }
        tagData = tag.toJson();
      }

      final tagType = tagData['tagType'] ?? 'attendance';
      final tagName = tagData['tagName'] ?? 'Media Office';
      final double tagLat = tagData['latitude'] as double;
      final double tagLng = tagData['longitude'] as double;
      final double tagRadius = (tagData['radius'] as num).toDouble();
      final String tagUuid = tagData['id'] as String;
      final String? tagCampusId = tagData['campusId'] as String?;
      final String? tagCampusName = tagData['campusName'] as String?;

      // Validate coordinates are present, non-zero and radius is positive
      if (tagLat == 0.0 && tagLng == 0.0) {
        state = NfcScanState(
          status: NfcScanStatus.error,
          message: 'Attendance denied. Tag location coordinate configuration is invalid.',
        );
        return;
      }
      if (tagRadius <= 0.0) {
        state = NfcScanState(
          status: NfcScanStatus.error,
          message: 'Attendance denied. Tag radius configuration is invalid.',
        );
        return;
      }

      // ─── Step 1b: Field Work Tag Routing ───
      // If this is a field work NFC tag, route to field work flow
      // instead of normal attendance check-in/out
      if (tagType == 'field_work') {
        state = NfcScanState(
          status: NfcScanStatus.fieldWork,
          message: 'Field work tag detected.',
          data: {
            'tagName': tagName,
            'tagUuid': tagUuid,
            'physicalTagId': physicalTagId,
          },
        );
        return;
      }

      // ─── Step 2: GPS & WiFi Trust Verification Check ───
      int pointsNfcOrQr = 50; // Dynamic 50 points as we are triggered by tag or QR scan
      int pointsWifi = 0;
      int pointsGps = 0;
      int pointsBiometrics = 0;
      String? activeSsid;
      final String? approvedSsids = (tagData['wifi_ssids'] ?? tagData['wifiSsids']) as String?;
      String? gpsFailureReason;

      // Helper function for SSID normalization
      String normalizeSsid(String ssid) {
        String cleaned = ssid.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
          cleaned = cleaned.substring(1, cleaned.length - 1).trim();
        }
        if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length >= 2) {
          cleaned = cleaned.substring(1, cleaned.length - 1).trim();
        }
        cleaned = cleaned.replaceAll(RegExp(r'\s+'), ' ');
        return cleaned.toUpperCase();
      }

      // 2a. WiFi SSID Check
      try {
        final info = NetworkInfo();
        final String? rawSsid = await info.getWifiName();
        _logger.info('RAW ACTIVE SSID VALUE: [$rawSsid]');
        if (rawSsid != null) {
          activeSsid = rawSsid;
        }
      } catch (wifiError) {
        _logger.warning('Failed to get connected WiFi SSID: $wifiError');
      }

      _logger.info('RAW APPROVED SSID VALUE: [$approvedSsids]');

      if (activeSsid != null && approvedSsids != null && approvedSsids.isNotEmpty) {
        final normalizedActive = normalizeSsid(activeSsid);
        final approvedList = approvedSsids.split(',').map((s) => normalizeSsid(s));
        if (approvedList.contains(normalizedActive)) {
          pointsWifi = 30;
        }
      }

      // 2b. GPS Location Check
      Position? currentPosition;
      bool isInsideRadius = false;
      const int maxAttempts = 3;
      int attemptsCount = 0;

      try {
        final geoPermission = await Geolocator.checkPermission();
        if (geoPermission == LocationPermission.denied || geoPermission == LocationPermission.deniedForever) {
          final request = await Geolocator.requestPermission();
          if (request == LocationPermission.denied || request == LocationPermission.deniedForever) {
            gpsFailureReason = 'Permission denied';
            throw Exception('Location permission denied.');
          }
        }

        final serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          gpsFailureReason = 'Location services disabled';
          throw Exception('Location services disabled.');
        }

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
          attemptsCount = attempt;
          try {
            currentPosition = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.high,
              timeLimit: const Duration(seconds: 5),
            );

            final distance = Geolocator.distanceBetween(
              currentPosition.latitude,
              currentPosition.longitude,
              tagLat,
              tagLng,
            );

            if (distance <= tagRadius && currentPosition.accuracy <= 15.0) {
              isInsideRadius = true;
              pointsGps = 30;
              break;
            }

            if (distance <= tagRadius && attempt == maxAttempts) {
              isInsideRadius = true;
              pointsGps = 30;
              break;
            }

            // OPTIMIZATION: If we already have a valid NFC/QR scan AND are connected to an approved WiFi,
            // we satisfy the required rules (NFC/QR + (GPS or WiFi)). No need to wait for GPS stabilization.
            final bool isWifiApproved = (activeSsid != null && approvedSsids != null && approvedSsids.isNotEmpty &&
                approvedSsids.split(',').map((s) => normalizeSsid(s)).contains(normalizeSsid(activeSsid)));
            if ((source == 'nfc' || source == 'qr') && isWifiApproved) {
              _logger.info('Connected to approved WiFi. Bypassing GPS stabilization retries.');
              break;
            }

            // Decide whether to retry or immediately deny:
            final bool shouldRetry = (currentPosition.accuracy > 15.0) || (distance <= tagRadius + 20.0);
            if (!shouldRetry) {
              _logger.info('User is far outside boundary (Distance: ${distance.toStringAsFixed(1)}m, Radius: ${tagRadius}m). Aborting retry.');
              break;
            }
          } on TimeoutException catch (timeoutErr) {
            _logger.warning('GPS verification attempt $attempt timed out: $timeoutErr');
            gpsFailureReason = 'Timeout';
          } catch (attemptError) {
            _logger.warning('GPS verification attempt $attempt failed: $attemptError');
            gpsFailureReason = 'Exception';
          }

          if (attempt < maxAttempts) {
            await Future.delayed(const Duration(milliseconds: 1500));
          }
        }
      } catch (geoError) {
        _logger.error('GPS verification failed: $geoError');
        if (gpsFailureReason == null) {
          if (geoError.toString().contains('permission')) {
            gpsFailureReason = 'Permission denied';
          } else if (geoError.toString().contains('service')) {
            gpsFailureReason = 'Location services disabled';
          } else {
            gpsFailureReason = 'Exception';
          }
        }
      }

      double? calculatedDist;
      if (currentPosition != null) {
        calculatedDist = Geolocator.distanceBetween(
          currentPosition.latitude,
          currentPosition.longitude,
          tagLat,
          tagLng,
        );
        if (calculatedDist > tagRadius) {
          gpsFailureReason = 'Outside radius (${calculatedDist.toStringAsFixed(1)}m)';
        }
      }

      String provider = 'Unknown';
      if (currentPosition != null) {
        if (Platform.isIOS) {
          provider = 'Fused (CoreLocation)';
        } else {
          if (currentPosition.accuracy <= 10.0) {
            provider = 'GPS';
          } else if (currentPosition.accuracy <= 40.0) {
            provider = 'Fused';
          } else {
            provider = 'Network';
          }
        }
      }

      // ─── Step 3: Biometric Authentication (If enabled by policy) ───
      bool biometricsRequired = false;
      if (!isOffline) {
        biometricsRequired = await _repo.isBiometricsRequired();
      } else {
        final box = await Hive.openBox('app_settings');
        biometricsRequired = box.get('attendance_biometrics_required', defaultValue: false);
      }

      if (biometricsRequired) {
        try {
          final canAuthenticate = await _localAuth.canCheckBiometrics || await _localAuth.isDeviceSupported();
          if (canAuthenticate) {
            final authenticated = await _localAuth.authenticate(
              localizedReason: 'Please verify your identity to log attendance',
              options: const AuthenticationOptions(stickyAuth: true, biometricOnly: true),
            );

            if (!authenticated) {
              if (activeSession != null && !isOffline) {
                await _repo.logTimelineEvent(
                  attendanceId: activeSession.id,
                  userId: userId,
                  eventType: 'biometric_failed',
                  notes: 'Biometric authorization check failed.',
                  eventTime: serverTime,
                );
              }
              state = NfcScanState(
                status: NfcScanStatus.error,
                message: 'Attendance denied. Biometric verification failed.',
              );
              return;
            } else {
              pointsBiometrics = 20;
            }
          }
        } catch (authError) {
          _logger.error('Biometric verification failed: $authError');
          state = NfcScanState(
            status: NfcScanStatus.error,
            message: 'Attendance denied. Biometric verification encountered an error.',
          );
          return;
        }
      }

      // Final Rule-Based Validation
      final bool hasNfcOrQr = (source == 'nfc' || source == 'qr');
      final bool isWifiApproved = (activeSsid != null && approvedSsids != null && approvedSsids.isNotEmpty &&
          approvedSsids.split(',').map((s) => normalizeSsid(s)).contains(normalizeSsid(activeSsid)));
      final bool rulePassed = hasNfcOrQr && (isInsideRadius || isWifiApproved);

      if (!rulePassed) {
        if (activeSession != null && !isOffline) {
          await _repo.logTimelineEvent(
            attendanceId: activeSession.id,
            userId: userId,
            eventType: 'gps_verification_failed',
            notes: 'Rule-based validation failed. GPS Inside: $isInsideRadius. WiFi Approved: $isWifiApproved (SSID: $activeSsid).',
            eventTime: serverTime,
          );
        }

        _logger.warning('Rule-Based Validation Failed!\n'
            '- NFC/QR Scan: $hasNfcOrQr\n'
            '- WiFi Approved: $isWifiApproved (SSID: $activeSsid, Approved: $approvedSsids)\n'
            '- GPS Inside Radius: $isInsideRadius (Distance: ${calculatedDist?.toStringAsFixed(1)}m, Radius: ${tagRadius}m)\n'
            '- Result: Denied');

        state = NfcScanState(
          status: NfcScanStatus.error,
          message: 'Attendance denied. You must be inside the GPS radius or connected to the office WiFi.',
          physicalTagId: physicalTagId,
          tagName: tagName,
          registeredLatitude: tagLat,
          registeredLongitude: tagLng,
          currentLatitude: currentPosition?.latitude,
          currentLongitude: currentPosition?.longitude,
          registeredRadius: tagRadius,
          calculatedDistance: calculatedDist,
          gpsAccuracy: currentPosition?.accuracy,
          locationProvider: provider,
          attempts: attemptsCount,
          pointsNfcOrQr: hasNfcOrQr ? 50 : 0,
          pointsWifi: isWifiApproved ? 30 : 0,
          pointsGps: isInsideRadius ? 30 : 0,
          pointsBiometrics: biometricsRequired ? 20 : 0,
          totalPoints: (hasNfcOrQr ? 50 : 0) + (isWifiApproved ? 30 : 0) + (isInsideRadius ? 30 : 0),
          ssidsChecked: approvedSsids,
          activeSsid: activeSsid,
          gpsFailureReason: gpsFailureReason,
        );
        return;
      } else {
        _logger.info('Rule-Based Validation Succeeded!\n'
            '- NFC/QR Scan: $hasNfcOrQr\n'
            '- WiFi Approved: $isWifiApproved (SSID: $activeSsid)\n'
            '- GPS Inside Radius: $isInsideRadius (Distance: ${calculatedDist?.toStringAsFixed(1)}m)\n'
            '- Result: Allowed');
      }

      // ─── Phase 2: Mock Location Detection (Android Only) ───
      if (currentPosition != null) {
        final mockDetector = _ref.read(mockLocationDetectorProvider);
        if (mockDetector.isMockedLocation(currentPosition)) {
          _logger.warning('Spoofed GPS detected for user $userId');
          if (activeSession != null && !isOffline) {
            await _repo.logTimelineEvent(
              attendanceId: activeSession.id,
              userId: userId,
              eventType: 'mock_location_detected',
              notes: 'Android mock location usage detected.',
              eventTime: serverTime,
              metadata: {
                'timestamp': serverTime.toIso8601String(),
                'location': '${currentPosition.latitude}, ${currentPosition.longitude}',
              },
            );
          }
        }
      }

      // Get device identifier/info
      String deviceId = 'unknown_id';
      String deviceName = Platform.isAndroid ? 'Android Device' : 'iOS Device';

      // ─── Step 4: Attendance Action (Check-in or Check-out) ───
      if (activeSession == null) {
        // ─── Phase 2: Leave Conflict Detection ───
        if (!isOffline && !bypassLeaveCheck) {
          final hasLeave = await _ref.read(leaveConflictServiceProvider).hasApprovedLeave(userId, serverTime);
          if (hasLeave) {
            state = NfcScanState(
              status: NfcScanStatus.leaveConflict,
              message: 'You have approved leave for today. Proceed with check-in?',
              physicalTagId: physicalTagId,
              tagName: tagName,
            );
            return;
          }
        } else if (!isOffline && bypassLeaveCheck) {
          // Log timeline override event for leave conflict
          _logger.info('Check-in during leave: Logging timeline override event');
        }

        // Perform CHECK-IN
        final isHoliday = isOffline ? false : await _repo.isHolidayDate(serverTime);
        final isWeekend = serverTime.weekday == DateTime.saturday || serverTime.weekday == DateTime.sunday;

        if (isOffline) {
          // Offline queue
          await _queue.queueScan(
            type: 'check_in',
            userId: userId,
            userName: userName,
            physicalTagId: physicalTagId,
            latitude: currentPosition?.latitude,
            longitude: currentPosition?.longitude,
            deviceId: deviceId,
            deviceName: deviceName,
            workMode: workMode,
            lastKnownWorkLocation: lastKnownWorkLocation,
            assignmentId: assignmentId,
            source: source,
          );

          final mockRecord = AttendanceRecord(
            id: 'temp_offline_checkin',
            userId: userId,
            userName: userName,
            nfcTagId: tagUuid,
            checkInTime: serverTime.toIso8601String(),
            checkInSource: source,
            latitude: currentPosition?.latitude,
            longitude: currentPosition?.longitude,
            deviceId: deviceId,
            deviceName: deviceName,
            attendanceState: 'active',
            workMode: workMode,
            lastKnownWorkLocation: lastKnownWorkLocation,
            assignmentId: assignmentId,
            campusId: tagCampusId,
            campusName: tagCampusName,
            isHoliday: isHoliday,
            isWeekend: isWeekend,
            createdAt: serverTime.toIso8601String(),
          );

          _ref.read(activeAttendanceSessionProvider.notifier).setSession(mockRecord);
          
          if (bypassLeaveCheck) {
            await _repo.logTimelineEvent(
              attendanceId: mockRecord.id,
              userId: userId,
              eventType: 'attendance_during_leave',
              notes: 'Check-in allowed during approved leave.',
              eventTime: serverTime,
            );
          }

          state = NfcScanState(
            status: NfcScanStatus.success,
            message: 'Saved Offline. Checking in...',
            record: mockRecord,
            physicalTagId: physicalTagId,
            tagName: tagName,
          );
        } else {
          // Online check-in
          final record = await _repo.checkIn(
            userId: userId,
            userName: userName,
            nfcTagId: tagUuid,
            latitude: currentPosition?.latitude,
            longitude: currentPosition?.longitude,
            deviceId: deviceId,
            deviceName: deviceName,
            workMode: workMode,
            lastKnownWorkLocation: lastKnownWorkLocation,
            assignmentId: assignmentId,
            source: source,
            serverTime: serverTime,
            campusId: tagCampusId,
            campusName: tagCampusName,
            isHoliday: isHoliday,
            isWeekend: isWeekend,
          );

          _ref.read(activeAttendanceSessionProvider.notifier).setSession(record);

          if (bypassLeaveCheck) {
            await _repo.logTimelineEvent(
              attendanceId: record.id,
              userId: userId,
              eventType: 'attendance_during_leave',
              notes: 'Check-in allowed during approved leave.',
              eventTime: serverTime,
            );
          }

          state = NfcScanState(
            status: NfcScanStatus.success,
            message: 'Checked In Successfully',
            record: record,
            physicalTagId: physicalTagId,
            tagName: tagName,
          );

          // Start background presence verification
          BackgroundPresenceService().startTracking(
            attendanceId: record.id,
            userId: userId,
            officeLatitude: tagLat,
            officeLongitude: tagLng,
            officeRadiusMeters: tagRadius,
          );
        }
      } else {
        // Perform CHECK-OUT
        // ─── Phase 2: Multi-Tag Compatibility & Campus Verification ───
        if (activeSession.campusId != null && tagCampusId != null && tagCampusId != activeSession.campusId) {
          state = NfcScanState(
            status: NfcScanStatus.error,
            message: 'Checkout Rejected: Scan location does not match Check-In Campus ($tagCampusName).',
          );
          return;
        }

        // ─── Phase 2: Device Change Auditing ───
        if (!isOffline && activeSession.deviceId != null && activeSession.deviceId != deviceId) {
          await _repo.logTimelineEvent(
            attendanceId: activeSession.id,
            userId: userId,
            eventType: 'device_changed',
            notes: 'Device shifted between check-in and check-out.',
            eventTime: serverTime,
            metadata: {
              'previousDeviceId': activeSession.deviceId,
              'newDeviceId': deviceId,
            },
          );
        }

        if (isOffline) {
          // Offline queue
          await _queue.queueScan(
            type: 'check_out',
            userId: userId,
            userName: userName,
            physicalTagId: physicalTagId,
            latitude: currentPosition?.latitude,
            longitude: currentPosition?.longitude,
            deviceId: deviceId,
            deviceName: deviceName,
            workMode: workMode,
            source: source,
          );

          final mockRecord = activeSession.copyWith(
            checkOutTime: serverTime.toIso8601String(),
            checkOutSource: source,
            checkOutDeviceId: deviceId,
            checkOutDeviceName: deviceName,
            attendanceState: 'closed',
          );

          _ref.read(activeAttendanceSessionProvider.notifier).setSession(null);
          state = NfcScanState(
            status: NfcScanStatus.success,
            message: 'Saved Offline. Checking out...',
            record: mockRecord,
            physicalTagId: physicalTagId,
            tagName: tagName,
          );
        } else {
          // Online check-out
          final record = await _repo.checkOut(
            attendanceId: activeSession.id,
            userId: userId,
            nfcTagId: tagUuid,
            latitude: currentPosition?.latitude,
            longitude: currentPosition?.longitude,
            source: source,
            serverTime: serverTime,
            checkOutDeviceId: deviceId,
            checkOutDeviceName: deviceName,
          );

          _ref.read(activeAttendanceSessionProvider.notifier).setSession(null);

          // Stop background presence verification
          BackgroundPresenceService().stopTracking();
          state = NfcScanState(
            status: NfcScanStatus.success,
            message: 'Checked Out Successfully',
            record: record,
            physicalTagId: physicalTagId,
            tagName: tagName,
          );
        }
      }

      // Refresh listings
      _ref.invalidate(personalAttendanceHistoryProvider);
      _ref.invalidate(attendanceRequestsProvider);
    } catch (e) {
      _logger.error('Error processing tag scan action: $e');
      state = NfcScanState(
        status: NfcScanStatus.error,
        message: 'Transaction Failed: $e',
      );
    }
  }
}

class ResolveRequestNotifier extends StateNotifier<AsyncValue<void>> {
  final AttendanceRepository _repo;
  final Ref _ref;

  ResolveRequestNotifier(this._repo, this._ref) : super(const AsyncValue.data(null));

  Future<void> resolve({
    required String requestId,
    required String status,
    required String adminUserId,
    String? adminNotes,
  }) async {
    try {
      state = const AsyncValue.loading();
      await _repo.resolveAttendanceRequest(
        requestId: requestId,
        status: status,
        adminUserId: adminUserId,
        adminNotes: adminNotes,
      );
      state = const AsyncValue.data(null);
      // Invalidate both user and admin request lists, active sessions, and personal history
      _ref.invalidate(attendanceRequestsProvider);
      _ref.invalidate(adminAttendanceRequestsProvider);
      _ref.invalidate(activeAttendanceSessionProvider);
      _ref.invalidate(personalAttendanceHistoryProvider);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}

final resolveRequestNotifierProvider = StateNotifierProvider<ResolveRequestNotifier, AsyncValue<void>>((ref) {
  final repo = ref.watch(attendanceRepositoryProvider);
  return ResolveRequestNotifier(repo, ref);
});

final nfcRegistryActiveProvider = StateProvider<bool>((ref) => false);
