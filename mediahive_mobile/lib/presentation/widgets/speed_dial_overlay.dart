import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';

class SpeedDialOverlay extends ConsumerWidget {
  final bool isTablet;
  final VoidCallback onClose;

  const SpeedDialOverlay({
    super.key,
    this.isTablet = false,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;

    return Positioned.fill(
      child: GestureDetector(
        onTap: onClose,
        child: Container(
          color: isLight
              ? DesignTokens.lightBackground.withValues(alpha: 0.55)
              : colors.backgroundPrimary.withValues(alpha: 0.4),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Consumer(
              builder: (context, ref, _) {
                final profileAsync = ref.watch(currentUserProfileProvider);

                final isManagerOrAdmin = profileAsync.maybeWhen(
                  data: (profile) {
                    final roleRaw = (profile?['role']?.toString() ?? 'member').toLowerCase().trim();
                    return roleRaw.contains('admin') || roleRaw.contains('manager');
                  },
                  orElse: () => false,
                );

                return Stack(
                  alignment: Alignment.center,
                  children: [
                    if (isManagerOrAdmin) ...[
                      _buildSpeedDialItem(colors, LucideIcons.bell, 'Notify', const Offset(-160, -130), color: const Color(0xFFF59E0B), index: 0, isTablet: isTablet, onTap: () {
                        onClose();
                        context.push('/notifications/create');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.calendar, 'Event', const Offset(-65, -240), color: const Color(0xFF10B981), index: 1, isTablet: isTablet, onTap: () {
                        onClose();
                        context.push('/create-event');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.checkCircle, 'Task', const Offset(65, -240), color: const Color(0xFF3B82F6), index: 2, isTablet: isTablet, onTap: () {
                        onClose();
                        context.push('/create-task');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.box, 'Asset', const Offset(160, -130), color: const Color(0xFF8B5CF6), index: 3, isTablet: isTablet, onTap: () {
                        onClose();
                        context.push('/inventory/create');
                      }),
                    ] else ...[
                      _buildSpeedDialItem(colors, LucideIcons.calendar, 'Event', const Offset(-90, -160), color: const Color(0xFF10B981), index: 0, isTablet: isTablet, onTap: () {
                        onClose();
                        context.push('/create-event');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.checkCircle, 'Task', const Offset(90, -160), color: const Color(0xFF3B82F6), index: 1, isTablet: isTablet, onTap: () {
                        onClose();
                        context.push('/create-task');
                      }),
                    ],
                  ],
                );
              }
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpeedDialItem(
    ThemeColors colors,
    IconData icon,
    String label,
    Offset offset, {
    required Color color,
    required int index,
    bool isTablet = false,
    VoidCallback? onTap,
  }) {
    final isLight = !colors.isDark;
    return Align(
      alignment: isTablet ? Alignment.topLeft : Alignment.bottomCenter,
      child: Transform.translate(
        offset: isTablet ? Offset(90.0, 40.0 + (index * 85.0)) : offset,
        child: Semantics(
          label: "Quick action: Create $label",
          button: true,
          child: GestureDetector(
            onTap: onTap,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(
                    color: isLight
                        ? Colors.white.withValues(alpha: 0.85)
                        : colors.surface.withValues(alpha: 0.8),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isLight
                          ? DesignTokens.lightBorderStrong
                          : colors.border.withValues(alpha: 0.5),
                      width: isLight ? 0.75 : 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: isLight ? 0.18 : 0.25),
                        blurRadius: isLight ? 16 : 20,
                        spreadRadius: isLight ? 0 : 2,
                        offset: isLight ? const Offset(0, 4) : Offset.zero,
                      ),
                      if (isLight)
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  child: ClipOval(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(
                        sigmaX: isLight ? 20 : 10,
                        sigmaY: isLight ? 20 : 10,
                      ),
                      child: Center(
                        child: Icon(icon, color: color, size: 26),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: BackdropFilter(
                    filter: isLight
                      ? ImageFilter.blur(sigmaX: 8, sigmaY: 8)
                      : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isLight
                            ? Colors.white.withValues(alpha: 0.75)
                            : Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(6),
                        border: isLight
                            ? Border.all(color: DesignTokens.lightBorder, width: 0.75)
                            : null,
                      ),
                      child: Text(
                        label.toUpperCase(),
                        style: TextStyle(
                          color: isLight ? DesignTokens.lightTextPrimary : Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            )
            .animate()
            .fadeIn(delay: (index * 40).ms, duration: 300.ms)
            .scale(
              begin: const Offset(0.5, 0.5),
              end: const Offset(1, 1),
              delay: (index * 40).ms,
              duration: 400.ms,
              curve: Curves.easeOutBack,
            )
            .move(
              begin: isTablet ? const Offset(-40, 0) : Offset(-offset.dx * 0.5, -offset.dy * 0.5 + 40),
              end: Offset.zero,
              delay: (index * 40).ms,
              duration: 500.ms,
              curve: Curves.easeOutBack,
            ),
          ),
        ),
      ),
    );
  }
}
