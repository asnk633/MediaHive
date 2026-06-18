import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/logger_service.dart';
import '../../../../core/services/notification_service.dart';
import '../../presentation/providers/attendance_provider.dart';
import '../../domain/models/attendance_policy.dart';
import '../../domain/models/attendance_record.dart';

enum ReminderType {
  preCheckin,
  postCheckin,
  preCheckout,
  postCheckout,
  lunch,
  postLunch,
}

final attendanceReminderServiceProvider = Provider<AttendanceReminderService>((ref) {
  final service = AttendanceReminderService(ref);
  
  // Listen to active session changes
  ref.listen<AsyncValue<AttendanceRecord?>>(activeAttendanceSessionProvider, (prev, next) {
    next.whenData((session) {
      service.updateReminders(session);
    });
  });

  // Listen to policy changes
  ref.listen<AsyncValue<AttendancePolicy>>(attendancePolicyProvider, (prev, next) {
    next.whenData((policy) {
      final session = ref.read(activeAttendanceSessionProvider).value;
      service.updateReminders(session, policyOverride: policy);
    });
  });

  // Listen to history changes (so editing checkout time or completed checkins refreshes reminders)
  ref.listen<AsyncValue<List<AttendanceRecord>>>(personalAttendanceHistoryProvider, (prev, next) {
    next.whenData((history) {
      final session = ref.read(activeAttendanceSessionProvider).value;
      service.updateReminders(session);
    });
  });

  // Eagerly fire an initial reminder update if the session provider is already loaded.
  // ref.listen does NOT trigger on the initial value — only on subsequent changes.
  // This ensures shift reminders are scheduled on boot/login without waiting for a state change.
  final initialSessionState = ref.read(activeAttendanceSessionProvider);
  initialSessionState.whenData((session) {
    service.updateReminders(session);
  });

  return service;
});

class AttendanceReminderService {
  final Ref _ref;
  final _logger = LoggerService();
  static const int _notificationIdOffset = 2000;
  Timer? _debounceTimer;

  AttendanceReminderService(this._ref);

  int _getNotificationId(ReminderType type) => _notificationIdOffset + type.index;

  /// Helper to skip weekends and holidays when scheduling check-ins forward.
  Future<DateTime> _nextWorkingDay(DateTime date) async {
    DateTime next = date.add(const Duration(days: 1));
    for (int i = 0; i < 7; i++) {
      final isWeekend = next.weekday == DateTime.saturday || next.weekday == DateTime.sunday;
      bool isHoliday = false;
      try {
        isHoliday = await _ref.read(attendanceRepositoryProvider).isHolidayDate(next);
      } catch (e) {
        _logger.error('Failed to check holiday date for $next, ignoring holiday check: $e');
      }
      if (!isWeekend && !isHoliday) {
        return next;
      }
      next = next.add(const Duration(days: 1));
    }
    return next;
  }

