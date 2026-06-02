import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../providers/navigation_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/design_tokens.dart';
import '../../core/theme_provider.dart';
import '../../core/providers/user_provider.dart';
import '../../features/system/presentation/providers/notifications_provider.dart';
import 'dart:io';

import '../../shared/widgets/ambient_canvas_background.dart';
import '../../core/providers/update_provider.dart';
import '../../core/services/update_service.dart';
import '../../features/chat/presentation/providers/chat_providers.dart';


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
    final isChatRoute = currentRoute.startsWith('/chat');

    final shouldHideNav = isProfileRoute || isNotificationsRoute || isChatRoute || !isBottomNavVisible;

    final updateInfoAsync = ref.watch(updateInfoProvider);
    final updateState = ref.watch(updateStateProvider);
    final updateProgress = ref.watch(updateProgressProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      extendBody: true,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isTablet = constraints.maxWidth >= 600;
          return Stack(
            children: [
              Row(
                children: [
                  if (isTablet && !shouldHideNav) ...[
                    _buildTabletNavigationRail(currentItem, colors),
                    VerticalDivider(thickness: 1, width: 1, color: colors.border.withValues(alpha: 0.2)),
                  ],
                  Expanded(
                    child: Stack(
                      children: [
                        // ── Ambient canvas shader — living gradient behind all content ──
                        Positioned.fill(
                          child: IgnorePointer(
                            child: AmbientCanvasBackground(isDark: colors.isDark),
                          ),
                        ),
                        // Push down content when update banner is active
                        Padding(
                          padding: EdgeInsets.only(
                            top: updateInfoAsync.maybeWhen(
                              data: (info) => info.isUpdateAvailable ? 165.0 : 0.0,
                              orElse: () => 0.0,
                            ),
                          ),
                          child: widget.child,
                        ),
                        
                        // Persistent Header
                        if (!currentRoute.startsWith('/chat/'))
                          _buildGlobalHeader(colors, currentRoute, shouldHideNav, isProfileRoute),

                        // Persistent Update Banner under Header
                        updateInfoAsync.maybeWhen(
                          data: (info) {
                            if (!info.isUpdateAvailable) return const SizedBox.shrink();
                            return Positioned(
                              top: 92 + MediaQuery.of(context).padding.top,
                              left: 16,
                              right: 16,
                              child: _buildUpdateBanner(context, colors, info, updateState, updateProgress),
                            );
                          },
                          orElse: () => const SizedBox.shrink(),
                        ),
                        
                        // Floating Dock with Integrated FAB & Bottom Blur (Phone only)
                        if (!shouldHideNav && !isTablet) ...[
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
                  ),
                ],
              ),
              // Speed Dial Overlay
              if (_isSpeedDialOpen) _buildSpeedDialOverlay(colors, isTablet),
            ],
          );
        },
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
                  ? Colors.white.withValues(alpha: 0.78)
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
                                const Text(
                                  'OPERATIONAL',
                                  style: TextStyle(
                                    color: Color(0xFF10B981),
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
                        // Chat Button
                        Consumer(
                          builder: (context, ref, _) {
                            final unreadChatsCount = ref.watch(unreadChatMessagesCountProvider);
                            return GestureDetector(
                              onTap: () {
                                if (currentRoute.startsWith('/chat')) {
                                  context.pop();
                                } else {
                                  context.push('/chat');
                                }
                              },
                              child: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Icon(
                                    LucideIcons.messageSquare,
                                    color: colors.iconColor.withValues(alpha: 0.7),
                                    size: 22,
                                  ),
                                  if (unreadChatsCount > 0)
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
                                          unreadChatsCount > 9 ? '9+' : unreadChatsCount.toString(),
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
                                    color: colors.iconColor.withValues(alpha: 0.7),
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
                                        : Colors.white.withValues(alpha: 0.1),
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
                // Light: ~80% white frost | Dark: semi-transparent dark
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

  Widget _buildTabletNavigationRail(NavItem currentItem, ThemeColors colors) {
    final isLight = !colors.isDark;
    
    return NavigationRail(
      backgroundColor: isLight ? Colors.white.withValues(alpha: 0.8) : colors.backgroundPrimary.withValues(alpha: 0.8),
      selectedIndex: _getNavIndex(currentItem),
      onDestinationSelected: (index) {
        NavItem selectedItem;
        switch(index) {
          case 0: selectedItem = NavItem.dashboard; break;
          case 1: selectedItem = NavItem.tasks; break;
          case 2: selectedItem = NavItem.events; break;
          case 3: selectedItem = NavItem.inventory; break;
          case 4: selectedItem = NavItem.files; break;
          case 5: selectedItem = NavItem.governance; break;
          default: selectedItem = NavItem.dashboard; break;
        }
        ref.read(navigationProvider.notifier).state = selectedItem;
        if (_isSpeedDialOpen) setState(() => _isSpeedDialOpen = false);
        switch (selectedItem) {
          case NavItem.dashboard:  context.go('/dashboard'); break;
          case NavItem.tasks:      context.go('/tasks'); break;
          case NavItem.events:     context.go('/calendar'); break;
          case NavItem.inventory:  context.go('/inventory'); break;
          case NavItem.files:      context.go('/files'); break;
          case NavItem.governance: context.go('/governance'); break;
        }
      },
      labelType: NavigationRailLabelType.all,
      selectedIconTheme: IconThemeData(color: colors.indigo, size: 24),
      unselectedIconTheme: IconThemeData(color: colors.textSecondary.withValues(alpha: isLight ? 0.5 : 0.4), size: 24),
      selectedLabelTextStyle: TextStyle(
        color: isLight ? DesignTokens.lightHoney : colors.textPrimary,
        fontSize: 10,
        fontWeight: FontWeight.bold,
      ),
      unselectedLabelTextStyle: TextStyle(
        color: colors.textSecondary.withValues(alpha: isLight ? 0.5 : 0.4),
        fontSize: 10,
        fontWeight: FontWeight.w600,
      ),
      leading: Padding(
        padding: const EdgeInsets.only(bottom: 24, top: 16),
        child: _buildIntegratedFAB(colors),
      ),
      destinations: [
        const NavigationRailDestination(
          icon: Icon(LucideIcons.home),
          label: Text('HOME'),
        ),
        const NavigationRailDestination(
          icon: Icon(LucideIcons.checkSquare),
          label: Text('TASKS'),
        ),
        const NavigationRailDestination(
          icon: Icon(LucideIcons.calendar),
          label: Text('EVENTS'),
        ),
        const NavigationRailDestination(
          icon: Icon(LucideIcons.package),
          label: Text('INVENTORY'),
        ),
        const NavigationRailDestination(
          icon: Icon(LucideIcons.download),
          label: Text('FILES'),
        ),
        NavigationRailDestination(
          icon: Consumer(
            builder: (context, ref, _) {
              final profileAsync = ref.watch(currentUserProfileProvider);
              return profileAsync.maybeWhen(
                data: (profile) {
                  final role = profile?['role'] as String? ?? 'member';
                  IconData icon = LucideIcons.shieldCheck;
                  if (role == 'admin' || role == 'manager') {
                    icon = LucideIcons.command;
                  } else if (role == 'team') {
                    icon = LucideIcons.calendarClock;
                  } else {
                    icon = LucideIcons.user;
                  }
                  return Icon(icon);
                },
                orElse: () => const Icon(LucideIcons.shieldCheck),
              );
            },
          ),
          label: Consumer(
            builder: (context, ref, _) {
              final profileAsync = ref.watch(currentUserProfileProvider);
              return profileAsync.maybeWhen(
                data: (profile) {
                  final role = profile?['role'] as String? ?? 'member';
                  String label = 'GOV';
                  if (role == 'admin' || role == 'manager') {
                    label = 'ADMIN';
                  } else if (role == 'team') {
                    label = 'LEAVE';
                  } else {
                    label = 'PROFILE';
                  }
                  return Text(label);
                },
                orElse: () => const Text('GOV'),
              );
            }
          ),
        ),
      ],
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
          HapticFeedback.lightImpact();
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

  Widget _buildSpeedDialOverlay(ThemeColors colors, [bool isTablet = false]) {
    final isLight = !colors.isDark;
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() => _isSpeedDialOpen = false),
        child: Container(
          // Light: faint sky-tinted scrim | Dark: dark scrim
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
                      // 4-Button Arch for Managers/Admins
                      _buildSpeedDialItem(colors, LucideIcons.bell, 'Notify', const Offset(-160, -130), color: const Color(0xFFF59E0B), index: 0, isTablet: isTablet, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/notifications/create');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.calendar, 'Event', const Offset(-65, -240), color: const Color(0xFF10B981), index: 1, isTablet: isTablet, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/create-event');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.checkCircle, 'Task', const Offset(65, -240), color: const Color(0xFF3B82F6), index: 2, isTablet: isTablet, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/create-task');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.box, 'Asset', const Offset(160, -130), color: const Color(0xFF8B5CF6), index: 3, isTablet: isTablet, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/inventory/create');
                      }),
                    ] else ...[
                      // 2-Button Arch for Team/Members
                      _buildSpeedDialItem(colors, LucideIcons.calendar, 'Event', const Offset(-90, -160), color: const Color(0xFF10B981), index: 0, isTablet: isTablet, onTap: () {
                        setState(() => _isSpeedDialOpen = false);
                        context.push('/create-event');
                      }),
                      _buildSpeedDialItem(colors, LucideIcons.checkCircle, 'Task', const Offset(90, -160), color: const Color(0xFF3B82F6), index: 1, isTablet: isTablet, onTap: () {
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
    bool isTablet = false,
    VoidCallback? onTap,
  }) {
    final isLight = !colors.isDark;
    return Align(
      alignment: isTablet ? Alignment.topLeft : Alignment.bottomCenter,
      child: Transform.translate(
        offset: isTablet ? Offset(90.0, 40.0 + (index * 85.0)) : offset,
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
            begin: isTablet ? const Offset(-40, 0) : Offset(-offset.dx * 0.5, -offset.dy * 0.5 + 40),
            end: Offset.zero,
            delay: (index * 40).ms,
            duration: 500.ms,
            curve: Curves.easeOutBack,
          ),
        ),
      ),
    );
  }

  Widget _buildUpdateBanner(
    BuildContext context,
    ThemeColors colors,
    UpdateInfo info,
    UpdateDownloadState state,
    double progress,
  ) {
    final isLight = !colors.isDark;
    final isDownloading = state == UpdateDownloadState.downloading;
    final isDownloaded = state == UpdateDownloadState.downloaded;
    final isInstalling = state == UpdateDownloadState.installing;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isLight
              ? [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7)] // Premium light amber
              : [const Color(0xFF78350F).withValues(alpha: 0.85), const Color(0xFF451A03).withValues(alpha: 0.9)], // Deep warm amber
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(DesignTokens.radiusL),
        border: Border.all(
          color: isLight ? const Color(0xFFFDE68A) : const Color(0xFFD97706).withValues(alpha: 0.4),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD97706).withValues(alpha: isLight ? 0.08 : 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(DesignTokens.radiusL - 1),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: isLight ? 0.15 : 0.25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.rocket,
                      color: Color(0xFFD97706),
                      size: 18,
                    ),
                  ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                   .moveY(begin: -2, end: 2, duration: 1000.ms, curve: Curves.easeInOut),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Update Available — v${info.latestVersion}',
                          style: TextStyle(
                            color: isLight ? const Color(0xFF78350F) : Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isDownloading
                              ? 'Downloading system resources...'
                              : isDownloaded
                                  ? 'Update downloaded successfully!'
                                  : isInstalling
                                      ? 'Installing update package...'
                                      : info.releaseNotes,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: isLight ? const Color(0xFF92400E) : const Color(0xFFFCD34D).withValues(alpha: 0.8),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (!isDownloading && !isInstalling)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD97706),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(DesignTokens.radiusM),
                        ),
                      ),
                      onPressed: () {
                        if (isDownloaded) {
                          ref.read(updateStateProvider.notifier).installUpdate();
                        } else {
                          ref.read(updateStateProvider.notifier).downloadUpdate(info.downloadUrl);
                        }
                      },
                      child: Text(
                        isDownloaded ? 'INSTALL' : 'UPDATE',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                  if (isDownloading)
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: Color(0xFFD97706), size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        ref.read(updateStateProvider.notifier).cancelDownload();
                      },
                    ),
                ],
              ),
              if (isDownloading) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          backgroundColor: const Color(0xFFD97706).withValues(alpha: 0.15),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD97706)),
                          minHeight: 5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: TextStyle(
                        color: isLight ? const Color(0xFF78350F) : Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0, curve: Curves.easeOutCubic);
  }
}

