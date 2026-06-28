import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/presentation/providers/navigation_provider.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/shared/widgets/ambient_canvas_background.dart';
import 'package:mediahive_mobile/core/providers/update_provider.dart';
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:intl/intl.dart';
import 'package:mediahive_mobile/presentation/widgets/global_header.dart';
import 'package:mediahive_mobile/presentation/widgets/update_banner.dart';
import 'package:mediahive_mobile/presentation/widgets/floating_navigation_dock.dart';
import 'package:mediahive_mobile/presentation/widgets/speed_dial_overlay.dart';


class ShellScreen extends ConsumerStatefulWidget {
  final Widget child;
  const ShellScreen({super.key, required this.child});

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen> {
  bool _isSpeedDialOpen = false;
  bool _showReleaseNotes = false;

  @override
  Widget build(BuildContext context) {
    final currentItem = ref.watch(navigationProvider);
    final colors = ref.watch(themeColorsProvider);
    final isBottomNavVisible = ref.watch(bottomNavVisibleProvider);
    final nfcState = ref.watch(globalNfcScanningProvider);
    
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
                          GlobalHeader(
                            currentRoute: currentRoute,
                            shouldHideNav: shouldHideNav,
                            isProfileRoute: isProfileRoute,
                          ),

                        // Persistent Update Banner under Header
                        updateInfoAsync.when(
                          data: (info) {
                            if (!info.isUpdateAvailable) return const SizedBox.shrink();
                            return Positioned(
                              top: 92 + MediaQuery.of(context).padding.top,
                              left: 16,
                              right: 16,
                              child: UpdateBanner(
                                info: info,
                                state: updateState,
                                progress: updateProgress,
                                showReleaseNotes: _showReleaseNotes,
                                onToggleReleaseNotes: () => setState(() => _showReleaseNotes = !_showReleaseNotes),
                              ),
                            );
                          },
                          loading: () => const SizedBox.shrink(),
                          error: (err, stack) {
                            return Positioned(
                              top: 92 + MediaQuery.of(context).padding.top,
                              left: 16,
                              right: 16,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade900.withValues(alpha: 0.9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Update Error: $err',
                                  style: const TextStyle(color: Colors.white, fontSize: 10),
                                ),
                              ),
                            );
                          },
                        ),
                        
                        // Floating Dock with Integrated FAB & Bottom Blur (Phone only)
                        if (!shouldHideNav && !isTablet)
                          FloatingNavigationDock(
                            currentItem: currentItem,
                            isSpeedDialOpen: _isSpeedDialOpen,
                            onNavigate: (item) {
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
                            onToggleSpeedDial: () => setState(() => _isSpeedDialOpen = !_isSpeedDialOpen),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              // Speed Dial Overlay
              if (_isSpeedDialOpen) SpeedDialOverlay(
                isTablet: isTablet,
                onClose: () => setState(() => _isSpeedDialOpen = false),
              ),
              if (nfcState.status != NfcScanStatus.idle)
                _buildNfcScanOverlay(context, ref, nfcState, colors),
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
        child: GestureDetector(
          onTap: () => setState(() => _isSpeedDialOpen = !_isSpeedDialOpen),
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
              turns: _isSpeedDialOpen ? 0.125 : 0,
              duration: const Duration(milliseconds: 300),
              child: const Icon(LucideIcons.plus, color: Colors.white, size: 26),
            ),
          ),
        ).animate().scale(delay: 400.ms, duration: 400.ms, curve: Curves.easeOutBack),
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
  Widget _buildNfcScanOverlay(BuildContext context, WidgetRef ref, NfcScanState nfcState, ThemeColors colors) {
    final isLight = !colors.isDark;
    return Positioned.fill(
      child: Container(
        color: colors.backgroundPrimary.withValues(alpha: 0.7),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isLight ? Colors.white.withValues(alpha: 0.9) : colors.surface.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(
                  color: colors.border.withValues(alpha: 0.3),
                  width: 0.75,
                ),
                boxShadow: isLight ? DesignTokens.spatialCardShadow : [
                  BoxShadow(
                    color: colors.honey.withValues(alpha: 0.1),
                    blurRadius: 30,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildNfcStatusIcon(nfcState, colors),
                  const SizedBox(height: 24),
                  Text(
                    _getNfcStatusTitle(nfcState.status),
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    nfcState.message ?? '',
                    style: TextStyle(
                      color: colors.textSecondary.withValues(alpha: 0.8),
                      fontSize: 13,
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (nfcState.status == NfcScanStatus.success && nfcState.record != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colors.backgroundPrimary.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: colors.border.withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('USER', nfcState.record!.userName, colors),
                          const Divider(height: 16, thickness: 0.5, color: Colors.grey),
                          _buildDetailRow('LOCATION', nfcState.tagName ?? 'Registered Tag', colors),
                          const Divider(height: 16, thickness: 0.5, color: Colors.grey),
                          _buildDetailRow('WORK MODE', nfcState.record!.workMode.toUpperCase(), colors),
                          if (nfcState.record!.lastKnownWorkLocation != null) ...[
                            const Divider(height: 16, thickness: 0.5, color: Colors.grey),
                            _buildDetailRow('VENUE', nfcState.record!.lastKnownWorkLocation!, colors),
                          ],
                          const Divider(height: 16, thickness: 0.5, color: Colors.grey),
                          _buildDetailRow(
                            nfcState.record!.checkOutTime != null ? 'CHECK OUT TIME' : 'CHECK IN TIME',
                            DateFormat('hh:mm a').format(
                              DateTime.parse(nfcState.record!.checkOutTime ?? nfcState.record!.checkInTime).toLocal()
                            ),
                            colors,
                          ),
                          if (nfcState.record!.checkOutTime != null) ...[
                            const Divider(height: 16, thickness: 0.5, color: Colors.grey),
                            _buildDetailRow('DURATION', nfcState.record!.formattedDuration, colors),
                          ]
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 28),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (nfcState.status == NfcScanStatus.scanning)
                        OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: colors.textSecondary,
                            side: BorderSide(color: colors.border),
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: () {
                            NfcManager.instance.stopSession();
                            ref.read(globalNfcScanningProvider.notifier).reset();
                          },
                          child: const Text('CANCEL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        )
                      else
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colors.honey,
                            foregroundColor: colors.backgroundPrimary,
                            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                          onPressed: () {
                            ref.read(globalNfcScanningProvider.notifier).reset();
                          },
                          child: const Text('DISMISS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5)),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNfcStatusIcon(NfcScanState nfcState, ThemeColors colors) {
    switch (nfcState.status) {
      case NfcScanStatus.scanning:
        return Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: colors.honey.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(LucideIcons.nfc, color: colors.honey, size: 40),
        ).animate(onPlay: (controller) => controller.repeat())
         .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 1.seconds, curve: Curves.easeInOut)
         .blurXY(begin: 0, end: 1, duration: 1.seconds, curve: Curves.easeInOut);
      case NfcScanStatus.success:
        return Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(LucideIcons.checkCircle, color: Colors.green, size: 40),
        ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack);
      case NfcScanStatus.error:
        return Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.red.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(LucideIcons.alertTriangle, color: Colors.red, size: 40),
        ).animate().shake(duration: 500.ms);
      case NfcScanStatus.nfcNotAvailable:
      case NfcScanStatus.nfcDisabled:
        return Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.orange.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(LucideIcons.nfc, color: Colors.orange, size: 40),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  String _getNfcStatusTitle(NfcScanStatus status) {
    switch (status) {
      case NfcScanStatus.scanning:
        return 'TAP NFC TAG';
      case NfcScanStatus.success:
        return 'TAP VERIFIED';
      case NfcScanStatus.error:
        return 'ACCESS DENIED';
      case NfcScanStatus.nfcNotAvailable:
        return 'NFC NOT AVAILABLE';
      case NfcScanStatus.nfcDisabled:
        return 'NFC DISABLED';
      default:
        return 'NFC SCAN';
    }
  }

  Widget _buildDetailRow(String label, String value, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: colors.textSecondary.withValues(alpha: 0.5),
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: colors.textPrimary,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

