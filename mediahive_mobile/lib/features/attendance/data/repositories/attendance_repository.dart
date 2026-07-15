import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_record.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_event.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_policy.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/nfc_tag.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_request.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

class AttendanceRepository {
  final SupabaseClient _client;
  final _logger = LoggerService();

  AttendanceRepository(this._client);

  /// Fetch active tag details by physical tagId string
  Future<NfcTag?> getTagByPhysicalId(String tagId) async {
    try {
      final response = await _client
          .from('nfc_tags')
          .select()
          .eq('tagId', tagId)
          .eq('active', true)
          .isFilter('deletedAt', null)
          .maybeSingle();
      if (response == null) return null;
      return NfcTag.fromJson(response);
    } catch (e) {
      _logger.error('Error fetching tag by physical ID: $e');
      return null;
    }
  }

  /// Fetch tag details by database UUID
  Future<NfcTag?> getTagByUuid(String id) async {
    try {
      final response = await _client
          .from('nfc_tags')
          .select()
          .eq('id', id)
          .maybeSingle();
      if (response == null) return null;
      return NfcTag.fromJson(response);
    } catch (e) {
      _logger.error('Error fetching tag by UUID: $e');
      return null;
    }
  }

  /// Get active session for a specific user. Retroactively auto-closes forgotten sessions.
  Future<AttendanceRecord?> getActiveSession(String userId) async {
    try {
      final response = await _client
          .from('attendance')
          .select()
          .eq('userId', userId)
          .eq('attendanceState', 'active')
          .order('checkInTime', ascending: false)
          .limit(1)
          .maybeSingle();
      if (response == null) return null;
      
      final record = AttendanceRecord.fromJson(response);
      
      // Retroactive auto-close check
      final policy = await getAttendancePolicy();
      final checkInLocal = DateTime.tryParse(record.checkInTime)?.toLocal();
      if (checkInLocal != null) {
        final autoCloseDateTime = policy.parseTime(policy.autoCloseTimeStr, checkInLocal);
        if (autoCloseDateTime != null) {
          final now = DateTime.now();
          final isFieldOrAssigned = record.workMode == 'field' || record.assignmentId != null;
          
          if (!isFieldOrAssigned && now.isAfter(autoCloseDateTime)) {
            final autoCloseTimeIso = autoCloseDateTime.toUtc().toIso8601String();
            await _client
                .from('attendance')
                .update({
                  'checkOutTime': autoCloseTimeIso,
                  'checkOutSource': 'system',
                  'attendanceState': 'closed',
                  'closeReason': 'Forgotten Checkout',
                })
                .eq('id', record.id);
            
            await logTimelineEvent(
              attendanceId: record.id,
              userId: userId,
              eventType: 'auto_closed',
              notes: 'Auto Closed (Forgotten Checkout)',
              workMode: record.workMode,
              lastKnownWorkLocation: record.lastKnownWorkLocation,
              nfcTagId: record.nfcTagId,
              latitude: record.latitude,
              longitude: record.longitude,
            );
            
            _logger.info('Retroactively auto-closed session ${record.id} for user $userId');
            return null;
          }
        }
      }
      
      return record;
    } catch (e) {
      _logger.error('Error fetching active session: $e');
      return null;
    }
  }

  /// Fetch all active tags (not soft deleted)
  Future<List<NfcTag>> getActiveTags() async {
    try {
      final response = await _client
          .from('nfc_tags')
          .select()
          .eq('active', true)
          .isFilter('deletedAt', null)
          .order('tagName');
      return (response as List).map((json) => NfcTag.fromJson(json)).toList();
    } catch (e) {
      _logger.error('Error fetching active tags: $e');
      return [];
    }
  }

