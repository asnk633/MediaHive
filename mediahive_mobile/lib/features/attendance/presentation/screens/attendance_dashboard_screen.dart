import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';


import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/theme_provider.dart';
import '../../../../shared/widgets/mh_loading.dart';
import '../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../domain/models/attendance_event.dart';
import '../../domain/models/attendance_record.dart';
import '../../domain/models/attendance_policy.dart';
import '../providers/attendance_provider.dart';
import '../../../../core/providers/user_provider.dart';
import 'field_work_scan_screen.dart';
import 'field_work_approval_screen.dart';
import '../providers/field_work_provider.dart';
import 'missed_checkin_request_sheet.dart';
import 'remote_checkout_request_sheet.dart';
import 'qr_scanner_overlay.dart';
import '../../../../core/services/snackbar_service.dart';

class AttendanceDashboardScreen extends ConsumerStatefulWidget {
  const AttendanceDashboardScreen({super.key});

  @override
  ConsumerState<AttendanceDashboardScreen> createState() =>
      _AttendanceDashboardScreenState();
}

class _AttendanceDashboardScreenState
    extends ConsumerState<AttendanceDashboardScreen>
    with SingleTickerProviderStateMixin {
  Timer? _stopwatchTimer;
  Duration _elapsed = Duration.zero;
  late AnimationController _pulseController;
  String _selectedWorkMode = 'office';
  final TextEditingController _locationController = TextEditingController();
  bool _hasShownReminderDialog = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _stopwatchTimer?.cancel();
    _pulseController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _startStopwatch(DateTime checkInTime) {
    _elapsed = DateTime.now().difference(checkInTime);
    _stopwatchTimer?.cancel();
    _stopwatchTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _elapsed = DateTime.now().difference(checkInTime);
        });
      }
    });
  }

  void _stopStopwatch() {
    _stopwatchTimer?.cancel();
    setState(() => _elapsed = Duration.zero);
  }

  String _formatElapsed(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final activeSessionAsync = ref.watch(activeAttendanceSessionProvider);
    final historyAsync = ref.watch(personalAttendanceHistoryProvider);

    ref.listen<NfcScanState>(globalNfcScanningProvider, (prev, next) {
      if (next.status == NfcScanStatus.leaveConflict) {
        _showLeaveConflictDialog(next.physicalTagId!, next.tagName ?? 'Campus Tag');
      }
      // Navigate to field work screen when a field_work NFC tag is scanned
      if (next.status == NfcScanStatus.fieldWork && next.data != null) {
        final tagData = next.data!;
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => FieldWorkScanScreen(
              tagUuid: tagData['tagId'] as String? ?? '',
              tagName: tagData['tagName'] as String? ?? 'Field Work Tag',
            ),
          ),
        );
      }
    });

    // Sync stopwatch state
    activeSessionAsync.whenData((session) {
      if (session != null) {
        final checkIn = DateTime.tryParse(session.checkInTime);
        if (checkIn != null && (_stopwatchTimer == null || !_stopwatchTimer!.isActive)) {
          _startStopwatch(checkIn);
        }
        _selectedWorkMode = session.workMode;
      } else {
        if (_stopwatchTimer?.isActive == true) _stopStopwatch();
      }
    });

    // Handle checkout reminder notification redirect
    final routeState = GoRouterState.of(context);
    final triggerCheckoutReminder = routeState.uri.queryParameters['triggerCheckoutReminder'] == 'true';
    if (triggerCheckoutReminder && !_hasShownReminderDialog) {
      _hasShownReminderDialog = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showCheckoutReminderDialog();
      });
    }

    // Dynamic calculations for Today's worked hours & overtime
    final records = historyAsync.value ?? [];
    final now = DateTime.now();
    final todayRecords = records.where((r) {
      final dt = DateTime.tryParse(r.checkInTime)?.toLocal();
      return dt != null && dt.year == now.year && dt.month == now.month && dt.day == now.day;
    }).toList();

    final activeSession = activeSessionAsync.value;
    final containsActive = activeSession != null && todayRecords.any((r) => r.id == activeSession.id);

    Duration totalToday = Duration.zero;
    Duration overtimeToday = Duration.zero;

    final policy = ref.watch(attendancePolicyProvider).value ?? AttendancePolicy.defaultPolicy();

    for (final r in todayRecords) {
      totalToday += r.calculatedDuration;
      overtimeToday += r.getOvertimeHours(policy);
    }

    if (activeSession != null && !containsActive) {
      totalToday += _elapsed;
      overtimeToday += activeSession.getOvertimeHours(policy);
    }

    final workedHours = totalToday.inHours;
    final workedMins = totalToday.inMinutes.remainder(60);
    final todayWorkedStr = workedHours > 0 ? '${workedHours}h ${workedMins}m' : '${workedMins}m';

    final otHours = overtimeToday.inHours;
    final otMins = overtimeToday.inMinutes.remainder(60);
    final todayOvertimeStr = otHours > 0 ? '${otHours}h ${otMins}m' : '${otMins}m';

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.backgroundSecondary, colors.backgroundPrimary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: MhRefreshIndicator(
          edgeOffset: 140,
          onRefresh: () async {
            ref.invalidate(activeAttendanceSessionProvider);
            ref.invalidate(personalAttendanceHistoryProvider);
            await Future.delayed(const Duration(milliseconds: 600));
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ElasticScrollPhysics()),
            slivers: [
              SliverPadding(
                padding: EdgeInsets.fromLTRB(
                    20, 100 + MediaQuery.of(context).padding.top, 20, 100),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildHeader(context, colors),
                    const SizedBox(height: 24),
                    activeSessionAsync.when(
                      data: (session) => _buildActiveSessionCard(
                        context, 
                        colors, 
                        session, 
                        todayWorkedStr: todayWorkedStr, 
                        todayOvertimeStr: todayOvertimeStr,
                        policy: policy,
                      ),
                      loading: () => const MhLoading(size: 80),
                      error: (e, _) => _buildErrorCard(colors, e.toString()),
                    ),
                    const SizedBox(height: 24),
                    _buildWorkModePanel(context, colors, activeSessionAsync.value),
                    const SizedBox(height: 24),
                    // Manager-only: Pending field work requests
                    _buildFieldWorkRequestsPanel(context, colors),
                    historyAsync.when(
                      data: (records) => _buildStatsSummary(colors, records),
                      loading: () => const MhLoading(size: 60),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 24),
                    historyAsync.when(
                      data: (records) => _buildHistoryList(colors, records),
                      loading: () => const MhLoading(size: 100),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  Widget _buildHeader(BuildContext context, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ATTENDANCE',
                style: AppTypography.h1.copyWith(color: colors.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                'YOUR WORK SESSION & HISTORY',
                style: AppTypography.caption
                    .copyWith(color: colors.textSecondary, letterSpacing: 1),
              ),
              const SizedBox(height: 16),
              Container(height: 1, width: 60, color: colors.honey.withValues(alpha: 0.5)),
            ],
          ),
        ),
        GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.border),
            ),
            child: Icon(LucideIcons.clock, color: colors.honey, size: 20),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1);
  }

  Color _getStatusColor(AttendanceStatus status, ThemeColors colors) {
    switch (status) {
      case AttendanceStatus.checkedIn:
        return AppColors.success; // Green
      case AttendanceStatus.onField:
        return AppColors.warning; // Yellow
      case AttendanceStatus.remote:
        return AppColors.info; // Blue
      case AttendanceStatus.autoClosed:
        return colors.isDark ? Colors.white54 : Colors.black87; // Black
      case AttendanceStatus.checkedOut:
        return AppColors.error; // Red
    }
  }

  String _getStatusLabel(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.checkedIn:
        return 'CHECKED IN';
      case AttendanceStatus.onField:
        return 'ON FIELD ASSIGNMENT';
      case AttendanceStatus.remote:
        return 'REMOTE WORK';
      case AttendanceStatus.autoClosed:
        return 'AUTO CLOSED';
      case AttendanceStatus.checkedOut:
        return 'CHECKED OUT';
    }
  }

  void _showCheckoutReminderDialog() {
    final activeSession = ref.read(activeAttendanceSessionProvider).value;
    if (activeSession == null || activeSession.attendanceState != 'active') return;
    final colors = ref.read(themeColorsProvider);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.backgroundSecondary,
        title: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, color: AppColors.warning, size: 22),
            const SizedBox(width: 8),
            Text('Checkout Reminder', style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'You appear to have left the office area.\n\nDid you forget to check out?',
          style: TextStyle(color: colors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Dismiss', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () async {
              Navigator.pop(ctx);
              ref.read(globalNfcScanningProvider.notifier).performManualCheckout(
                source: 'geofence_exit_dialog',
              );
            },
            child: const Text('Check Out', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showLeaveConflictDialog(String tagId, String tagName) {
    final colors = ref.read(themeColorsProvider);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.backgroundSecondary,
        title: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, color: AppColors.warning, size: 22),
            const SizedBox(width: 8),
            Text('Leave Conflict', style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'You currently have approved leave for today.\n\nDo you still want to check in at $tagName?',
          style: TextStyle(color: colors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () {
              ref.read(globalNfcScanningProvider.notifier).reset();
              Navigator.pop(ctx);
            },
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(globalNfcScanningProvider.notifier).startScan(
                workMode: 'office',
                bypassLeaveCheck: true,
                mockPhysicalTagId: tagId,
              );
            },
            child: const Text('Continue', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // ─── Active Session Card ───────────────────────────────────────────────────
  Widget _buildActiveSessionCard(
      BuildContext context, ThemeColors colors, AttendanceRecord? session,
      {required String todayWorkedStr, required String todayOvertimeStr, required AttendancePolicy policy}) {
    final isCheckedIn = session != null;
    final scanState = ref.watch(globalNfcScanningProvider);
    final isScanning = scanState.status == NfcScanStatus.scanning;

    final AttendanceStatus currentStatus = isCheckedIn ? session.status : AttendanceStatus.checkedOut;
    final statusColor = _getStatusColor(currentStatus, colors);
    final statusLabel = _getStatusLabel(currentStatus);

    final profileAsync = ref.watch(currentUserProfileProvider);
    final profile = profileAsync.value;
    final role = (profile?['role']?.toString() ?? 'member').toLowerCase().trim();
    final department = (profile?['department_name']?.toString() ?? 'None').toLowerCase().trim();

    final isTeam = role == 'team';
    final isMediaItManager = role == 'manager' && 
        (department.contains('media') && department.contains('it'));
        
    final hasCheckInPermission = isTeam || isMediaItManager;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isCheckedIn
              ? statusColor.withValues(alpha: 0.3)
              : colors.border,
        ),
        boxShadow: isCheckedIn
            ? [
                BoxShadow(
                  color: statusColor.withValues(alpha: 0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ]
            : colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─ Status Row ─
          Row(
            children: [
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, _) => Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isCheckedIn
                        ? statusColor.withValues(
                            alpha: 0.5 + 0.5 * _pulseController.value)
                        : colors.textSecondary.withValues(alpha: 0.3),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                statusLabel,
                style: TextStyle(
                  color: isCheckedIn ? statusColor : colors.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const Spacer(),
              if (isCheckedIn)
                Navigator.canPop(context) ? const SizedBox.shrink() : Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(
                        color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    session.workMode.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 20),

          // ─ Stopwatch / CTA ─
          if (isCheckedIn) ...[
            Center(
              child: Text(
                _formatElapsed(_elapsed),
                style: AppTypography.h1.copyWith(
                  color: colors.textPrimary,
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ).animate(onPlay: (c) => c.repeat()).shimmer(
                    duration: 3000.ms,
                    color: colors.honey.withValues(alpha: 0.15),
                  ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                'Checked in at ${DateFormat('hh:mm a').format(DateTime.parse(session.checkInTime).toLocal())}',
                style: TextStyle(
                    color: colors.textSecondary, fontSize: 12),
              ),
            ),
            if (session.lastKnownWorkLocation != null) ...[
              const SizedBox(height: 4),
              Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.mapPin, color: colors.honey, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      session.lastKnownWorkLocation!,
                      style: TextStyle(
                          color: colors.honey,
                          fontSize: 11,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
            // ─ Worked Today & Overtime display ─
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.backgroundPrimary.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('WORKED TODAY', style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Text(todayWorkedStr, style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.backgroundPrimary.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('OVERTIME TODAY', style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Text(
                          todayOvertimeStr,
                          style: TextStyle(
                            color: policy.overtimeEnabled && todayOvertimeStr != '0m' ? colors.honey : colors.textSecondary,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            Center(
              child: Text(
                'Ready to log attendance',
                style: TextStyle(color: colors.textSecondary, fontSize: 14),
              ),
            ),
            // Still show Today's summary metrics even when checked out
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.backgroundPrimary.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('WORKED TODAY', style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Text(todayWorkedStr, style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.backgroundPrimary.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('OVERTIME TODAY', style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Text(
                          todayOvertimeStr,
                          style: TextStyle(
                            color: policy.overtimeEnabled && todayOvertimeStr != '0m' ? colors.honey : colors.textSecondary,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],

          if (!hasCheckInPermission && !isCheckedIn) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.honey.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.honey.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.info, color: colors.honey, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Attendance logging is restricted to Team members and Media & IT department Managers.',
                      style: TextStyle(color: colors.textSecondary, fontSize: 12, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 24),
            // ─ NFC Action Button ─
            GestureDetector(
              onTap: isScanning
                  ? null
                  : () {
                      ref.read(globalNfcScanningProvider.notifier).startScan(
                            workMode: isCheckedIn ? session.workMode : 'office',
                            source: 'nfc',
                          );
                    },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: isCheckedIn
                    ? const LinearGradient(
                        colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : (colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient),
                borderRadius: BorderRadius.circular(18),
                boxShadow: isCheckedIn
                    ? [
                        BoxShadow(
                          color: Colors.red.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        )
                      ]
                    : (colors.isDark ? [] : []),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isScanning
                        ? LucideIcons.loader
                        : (isCheckedIn ? LucideIcons.logOut : LucideIcons.nfc),
                    color: isCheckedIn ? Colors.white : colors.backgroundPrimary,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    isScanning
                        ? 'SCANNING...'
                        : (isCheckedIn ? 'TAP NFC TO CHECK OUT' : 'TAP NFC TO CHECK IN'),
                    style: TextStyle(
                      color:
                          isCheckedIn ? Colors.white : colors.backgroundPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ─ QR Action Button ─
          GestureDetector(
            onTap: isScanning
                ? null
                : () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => QrScannerOverlay(
                        onScan: (payload) {
                          Navigator.pop(ctx);
                          ref.read(globalNfcScanningProvider.notifier).startScan(
                                workMode: isCheckedIn ? session.workMode : 'office',
                                source: 'qr',
                                qrPayload: payload,
                              );
                        },
                      ),
                    );
                  },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: isCheckedIn
                    ? const LinearGradient(
                        colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : const LinearGradient(
                        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: (isCheckedIn ? Colors.blue : Colors.purple).withValues(alpha: 0.2),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isScanning
                        ? LucideIcons.loader
                        : (isCheckedIn ? LucideIcons.logOut : LucideIcons.qrCode),
                    color: Colors.white,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    isScanning
                        ? 'SCANNING...'
                        : (isCheckedIn ? 'SCAN QR TO CHECK OUT' : 'SCAN QR TO CHECK IN'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],

        // ─ Quick Check Out Button (shown only when checked in) ─
        if (isCheckedIn) ...[
          const SizedBox(height: 12),
          GestureDetector(
            onTap: isScanning
                ? null
                : () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: colors.backgroundSecondary,
                        title: Row(
                          children: [
                            const Icon(LucideIcons.logOut, color: AppColors.warning, size: 22),
                            const SizedBox(width: 8),
                            Text('Quick Check Out',
                                style: TextStyle(
                                    color: colors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold)),
                          ],
                        ),
                        content: Text(
                          'This will check you out immediately without scanning an NFC tag or QR code.\n\nAre you sure?',
                          style: TextStyle(color: colors.textSecondary, fontSize: 13),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: Text('Cancel',
                                style: TextStyle(
                                    color: colors.textSecondary, fontSize: 12)),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.warning),
                            onPressed: () {
                              Navigator.pop(ctx);
                              ref
                                  .read(globalNfcScanningProvider.notifier)
                                  .performManualCheckout(
                                      source: 'quick_checkout_button');
                            },
                            child: const Text('Check Out Now',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    );
                  },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.5), width: 1.5),
                borderRadius: BorderRadius.circular(18),
                color: AppColors.warning.withValues(alpha: 0.08),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.logOut, color: AppColors.warning, size: 18),
                  SizedBox(width: 10),
                  Text(
                    'QUICK CHECK OUT',
                    style: TextStyle(
                      color: AppColors.warning,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],

        if (isCheckedIn && session.workMode == 'field') ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: colors.backgroundSecondary,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  builder: (ctx) => RemoteCheckoutRequestSheet(
                    attendanceId: session.id,
                    assignmentId: session.assignmentId,
                  ),
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: colors.honey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: colors.honey.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.mapPin, color: colors.honey, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      'REQUEST REMOTE CHECKOUT',
                      style: TextStyle(
                        color: colors.honey,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else if (!isCheckedIn) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: colors.backgroundSecondary,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  builder: (ctx) => const MissedCheckinRequestSheet(),
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: colors.border,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.calendar, color: colors.textSecondary, size: 14),
                    const SizedBox(width: 8),
                    Text(
                      'REPORT MISSED CHECK-IN',
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // ─ Scan Status Message ─
          if (scanState.message != null) ...[
            const SizedBox(height: 12),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: (scanState.status == NfcScanStatus.error
                        ? AppColors.error
                        : AppColors.success)
                    .withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: (scanState.status == NfcScanStatus.error
                          ? AppColors.error
                          : AppColors.success)
                      .withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    scanState.status == NfcScanStatus.error
                        ? LucideIcons.alertCircle
                        : LucideIcons.checkCircle,
                    color: scanState.status == NfcScanStatus.error
                        ? AppColors.error
                        : AppColors.success,
                    size: 14,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      scanState.message!,
                      style: TextStyle(
                        color: scanState.status == NfcScanStatus.error
                            ? AppColors.error
                            : AppColors.success,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.3),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1);
  }

  // ─── Manager: Pending Field Work Requests ────────────────────────────────
  Widget _buildFieldWorkRequestsPanel(BuildContext context, ThemeColors colors) {
    final profile = ref.watch(currentUserProfileProvider).valueOrNull;
    final role = (profile?['role']?.toString() ?? 'member').toLowerCase().trim();
    final isManagerOrAdmin = role == 'manager' || role == 'admin' || role == 'owner';

    if (!isManagerOrAdmin) return const SizedBox.shrink();

    final pendingAsync = ref.watch(pendingFieldWorkSessionsProvider);

    return pendingAsync.when(
      data: (sessions) {
        if (sessions.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: GestureDetector(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const FieldWorkApprovalScreen(),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.warning.withValues(alpha: 0.4),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      LucideIcons.briefcase,
                      color: AppColors.warning,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Field Work Requests',
                          style: AppTypography.bodyM.copyWith(
                            color: colors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${sessions.length} pending approval${sessions.length > 1 ? 's' : ''}',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.warning,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${sessions.length}',
                      style: AppTypography.caption.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    LucideIcons.chevronRight,
                    color: colors.textSecondary,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  // ─── Work Mode Panel ────────────────────────────────────────────────────────
  Widget _buildWorkModePanel(
      BuildContext context, ThemeColors colors, AttendanceRecord? session) {
    if (session == null) return const SizedBox.shrink();

    final modes = [
      {'id': 'office', 'label': 'OFFICE', 'icon': LucideIcons.building2},
      {'id': 'field', 'label': 'FIELD', 'icon': LucideIcons.mapPin},
      {'id': 'remote', 'label': 'REMOTE', 'icon': LucideIcons.wifi},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.briefcase, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text(
              'WORK MODE',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: modes.map((m) {
            final isSelected = _selectedWorkMode == m['id'];
            return Expanded(
              child: GestureDetector(
                onTap: () async {
                  setState(() => _selectedWorkMode = m['id'] as String);
                  await _showLocationDialog(context, colors, session, m['id'] as String);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? colors.honey.withValues(alpha: colors.isDark ? 0.15 : 0.1)
                        : colors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? colors.honey.withValues(alpha: 0.5) : colors.border,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        m['icon'] as IconData,
                        color: isSelected ? colors.honey : colors.textSecondary,
                        size: 20,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        m['label'] as String,
                        style: TextStyle(
                          color: isSelected ? colors.honey : colors.textSecondary,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 100.ms);
  }

  Future<void> _showLocationDialog(
      BuildContext context, ThemeColors colors, AttendanceRecord session, String newMode) async {
    _locationController.text = session.lastKnownWorkLocation ?? '';

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.backgroundSecondary,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, 24 + MediaQuery.of(ctx).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: colors.border,
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'SHIFT WORK MODE',
              style: AppTypography.h3.copyWith(color: colors.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              'Set your current work location',
              style: TextStyle(color: colors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _locationController,
              style: TextStyle(color: colors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Location (e.g. Main Auditorium)',
                labelStyle: TextStyle(color: colors.textSecondary),
                filled: true,
                fillColor: colors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.honey),
                ),
                prefixIcon: Icon(LucideIcons.mapPin, color: colors.honey, size: 18),
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: () async {
                final location = _locationController.text.trim().isEmpty
                    ? null
                    : _locationController.text.trim();
                Navigator.pop(ctx);
                await ref
                    .read(attendanceRepositoryProvider)
                    .switchWorkMode(
                      attendanceId: session.id,
                      userId: session.userId,
                      newWorkMode: newMode,
                      lastKnownWorkLocation: location,
                    );
                ref.invalidate(activeAttendanceSessionProvider);
                ref.invalidate(personalAttendanceHistoryProvider);
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Text(
                    'CONFIRM WORK MODE',
                    style: TextStyle(
                      color: colors.isDark ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Stats Summary ──────────────────────────────────────────────────────────
  Widget _buildStatsSummary(ThemeColors colors, List<AttendanceRecord> records) {
    final now = DateTime.now();
    final monthStart = DateTime(now.year, now.month, 1);
    final monthRecords = records.where((r) {
      final dt = DateTime.tryParse(r.checkInTime);
      return dt != null && dt.isAfter(monthStart);
    }).toList();

    int workingDays = 0;
    Duration totalDuration = Duration.zero;
    int lateCount = 0;

    for (final r in monthRecords) {
      workingDays++;
      totalDuration += r.calculatedDuration;
      final checkIn = DateTime.tryParse(r.checkInTime)?.toLocal();
      if (checkIn != null && (checkIn.hour > 9 || (checkIn.hour == 9 && checkIn.minute > 15))) {
        lateCount++;
      }
    }

    final avgHours = workingDays > 0 ? totalDuration.inHours / workingDays : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.barChart3, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text(
              'THIS MONTH',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
            const Spacer(),
            Text(
              DateFormat('MMMM yyyy').format(now),
              style: TextStyle(color: colors.textSecondary, fontSize: 11),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _buildStatTile(colors, 'DAYS IN', workingDays.toString(), LucideIcons.calendarCheck, AppColors.success),
            const SizedBox(width: 10),
            _buildStatTile(colors, 'AVG HOURS', '${avgHours.toStringAsFixed(1)}h', LucideIcons.timer, colors.honey),
            const SizedBox(width: 10),
            _buildStatTile(colors, 'LATE IN', lateCount.toString(), LucideIcons.alarmClock, AppColors.warning),
          ],
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
  }

  Widget _buildStatTile(ThemeColors colors, String label, String value, IconData icon, Color accentColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
          boxShadow: [BoxShadow(color: accentColor.withValues(alpha: 0.05), blurRadius: 12)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: accentColor, size: 18),
            const SizedBox(height: 12),
            Text(value,
                style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    color: colors.textSecondary,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  // ─── History List ────────────────────────────────────────────────────────────
  Widget _buildHistoryList(ThemeColors colors, List<AttendanceRecord> records) {
    if (records.isEmpty) {
      return _buildEmptyState(colors);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.history, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text(
              'ATTENDANCE HISTORY',
              style: TextStyle(
                color: colors.textPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
            const Spacer(),
            Text(
              '${records.length} RECORDS',
              style: TextStyle(color: colors.textSecondary, fontSize: 10),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...records.take(20).toList().asMap().entries.map((entry) {
          final i = entry.key;
          final record = entry.value;
          return _buildHistoryTile(colors, record, i);
        }),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 300.ms);
  }

  Widget _buildHistoryTile(ThemeColors colors, AttendanceRecord record, int index) {
    final checkIn = DateTime.tryParse(record.checkInTime)?.toLocal();
    final checkOut = record.checkOutTime != null
        ? DateTime.tryParse(record.checkOutTime!)?.toLocal()
        : null;
    final isClosed = record.attendanceState == 'closed';

    Color workModeColor;
    switch (record.workMode) {
      case 'field':
        workModeColor = AppColors.warning;
        break;
      case 'remote':
        workModeColor = AppColors.info;
        break;
      default:
        workModeColor = AppColors.success;
    }

    return GestureDetector(
      onTap: () => _showTimelineSheet(context, colors, record),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            // Work mode indicator
            Container(
              width: 4,
              height: 48,
              decoration: BoxDecoration(
                color: workModeColor,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            const SizedBox(width: 14),
            // Date
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  checkIn != null ? DateFormat('dd').format(checkIn) : '--',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w900),
                ),
                Text(
                  checkIn != null ? DateFormat('MMM').format(checkIn) : '--',
                  style: TextStyle(
                      color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(width: 16),
            // Times
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.logIn, color: AppColors.success, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        checkIn != null ? DateFormat('hh:mm a').format(checkIn) : '--:--',
                        style: TextStyle(color: colors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getStatusColor(record.status, colors).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: _getStatusColor(record.status, colors).withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          _getStatusLabel(record.status),
                          style: TextStyle(
                            color: _getStatusColor(record.status, colors),
                            fontSize: 7,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(LucideIcons.logOut, color: AppColors.error, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        checkOut != null ? DateFormat('hh:mm a').format(checkOut) : (isClosed ? 'Auto Closed' : '--:-- '),
                        style: TextStyle(
                          color: isClosed && record.closeReason == 'Forgotten Checkout' 
                              ? _getStatusColor(AttendanceStatus.autoClosed, colors) 
                              : colors.textSecondary, 
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: workModeColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          record.workMode.toUpperCase(),
                          style: TextStyle(color: workModeColor, fontSize: 8, fontWeight: FontWeight.w900),
                        ),
                      ),
                      if (record.closeReason != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: colors.border,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            record.closeReason!.toUpperCase(),
                            style: TextStyle(color: colors.textSecondary, fontSize: 7),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            // Duration
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  record.formattedDuration,
                  style: TextStyle(
                      color: colors.honey, fontSize: 16, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                Icon(LucideIcons.chevronRight, color: colors.textSecondary, size: 14),
              ],
            ),
          ],
        ),
      ).animate(delay: (index * 50).ms).fadeIn(duration: 300.ms).slideX(begin: 0.05),
    );
  }

  void _showTimelineSheet(BuildContext context, ThemeColors colors, AttendanceRecord record) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.backgroundSecondary,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollCtrl) => _buildTimelineContent(ctx, colors, record, scrollCtrl),
      ),
    );
  }

  Widget _buildTimelineContent(BuildContext context, ThemeColors colors, AttendanceRecord record, ScrollController scrollCtrl) {
    final eventsAsync = ref.watch(activeSessionTimelineProvider(record.id));
    final profile = ref.watch(currentUserProfileProvider).value;
    final role = (profile?['role']?.toString() ?? 'member').toLowerCase().trim();
    final isAdmin = role == 'admin' || role == 'manager' || role == 'owner';

    bool isEditable = false;
    bool isExpired = false;
    if (record.attendanceState == 'closed') {
      isEditable = true;
      final checkInDate = DateTime.tryParse(record.checkInTime)?.toLocal();
      if (checkInDate != null) {
        final age = DateTime.now().difference(checkInDate);
        if (age.inDays >= 3 && !isAdmin) {
          isExpired = true;
        }
      }
    }

    return Column(
      children: [
        const SizedBox(height: 12),
        Center(
          child: Container(
            width: 36, height: 4,
            decoration: BoxDecoration(
              color: colors.border, borderRadius: BorderRadius.circular(100),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Icon(LucideIcons.activity, color: colors.honey, size: 20),
              const SizedBox(width: 10),
              Text('TIMELINE', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
              const Spacer(),
              Text(record.formattedDuration,
                  style: TextStyle(color: colors.honey, fontWeight: FontWeight.w900, fontSize: 16)),
            ],
          ),
        ),
        Expanded(
          child: eventsAsync.when(
            data: (events) => events.isEmpty
                ? Center(child: Text('No timeline events', style: TextStyle(color: colors.textSecondary)))
                : ListView.builder(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: events.length,
                    itemBuilder: (_, i) => _buildTimelineItem(colors, events[i], i == events.length - 1),
                  ),
            loading: () => const MhLoading(size: 80),
            error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
          ),
        ),
        if (isEditable) ...[
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                if (isExpired) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.alertTriangle, color: AppColors.warning, size: 16),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Checkout editing is locked (records > 3 days old). Contact an administrator to modify.',
                            style: TextStyle(color: colors.textPrimary, fontSize: 10),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: colors.border.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: colors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.lock, color: colors.textSecondary, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'EDIT CHECKOUT LOCKED',
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  GestureDetector(
                    onTap: () => _editCheckoutTime(context, colors, record),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: colors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.edit3, color: colors.honey, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'EDIT CHECKOUT TIME',
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }

  Future<void> _editCheckoutTime(BuildContext context, ThemeColors colors, AttendanceRecord record) async {
    final checkInDateTime = DateTime.tryParse(record.checkInTime)?.toLocal();
    if (checkInDateTime == null) return;

    final initialCheckout = record.checkOutTime != null
        ? DateTime.tryParse(record.checkOutTime!)?.toLocal() ?? DateTime.now()
        : DateTime.now();

    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: initialCheckout.isBefore(checkInDateTime) ? checkInDateTime : initialCheckout,
      firstDate: checkInDateTime.subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: ColorScheme.dark(
            primary: colors.honey,
            onPrimary: colors.backgroundPrimary,
            surface: colors.backgroundSecondary,
            onSurface: colors.textPrimary,
          ),
        ),
        child: child!,
      ),
    );

    if (pickedDate == null) return;

    if (!context.mounted) return;

    final TimeOfDay? pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialCheckout),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: ColorScheme.dark(
            primary: colors.honey,
            onPrimary: colors.backgroundPrimary,
            surface: colors.backgroundSecondary,
            onSurface: colors.textPrimary,
          ),
        ),
        child: child!,
      ),
    );

    if (pickedTime == null) return;

    final newCheckoutDateTime = DateTime(
      pickedDate.year,
      pickedDate.month,
      pickedDate.day,
      pickedTime.hour,
      pickedTime.minute,
    );

    if (newCheckoutDateTime.isBefore(checkInDateTime)) {
      if (!context.mounted) return;
      SnackbarService.show(text: 'Checkout time cannot be before check-in time (${DateFormat('hh:mm a').format(checkInDateTime)})');
      return;
    }

    if (newCheckoutDateTime.isAfter(DateTime.now())) {
      if (!context.mounted) return;
      SnackbarService.show(text: 'Checkout time cannot be in the future');
      return;
    }

    // Show loading spinner dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator(color: AppColors.honey)),
    );

    try {
      await ref.read(attendanceRepositoryProvider).updateCheckoutTime(
        attendanceId: record.id,
        userId: record.userId,
        newCheckOutTime: newCheckoutDateTime,
      );

      if (!context.mounted) return;
      Navigator.of(context).pop(); // dismiss loader
      Navigator.of(context).pop(); // close timeline sheet

      ref.invalidate(personalAttendanceHistoryProvider);
      ref.invalidate(activeSessionTimelineProvider(record.id));
      SnackbarService.show(text: 'Checkout time updated successfully');
    } catch (e) {
      if (!context.mounted) return;
      Navigator.of(context).pop(); // dismiss loader
      SnackbarService.show(text: 'Failed to update checkout time: $e');
    }
  }

  Widget _buildTimelineItem(ThemeColors colors, AttendanceEvent event, bool isLast) {
    IconData icon;
    Color iconColor;
    switch (event.eventType) {
      case 'check_in':
        icon = LucideIcons.logIn;
        iconColor = AppColors.success;
        break;
      case 'check_out':
        icon = LucideIcons.logOut;
        iconColor = AppColors.error;
        break;
      case 'work_mode_change':
        icon = LucideIcons.briefcase;
        iconColor = AppColors.warning;
        break;
      case 'gps_verification_failed':
        icon = LucideIcons.mapPinOff;
        iconColor = AppColors.error;
        break;
      case 'biometric_failed':
        icon = LucideIcons.fingerprint;
        iconColor = AppColors.error;
        break;
      case 'attendance_override':
        icon = LucideIcons.shieldCheck;
        iconColor = AppColors.info;
        break;
      default:
        icon = LucideIcons.activity;
        iconColor = colors.honey;
    }

    final time = DateTime.tryParse(event.eventTime)?.toLocal();

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: iconColor.withValues(alpha: 0.3)),
                ),
                child: Icon(icon, color: iconColor, size: 14),
              ),
              if (!isLast)
                Expanded(
                  child: Container(width: 1, color: colors.border),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 6),
                  Text(
                    event.eventType.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                        color: colors.textPrimary,
                        fontSize: 11,
                        fontWeight: FontWeight.w900),
                  ),
                  if (event.notes != null) ...[
                    const SizedBox(height: 2),
                    Text(event.notes!, style: TextStyle(color: colors.textSecondary, fontSize: 11)),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    time != null ? DateFormat('hh:mm:ss a').format(time) : '--',
                    style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5), fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(LucideIcons.calendarOff, color: colors.textSecondary, size: 48),
            const SizedBox(height: 16),
            Text(
              'No attendance records yet',
              style: TextStyle(color: colors.textSecondary, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard(ThemeColors colors, String error) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 18),
          const SizedBox(width: 12),
          Expanded(child: Text(error, style: const TextStyle(color: AppColors.error, fontSize: 12))),
        ],
      ),
    );
  }
}
