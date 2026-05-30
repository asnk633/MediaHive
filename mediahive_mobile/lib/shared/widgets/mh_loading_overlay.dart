import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import 'mh_honey_loader.dart';
import '../../core/providers/ui_providers.dart';

class MhLoadingOverlay extends ConsumerWidget {
  const MhLoadingOverlay({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(globalLoadingProvider);
    final message = ref.watch(loadingMessageProvider);

    if (!isLoading) return const SizedBox.shrink();

    return Material(
      color: Colors.transparent,
      child: Stack(
        children: [
          // Background Dim & Blur
          Positioned.fill(
            child: Container(
              color: Colors.black.withOpacity(0.55),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: const SizedBox.expand(),
              ),
            ),
          ),
          
          // Content
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Rotating Logo
                Image.asset(
                  'assets/images/logo.png',
                  width: 100,
                  height: 100,
                )
                .animate(onPlay: (controller) => controller.repeat())
                .rotate(duration: 2500.ms, curve: Curves.easeInOutSine),
                
                const SizedBox(height: 32),
                
                // Status Text
                Consumer(
                  builder: (context, ref, _) {
                    final message = ref.watch(loadingMessageProvider);
                    return Text(
                      message,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    );
                  },
                )
                .animate(onPlay: (controller) => controller.repeat(reverse: true))
                .fadeIn(duration: 800.ms)
                .then()
                .fadeOut(duration: 800.ms),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