  /// Fetch all tags, including inactive/soft deleted for admin list
  Future<List<NfcTag>> getAllTagsAdmin() async {
    try {
      final response = await _client
          .from('nfc_tags')
          .select()
          .isFilter('deletedAt', null)
          .order('tagName');
      return (response as List).map((json) => NfcTag.fromJson(json)).toList();
    } catch (e) {
      _logger.error('Error fetching all tags: $e');
      return [];
    }
  }

  /// Register a new NFC tag (Admin)
  Future<NfcTag> registerTag(Map<String, dynamic> data) async {
    try {
      final response = await _client
          .from('nfc_tags')
          .upsert(data, onConflict: 'tagId')
          .select()
          .single();
      return NfcTag.fromJson(response);
    } catch (e) {
      _logger.error('Error registering NFC tag: $e');
      throw Exception('Failed to register NFC tag: $e');
    }
  }

  /// Update an NFC tag's properties (Admin/Manager)
  Future<NfcTag> updateTag(String id, Map<String, dynamic> data) async {
    try {
      final response = await _client
          .from('nfc_tags')
          .update(data)
          .eq('id', id)
          .select()
          .single();
      return NfcTag.fromJson(response);
    } catch (e) {
      _logger.error('Error updating NFC tag: $e');
      throw Exception('Failed to update NFC tag: $e');
    }
  }