  /// Reactively schedules and cancels check-in/out and lunch reminders.
  /// Uses debounce to coalesce rapid-fire calls from multiple provider listeners.
  void updateReminders(AttendanceRecord? activeSession, {AttendancePolicy? policyOverride}) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _executeUpdateReminders(activeSession, policyOverride: policyOverride);
    });
  }

  Future<void> _executeUpdateReminders(AttendanceRecord? activeSession, {AttendancePolicy? policyOverride}) async {
    try {
      final AttendancePolicy policy = policyOverride ?? await _ref.read(attendancePolicyProvider.future);
      final notificationService = _ref.read(notificationServiceProvider);
      
      final history = _ref.read(personalAttendanceHistoryProvider).value ?? [];
      final now = DateTime.now();
      
      final todayRecords = history.where((r) {
        final checkInDate = DateTime.tryParse(r.checkInTime)?.toLocal();
        return checkInDate != null &&
            checkInDate.year == now.year &&
            checkInDate.month == now.month &&
            checkInDate.day == now.day;
      }).toList();

      // Cancel all existing shift reminders before rescheduling
      for (final type in ReminderType.values) {
        await notificationService.cancelNotification(_getNotificationId(type));
      }

      // Check if user has already checked out today
      bool checkedOutToday = false;
      if (todayRecords.isNotEmpty) {
        final latest = todayRecords.first;
        if (latest.attendanceState == 'closed') {
          checkedOutToday = true;
        }
      }

      // If already checked out today, don't schedule notifications for today,
      // but schedule check-in reminders for the next working day.
      if (checkedOutToday) {
        final nextWorkDay = await _nextWorkingDay(now);
        _logger.debug('User already checked out today. Scheduling tomorrow reminders for $nextWorkDay');
        await _scheduleCheckInReminders(policy, nextWorkDay);
        return;
      }

      // Check if today is a weekend or holiday
      final isWeekend = now.weekday == DateTime.saturday || now.weekday == DateTime.sunday;
      bool isHoliday = false;
      try {
        isHoliday = await _ref.read(attendanceRepositoryProvider).isHolidayDate(now);
      } catch (e) {
        _logger.error('Failed to check holiday date for today, ignoring holiday check: $e');
      }

      if (activeSession != null && activeSession.attendanceState == 'active') {
        // User is currently checked in.
        // Even if it's a weekend/holiday, they checked in, so schedule checkout and lunch reminders for today.
        _logger.debug('User is checked in. Scheduling checkout and lunch break reminders for today.');
        await _scheduleCheckOutReminders(policy, now);
        await _scheduleLunchReminders(policy, now);
      } else {
        // Not checked in yet.
        if (isWeekend || isHoliday) {
          // It's a weekend or holiday and they aren't checked in, so skip today's check-in reminders
          // and schedule check-in reminders for the next working day.
          final nextWorkDay = await _nextWorkingDay(now);
          _logger.debug('Today is a weekend/holiday. Scheduling next working day reminders for $nextWorkDay');
          await _scheduleCheckInReminders(policy, nextWorkDay);
        } else {
          // Regular workday and not checked in. Schedule check-in reminders for today.
          _logger.debug('Regular workday. Scheduling check-in reminders for today.');
          await _scheduleCheckInReminders(policy, now);
        }
      }
    } catch (e, stack) {
      _logger.error('Error updating attendance reminders', e, stack);
    }
  }

  Future<void> _scheduleCheckInReminders(AttendancePolicy policy, DateTime date) async {
    final notificationService = _ref.read(notificationServiceProvider);
    
    final startTime = policy.parseTime(policy.startTimeStr, date);
    if (startTime != null) {
      // 5 minutes before check-in start
      final preTime = startTime.subtract(const Duration(minutes: 5));
      await notificationService.scheduleShiftReminder(
        id: _getNotificationId(ReminderType.preCheckin),
        title: 'Get Ready to Check In',
        body: 'Your work shift starts in 5 minutes. Please remember to check in.',
        scheduledDateTime: preTime,
        payload: '/attendance',
      );

      // 10 minutes after check-in start
      final postTime = startTime.add(const Duration(minutes: 10));
      await notificationService.scheduleShiftReminder(
        id: _getNotificationId(ReminderType.postCheckin),
        title: 'Check-In Reminder',
        body: 'You haven\'t checked in yet. Did you forget to check in?',
        scheduledDateTime: postTime,
        payload: '/attendance',
      );
    }
  }

  Future<void> _scheduleCheckOutReminders(AttendancePolicy policy, DateTime date) async {
    final notificationService = _ref.read(notificationServiceProvider);

    final endTime = policy.parseTime(policy.endTimeStr, date);
    if (endTime != null) {
      // 5 minutes before check-out end
      final preTime = endTime.subtract(const Duration(minutes: 5));
      await notificationService.scheduleShiftReminder(
        id: _getNotificationId(ReminderType.preCheckout),
        title: 'Check-Out Reminder',
        body: 'Your work shift ends in 5 minutes. Don\'t forget to check out when you\'re done!',
        scheduledDateTime: preTime,
        payload: '/attendance',
      );

      // 10 minutes after check-out end
      final postTime = endTime.add(const Duration(minutes: 10));
      await notificationService.scheduleShiftReminder(
        id: _getNotificationId(ReminderType.postCheckout),
        title: 'Still working?',
        body: 'Your scheduled checkout time has passed. Are you still working? If not, please check out.',
        scheduledDateTime: postTime,
        payload: '/attendance',
      );
    }
  }

  Future<void> _scheduleLunchReminders(AttendancePolicy policy, DateTime date) async {
    final notificationService = _ref.read(notificationServiceProvider);

    // Lunch break start reminder
    final lunchStart = policy.parseTime(policy.lunchStartTimeStr, date);
    if (lunchStart != null) {
      await notificationService.scheduleShiftReminder(
        id: _getNotificationId(ReminderType.lunch),
        title: 'Lunch Break Time 🍽️',
        body: 'It\'s lunch break time. Take a break, relax, and remember to check out for lunch.',
        scheduledDateTime: lunchStart,
        payload: '/attendance',
      );
    }

    // Lunch break end reminder (10 minutes after lunch end)
    final lunchEnd = policy.parseTime(policy.lunchEndTimeStr, date);
    if (lunchEnd != null) {
      final postLunchTime = lunchEnd.add(const Duration(minutes: 10));
      await notificationService.scheduleShiftReminder(
        id: _getNotificationId(ReminderType.postLunch),
        title: 'Welcome Back 🐝',
        body: 'Hope you had a good lunch! Don\'t forget to check back in for your afternoon session.',
        scheduledDateTime: postLunchTime,
        payload: '/attendance',
      );
    }
  }
}
