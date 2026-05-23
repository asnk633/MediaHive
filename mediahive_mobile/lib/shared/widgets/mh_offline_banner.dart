import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/network_service.dart';
import '../../../core/design_tokens.dart';

class MhOfflineBanner extends ConsumerWidget {
  const MhOfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(networkStatusProvider).value ?? NetworkStatus.online;
    
    if (status == NetworkStatus.online) {
      return const SizedBox.shrink();
    }

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A).withOpacity(0.8),
            border: Border(
              bottom: BorderSide(color: Colors.white.withOpacity(0.05)),
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
          child: SafeArea(
            bottom: false,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.cloud_off, color: Colors.white60, size: 14),
                const SizedBox(width: 12),
                const Text(
                  'RECONNECTING TO MEDIAHIVE...',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.0,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 10,
                  height: 10,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white.withOpacity(0.2)),
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
