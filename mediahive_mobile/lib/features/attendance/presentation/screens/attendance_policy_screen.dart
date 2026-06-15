import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/theme_provider.dart';
import '../../../../shared/widgets/mh_loading.dart';
import '../../domain/models/attendance_policy.dart';
import '../providers/attendance_provider.dart';

class AttendancePolicyScreen extends ConsumerStatefulWidget {
  const AttendancePolicyScreen({super.key});

  @override
  ConsumerState<AttendancePolicyScreen> createState() => _AttendancePolicyScreenState();
}

class _AttendancePolicyScreenState extends ConsumerState<AttendancePolicyScreen> {
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = true;
  bool _isSaving = false;

  // Form fields
  late TimeOfDay _startTime;
  late TimeOfDay _endTime;
  late double _gracePeriod;
  late TimeOfDay _autoCloseTime;
  late bool _overtimeEnabled;
  late bool _checkoutReminderEnabled;
  late double _scanCooldown;
  late TimeOfDay _lunchStartTime;
  late TimeOfDay _lunchEndTime;

  @override
  void initState() {
    super.initState();
    _loadPolicyData();
  }

  Future<void> _loadPolicyData() async {
    try {
      final policy = await ref.read(attendanceRepositoryProvider).getAttendancePolicy();
      setState(() {
        _startTime = _parseTimeOfDay(policy.startTimeStr) ?? const TimeOfDay(hour: 9, minute: 0);
        _endTime = _parseTimeOfDay(policy.endTimeStr) ?? const TimeOfDay(hour: 17, minute: 0);
        _gracePeriod = policy.gracePeriod.toDouble();
        _autoCloseTime = _parseTimeOfDay(policy.autoCloseTimeStr) ?? const TimeOfDay(hour: 23, minute: 59);
        _overtimeEnabled = policy.overtimeEnabled;
        _checkoutReminderEnabled = policy.checkoutReminderEnabled;
        _scanCooldown = policy.scanCooldownSeconds.toDouble();
        _lunchStartTime = _parseTimeOfDay(policy.lunchStartTimeStr) ?? const TimeOfDay(hour: 13, minute: 0);
        _lunchEndTime = _parseTimeOfDay(policy.lunchEndTimeStr) ?? const TimeOfDay(hour: 14, minute: 0);
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        _showSnack('Failed to load policy: $e');
        setState(() => _isLoading = false);
      }
    }
  }

  TimeOfDay? _parseTimeOfDay(String str) {
    str = str.trim().toUpperCase();
    try {
      if (str.contains('AM') || str.contains('PM')) {
        final isPm = str.contains('PM');
        final clean = str.replaceAll('AM', '').replaceAll('PM', '').trim();
        final parts = clean.split(':');
        int h = int.parse(parts[0]);
        final m = int.parse(parts[1]);
        if (isPm && h < 12) h += 12;
        if (!isPm && h == 12) h = 0;
        return TimeOfDay(hour: h, minute: m);
      } else {
        final parts = str.split(':');
        return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
      }
    } catch (_) {
      return null;
    }
  }

  String _formatTimeOfDay(TimeOfDay tod) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, tod.hour, tod.minute);
    return DateFormat('hh:mm a').format(dt);
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final colors = ref.read(themeColorsProvider);
    final initialTime = isStart 
        ? _startTime 
        : (isStart ? _startTime : (isStart == false && isStart != true ? _endTime : _autoCloseTime)); // placeholder
    
    TimeOfDay initialVal = _startTime;
    if (!isStart) initialVal = _endTime;
    
