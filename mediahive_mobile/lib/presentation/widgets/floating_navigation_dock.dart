import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/presentation/providers/navigation_provider.dart';

class FloatingNavigationDock extends ConsumerWidget {
  final NavItem currentItem;
  final bool isSpeedDialOpen;
  final ValueChanged<NavItem> onNavigate;
  final VoidCallback onToggleSpeedDial;

  const FloatingNavigationDock({
    super.key,
    required this.currentItem,
    required this.isSpeedDialOpen,
    required this.onNavigate,
    required this.onToggleSpeedDial,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    return Stack(
      children: [
        _buildBottomBlurBar(colors),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: _buildFloatingDock(context, ref, colors),
        ),
      ],
    );
  }

  Widget _buildBottomBlurBar(ThemeColors colors) {
    final isLight = !colors.isDark;
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: Container(
          height: isLight ? 110 : 140,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                colors.backgroundPrimary.withValues(alpha: 0.0),
                colors.backgroundPrimary.withValues(alpha: isLight ? 0.35 : 0.5),
                colors.backgroundPrimary.withValues(alpha: isLight ? 0.75 : 0.9),
                colors.backgroundPrimary,
              ],
              stops: const [0.0, 0.5, 0.8, 1.0],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFloatingDock(BuildContext context, WidgetRef ref, ThemeColors colors) {
    final isLight = !colors.isDark;
    return SafeArea(
      top: false,
      child: Container(
        height: 85,
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(32),
          boxShadow: isLight
              ? DesignTokens.spatialDockShadow
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 30,
                    offset: const Offset(0, 15),
                  ),
                ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: isLight ? 28.0 : 20.0,
              sigmaY: isLight ? 28.0 : 20.0,
            ),
            child: Container(
              decoration: BoxDecoration(
                color: isLight
                    ? Colors.white.withValues(alpha: 0.80)
                    : colors.backgroundPrimary.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: isLight
                      ? DesignTokens.lightBorder
                      : Colors.white.withValues(alpha: 0.08),
                  width: isLight ? 0.75 : 1.0,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Expanded(child: _buildDockItem(context, ref, LucideIcons.home, 'Home', NavItem.dashboard, currentItem, colors)),
                    Expanded(child: _buildDockItem(context, ref, LucideIcons.checkSquare, 'Tasks', NavItem.tasks, currentItem, colors)),
                    Expanded(child: _buildDockItem(context, ref, LucideIcons.calendar, 'Events', NavItem.events, currentItem, colors)),
                    _buildIntegratedFAB(colors),
                    Expanded(child: _buildDockItem(context, ref, LucideIcons.package, 'Inv', NavItem.inventory, currentItem, colors)),
                    Expanded(child: _buildDockItem(context, ref, LucideIcons.download, 'Files', NavItem.files, currentItem, colors)),
                    Expanded(
                      child: Consumer(
                        builder: (context, ref, _) {
                          final profileAsync = ref.watch(currentUserProfileProvider);
                          return profileAsync.maybeWhen(
                            data: (profile) {
                              final role = profile?['role'] as String? ?? 'member';
                              IconData icon = LucideIcons.shieldCheck;
                              String label = 'Gov';
                              if (role == 'admin' || role == 'manager') {
                                icon = LucideIcons.command;
                                label = 'Admin';
                              } else if (role == 'team') {
                                icon = LucideIcons.calendarClock;
                                label = 'Leave';
                              } else {
                                icon = LucideIcons.user;
                                label = 'Profile';
                              }
                              return _buildDockItem(context, ref, icon, label, NavItem.governance, currentItem, colors);
                            },
                            orElse: () => _buildDockItem(
                              context, ref, LucideIcons.shieldCheck, 'Gov', NavItem.governance, currentItem, colors),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    ).animate().slideY(begin: 1, end: 0, delay: 200.ms, duration: 500.ms, curve: Curves.easeOutCubic);
  }

  Widget _buildIntegratedFAB(ThemeColors colors) {
    final isLight = !colors.isDark;
    return GestureDetector(
      onTap: onToggleSpeedDial,
      child: Container(
        width: 52,
        height: 52,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          gradient: isLight
              ? AppColors.lightPrimaryGradient
              : AppColors.primaryGradient,
          shape: BoxShape.circle,
          boxShadow: isLight ? DesignTokens.spatialGlowBlue : [],
        ),
        child: AnimatedRotation(
          turns: isSpeedDialOpen ? 0.125 : 0,
          duration: const Duration(milliseconds: 300),
          child: const Icon(LucideIcons.plus, color: Colors.white, size: 26),
        ),
      ),
    ).animate().scale(delay: 400.ms, duration: 400.ms, curve: Curves.easeOutBack);
  }

  Widget _buildDockItem(BuildContext context, WidgetRef ref, IconData icon, String label, NavItem item, NavItem currentItem, ThemeColors colors) {
    final isSelected = currentItem == item;
    final isLight = !colors.isDark;

    String fullLabel = label;
    if (label == 'Inv')     fullLabel = 'Inventory';
    if (label == 'Admin')   fullLabel = 'Command Center';
    if (label == 'Leave')   fullLabel = 'Request Leave';
    if (label == 'Profile') fullLabel = 'My Profile';
    if (label == 'Files')   fullLabel = 'Downloads';

    return Tooltip(
      message: fullLabel,
      preferBelow: false,
      verticalOffset: 20,
      decoration: BoxDecoration(
        color: isLight ? DesignTokens.lightSurface : colors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isLight ? DesignTokens.lightBorder : colors.border,
        ),
        boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
      ),
      textStyle: TextStyle(
        color: colors.textPrimary,
        fontSize: 10,
        fontWeight: FontWeight.bold,
      ),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onNavigate(item);
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isSelected && isLight)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: DesignTokens.lightHoney.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusM),
                ),
                child: Icon(
                  icon,
                  size: 22,
                  color: DesignTokens.lightHoney,
                ),
              ).animate(target: 1).scale(
                begin: const Offset(0.8, 0.8),
                end: const Offset(1.0, 1.0),
              )
            else
              Icon(
                icon,
                size: 24,
                color: isSelected
                    ? colors.indigo
                    : colors.textSecondary.withValues(alpha: isLight ? 0.5 : 0.4),
              ).animate(target: isSelected ? 1 : 0).scale(
                begin: const Offset(0.8, 0.8),
                end: const Offset(1.1, 1.1),
              ),

            const SizedBox(height: 4),

            AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isSelected ? 1.0 : 0.0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: isSelected ? 12 : 0,
                child: Text(
                  fullLabel.toUpperCase(),
                  style: TextStyle(
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: isLight && isSelected
                        ? DesignTokens.lightHoney
                        : colors.textPrimary,
                  ),
                ),
              ),
            ),

            if (isSelected && !isLight)
              Container(
                margin: const EdgeInsets.only(top: 4),
                width: 4,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.indigo,
                  shape: BoxShape.circle,
                ),
              ).animate().fade().scale(),
          ],
        ),
      ),
    );
  }
}
