import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';

class TodayAttendancePanel extends StatelessWidget {
  final String role;
  final bool isCheckedIn;
  final String? checkInTime;
  final String? workMode;
  final String? lastKnownWorkLocation;
  final VoidCallback onTapAttendance;
  final VoidCallback onTapNfc;
  final VoidCallback onTapQr;

  const TodayAttendancePanel({
    super.key,
    required this.role,
    required this.isCheckedIn,
    this.checkInTime,
    this.workMode,
    this.lastKnownWorkLocation,
    required this.onTapAttendance,
    required this.onTapNfc,
    required this.onTapQr,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      final cleanRole = role.replaceAll('userrole.', '').trim().toLowerCase();

      if (cleanRole == 'member') {
        return _buildGuestPanel(colors);
      }

      return _buildActivePanel(colors);
    });
  }

  Widget _buildGuestPanel(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.shieldAlert, color: colors.textSecondary.withValues(alpha: 0.5), size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              'GUEST ACCOUNT \u2022 ATTENDANCE DISABLED',
              style: TextStyle(
                color: colors.textSecondary.withValues(alpha: 0.6),
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivePanel(ThemeColors colors) {
    final statusColor = isCheckedIn ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final statusText = isCheckedIn ? '\u{1F7E2} Checked In' : '\u{1F534} Checked Out';
    final workModeText = isCheckedIn && workMode != null ? ' (${workMode!.toUpperCase()})' : '';
    final isLight = !colors.isDark;

    return GestureDetector(
      onTap: onTapAttendance,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isCheckedIn ? const Color(0xFF10B981).withValues(alpha: 0.3) : colors.border.withValues(alpha: 0.5),
          ),
          boxShadow: isLight ? DesignTokens.spatialCardShadow : [
            BoxShadow(
              color: (isCheckedIn ? const Color(0xFF10B981) : colors.honey).withValues(alpha: 0.05),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        statusText,
                        style: TextStyle(
                          color: isCheckedIn ? const Color(0xFF10B981) : colors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        workModeText,
                        style: TextStyle(
                          color: colors.textSecondary.withValues(alpha: 0.8),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (isCheckedIn && checkInTime != null) ...[
                    Text(
                      'Since $checkInTime',
                      style: TextStyle(
                        color: colors.textSecondary.withValues(alpha: 0.6),
                        fontSize: 11,
                      ),
                    ),
                    if (lastKnownWorkLocation != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Location: $lastKnownWorkLocation',
                        style: TextStyle(
                          color: colors.honey.withValues(alpha: 0.8),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ] else ...[
                    Text(
                      'Ready to log check-in',
                      style: TextStyle(
                        color: colors.textSecondary.withValues(alpha: 0.5),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 16),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildActionButton(
                  colors,
                  icon: LucideIcons.nfc,
                  label: isCheckedIn ? 'CHECK OUT' : 'TAP NFC',
                  gradient: isCheckedIn
                      ? const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)])
                      : DesignTokens.primaryGradient,
                  textColor: isCheckedIn ? colors.primaryButtonText : colors.primaryButtonText,
                  onTap: onTapNfc,
                ),
                const SizedBox(height: 8),
                _buildActionButton(
                  colors,
                  icon: LucideIcons.qrCode,
                  label: isCheckedIn ? 'QR OUT' : 'SCAN QR',
                  gradient: isCheckedIn
                      ? const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)])
                      : const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)]),
                  textColor: colors.primaryButtonText,
                  onTap: onTapQr,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(
    ThemeColors colors, {
    required IconData icon,
    required String label,
    required Gradient gradient,
    required Color textColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 6,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: textColor, size: 14),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: textColor,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