  /// Soft delete / retire a tag
  Future<void> deleteTag(String id) async {
    try {
      await _client
          .from('nfc_tags')
          .update({
            'active': false,
            'deletedAt': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('id', id);
    } catch (e) {
      _logger.error('Error soft-deleting tag: $e');
      throw Exception('Failed to delete tag: $e');
    }
  }

  /// Fetch biometric requirement setting from system config
  Future<bool> isBiometricsRequired() async {
    try {
      final response = await _client
          .from('system_config')
          .select('value')
          .eq('key', 'attendance_biometrics_required')
          .maybeSingle();
      if (response == null) return false;
      return response['value'] == 'true';
    } catch (e) {
      _logger.error('Error fetching biometric requirement: $e');
      return false;
    }
  }

  /// Update biometric requirement setting (Admin)
  Future<void> setBiometricsRequired(bool required) async {
    try {
      await _client
          .from('system_config')
          .upsert({
            'key': 'attendance_biometrics_required',
            'value': required.toString(),
          });
    } catch (e) {
      _logger.error('Error setting biometric requirement: $e');
      throw Exception('Failed to update biometric setting: $e');
    }
  }

  /// Fetch the active attendance policy from system config
  Future<AttendancePolicy> getAttendancePolicy() async {
    try {
      final response = await _client
          .from('system_config')
          .select('key, value')
          .inFilter('key', [
            'attendance_start_time',
            'attendance_end_time',
            'attendance_grace_period',
            'attendance_auto_close_time',
            'attendance_overtime_enabled',
            'attendance_checkout_reminder_enabled',
            'attendance_scan_cooldown_seconds',
            'attendance_lunch_start_time',
            'attendance_lunch_end_time',
          ]);
      
      final configs = {for (var item in response) item['key'] as String: item['value'] as String};
      
      return AttendancePolicy(
        startTimeStr: configs['attendance_start_time'] ?? '09:00 AM',
        endTimeStr: configs['attendance_end_time'] ?? '05:00 PM',
        gracePeriod: int.tryParse(configs['attendance_grace_period'] ?? '15') ?? 15,
        autoCloseTimeStr: configs['attendance_auto_close_time'] ?? '11:59 PM',
        overtimeEnabled: configs['attendance_overtime_enabled'] != 'false', // Default to true
        checkoutReminderEnabled: configs['attendance_checkout_reminder_enabled'] != 'false', // Default to true
        scanCooldownSeconds: int.tryParse(configs['attendance_scan_cooldown_seconds'] ?? '30') ?? 30,
        lunchStartTimeStr: configs['attendance_lunch_start_time'] ?? '01:00 PM',
        lunchEndTimeStr: configs['attendance_lunch_end_time'] ?? '02:00 PM',
      );
    } catch (e) {
      _logger.error('Error fetching attendance policy: $e');
      return AttendancePolicy.defaultPolicy();
    }
  }

  /// Update the attendance policy in system config (Admin)
  Future<void> updateAttendancePolicy(AttendancePolicy policy) async {
    try {
      final data = [
        {'key': 'attendance_start_time', 'value': policy.startTimeStr},
        {'key': 'attendance_end_time', 'value': policy.endTimeStr},
        {'key': 'attendance_grace_period', 'value': policy.gracePeriod.toString()},
        {'key': 'attendance_auto_close_time', 'value': policy.autoCloseTimeStr},
        {'key': 'attendance_overtime_enabled', 'value': policy.overtimeEnabled.toString()},
        {'key': 'attendance_checkout_reminder_enabled', 'value': policy.checkoutReminderEnabled.toString()},
        {'key': 'attendance_scan_cooldown_seconds', 'value': policy.scanCooldownSeconds.toString()},
        {'key': 'attendance_lunch_start_time', 'value': policy.lunchStartTimeStr},
        {'key': 'attendance_lunch_end_time', 'value': policy.lunchEndTimeStr},
      ];
      
      for (final item in data) {
        await _client.from('system_config').upsert(item);
      }
    } catch (e) {
      _logger.error('Error updating attendance policy: $e');
      throw Exception('Failed to update attendance policy: $e');
    }
  }

  /// Perform User Check-In transaction
  Future<AttendanceRecord> checkIn({
    required String userId,
    required String userName,
    required String? nfcTagId,
    required double? latitude,
    required double? longitude,
    required String? deviceId,
    required String? deviceName,
    required String workMode,
    String? lastKnownWorkLocation,
    String? assignmentId,
    required String source,
    required DateTime serverTime,
    String? campusId,
    String? campusName,
    bool isHoliday = false,
    bool isWeekend = false,
  }) async {
    try {
      final checkInTimeStr = serverTime.toUtc().toIso8601String();
      final data = {
        'userId': userId,
        'userName': userName,
        'nfcTagId': nfcTagId,
        'checkInTime': checkInTimeStr,
        'checkInSource': source,
        'latitude': latitude,
        'longitude': longitude,
        'deviceId': deviceId,
        'deviceName': deviceName,
        'attendanceState': 'active',
        'workMode': workMode,
        'lastKnownWorkLocation': lastKnownWorkLocation,
        'assignmentId': assignmentId,
        'campusId': campusId,
        'campusName': campusName,
        'isHoliday': isHoliday,
        'isWeekend': isWeekend,
        'closeReason': null,
      };

      final response = await _client
          .from('attendance')
          .insert(data)
          .select()
          .single();
      final record = AttendanceRecord.fromJson(response);

      // Log timeline check-in event
      await logTimelineEvent(
        attendanceId: record.id,
        userId: userId,
        eventType: 'check_in',
        workMode: workMode,
        lastKnownWorkLocation: lastKnownWorkLocation,
        nfcTagId: nfcTagId,
        latitude: latitude,
        longitude: longitude,
        notes: 'Checked in via $source',
      );

      return record;
    } catch (e) {
      _logger.error('Error during check-in: $e');
      throw Exception('Failed to check in: $e');
    }
  }

  /// Perform User Check-Out transaction
  Future<AttendanceRecord> checkOut({
    required String attendanceId,
    required String userId,
    required String? nfcTagId,
    required double? latitude,
    required double? longitude,
    required String source,
    required DateTime serverTime,
    String? checkOutDeviceId,
    String? checkOutDeviceName,
  }) async {
    return checkOutWithCloseReason(
      attendanceId: attendanceId,
      userId: userId,
      nfcTagId: nfcTagId,
      latitude: latitude,
      longitude: longitude,
      source: source,
      serverTime: serverTime,
      closeReason: 'normal_checkout',
      checkOutDeviceId: checkOutDeviceId,
      checkOutDeviceName: checkOutDeviceName,
    );
  }

  /// Perform User Check-Out transaction with custom close reason
  Future<AttendanceRecord> checkOutWithCloseReason({
    required String attendanceId,
    required String userId,
    required String? nfcTagId,
    required double? latitude,
    required double? longitude,
    required String source,
    required DateTime serverTime,
    required String closeReason,
    String? checkOutDeviceId,
    String? checkOutDeviceName,
  }) async {
    try {
      final checkOutTimeStr = serverTime.toUtc().toIso8601String();
      
      final response = await _client
          .from('attendance')
          .update({
            'checkOutTime': checkOutTimeStr,
            'checkOutSource': source,
            'attendanceState': 'closed',
            'closeReason': closeReason,
            'checkOutDeviceId': checkOutDeviceId,
            'checkOutDeviceName': checkOutDeviceName,
          })
          .eq('id', attendanceId)
          .select()
          .single();
      
      final record = AttendanceRecord.fromJson(response);

      // Log timeline check-out event
      await logTimelineEvent(
        attendanceId: record.id,
        userId: userId,
        eventType: 'check_out',
        workMode: record.workMode,
        lastKnownWorkLocation: record.lastKnownWorkLocation,
        nfcTagId: nfcTagId,
        latitude: latitude,
        longitude: longitude,
        notes: 'Checked out via $source. Reason: $closeReason',
      );

      return record;
    } catch (e) {
      _logger.error('Error during check-out: $e');
      throw Exception('Failed to check out: $e');
    }
  }

  /// Update user's checkout time (with timeline event audit trail)
  Future<AttendanceRecord> updateCheckoutTime({
    required String attendanceId,
    required String userId,
    required DateTime newCheckOutTime,
  }) async {
    try {
      final checkOutTimeStr = newCheckOutTime.toUtc().toIso8601String();
      
      final response = await _client
          .from('attendance')
          .update({
            'checkOutTime': checkOutTimeStr,
            'checkOutSource': 'manual_edit',
            'attendanceState': 'closed',
          })
          .eq('id', attendanceId)
          .eq('userId', userId)
          .select()
          .single();
      
      final record = AttendanceRecord.fromJson(response);

      // Log timeline check-out edit event
      await logTimelineEvent(
        attendanceId: record.id,
        userId: userId,
        eventType: 'checkout_time_edited',
        workMode: record.workMode,
        lastKnownWorkLocation: record.lastKnownWorkLocation,
        nfcTagId: record.nfcTagId,
        latitude: record.latitude,
        longitude: record.longitude,
        notes: 'Checkout time manually edited by user to ${newCheckOutTime.toLocal()}',
        eventTime: DateTime.now(),
      );

      return record;
    } catch (e) {
      _logger.error('Error updating checkout time: $e');
      throw Exception('Failed to update checkout time: $e');
    }
  }

  /// Log an audit/timeline event
  Future<void> logTimelineEvent({
    required String attendanceId,
    required String userId,
    required String eventType,
    String? workMode,
    String? lastKnownWorkLocation,
    String? nfcTagId,
    double? latitude,
    double? longitude,
    String? notes,
    DateTime? eventTime,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final data = {
        'attendanceId': attendanceId,
        'userId': userId,
        'eventType': eventType,
        'workMode': workMode,
        'lastKnownWorkLocation': lastKnownWorkLocation,
        'nfcTagId': nfcTagId,
        'latitude': latitude,
        'longitude': longitude,
        'notes': notes,
        'metadata': metadata,
      };

      if (eventTime != null) {
        data['eventTime'] = eventTime.toUtc().toIso8601String();
      }

      await _client
          .from('attendance_events')
          .insert(data);
    } catch (e) {
      _logger.error('Failed to log timeline event: $e');
    }
  }

  /// Update current work mode (Office -> Field -> Remote)
  Future<AttendanceRecord> switchWorkMode({
    required String attendanceId,
    required String userId,
    required String newWorkMode,
    String? lastKnownWorkLocation,
  }) async {
    try {
      final response = await _client
          .from('attendance')
          .update({
            'workMode': newWorkMode,
            'lastKnownWorkLocation': lastKnownWorkLocation,
          })
          .eq('id', attendanceId)
          .select()
          .single();
      final record = AttendanceRecord.fromJson(response);

      await logTimelineEvent(
        attendanceId: record.id,
        userId: userId,
        eventType: 'work_mode_change',
        workMode: newWorkMode,
        lastKnownWorkLocation: lastKnownWorkLocation,
        notes: 'Work mode shifted to $newWorkMode${lastKnownWorkLocation != null ? ' at $lastKnownWorkLocation' : ''}',
      );

      return record;
    } catch (e) {
      _logger.error('Error switching work mode: $e');
      throw Exception('Failed to switch work mode: $e');
    }
  }

  /// Update current active assignment link
  Future<AttendanceRecord> switchAssignment({
    required String attendanceId,
    required String userId,
    required String? assignmentId,
    String? assignmentName,
  }) async {
    try {
      final response = await _client
          .from('attendance')
          .update({
            'assignmentId': assignmentId,
          })
          .eq('id', attendanceId)
          .select()
          .single();
      final record = AttendanceRecord.fromJson(response);

      await logTimelineEvent(
        attendanceId: record.id,
        userId: userId,
        eventType: 'assignment_change',
        workMode: record.workMode,
        notes: assignmentId != null 
            ? 'Linked to assignment: ${assignmentName ?? assignmentId}' 
            : 'Unlinked assignment',
      );

      return record;
    } catch (e) {
      _logger.error('Error switching assignment: $e');
      throw Exception('Failed to link assignment: $e');
    }
  }

  /// Get personal attendance records for a user
  Future<List<AttendanceRecord>> getPersonalHistory(String userId) async {
    try {
      final response = await _client
          .from('attendance')
          .select()
          .eq('userId', userId)
          .order('checkInTime', ascending: false);
      return (response as List).map((json) => AttendanceRecord.fromJson(json)).toList();
    } catch (e) {
      _logger.error('Error fetching personal history: $e');
      return [];
    }
  }

  /// Get timeline events for a specific attendance session
  Future<List<AttendanceEvent>> getTimelineEvents(String attendanceId) async {
    try {
      final response = await _client
          .from('attendance_events')
          .select()
          .eq('attendanceId', attendanceId)
          .order('eventTime', ascending: true);
      return (response as List).map((json) => AttendanceEvent.fromJson(json)).toList();
    } catch (e) {
      _logger.error('Error fetching timeline events: $e');
      return [];
    }
  }

  /// Fetch global attendance reports (Admin/Manager filter view)
  Future<List<Map<String, dynamic>>> getAttendanceReports({
    String? startDate,
    String? endDate,
    String? userId,
    String? departmentId,
    String? attendanceState,
  }) async {
    try {
      var query = _client.from('attendance').select('*, profiles(*, departments(*)), nfc_tags(*)');
      
      if (startDate != null && startDate.isNotEmpty) {
        query = query.gte('checkInTime', startDate);
      }
      if (endDate != null && endDate.isNotEmpty) {
        query = query.lte('checkInTime', endDate);
      }
      if (userId != null && userId.isNotEmpty) {
        query = query.eq('userId', userId);
      }
      if (attendanceState != null && attendanceState.isNotEmpty) {
        query = query.eq('attendanceState', attendanceState);
      }
      
      final response = await query.order('checkInTime', ascending: false);
      var list = List<Map<String, dynamic>>.from(response);
      
      // Filter by department in-memory if requested (since department is joined)
      if (departmentId != null && departmentId.isNotEmpty) {
        list = list.where((item) {
          final profile = item['profiles'] as Map<String, dynamic>?;
          return profile != null && profile['department_id']?.toString() == departmentId;
        }).toList();
      }
      
      return list;
    } catch (e) {
      _logger.error('Error fetching global attendance reports: $e');
      return [];
    }
  }

  /// Override a user's attendance record (Admin override)
  Future<void> adminOverrideRecord({
    required String attendanceId,
    required Map<String, dynamic> updates,
    required String adminUserId,
    String? reason,
  }) async {
    try {
      final response = await _client
          .from('attendance')
          .update(updates)
          .eq('id', attendanceId)
          .select()
          .single();
      
      final record = AttendanceRecord.fromJson(response);

      await logTimelineEvent(
        attendanceId: record.id,
        userId: record.userId,
        eventType: 'attendance_override',
        notes: 'Admin (ID: $adminUserId) override: ${reason ?? "Record modified."}',
        eventTime: DateTime.now(),
        metadata: {
          'adminUserId': adminUserId,
          'reason': reason,
        },
      );
    } catch (e) {
      _logger.error('Error updating override record: $e');
      throw Exception('Failed to override record: $e');
    }
  }

  /// Check if the date is registered as a public holiday.
  Future<bool> isHolidayDate(DateTime date) async {
    try {
      final dateStr = date.toIso8601String().split('T')[0];
      final response = await _client
          .from('public_holidays')
          .select('id')
          .eq('date', dateStr)
          .limit(1);
      final list = response as List?;
      return list != null && list.isNotEmpty;
    } catch (e) {
      _logger.error('Error checking holiday date: $e');
      return false;
    }
  }

  /// Fetch all holidays (Admin)
  Future<List<Map<String, dynamic>>> getHolidayList() async {
    try {
      final response = await _client
          .from('public_holidays')
          .select()
          .order('date', ascending: true);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      _logger.error('Error fetching holiday list: $e');
      return [];
    }
  }

  /// Add new holiday
  Future<void> addHoliday(String dateStr, String name, {String? campusId}) async {
    try {
      await _client
          .from('public_holidays')
          .insert({
            'date': dateStr,
            'name': name,
            'campusId': campusId,
          });
    } catch (e) {
      _logger.error('Error adding holiday: $e');
      throw Exception('Failed to add holiday: $e');
    }
  }

  /// Delete holiday
  Future<void> deleteHoliday(String id) async {
    try {
      await _client
          .from('public_holidays')
          .delete()
          .eq('id', id);
    } catch (e) {
      _logger.error('Error deleting holiday: $e');
      throw Exception('Failed to delete holiday: $e');
    }
  }

  /// Submit a Missed Check-in or Remote Checkout Request
  Future<AttendanceRequest> submitAttendanceRequest({
    required String userId,
    required String userName,
    required String requestType, // 'missed_checkin' | 'remote_checkout'
    required DateTime requestedTime,
    required String reason,
    double? latitude,
    double? longitude,
    String? assignmentId,
    String? attendanceId,
  }) async {
    try {
      final data = {
        'userId': userId,
        'userName': userName,
        'requestType': requestType,
        'requestedTime': requestedTime.toUtc().toIso8601String(),
        'reason': reason,
        'latitude': latitude,
        'longitude': longitude,
        'assignmentId': assignmentId,
        'attendanceId': attendanceId,
        'status': 'pending',
      };

      final response = await _client
          .from('attendance_requests')
          .insert(data)
          .select()
          .single();

      return AttendanceRequest.fromJson(response);
    } catch (e) {
      _logger.error('Error submitting attendance request: $e');
      throw Exception('Failed to submit request: $e');
    }
  }

  /// Retroactively expire pending requests older than 72 hours
  Future<void> expireStaleRequests() async {
    try {
      final cutoff = DateTime.now().toUtc().subtract(const Duration(hours: 72)).toIso8601String();
      await _client
          .from('attendance_requests')
          .update({'status': 'expired'})
          .eq('status', 'pending')
          .lt('createdAt', cutoff);
    } catch (e) {
      _logger.error('Error auto-expiring stale requests: $e');
    }
  }

  /// Get pending/resolved attendance requests for a user
  Future<List<AttendanceRequest>> getAttendanceRequests({String? userId, String? status}) async {
    try {
      await expireStaleRequests();
      var query = _client.from('attendance_requests').select();
      if (userId != null) {
        query = query.eq('userId', userId);
      }
      if (status != null) {
        query = query.eq('status', status);
      }
      final response = await query.order('createdAt', ascending: false);
      return (response as List).map((json) => AttendanceRequest.fromJson(json)).toList();
    } catch (e) {
      _logger.error('Error fetching attendance requests: $e');
      return [];
    }
  }

  /// Resolve (Approve / Reject) an attendance request
  Future<void> resolveAttendanceRequest({
    required String requestId,
    required String status, // 'approved' | 'rejected'
    required String adminUserId,
    String? adminNotes,
  }) async {
    try {
      final nowStr = DateTime.now().toUtc().toIso8601String();
      
      // First fetch the request to know details
      final reqJson = await _client
          .from('attendance_requests')
          .select()
          .eq('id', requestId)
          .single();
      final req = AttendanceRequest.fromJson(reqJson);

      await _client
          .from('attendance_requests')
          .update({
            'status': status,
            'adminUserId': adminUserId,
            'adminNotes': adminNotes,
            'resolvedAt': nowStr,
          })
          .eq('id', requestId);

      if (status == 'approved') {
        if (req.requestType == 'missed_checkin') {
          // Retroactively create active attendance record for check-in
          final checkInTime = DateTime.tryParse(req.requestedTime) ?? DateTime.now();
          final data = {
            'userId': req.userId,
            'userName': req.userName,
            'checkInTime': checkInTime.toUtc().toIso8601String(),
            'checkInSource': 'manual',
            'attendanceState': 'active',
            'workMode': 'office', // Default to office for manual retroactive check-in
          };
          
          final recordJson = await _client
              .from('attendance')
              .insert(data)
              .select()
              .single();
          final record = AttendanceRecord.fromJson(recordJson);

          // Log timeline override event
          await logTimelineEvent(
            attendanceId: record.id,
            userId: req.userId,
            eventType: 'attendance_override',
            notes: 'Approved Missed Check-In (Request ID: ${req.id}). Admin ID: $adminUserId. Reason: ${req.reason}',
            eventTime: DateTime.now(),
            metadata: {
              'adminUserId': adminUserId,
              'requestId': req.id,
              'reason': req.reason,
            },
          );
        } else if (req.requestType == 'remote_checkout') {
          // Check out the user's active session
          if (req.attendanceId != null) {
            final checkOutTime = DateTime.tryParse(req.requestedTime) ?? DateTime.now();
            await _client
                .from('attendance')
                .update({
                  'checkOutTime': checkOutTime.toUtc().toIso8601String(),
                  'checkOutSource': 'manual',
                  'attendanceState': 'closed',
                  'closeReason': 'normal_checkout',
                })
                .eq('id', req.attendanceId!);

            await logTimelineEvent(
              attendanceId: req.attendanceId!,
              userId: req.userId,
              eventType: 'remote_checkout',
              notes: 'Approved Remote Checkout (Request ID: ${req.id}). Admin ID: $adminUserId. Reason: ${req.reason}',
              latitude: req.latitude,
              longitude: req.longitude,
              eventTime: DateTime.now(),
              metadata: {
                'adminUserId': adminUserId,
                'requestId': req.id,
                'latitude': req.latitude,
                'longitude': req.longitude,
              },
            );
          }
        }
      }
    } catch (e) {
      _logger.error('Error resolving attendance request: $e');
      throw Exception('Failed to resolve request: $e');
    }
  }
}
