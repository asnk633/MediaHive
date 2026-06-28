import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';

class AttendanceActionPanel extends StatelessWidget {
  final bool isCheckedIn;
  final bool isScanning;
  final bool hasCheckInPermission;
  final String? workMode;
  final String? sessionId;
  final String? assignmentId;
  final NfcScanState scanState;
  final VoidCallback? onNfcTap;
  final VoidCallback? onQrTap;
  final VoidCallback? onQuickCheckoutTap;
  final VoidCallback? onRemoteCheckoutTap;
  final VoidCallback? onMissedCheckinTap;

  const AttendanceActionPanel({
    super.key,
    required this.isCheckedIn,
    required this.isScanning,
    required this.hasCheckInPermission,
    this.workMode,
    this.sessionId,
    this.assignmentId,
    required this.scanState,
    this.onNfcTap,
    this.onQrTap,
    this.onQuickCheckoutTap,
    this.onRemoteCheckoutTap,
    this.onMissedCheckinTap,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: colors.border),
          boxShadow: colors.cardShadow,
        ),
        child: Column(
          children: [
            if (!hasCheckInPermission && !isCheckedIn) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colors.honey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: colors.honey.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.info, color: colors.honey, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Attendance logging is restricted to Team members and Media & IT department Managers.',
                        style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: 12,
                            height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              _buildNfcButton(colors),
              const SizedBox(height: 12),
              _buildQrButton(colors),
            ],
            if (isCheckedIn) ...[
              const SizedBox(height: 12),
              _buildQuickCheckoutButton(colors),
            ],
            if (isCheckedIn && workMode == 'field') ...[
              const SizedBox(height: 12),
              _buildRemoteCheckoutButton(colors),
            ] else if (!isCheckedIn) ...[
              const SizedBox(height: 12),
              _buildMissedCheckinButton(colors),
            ],
            if (scanState.message != null) ...[
              const SizedBox(height: 12),
              _buildScanStatus(colors),
            ],
          ],
        ),
      );
    });
  }

  Widget _buildNfcButton(ThemeColors colors) {
    return GestureDetector(
      onTap: isScanning ? null : onNfcTap,
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
              : (colors.isDark
                  ? AppColors.primaryGradient
                  : AppColors.lightPrimaryGradient),
          borderRadius: BorderRadius.circular(18),
          boxShadow: isCheckedIn
              ? [
                  BoxShadow(
                    color: Colors.red.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  )
                ]
              : [],
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
                  : (isCheckedIn
                      ? 'TAP NFC TO CHECK OUT'
                      : 'TAP NFC TO CHECK IN'),
              style: TextStyle(
                color: isCheckedIn ? Colors.white : colors.backgroundPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQrButton(ThemeColors colors) {
    return GestureDetector(
      onTap: isScanning ? null : onQrTap,
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
              color: (isCheckedIn ? Colors.blue : Colors.purple)
                  .withValues(alpha: 0.2),
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
                  : (isCheckedIn
                      ? 'SCAN QR TO CHECK OUT'
                      : 'SCAN QR TO CHECK IN'),
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
    );
  }

  Widget _buildQuickCheckoutButton(ThemeColors colors) {
    return GestureDetector(
      onTap: isScanning ? null : onQuickCheckoutTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(
            color: AppColors.warning.withValues(alpha: 0.5),
            width: 1.5,
          ),
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
    );
  }

  Widget _buildRemoteCheckoutButton(ThemeColors colors) {
    return GestureDetector(
      onTap: onRemoteCheckoutTap,
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
    );
  }

  Widget _buildMissedCheckinButton(ThemeColors colors) {
    return GestureDetector(
      onTap: onMissedCheckinTap,
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
            Icon(LucideIcons.calendar,
                color: colors.textSecondary, size: 14),
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
    );
  }

  Widget _buildScanStatus(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.3);
  }
}
