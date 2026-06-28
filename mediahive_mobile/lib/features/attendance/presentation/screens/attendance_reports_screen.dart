import 'dart:io';
import 'package:excel/excel.dart' as xl;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme/elastic_scroll_physics.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/shared/widgets/mh_refresh_indicator.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_record.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/attendance_policy.dart';
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';

class AttendanceReportsScreen extends ConsumerStatefulWidget {
  const AttendanceReportsScreen({super.key});

  @override
  ConsumerState<AttendanceReportsScreen> createState() =>
      _AttendanceReportsScreenState();
}

class _AttendanceReportsScreenState
    extends ConsumerState<AttendanceReportsScreen> {
  DateTimeRange? _dateRange;
  String _selectedState = '';
  String _selectedWorkMode = '';
  String _selectedCampus = '';
  String _selectedHoliday = '';
  bool _isExporting = false;

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final reportsAsync = ref.watch(_filteredReportsProvider((
      startDate: _dateRange?.start,
      endDate: _dateRange?.end,
      attendanceState: _selectedState,
    )));

    final reports = reportsAsync.value ?? const [];
    final campuses = reports
        .map((r) => r['campusName'] as String?)
        .where((name) => name != null && name.isNotEmpty)
        .cast<String>()
        .toSet()
        .toList();

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
            ref.invalidate(_filteredReportsProvider((
              startDate: _dateRange?.start,
              endDate: _dateRange?.end,
              attendanceState: _selectedState,
            )));
            await Future.delayed(const Duration(milliseconds: 600));
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: ElasticScrollPhysics()),
            slivers: [
              SliverPadding(
                padding: EdgeInsets.fromLTRB(
                    20, 100 + MediaQuery.of(context).padding.top, 20, 80),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildHeader(context, colors),
                    const SizedBox(height: 24),
                    _buildFilters(context, colors, campuses),
                    const SizedBox(height: 24),
                    reportsAsync.when(
                      data: (reportsList) {
                        final filtered = reportsList.where((r) {
                          if (_selectedWorkMode.isNotEmpty && r['workMode'] != _selectedWorkMode) {
                            return false;
                          }
                          if (_selectedCampus.isNotEmpty && r['campusName'] != _selectedCampus) {
                            return false;
                          }
                          if (_selectedHoliday.isNotEmpty) {
                            final isHol = r['isHoliday'] == true;
                            if (_selectedHoliday == 'holiday' && !isHol) return false;
                            if (_selectedHoliday == 'regular' && isHol) return false;
                          }
                          return true;
                        }).toList();

                        return Column(
                          children: [
                            _buildSummaryMetrics(colors, filtered),
                            const SizedBox(height: 24),
                            _buildExportActions(context, colors, filtered),
                            const SizedBox(height: 24),
                            _buildReportsList(context, colors, filtered),
                          ],
                        );
                      },
                      loading: () => const MhLoading(size: 100),
                      error: (e, _) => _buildErrorCard(colors, e.toString()),
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

  // ─── Filtered Reports Provider ────────────────────────────────────────────
  static final _filteredReportsProvider = FutureProvider.autoDispose
      .family<List<Map<String, dynamic>>, ({DateTime? startDate, DateTime? endDate, String attendanceState})>(
          (ref, params) async {
    final repo = ref.watch(attendanceRepositoryProvider);
    return repo.getAttendanceReports(
      startDate: params.startDate?.toIso8601String(),
      endDate: params.endDate?.toIso8601String(),
      attendanceState: params.attendanceState.isEmpty ? null : params.attendanceState,
    );
  });

  // ─── Header ────────────────────────────────────────────────────────────────
  Widget _buildHeader(BuildContext context, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('REPORTS', style: AppTypography.h1.copyWith(color: colors.textPrimary)),
              const SizedBox(height: 4),
              Text(
                'ATTENDANCE ANALYTICS & EXPORTS',
                style: AppTypography.caption.copyWith(color: colors.textSecondary, letterSpacing: 1),
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
            child: Icon(LucideIcons.fileSpreadsheet, color: colors.honey, size: 20),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1);
  }

  // ─── Filter Controls ────────────────────────────────────────────────────────
  Widget _buildFilters(BuildContext context, ThemeColors colors, List<String> campuses) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.slidersHorizontal, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text('FILTERS', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 12),
        // Quick interval buttons
        Row(
          children: [
            _buildIntervalChip(colors, 'DAILY', () {
              final now = DateTime.now();
              setState(() => _dateRange = DateTimeRange(
                start: DateTime(now.year, now.month, now.day),
                end: DateTime(now.year, now.month, now.day, 23, 59, 59),
              ));
            }),
            const SizedBox(width: 8),
            _buildIntervalChip(colors, 'WEEKLY', () {
              final now = DateTime.now();
              final start = now.subtract(Duration(days: now.weekday - 1));
              setState(() => _dateRange = DateTimeRange(
                start: DateTime(start.year, start.month, start.day),
                end: DateTime(now.year, now.month, now.day, 23, 59, 59),
              ));
            }),
            const SizedBox(width: 8),
            _buildIntervalChip(colors, 'MONTHLY', () {
              final now = DateTime.now();
              setState(() => _dateRange = DateTimeRange(
                start: DateTime(now.year, now.month, 1),
                end: DateTime(now.year, now.month, now.day, 23, 59, 59),
              ));
            }),
          ],
        ),
        const SizedBox(height: 12),
        // Date range picker
        GestureDetector(
          onTap: () async {
            final picked = await showDateRangePicker(
              context: context,
              firstDate: DateTime(2024),
              lastDate: DateTime.now(),
              initialDateRange: _dateRange,
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(
                  colorScheme: ColorScheme.dark(
                    primary: colors.honey,
                    onPrimary: colors.backgroundPrimary,
                    surface: colors.backgroundSecondary,
                  ),
                ),
                child: child!,
              ),
            );
            if (picked != null) setState(() => _dateRange = picked);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _dateRange != null ? colors.honey.withValues(alpha: 0.4) : colors.border,
              ),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.calendarRange, color: _dateRange != null ? colors.honey : colors.textSecondary, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _dateRange != null
                        ? '${DateFormat('dd MMM').format(_dateRange!.start)} → ${DateFormat('dd MMM yyyy').format(_dateRange!.end)}'
                        : 'Select custom date range',
                    style: TextStyle(
                      color: _dateRange != null ? colors.textPrimary : colors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (_dateRange != null)
                  GestureDetector(
                    onTap: () => setState(() => _dateRange = null),
                    child: Icon(LucideIcons.x, color: colors.textSecondary, size: 14),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        // State & Work Mode chips
        Row(
          children: [
            _buildFilterChip(colors, 'All Statuses', '', _selectedState, (v) => setState(() => _selectedState = v)),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Active Only', 'active', _selectedState, (v) => setState(() => _selectedState = v)),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Closed Only', 'closed', _selectedState, (v) => setState(() => _selectedState = v)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildFilterChip(colors, 'All Modes', '', _selectedWorkMode, (v) => setState(() => _selectedWorkMode = v)),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Office', 'office', _selectedWorkMode, (v) => setState(() => _selectedWorkMode = v), color: AppColors.success),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Field', 'field', _selectedWorkMode, (v) => setState(() => _selectedWorkMode = v), color: AppColors.warning),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Remote', 'remote', _selectedWorkMode, (v) => setState(() => _selectedWorkMode = v), color: AppColors.info),
          ],
        ),
        const SizedBox(height: 8),
        // Holiday Filter row
        Row(
          children: [
            _buildFilterChip(colors, 'All Days', '', _selectedHoliday, (v) => setState(() => _selectedHoliday = v)),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Holidays Only', 'holiday', _selectedHoliday, (v) => setState(() => _selectedHoliday = v), color: AppColors.honey),
            const SizedBox(width: 8),
            _buildFilterChip(colors, 'Regular Days', 'regular', _selectedHoliday, (v) => setState(() => _selectedHoliday = v)),
          ],
        ),
        // Campus filter chips
        if (campuses.isNotEmpty) ...[
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip(colors, 'All Campuses', '', _selectedCampus, (v) => setState(() => _selectedCampus = v)),
                for (final campus in campuses) ...[
                  const SizedBox(width: 8),
                  _buildFilterChip(colors, campus, campus, _selectedCampus, (v) => setState(() => _selectedCampus = v)),
                ],
              ],
            ),
          ),
        ],
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 100.ms);
  }

  Widget _buildIntervalChip(ThemeColors colors, String label, VoidCallback onTap) {
    final now = DateTime.now();
    bool isSelected = false;
    if (_dateRange != null) {
      if (label == 'DAILY') {
        isSelected = _dateRange!.start.day == now.day && _dateRange!.start.month == now.month && _dateRange!.start.year == now.year;
      } else if (label == 'WEEKLY') {
        final start = now.subtract(Duration(days: now.weekday - 1));
        isSelected = _dateRange!.start.day == start.day && _dateRange!.start.month == start.month && _dateRange!.start.year == start.year && _dateRange!.end.day == now.day;
      } else if (label == 'MONTHLY') {
        isSelected = _dateRange!.start.day == 1 && _dateRange!.start.month == now.month && _dateRange!.start.year == now.year && _dateRange!.end.day == now.day;
      }
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? colors.honey.withValues(alpha: 0.15) : colors.surface,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: isSelected ? colors.honey : colors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? colors.honey : colors.textSecondary,
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    ThemeColors colors,
    String label,
    String value,
    String current,
    ValueChanged<String> onSelect, {
    Color? color,
  }) {
    final isSelected = current == value;
    final chipColor = color ?? colors.honey;
    return GestureDetector(
      onTap: () => onSelect(isSelected ? '' : value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? chipColor.withValues(alpha: 0.15) : colors.surface,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: isSelected ? chipColor.withValues(alpha: 0.5) : colors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? chipColor : colors.textSecondary,
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(AttendanceStatus status, ThemeColors colors) {
    switch (status) {
      case AttendanceStatus.checkedIn: return AppColors.success;
      case AttendanceStatus.onField: return AppColors.warning;
      case AttendanceStatus.remote: return AppColors.info;
      case AttendanceStatus.autoClosed: return colors.isDark ? Colors.white54 : Colors.black87;
      case AttendanceStatus.checkedOut: return AppColors.error;
    }
  }

  String _getStatusLabel(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.checkedIn: return 'ACTIVE';
      case AttendanceStatus.onField: return 'FIELD';
      case AttendanceStatus.remote: return 'REMOTE';
      case AttendanceStatus.autoClosed: return 'SYSTEM CLOSED';
      case AttendanceStatus.checkedOut: return 'COMPLETED';
    }
  }

  Widget _buildSummaryMetrics(ThemeColors colors, List<Map<String, dynamic>> reports) {
    final policy = ref.watch(attendancePolicyProvider).value ?? AttendancePolicy.defaultPolicy();
    final parsedRecords = reports.map((json) => AttendanceRecord.fromJson(json)).toList();

    Duration totalWorked = Duration.zero;
    Duration regularHours = Duration.zero;
    Duration overtimeHours = Duration.zero;

    Duration officeHours = Duration.zero;
    Duration fieldHours = Duration.zero;
    Duration remoteHours = Duration.zero;

    Duration holidayHours = Duration.zero;
    Duration weekendHours = Duration.zero;

    int lateCount = 0;
    int earlyDepartureCount = 0;
    int activeCount = 0;

    for (final r in parsedRecords) {
      totalWorked += r.calculatedDuration;
      regularHours += r.getRegularHours(policy);
      overtimeHours += r.getOvertimeHours(policy);
      holidayHours += r.holidayHours;
      weekendHours += r.weekendHours;

      switch (r.workMode) {
        case 'field': fieldHours += r.calculatedDuration; break;
        case 'remote': remoteHours += r.calculatedDuration; break;
        default: officeHours += r.calculatedDuration;
      }

      if (r.getLateArrivalDuration(policy) > Duration.zero) lateCount++;
      if (r.getEarlyDepartureDuration(policy) > Duration.zero) earlyDepartureCount++;
      if (r.attendanceState == 'active') activeCount++;
    }

    // Attendance percentage calculation (team average per day in range)
    int totalDays = 0;
    if (_dateRange != null) {
      totalDays = _dateRange!.end.difference(_dateRange!.start).inDays + 1;
    } else {
      totalDays = 30; // Default
    }

    final users = parsedRecords.map((r) => r.userId).toSet();
    double attendancePercentage = 0.0;
    if (users.isNotEmpty && totalDays > 0) {
      int totalUserDays = 0;
      for (final u in users) {
        final userRecords = parsedRecords.where((r) => r.userId == u);
        final userUniqueDays = userRecords.map((r) {
          final dt = DateTime.tryParse(r.checkInTime)?.toLocal();
          return dt != null ? '${dt.year}-${dt.month}-${dt.day}' : '';
        }).where((element) => element.isNotEmpty).toSet().length;
        totalUserDays += userUniqueDays;
      }
      attendancePercentage = (totalUserDays / (users.length * totalDays) * 100).clamp(0, 100);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.barChart3, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text('ANALYTICS SUMMARY', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
            const Spacer(),
            Text('${reports.length} RECORDS', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
          ],
        ),
        const SizedBox(height: 12),
        // Row 1: Primary Metrics
        Row(
          children: [
            _buildMetricCard(colors, 'TOTAL HOURS', '${totalWorked.inHours}h', LucideIcons.timer, colors.honey),
            const SizedBox(width: 10),
            _buildMetricCard(colors, 'REGULAR HOURS', '${regularHours.inHours}h', LucideIcons.calendarCheck, AppColors.success),
          ],
        ),
        const SizedBox(height: 10),
        // Row 2: Overtime & Attendance
        Row(
          children: [
            _buildMetricCard(
              colors, 
              'OVERTIME HOURS', 
              '${overtimeHours.inHours}h ${overtimeHours.inMinutes.remainder(60)}m', 
              LucideIcons.trendingUp, 
              colors.honey,
            ),
            const SizedBox(width: 10),
            _buildMetricCard(colors, 'ATTENDANCE %', '${attendancePercentage.toStringAsFixed(1)}%', LucideIcons.percent, const Color(0xFF6366F1)),
          ],
        ),
        const SizedBox(height: 10),
        // Row 3: Late Arrivals & Early Departures
        Row(
          children: [
            _buildMetricCard(colors, 'LATE ARRIVALS', lateCount.toString(), LucideIcons.alarmClock, AppColors.warning),
            const SizedBox(width: 10),
            _buildMetricCard(colors, 'EARLY DEPARTURES', earlyDepartureCount.toString(), LucideIcons.clock9, AppColors.error),
          ],
        ),
        const SizedBox(height: 10),
        // Row 4: Holidays & Weekends Metrics
        Row(
          children: [
            _buildMetricCard(colors, 'HOLIDAY HOURS', '${holidayHours.inHours}h', LucideIcons.palmtree, AppColors.info),
            const SizedBox(width: 10),
            _buildMetricCard(colors, 'WEEKEND HOURS', '${weekendHours.inHours}h', LucideIcons.calendarRange, colors.textSecondary),
          ],
        ),
        const SizedBox(height: 12),
        // Pill row for work modes distribution
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('WORK MODES:', style: TextStyle(color: colors.textSecondary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
              Row(
                children: [
                  _buildModeDistributionPill(colors, 'OFFICE', '${officeHours.inHours}h', AppColors.success),
                  const SizedBox(width: 10),
                  _buildModeDistributionPill(colors, 'FIELD', '${fieldHours.inHours}h', AppColors.warning),
                  const SizedBox(width: 10),
                  _buildModeDistributionPill(colors, 'REMOTE', '${remoteHours.inHours}h', AppColors.info),
                ],
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 150.ms);
  }

  Widget _buildModeDistributionPill(ThemeColors colors, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
          const SizedBox(width: 6),
          Text('$label: ', style: TextStyle(color: colors.textSecondary, fontSize: 8)),
          Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 8, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildMetricCard(ThemeColors colors, String label, String value, IconData icon, Color accentColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
          boxShadow: [BoxShadow(color: accentColor.withValues(alpha: 0.05), blurRadius: 12)],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: accentColor, size: 16),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900)),
                Text(label, style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── Export Actions ─────────────────────────────────────────────────────────
  Widget _buildExportActions(BuildContext context, ThemeColors colors, List<Map<String, dynamic>> reports) {
    return Row(
      children: [
        Expanded(
          child: _buildExportButton(
            context, colors,
            label: 'EXPORT PDF',
            icon: LucideIcons.fileText,
            color: AppColors.error,
            onTap: () => _exportPdf(context, colors, reports),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildExportButton(
            context, colors,
            label: 'EXPORT EXCEL',
            icon: LucideIcons.fileSpreadsheet,
            color: AppColors.success,
            onTap: () => _exportExcel(context, colors, reports),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
  }

  Widget _buildExportButton(
    BuildContext context,
    ThemeColors colors, {
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: _isExporting ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _isExporting
                ? SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: color))
                : Icon(icon, color: color, size: 14),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  // ─── Reports List ────────────────────────────────────────────────────────────
  Widget _buildReportsList(BuildContext context, ThemeColors colors, List<Map<String, dynamic>> reports) {
    if (reports.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            children: [
              Icon(LucideIcons.inbox, color: colors.textSecondary, size: 48),
              const SizedBox(height: 16),
              Text('No records found for selected filters', style: TextStyle(color: colors.textSecondary, fontSize: 14), textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.list, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text('ALL RECORDS', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 12),
        ...reports.take(50).toList().asMap().entries.map((entry) {
          final i = entry.key;
          final record = entry.value;
          return _buildReportTile(colors, record, i);
        }),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 250.ms);
  }

  Widget _buildReportTile(ThemeColors colors, Map<String, dynamic> record, int index) {
    final recordObj = AttendanceRecord.fromJson(record);
    final policy = ref.watch(attendancePolicyProvider).value ?? AttendancePolicy.defaultPolicy();

    final checkIn = DateTime.tryParse(recordObj.checkInTime)?.toLocal();
    final checkOut = recordObj.checkOutTime != null
        ? DateTime.tryParse(recordObj.checkOutTime!)?.toLocal()
        : null;
    final state = recordObj.attendanceState;
    final userName = recordObj.userName;
    final isClosed = state == 'closed';

    // Calculate duration
    final duration = recordObj.formattedDuration;

    // Advanced duration details
    final overtimeDur = recordObj.getOvertimeHours(policy);
    final hasOvertime = overtimeDur > Duration.zero;
    final lateDur = recordObj.getLateArrivalDuration(policy);
    final isLate = lateDur > Duration.zero;

    Color workModeColor;
    switch (recordObj.workMode) {
      case 'field': workModeColor = AppColors.warning; break;
      case 'remote': workModeColor = AppColors.info; break;
      default: workModeColor = AppColors.success;
    }

    final source = recordObj.checkInSource;
    final statusColor = _getStatusColor(recordObj.status, colors);
    final statusLabel = _getStatusLabel(recordObj.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          // Date column
          Column(
            children: [
              Text(
                checkIn != null ? DateFormat('dd').format(checkIn) : '--',
                style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w900),
              ),
              Text(
                checkIn != null ? DateFormat('MMM').format(checkIn) : '--',
                style: TextStyle(color: colors.textSecondary, fontSize: 9, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(width: 14),
          Container(width: 1, height: 54, color: workModeColor.withValues(alpha: 0.4)),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        userName,
                        style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        statusLabel, 
                        style: TextStyle(
                          color: statusColor, 
                          fontSize: 6, 
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      checkIn != null ? DateFormat('hh:mm a').format(checkIn) : '--:--',
                      style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    Text(' → ', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                    Text(
                      checkOut != null ? DateFormat('hh:mm a').format(checkOut) : (isClosed ? 'System' : 'Active'),
                      style: TextStyle(
                        color: isClosed ? AppColors.error : AppColors.success,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
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
                      child: Text(recordObj.workMode.toUpperCase(), style: TextStyle(color: workModeColor, fontSize: 7, fontWeight: FontWeight.w900)),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: colors.border,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(source.toUpperCase(), style: TextStyle(color: colors.textSecondary, fontSize: 7)),
                    ),
                    if (isLate) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Text('LATE IN', style: TextStyle(color: AppColors.warning, fontSize: 7, fontWeight: FontWeight.w900)),
                      ),
                    ],
                    if (hasOvertime) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: colors.honey.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          '+OT: ${overtimeDur.inHours}h', 
                          style: TextStyle(color: colors.honey, fontSize: 7, fontWeight: FontWeight.w900),
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
              Text(duration, style: TextStyle(color: colors.honey, fontSize: 14, fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Container(
                width: 6, height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isClosed ? colors.textSecondary.withValues(alpha: 0.3) : AppColors.success,
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate(delay: (index * 40).ms).fadeIn(duration: 300.ms).slideX(begin: 0.05);
  }

  // ─── PDF Export ─────────────────────────────────────────────────────────────
  Future<void> _exportPdf(BuildContext context, ThemeColors colors, List<Map<String, dynamic>> reports) async {
    setState(() => _isExporting = true);
    try {
      final pdf = pw.Document();
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          header: (ctx) => pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text('MediaHive Attendance Report',
                  style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold)),
              pw.Text('Generated: ${DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now())}',
                  style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey)),
              pw.SizedBox(height: 8),
              pw.Divider(color: PdfColors.grey300),
            ],
          ),
          build: (ctx) => [
            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
              columnWidths: {
                0: const pw.FlexColumnWidth(2),
                1: const pw.FlexColumnWidth(1.5),
                2: const pw.FlexColumnWidth(1.5),
                3: const pw.FlexColumnWidth(1),
                4: const pw.FlexColumnWidth(1),
                5: const pw.FlexColumnWidth(1),
                6: const pw.FlexColumnWidth(1.5),
              },
              children: [
                // Header row
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                  children: [
                    _pdfCell('Name', header: true),
                    _pdfCell('Check In', header: true),
                    _pdfCell('Check Out', header: true),
                    _pdfCell('Duration', header: true),
                    _pdfCell('Mode', header: true),
                    _pdfCell('State', header: true),
                    _pdfCell('Details', header: true),
                  ],
                ),
                // Data rows
                ...reports.map((r) {
                  final checkIn = DateTime.tryParse(r['checkInTime'] as String? ?? '')?.toLocal();
                  final checkOut = r['checkOutTime'] != null
                      ? DateTime.tryParse(r['checkOutTime'] as String)?.toLocal()
                      : null;
                  Duration dur = Duration.zero;
                  if (checkIn != null) dur = (checkOut ?? DateTime.now()).difference(checkIn);
                  final h = dur.inHours;
                  final m = dur.inMinutes.remainder(60);

                  final isHoliday = r['isHoliday'] == true;
                  final isWeekend = r['isWeekend'] == true;
                  final checkInSource = r['checkInSource']?.toString() ?? 'nfc';
                  final checkOutSource = r['checkOutSource']?.toString() ?? 'nfc';
                  final isOverride = checkInSource == 'manual' || checkOutSource == 'manual';
                  final devIn = r['checkInDeviceId']?.toString() ?? '';
                  final devOut = r['checkOutDeviceId']?.toString() ?? '';
                  final deviceChanged = devIn.isNotEmpty && devOut.isNotEmpty && devIn != devOut;

                  final List<String> detailsList = [];
                  if (isHoliday) detailsList.add('Holiday');
                  if (isWeekend) detailsList.add('Weekend');
                  if (isOverride) detailsList.add('Override');
                  if (deviceChanged) detailsList.add('DevChanged');
                  final detailsStr = detailsList.isEmpty ? 'Regular' : detailsList.join(', ');

                  return pw.TableRow(
                    children: [
                      _pdfCell(r['userName']?.toString() ?? 'Unknown'),
                      _pdfCell(checkIn != null ? DateFormat('dd/MM hh:mm a').format(checkIn) : '--'),
                      _pdfCell(checkOut != null ? DateFormat('dd/MM hh:mm a').format(checkOut) : '--'),
                      _pdfCell(h > 0 ? '${h}h ${m}m' : '${m}m'),
                      _pdfCell((r['workMode'] as String? ?? 'office').toUpperCase()),
                      _pdfCell((r['attendanceState'] as String? ?? 'closed').toUpperCase()),
                      _pdfCell(detailsStr),
                    ],
                  );
                }),
              ],
            ),
          ],
        ),
      );

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/mediahive_attendance_${DateTime.now().millisecondsSinceEpoch}.pdf');
      await file.writeAsBytes(await pdf.save());
      await Share.shareXFiles([XFile(file.path)], subject: 'MediaHive Attendance Report');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF export failed: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  pw.Widget _pdfCell(String text, {bool header = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(6),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 9,
          fontWeight: header ? pw.FontWeight.bold : pw.FontWeight.normal,
        ),
      ),
    );
  }

  // ─── Excel Export ────────────────────────────────────────────────────────────
  Future<void> _exportExcel(BuildContext context, ThemeColors colors, List<Map<String, dynamic>> reports) async {
    setState(() => _isExporting = true);
    try {
      final excel = xl.Excel.createExcel();
      final sheet = excel['Attendance Report'];
      excel.setDefaultSheet('Attendance Report');

      // Header
      final headers = [
        'Name',
        'Check In',
        'Check Out',
        'Duration (h)',
        'Work Mode',
        'Source',
        'State',
        'Campus',
        'Holiday',
        'Weekend',
        'Override',
        'Device Status'
      ];
      for (int i = 0; i < headers.length; i++) {
        final cell = sheet.cell(xl.CellIndex.indexByColumnRow(columnIndex: i, rowIndex: 0));
        cell.value = xl.TextCellValue(headers[i]);
        cell.cellStyle = xl.CellStyle(bold: true, backgroundColorHex: xl.ExcelColor.fromHexString('#2C2C2E'), fontColorHex: xl.ExcelColor.fromHexString('#FFFFFF'));
      }

      // Data rows
      for (int rowIdx = 0; rowIdx < reports.length; rowIdx++) {
        final r = reports[rowIdx];
        final checkIn = DateTime.tryParse(r['checkInTime'] as String? ?? '')?.toLocal();
        final checkOut = r['checkOutTime'] != null
            ? DateTime.tryParse(r['checkOutTime'] as String)?.toLocal()
            : null;
        Duration dur = Duration.zero;
        if (checkIn != null) dur = (checkOut ?? DateTime.now()).difference(checkIn);
        final hours = dur.inMinutes / 60.0;

        final isHoliday = r['isHoliday'] == true ? 'Yes' : 'No';
        final isWeekend = r['isWeekend'] == true ? 'Yes' : 'No';
        final checkInSource = r['checkInSource']?.toString() ?? 'nfc';
        final checkOutSource = r['checkOutSource']?.toString() ?? 'nfc';
        final isOverride = (checkInSource == 'manual' || checkOutSource == 'manual') ? 'Yes' : 'No';
        final devIn = r['checkInDeviceId']?.toString() ?? '';
        final devOut = r['checkOutDeviceId']?.toString() ?? '';
        final deviceStatus = (devIn.isNotEmpty && devOut.isNotEmpty && devIn != devOut)
            ? 'Changed ($devIn -> $devOut)'
            : (devIn.isNotEmpty ? 'Same ($devIn)' : '--');

        final rowData = [
          r['userName']?.toString() ?? 'Unknown',
          checkIn != null ? DateFormat('dd/MM/yyyy HH:mm').format(checkIn) : '--',
          checkOut != null ? DateFormat('dd/MM/yyyy HH:mm').format(checkOut) : '--',
          hours.toStringAsFixed(2),
          r['workMode']?.toString() ?? 'office',
          r['checkInSource']?.toString() ?? 'nfc',
          r['attendanceState']?.toString() ?? 'closed',
          r['campusName']?.toString() ?? '--',
          isHoliday,
          isWeekend,
          isOverride,
          deviceStatus,
        ];

        for (int col = 0; col < rowData.length; col++) {
          final cell = sheet.cell(xl.CellIndex.indexByColumnRow(columnIndex: col, rowIndex: rowIdx + 1));
          cell.value = xl.TextCellValue(rowData[col]);
        }
      }

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/mediahive_attendance_${DateTime.now().millisecondsSinceEpoch}.xlsx');
      final bytes = excel.save();
      if (bytes != null) {
        await file.writeAsBytes(bytes);
        await Share.shareXFiles([XFile(file.path)], subject: 'MediaHive Attendance Excel Report');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Excel export failed: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
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
