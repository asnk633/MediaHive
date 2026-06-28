import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/sync_errors_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/features/system/presentation/providers/notifications_provider.dart';
import 'package:mediahive_mobile/features/chat/presentation/providers/chat_providers.dart';

class GlobalHeader extends ConsumerWidget {
  final String currentRoute;
  final bool shouldHideNav;
  final bool isProfileRoute;

  const GlobalHeader({
    super.key,
    required this.currentRoute,
    required this.shouldHideNav,
    required this.isProfileRoute,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
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
                            width: 54,
                            height: 54,
                            child: Image.asset(
                              'assets/images/logo.png',
                              fit: BoxFit.contain,
                            )
                            .animate(onPlay: (controller) => controller.repeat())
                            .rotate(duration: 20.seconds, curve: Curves.linear),
                          ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              height: 28,
                              child: Transform.translate(
                                offset: const Offset(-14.5, 0),
                                child: Transform.scale(
                                  scale: 6.0,
                                  alignment: Alignment.centerLeft,
                                  child: Image.asset(
                                    colors.isDark ? 'assets/images/app_name_light.png' : 'assets/images/app_name_dark.png',
                                    height: 28,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
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
                        Consumer(
                          builder: (context, ref, _) {
                            final unreadChatsCount = ref.watch(unreadChatMessagesCountProvider);
                            return Semantics(
                              label: "Chat",
                              hint: "Open direct messages screen",
                              button: true,
                              child: Material(
                                color: Colors.transparent,
                                child: InkResponse(
                                  onTap: () {
                                    if (currentRoute.startsWith('/chat')) {
                                      context.pop();
                                    } else {
                                      context.push('/chat');
                                    }
                                  },
                                  radius: 20,
                                  splashColor: colors.indigo.withValues(alpha: 0.15),
                                  highlightColor: colors.indigo.withValues(alpha: 0.08),
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
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 20),
                        Consumer(
                          builder: (context, ref, _) {
                            final unreadCount = ref.watch(unreadNotificationsCountProvider);
                            final hasSyncErrors = ref.watch(syncErrorsProvider).hasSyncErrors;

                            return Semantics(
                              label: "Notifications",
                              hint: "Open notifications screen",
                              button: true,
                              child: Material(
                                color: Colors.transparent,
                                child: InkResponse(
                                  onTap: () {
                                    if (currentRoute.startsWith('/notifications')) {
                                      context.pop();
                                    } else {
                                      context.push('/notifications');
                                    }
                                  },
                                  radius: 20,
                                  splashColor: colors.indigo.withValues(alpha: 0.15),
                                  highlightColor: colors.indigo.withValues(alpha: 0.08),
                                  child: Stack(
                                    clipBehavior: Clip.none,
                                    children: [
                                      Icon(
                                        LucideIcons.bell,
                                        color: colors.iconColor.withValues(alpha: 0.7),
                                        size: 22,
                                      ),
                                      if (hasSyncErrors)
                                        Positioned(
                                          bottom: 0,
                                          right: 0,
                                          child: Container(
                                            width: 8,
                                            height: 8,
                                            decoration: BoxDecoration(
                                              color: Colors.orangeAccent,
                                              shape: BoxShape.circle,
                                              border: Border.all(color: colors.surface, width: 1.5),
                                            ),
                                          ),
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
                                ),
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
                            return Semantics(
                              label: "Profile",
                              hint: "Open user profile screen",
                              button: true,
                              child: Material(
                                color: Colors.transparent,
                                child: InkResponse(
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
                                  radius: 24,
                                  splashColor: colors.indigo.withValues(alpha: 0.15),
                                  highlightColor: colors.indigo.withValues(alpha: 0.08),
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
                                          avatarUrl ?? 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'),
                                  backgroundColor: colors.surface,
                                ),
                              ),
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
}