    final picked = await showTimePicker(
      context: context,
      initialTime: initialVal,
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

    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  Future<void> _selectLunchTime(BuildContext context, bool isStart) async {
    final colors = ref.read(themeColorsProvider);
    final initialVal = isStart ? _lunchStartTime : _lunchEndTime;
    
    final picked = await showTimePicker(
      context: context,
      initialTime: initialVal,
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

    if (picked != null) {
      setState(() {
        if (isStart) {
          _lunchStartTime = picked;
        } else {
          _lunchEndTime = picked;
        }
      });
    }
  }

  Future<void> _selectAutoCloseTime(BuildContext context) async {
    final colors = ref.read(themeColorsProvider);
    final picked = await showTimePicker(
      context: context,
      initialTime: _autoCloseTime,
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

    if (picked != null) {
      setState(() => _autoCloseTime = picked);
    }
  }

  Future<void> _savePolicy() async {
    if (!_formKey.currentState!.validate()) return;

    double toDouble(TimeOfDay myTime) => myTime.hour + myTime.minute / 60.0;
    
    final startVal = toDouble(_startTime);
    final endVal = toDouble(_endTime);
    final lunchStartVal = toDouble(_lunchStartTime);
    final lunchEndVal = toDouble(_lunchEndTime);
    
    if (lunchStartVal <= startVal || lunchStartVal >= endVal) {
      _showSnack('Lunch Start Time must be within Office Hours');
      return;
    }
    if (lunchEndVal <= startVal || lunchEndVal >= endVal) {
      _showSnack('Lunch End Time must be within Office Hours');
      return;
    }
    if (lunchEndVal <= lunchStartVal) {
      _showSnack('Lunch End Time must be after Lunch Start Time');
      return;
    }

    setState(() => _isSaving = true);
    try {
      final policy = AttendancePolicy(
        startTimeStr: _formatTimeOfDay(_startTime),
        endTimeStr: _formatTimeOfDay(_endTime),
        gracePeriod: _gracePeriod.toInt(),
        autoCloseTimeStr: _formatTimeOfDay(_autoCloseTime),
        overtimeEnabled: _overtimeEnabled,
        checkoutReminderEnabled: _checkoutReminderEnabled,
        scanCooldownSeconds: _scanCooldown.toInt(),
        lunchStartTimeStr: _formatTimeOfDay(_lunchStartTime),
        lunchEndTimeStr: _formatTimeOfDay(_lunchEndTime),
      );

      await ref.read(attendanceRepositoryProvider).updateAttendancePolicy(policy);
      ref.invalidate(attendancePolicyProvider);
      
      if (mounted) {
        _showSnack('Attendance policy updated successfully', isSuccess: true);
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        _showSnack('Failed to save policy: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  void _showSnack(String msg, {bool isSuccess = false}) {
    final colors = ref.read(themeColorsProvider);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontSize: 12)),
        backgroundColor: isSuccess ? AppColors.success : AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

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
        child: _isLoading 
            ? const Center(child: MhLoading(size: 100))
            : CustomScrollView(
                physics: const ElasticScrollPhysics(),
                slivers: [
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(20, 100 + MediaQuery.of(context).padding.top, 20, 100),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildHeader(context, colors),
                        const SizedBox(height: 24),
                        Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildOfficeHoursCard(colors),
                              const SizedBox(height: 20),
                              _buildLunchHoursCard(colors),
                              const SizedBox(height: 20),
                              _buildTimingRulesCard(colors),
                              const SizedBox(height: 20),
                              _buildAdvancedPolicyCard(colors),
                              const SizedBox(height: 32),
                              _buildSaveButton(colors),
                            ],
                          ),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  // ─── Header ────────────────────────────────────────────────────────────────
  Widget _buildHeader(BuildContext context, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('ATTENDANCE POLICIES', style: AppTypography.h1.copyWith(color: colors.textPrimary)),
              const SizedBox(height: 4),
              Text(
                'OFFICE HOURS, OVERTIME & REMINDERS',
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
            child: Icon(LucideIcons.shieldAlert, color: colors.honey, size: 20),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1);
  }

  // ─── Office Hours Card ─────────────────────────────────────────────────────
  Widget _buildLunchHoursCard(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.utensils, color: colors.honey, size: 18),
              const SizedBox(width: 8),
              Text('LUNCH BREAK HOURS', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => _selectLunchTime(context, true),
                  child: _buildTimeSelectorTile(
                    colors,
                    'LUNCH START',
                    _formatTimeOfDay(_lunchStartTime),
                    LucideIcons.coffee,
                    AppColors.info,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: GestureDetector(
                  onTap: () => _selectLunchTime(context, false),
                  child: _buildTimeSelectorTile(
                    colors,
                    'LUNCH END',
                    _formatTimeOfDay(_lunchEndTime),
                    LucideIcons.logIn,
                    AppColors.success,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 120.ms);
  }

  Widget _buildOfficeHoursCard(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.clock, color: colors.honey, size: 18),
              const SizedBox(width: 8),
              Text('OFFICE HOURS', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => _selectTime(context, true),
                  child: _buildTimeSelectorTile(
                    colors,
                    'START TIME',
                    _formatTimeOfDay(_startTime),
                    LucideIcons.logIn,
                    AppColors.success,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: GestureDetector(
                  onTap: () => _selectTime(context, false),
                  child: _buildTimeSelectorTile(
                    colors,
                    'END TIME',
                    _formatTimeOfDay(_endTime),
                    LucideIcons.logOut,
                    AppColors.error,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 100.ms);
  }

  Widget _buildTimeSelectorTile(
    ThemeColors colors,
    String label,
    String value,
    IconData icon,
    Color accent,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.backgroundPrimary.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: accent, size: 14),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.w900),
          ),
        ],
      ),
    );
  }

  // ─── Timing Rules Card ─────────────────────────────────────────────────────
  Widget _buildTimingRulesCard(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.sliders, color: colors.honey, size: 18),
              const SizedBox(width: 8),
              Text('TIMING RULES', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 20),
          // Grace Period Slider
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('GRACE PERIOD', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                  Text('Minutes allowed after start time', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: colors.honey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${_gracePeriod.toInt()} min',
                  style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
            ],
          ),
          Slider(
            value: _gracePeriod,
            min: 0,
            max: 60,
            divisions: 12,
            activeColor: colors.honey,
            inactiveColor: colors.border,
            onChanged: (v) => setState(() => _gracePeriod = v),
          ),
          const Divider(height: 32),
          // Auto Close Time picker
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('AUTO CLOSE TIME', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                  Text('Force checkout for active sessions', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                ],
              ),
              GestureDetector(
                onTap: () => _selectAutoCloseTime(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: colors.backgroundPrimary.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: colors.border),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.alarmClock, color: colors.honey, size: 14),
                      const SizedBox(width: 8),
                      Text(
                        _formatTimeOfDay(_autoCloseTime),
                        style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          // Duplicate Scan Cooldown Slider
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SCAN COOLDOWN', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                  Text('Seconds to ignore duplicate scans (10-120s)', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: colors.honey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${_scanCooldown.toInt()} sec',
                  style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
            ],
          ),
          Slider(
            value: _scanCooldown,
            min: 10,
            max: 120,
            divisions: 22,
            activeColor: colors.honey,
            inactiveColor: colors.border,
            onChanged: (v) => setState(() => _scanCooldown = v),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 150.ms);
  }

  // ─── Advanced Policy Card ──────────────────────────────────────────────────
  Widget _buildAdvancedPolicyCard(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.toggleRight, color: colors.honey, size: 18),
              const SizedBox(width: 8),
              Text('ADVANCED POLICIES', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 20),
          // Overtime Enabled Switch
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(LucideIcons.trendingUp, color: AppColors.info, size: 16),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('OVERTIME TRACKING', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                    Text('Calculate work hours in excess of workday duration', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                  ],
                ),
              ),
              Switch(
                value: _overtimeEnabled,
                activeColor: colors.honey,
                onChanged: (v) => setState(() => _overtimeEnabled = v),
              ),
            ],
          ),
          const Divider(height: 32),
          // Forgotten Checkout Reminder Switch
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(LucideIcons.bellRing, color: AppColors.warning, size: 16),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('CHECKOUT REMINDERS', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                    Text('Notify user when they leave the office geofence', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                  ],
                ),
              ),
              Switch(
                value: _checkoutReminderEnabled,
                activeColor: colors.honey,
                onChanged: (v) => setState(() => _checkoutReminderEnabled = v),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
  }

  // ─── Save Button ───────────────────────────────────────────────────────────
  Widget _buildSaveButton(ThemeColors colors) {
    return GestureDetector(
      onTap: _isSaving ? null : _savePolicy,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: _isSaving ? [] : [
            BoxShadow(
              color: colors.honey.withValues(alpha: 0.25),
              blurRadius: 16,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_isSaving)
              SizedBox(
                width: 16, height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: colors.backgroundPrimary),
              )
            else
              Icon(LucideIcons.save, color: colors.backgroundPrimary, size: 16),
            const SizedBox(width: 10),
            Text(
              _isSaving ? 'SAVING POLICIES...' : 'SAVE ATTENDANCE POLICIES',
              style: TextStyle(
                color: colors.backgroundPrimary,
                fontWeight: FontWeight.w900,
                fontSize: 13,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 250.ms);
  }
}
