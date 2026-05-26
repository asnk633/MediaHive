import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../providers/navigation_provider.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/tasks/presentation/screens/tasks_screen.dart';
import '../../features/inventory/presentation/screens/inventory_screen.dart';
import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/governance/presentation/screens/governance_screen.dart';
import '../../features/files/presentation/screens/downloads_screen.dart';
import '../../features/auth/presentation/screens/profile_screen.dart';
import '../../features/calendar/presentation/screens/create_event_screen.dart';
import '../../features/tasks/presentation/screens/create_task_screen.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/design_tokens.dart';
import '../../core/theme_provider.dart';
import '../../core/providers/user_provider.dart';
import '../../features/system/presentation/providers/notifications_provider.dart';
import 'dart:io';

import '../../shared/widgets/mh_loading_overlay.dart';

class ShellScreen extends ConsumerStatefulWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen> {
  bool _isSpeedDialOpen = false;

  @override
  Widget build(BuildContext context) {
    final currentItem = ref.watch(navigationProvider);
    final colors = ref.watch(themeColorsProvider);
    final isBottomNavVisible = ref.watch(bottomNavVisibleProvider);
    
    // Determine current route to selectively hide UI elements
    final currentRoute = GoRouterState.of(context).uri.toString();
    final isNotificationsRoute = currentRoute.startsWith('/notifications');
    
    // Check if we should hide for profile (even if on /governance)
    final profileAsync = ref.watch(currentUserProfileProvider);
    final isMemberProfile = profileAsync.maybeWhen(
      data: (p) => (p?['role'] as String? ?? 'member').toLowerCase() == 'member' && currentRoute.startsWith('/governance'),
      orElse: () => false,
    );
    final isProfileRoute = currentRoute.startsWith('/profile') || isMemberProfile;

    final shouldHideNav = isProfileRoute || isNotificationsRoute || !isBottomNavVisible;

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      extendBody: true,
      body: Stack(
        children: [
          widget.child,
          
          // Persistent Header
          _buildGlobalHeader(colors, currentRoute, shouldHideNav, isProfileRoute),
          
          // Speed Dial Overlay
          if (_isSpeedDialOpen) _buildSpeedDialOverlay(colors),

          // Floating Dock with Integrated FAB & Bottom Blur
          if (!shouldHideNav) ...[
            _buildBottomBlurBar(colors),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _buildFloatingDock(currentItem, colors),
            ),
          ],
        ],
      ),
    );
  }

  int _getNavIndex(NavItem item) {
    switch (item) {
      case NavItem.dashboard: return 0;
      case NavItem.tasks: return 1;
      case NavItem.events: return 2;
      case NavItem.inventory: return 3;
      case NavItem.files: return 4;
      case NavItem.governance: return 5;
    }
  }
  
  Widget _buildGlobalHeader(ThemeColors colors, String currentRoute, bool shouldHideNav, bool isProfileRoute) {
    final isLight = !colors.isDark;

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: ClipRect(
        child: BackdropFilter(
          filter: isLight
              ? ImageFilter.blur(sigmaX: 24, sigmaY: 24)
              : ImageFilter.blur(sigmaX: 0, sigmaY: 0),
          child: Container(
            decoration: BoxDecoration(
              // Light: frosted glass panel | Dark: solid primary
              color: isLight
                  ? Colors.white.withOpacity(0.78)
                  : colors.backgroundPrimary,
              border: Border(
                bottom: BorderSide(
                  color: isLight ? DesignTokens.lightBorder : colors.border,
                  width: isLight ? 0.75 : 1.0,
                ),
              ),
              boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.only(
                  top: 8,
                  bottom: 12,
                  left: 20,
                  right: 20,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        if (shouldHideNav)
                          IconButton(
                            icon: Icon(
                              context.canPop() ? LucideIcons.arrowLeft : LucideIcons.home,
                              color: colors.iconColor,
                            ),
                            onPressed: () => context.canPop()
                                ? context.pop()
                                : context.go('/dashboard'),
                          )
                        else
                          SizedBox(
                            width: 42,
                            height: 42,
                            child: Image.asset(
                              'assets/images/logo.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'MediaHive',
                              style: TextStyle(
                                color: colors.honey,
                                fontFamily: 'BavistaSoulvare',
                                fontSize: 32,
                                letterSpacing: 1.5,
                              ),
                            ),
                            Row(
                              children: [
                                Container(
                                  width: 5,
                                  height: 5,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF10B981),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'OPERATIONAL',
                                  style: TextStyle(
                                    color: const Color(0xFF10B981),
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        // Notification Bell
                        Consumer(
                          builder: (context, ref, _) {
                            final unreadCount = ref.watch(unreadNotificationsCountProvider);
                            return GestureDetector(
                              onTap: () {
                                if (currentRoute.startsWith('/notifications')) {
                                  context.pop();
                                } else {
                                  context.push('/notifications');
                                }
                              },
                              child: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Icon(
                                    LucideIcons.bell,
                                    color: colors.iconColor.withOpacity(0.7),
                                    size: 22,
                                  ),
                                  if (unreadCount > 0)
                                    Positioned(
                                      top: -2,
                                      right: -2,
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFEF4444),
                                          shape: BoxShape.circle,
                                        ),
                                        constraints: const BoxConstraints(
                                          minWidth: 14,
                                          minHeight: 14,
                                        ),
                                        child: Text(
                                          unreadCount > 9 ? '9+' : unreadCount.toString(),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 8,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 20),
                        Builder(
                          builder: (context) {
                            final profileImagePath = ref.watch(profileImagePathProvider);
                            final profileAsync = ref.watch(currentUserProfileProvider);
                            final avatarUrl = profileAsync.maybeWhen(
                              data: (p) => p?['avatar_url'] as String?,
                              orElse: () => null,
                            );
                            return GestureDetector(
                              onTap: () {
                                if (isProfileRoute) {
                                  if (context.canPop()) {
                                    context.pop();
                                  } else {
                                    context.go('/dashboard');
                                  }
                                } else {
                                  context.push('/profile');
                                }
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isLight
                                        ? DesignTokens.lightBorderStrong
                                        : Colors.white.withOpacity(0.1),
                                    width: 1.5,
                                  ),
                                  boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
                                ),
                                child: CircleAvatar(
                                  radius: 18,
                                  backgroundImage: profileImagePath != null
                                      ? FileImage(File(profileImagePath)) as ImageProvider
                                      : NetworkImage(
                                          avatarUrl ?? 'https://i.pravatar.cc/150?u=superadmin'),
                                  backgroundColor: colors.surface,
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBlurBar(ThemeColors colors) {
    final isLight = !colors.isDark;
    // Light mode: softer, shorter fade so the sky canvas shows through
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
                colors.backgroundPrimary.withOpacity(0.0),
                colors.backgroundPrimary.withOpacity(isLight ? 0.35 : 0.5),
                colors.backgroundPrimary.withOpacity(isLight ? 0.75 : 0.9),
                colors.backgroundPrimary,
              ],
              stops: const [0.0, 0.5, 0.8, 1.0],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIntegratedFAB(ThemeColors colors) {
    final isLight = !colors.isDark;
    return GestureDetector(
      onTap: () => setState(() => _isSpeedDialOpen = !_isSpeedDialOpen),
      child: Container(
        width: 52,
        height: 52,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          // Light: vivid spatial gradient with a subtle glow
          // Dark: solid brand blue (flat Apple convention)
          gradient: isLight
              ? AppColors.lightPrimaryGradient
              : AppColors.primaryGradient,
          shape: BoxShape.circle,
          boxShadow: isLight ? DesignTokens.spatialGlowBlue : [],
        ),
        child: AnimatedRotation(
          turns: _isSpeedDialOpen ? 0.125 : 0,
          duration: const Duration(milliseconds: 300),
          child: const Icon(LucideIcons.plus, color: Colors.white, size: 26),
        ),
      ),
    ).animate().scale(delay: 400.ms, duration: 400.ms, curve: Curves.easeOutBack);
  }

  Widget _buildFloatingDock(NavItem currentItem, ThemeColors colors) {
    final isLight = !colors.isDark;
    return SafeArea(
      top: false,
      child: Container(
        height: 85,
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(32),
          // Light: spatial two-layer depth shadow | Dark: classic dark elevation
          boxShadow: isLight
              ? DesignTokens.spatialDockShadow
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.5),
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
                // Light: ~80% white frost | Dark: semi-transparent dark
                color: isLight
                    ? Colors.white.withOpacity(0.80)
                    : colors.backgroundPrimary.withOpacity(0.5),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: isLight
                      ? DesignTokens.lightBorder
                      : Colors.white.withOpacity(0.08),
                  width: isLight ? 0.75 : 1.0,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Expanded(child: _buildDockItem(ref, LucideIcons.home, 'Home', NavItem.dashboard, currentItem, colors)),
                    Expanded(child: _buildDockItem(ref, LucideIcons.checkSquare, 'Tasks', NavItem.tasks, currentItem, colors)),
                    Expanded(child: _buildDockItem(ref, LucideIcons.calendar, 'Events', NavItem.events, currentItem, colors)),
                    _buildIntegratedFAB(colors),
                    Expanded(child: _buildDockItem(ref, LucideIcons.package, 'Inv', NavItem.inventory, currentItem, colors)),
                    Expanded(child: _buildDockItem(ref, LucideIcons.download, 'Files', NavItem.files, currentItem, colors)),
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
                              return _buildDockItem(ref, icon, label, NavItem.governance, currentItem, colors);
                            },
                            orElse: () => _buildDockItem(
                              ref, LucideIcons.shieldCheck, 'Gov', NavItem.governance, currentItem, colors),
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
      ).animate().slideY(begin: 1, end: 0, delay: 200.ms, duration: 500.ms, curve: Curves.easeOutCubic),
    );
  }

  Widget _buildDockItem(WidgetRef ref, IconData icon, String label, NavItem item, NavItem currentItem, ThemeColors colors) {
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
          ref.read(navigationProvider.notifier).state = item;
          if (_isSpeedDialOpen) setState(() => _isSpeedDialOpen = false);
          switch (item) {
            case NavItem.dashboard:  context.go('/dashboard'); break;
            case NavItem.tasks:      context.go('/tasks'); break;
            case NavItem.events:     context.go('/calendar'); break;
            case NavItem.inventory:  context.go('/inventory'); break;
            case NavItem.files:      context.go('/files'); break;
            case NavItem.governance: context.go('/governance'); break;
          }
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Active icon gets a frosted pill background in light mode
            if (isSelected && isLight)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: DesignTokens.lightHoney.withOpacity(0.12),
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
                    : colors.textSecondary.withOpacity(isLight ? 0.5 : 0.4),
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

  Widget _buildSpeedDialOverlay(ThemeColors colors) {
    final isLight = !colors.isDark;
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() => _isSpeedDialOpen = false),
        child: Container(
          // Light: faint sky-tinted scrim | Dark: dark scrim
          color: isLight
              ? DesignTokens.lightBackground.withOpacity(0.55)
              : colors.backgroundPrimary.withOpacity(0.4),
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
                      // 4-Button Arch for Managers/Admins
                      _buildSpeedDialItem(colors, LucideIcons.bell, 'Notify', const Offset(-160, -130), color: const Color(0xFFF59E0B), index: 0, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/notifications/create');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.calendar, 'Event', const Offset(-65, -240), color: const Color(0xFF10B981), index: 1, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/create-event');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.checkCircle, 'Task', const Offset(65, -240), color: const Color(0xFF3B82F6), index: 2, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/create-task');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.box, 'Asset', const Offset(160, -130), color: const Color(0xFF8B5CF6), index: 3, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/inventory/create');
                      }),
                    ] else ...[
                      // 2-Button Arch for Team/Members
                      _buildSpeedDialItem(colors, LucideIcons.calendar, 'Event', const Offset(-90, -160), color: const Color(0xFF10B981), index: 0, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/create-event');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.checkCircle, 'Task', const Offset(90, -160), color: const Color(0xFF3B82F6), index: 1, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
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
    VoidCallback? onTap,
  }) {
    final isLight = !colors.isDark;
    return Align(
      alignment: Alignment.bottomCenter,
      child: Transform.translate(
        offset: offset,
        child: GestureDetector(
          onTap: onTap,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  // Light: frosted white | Dark: semi-transparent dark surface
                  color: isLight
                      ? Colors.white.withOpacity(0.85)
                      : colors.surface.withOpacity(0.8),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isLight
                        ? DesignTokens.lightBorderStrong
                        : colors.border.withOpacity(0.5),
                    width: isLight ? 0.75 : 1.0,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(isLight ? 0.18 : 0.25),
                      blurRadius: isLight ? 16 : 20,
                      spreadRadius: isLight ? 0 : 2,
                      offset: isLight ? const Offset(0, 4) : Offset.zero,
                    ),
                    if (isLight)
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
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
              // Label pill
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
                          ? Colors.white.withOpacity(0.75)
                          : Colors.black.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(6),
                      border: isLight
                          ? Border.all(color: DesignTokens.lightBorder, width: 0.75)
                          : null,
                    ),
                    child: Text(
                      label.toUpperCase(),
                      style: TextStyle(
                        color: isLight ? DesignTokens.lightTextPrimary : Colors.white,
                        fontSize: 9,
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
            begin: Offset(-offset.dx * 0.5, -offset.dy * 0.5 + 40),
            end: Offset.zero,
            delay: (index * 40).ms,
            duration: 500.ms,
            curve: Curves.easeOutBack,
          ),
        ),
      ),
    );
  }
}
