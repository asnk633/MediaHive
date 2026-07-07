import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
    final isLight = !colors.isDark;

    final cardGradient = isCheckedIn
        ? (isLight
            ? const LinearGradient(
                colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : LinearGradient(
                colors: [
                  const Color(0xFF064E3B).withValues(alpha: 0.6),
                  const Color(0xFF022C22).withValues(alpha: 0.6),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ))
        : (isLight
            ? const LinearGradient(
                colors: [Color(0xFFFEF2F2), Color(0xFFFEE2E2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : LinearGradient(
                colors: [
                  const Color(0xFF7F1D1D).withValues(alpha: 0.6),
                  const Color(0xFF450A0A).withValues(alpha: 0.6),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ));

    final cardBorderColor = isCheckedIn
        ? const Color(0xFF10B981).withValues(alpha: isLight ? 0.8 : 0.4)
        : const Color(0xFFEF4444).withValues(alpha: isLight ? 0.8 : 0.4);

    final cardContentColor = isCheckedIn
        ? (colors.isDark ? const Color(0xFFD1FAE5) : const Color(0xFF065F46))
        : (colors.isDark ? const Color(0xFFFEE2E2) : const Color(0xFF991B1B));

    final cardContentSecondaryColor = isCheckedIn
        ? (colors.isDark ? const Color(0xFFA7F3D0) : const Color(0xFF047857))
        : (colors.isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C));

    final dotColor = isCheckedIn ? const Color(0xFF10B981) : const Color(0xFFEF4444);

    return GestureDetector(
      onTap: onTapAttendance,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: cardGradient,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: cardBorderColor,
            width: 1.5,
          ),
          boxShadow: isLight
              ? DesignTokens.spatialCardShadow
              : [
                  BoxShadow(
                    color: (isCheckedIn ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                        .withValues(alpha: 0.05),
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
                      _buildPulsingDot(dotColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Text(
                              isCheckedIn ? 'Checked In' : 'Checked Out',
                              style: TextStyle(
                                color: cardContentColor,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (isCheckedIn && workMode != null) ...[
                              const SizedBox(width: 6),
                              Text(
                                '(${workMode!.toUpperCase()})',
                                style: TextStyle(
                                  color: cardContentSecondaryColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (isCheckedIn && checkInTime != null) ...[
                    Row(
                      children: [
                        Icon(
                          LucideIcons.clock,
                          size: 12,
                          color: cardContentSecondaryColor,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Since $checkInTime',
                          style: TextStyle(
                            color: cardContentSecondaryColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    if (lastKnownWorkLocation != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 2.0),
                            child: Icon(
                              LucideIcons.mapPin,
                              size: 12,
                              color: cardContentSecondaryColor,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              lastKnownWorkLocation!,
                              style: TextStyle(
                                color: cardContentSecondaryColor,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ] else ...[
                    Row(
                      children: [
                        Icon(
                          LucideIcons.clock,
                          size: 12,
                          color: cardContentSecondaryColor,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Ready to log check-in',
                          style: TextStyle(
                            color: cardContentSecondaryColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
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

  Widget _buildPulsingDot(Color color) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.6),
            blurRadius: 6,
            spreadRadius: 2,
          ),
        ],
      ),
    )
        .animate(onPlay: (controller) => controller.repeat(reverse: true))
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1.2, 1.2),
          duration: 1000.ms,
          curve: Curves.easeInOut,
        )
        .fadeIn(
          begin: 0.5,
          duration: 1000.ms,
          curve: Curves.easeInOut,
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
        width: 115,
        padding: const EdgeInsets.symmetric(vertical: 10),
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
          mainAxisAlignment: MainAxisAlignment.center,
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
