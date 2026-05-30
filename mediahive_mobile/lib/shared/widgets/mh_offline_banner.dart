import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/network_service.dart';
import '../../../core/theme_provider.dart';

class MhOfflineBanner extends ConsumerWidget {
  const MhOfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(networkStatusProvider).value ?? NetworkStatus.online;

    if (status == NetworkStatus.online) {
      return const SizedBox.shrink();
    }

    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            // Light: warm amber-tinted frosted glass | Dark: deep navy scrim
            color: isLight
                ? const Color(0xFFFFF3CD).withOpacity(0.85)
                : const Color(0xFF0F172A).withOpacity(0.8),
            border: Border(
              bottom: BorderSide(
                color: isLight
                    ? const Color(0xFFFFD600).withOpacity(0.3)
                    : Colors.white.withOpacity(0.05),
                width: isLight ? 0.75 : 1.0,
              ),
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
          child: SafeArea(
            bottom: false,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.cloud_off,
                  color: isLight
                      ? const Color(0xFF7A5C00)
                      : Colors.white60,
                  size: 14,
                ),
                const SizedBox(width: 12),
                Text(
                  'RECONNECTING TO MEDIAHIVE...',
                  style: TextStyle(
                    color: isLight ? const Color(0xFF5C4500) : Colors.white70,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 10,
                  height: 10,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isLight
                          ? const Color(0xFF7A5C00).withOpacity(0.5)
                          : Colors.white.withOpacity(0.2),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
