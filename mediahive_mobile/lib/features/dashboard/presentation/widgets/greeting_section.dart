import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';

class GreetingSection extends StatelessWidget {
  final String fullName;
  final String role;
  final String greeting;
  final String motivation;
  final bool isLoading;

  const GreetingSection({
    super.key,
    required this.fullName,
    required this.role,
    required this.greeting,
    required this.motivation,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      if (isLoading) return _buildPlaceholder(colors);
      return _buildContent(colors);
    });
  }

  Widget _buildContent(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildRoleBadge(colors),
        const SizedBox(height: 12),
        Text(
          greeting.toUpperCase(),
          style: AppTypography.caption.copyWith(
            color: colors.indigo,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          fullName,
          style: AppTypography.h1.copyWith(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: colors.textPrimary,
            height: 1.1,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 8),
        Text(
          motivation,
          style: TextStyle(
            fontSize: 14,
            color: colors.textSecondary.withValues(alpha: 0.5),
            fontWeight: FontWeight.w500,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildRoleBadge(ThemeColors colors) {
    final cleanRole = role.replaceAll('userrole.', '').trim().toUpperCase();
    final isDark = colors.isDark;

    Gradient badgeGradient;
    Color borderColor;
    Color textColor;

    if (cleanRole.contains('ADMIN')) {
      badgeGradient = const LinearGradient(
        colors: [Color(0xFFFFD700), Color(0xFFC9A84C)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      borderColor = isDark ? const Color(0x26FFD700) : const Color(0xFFC9A84C).withValues(alpha: 0.4);
      textColor = colors.primaryButtonText;
    } else if (cleanRole.contains('MANAGER')) {
      badgeGradient = const LinearGradient(
        colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      borderColor = isDark ? const Color(0x333B82F6) : const Color(0xFF1D4ED8).withValues(alpha: 0.4);
      textColor = colors.primaryButtonText;
    } else {
      badgeGradient = isDark
          ? const LinearGradient(
              colors: [Color(0xFF333333), Color(0xFF1A1A1A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            )
          : const LinearGradient(
              colors: [Color(0xFFE5E7EB), Color(0xFFD1D5DB)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            );
      borderColor = isDark ? colors.border : colors.border.withValues(alpha: 0.3);
      textColor = isDark ? colors.textSecondary : const Color(0xFF1F2937);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: badgeGradient,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor, width: 0.75),
        boxShadow: [
          BoxShadow(
            color: colors.isDark ? Colors.black.withValues(alpha: 0.1) : colors.border.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        cleanRole,
        style: TextStyle(
          fontSize: 8,
          fontWeight: FontWeight.w900,
          color: textColor,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildPlaceholder(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(width: 60, height: 20, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(8))),
        const SizedBox(height: 12),
        Container(width: 100, height: 16, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(4))),
        const SizedBox(height: 8),
        Container(width: 200, height: 32, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(8))),
      ],
    ).animate(onPlay: (controller) => controller.repeat()).shimmer(duration: 1.5.seconds);
  }
}
