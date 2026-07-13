import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';

class MissedCheckinRequestSheet extends ConsumerStatefulWidget {
  const MissedCheckinRequestSheet({super.key});

  @override
  ConsumerState<MissedCheckinRequestSheet> createState() => _MissedCheckinRequestSheetState();
}

class _MissedCheckinRequestSheetState extends ConsumerState<MissedCheckinRequestSheet> {
  DateTime _selectedDateTime = DateTime.now();
  final _reasonController = TextEditingController();
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDateTime,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
    );
    if (date == null) return;

    if (!mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_selectedDateTime),
    );
    if (time == null) return;

    setState(() {
      _selectedDateTime = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _submit() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      setState(() => _errorMessage = 'Please provide a reason.');
      return;
    }

    if (_selectedDateTime.isAfter(DateTime.now())) {
      setState(() => _errorMessage = 'Check-in time cannot be in the future.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final profileAsync = ref.read(currentUserProfileProvider);
      final profile = profileAsync.value;
      if (profile == null) {
        throw Exception('User profile not loaded.');
      }
      final userId = profile['id'] as String;
      final userName = profile['full_name'] as String;

      await ref.read(attendanceRepositoryProvider).submitAttendanceRequest(
        userId: userId,
        userName: userName,
        requestType: 'missed_checkin',
        requestedTime: _selectedDateTime,
        reason: reason,
      );

      ref.invalidate(attendanceRequestsProvider);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Missed Check-In Request submitted successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() => _errorMessage = 'Submission failed: $e');
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
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
            'REPORT MISSED CHECK-IN',
            style: AppTypography.h3.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            'Request retroactive check-in from your administrator',
            style: TextStyle(color: colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),

          // Date Time Selection Card
          InkWell(
            onTap: _pickDateTime,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: colors.border),
              ),
              child: Row(
                children: [
                  Icon(LucideIcons.calendar, color: colors.honey, size: 20),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DESIRED CHECK-IN TIME',
                          style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateFormat('EEEE, MMM dd, yyyy - hh:mm a').format(_selectedDateTime),
                          style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Icon(LucideIcons.chevronDown, color: colors.textSecondary, size: 16),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Reason text input
          TextField(
            controller: _reasonController,
            maxLines: 3,
            style: TextStyle(color: colors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Reason / Explanation',
              labelStyle: TextStyle(color: colors.textSecondary, fontSize: 12),
              alignLabelWithHint: true,
              filled: true,
              fillColor: colors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: colors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: colors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: colors.honey),
              ),
            ),
          ),

          if (_errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(_errorMessage!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
          ],

          const SizedBox(height: 24),

          // Submit Button
          GestureDetector(
            onTap: _submitting ? null : _submit,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: _submitting
                    ? const MhLoading(size: 20)
                    : Text(
                        'SUBMIT REQUEST',
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
    );
  }
}
