import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../../core/theme_provider.dart';

class ResetConfirmationScreen extends ConsumerWidget {
  const ResetConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final isDark = colors.isDark;

    return Scaffold(
      body: Stack(
        children: [
          // Premium Background Gradient
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [
                        const Color(0xFF000000), // Pure Black
                        const Color(0xFF0A0A0A), // Extremely Deep Grey
                        const Color(0xFF141414), // Charcoal Grey
                      ]
                    : [
                        const Color(0xFFEFF3FC), // Sky White
                        const Color(0xFFE2EAFD), // Light Sky Blue
                        const Color(0xFFC7D8F9), // Soft Sky Blue
                      ],
                stops: const [0.0, 0.6, 1.0],
              ),
            ),
          ),
          
          // Subtle Pattern Overlay
          Positioned.fill(
            child: Opacity(
              opacity: isDark ? 0.05 : 0.08,
              child: Image.asset(
                'assets/images/pattern.png',
                repeat: ImageRepeat.repeat,
                errorBuilder: (context, error, stackTrace) => Container(),
              ),
            ),
          ),

          // Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildBrandHeader(colors),
                    const SizedBox(height: 40),
                    _buildConfirmationCard(context, colors),
                    const SizedBox(height: 32),
                    _buildFooter(colors),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrandHeader(ThemeColors colors) {
    final isDark = colors.isDark;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: isDark ? 0.05 : 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: isDark ? 0.1 : 0.3)),
            boxShadow: [
              BoxShadow(
                color: (isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6))
                    .withValues(alpha: isDark ? 0.2 : 0.1),
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Image.asset(
            'assets/brand/icon.png',
            height: 60,
            width: 60,
          ),
        ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
        const SizedBox(height: 24),
        Text(
          'MediaHive',
          style: TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF1D1D1F),
            fontFamily: 'BavistaSoulvare',
            letterSpacing: 2.0,
          ),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
        Text(
          'SECURE COMMAND CENTER',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary.withValues(alpha: 0.5),
            letterSpacing: 4,
          ),
        ).animate().fadeIn(delay: 400.ms),
      ],
    );
  }

  Widget _buildConfirmationCard(BuildContext context, ThemeColors colors) {
    final isDark = colors.isDark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.65),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withValues(alpha: isDark ? 0.1 : 0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                blurRadius: 40,
                offset: const Offset(0, 20),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Glowing Checkmark Success Icon
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withValues(alpha: 0.2),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(
                  LucideIcons.checkCircle,
                  color: Color(0xFF10B981),
                  size: 48,
                ),
              ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
              
              const SizedBox(height: 28),
              
              Text(
                'Password Reset Successfully',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: colors.textPrimary,
                  letterSpacing: 0.5,
                ),
              ),
              
              const SizedBox(height: 12),
              
              Text(
                'Your credentials have been successfully updated. You can now access your MediaHive account using your new password.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: colors.textSecondary.withValues(alpha: 0.7),
                  height: 1.5,
                ),
              ),
              
              const SizedBox(height: 36),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => context.go('/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6),
                    foregroundColor: isDark ? Colors.black : Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'BACK TO SIGN IN',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 500.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1));
  }

  Widget _buildFooter(ThemeColors colors) {
    return Column(
      children: [
        const SizedBox(height: 20),
        Text(
          'POWERED BY THAIBA GARDEN\nMEDIA & IT DEPARTMENT',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: colors.textSecondary.withValues(alpha: 0.2),
            letterSpacing: 2,
            height: 1.5,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 700.ms);
  }
}
