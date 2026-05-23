import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.dark);

class ThemeColors {
  final bool isDark;
  final Color backgroundPrimary;
  final Color backgroundSecondary;
  final Color textPrimary;
  final Color textSecondary;
  final Color surface;
  final Color border;
  final List<BoxShadow> cardShadow;
  final Color iconColor;
  final Color honey;
  final Color indigo;
  final Color emerald;
  final Color error;

  const ThemeColors({
    required this.isDark,
    required this.backgroundPrimary,
    required this.backgroundSecondary,
    required this.textPrimary,
    required this.textSecondary,
    required this.surface,
    required this.border,
    required this.cardShadow,
    required this.iconColor,
    required this.honey,
    required this.indigo,
    required this.emerald,
    required this.error,
  });

  factory ThemeColors.dark() {
    return const ThemeColors(
      isDark: true,
      backgroundPrimary: Color(0xFF000000),
      backgroundSecondary: Color(0xFF0A0E21),
      textPrimary: Colors.white,
      textSecondary: Color(0xFF94A3B8),
      surface: Color(0xFF1A1F38),
      border: Color(0xFF1E293B),
      iconColor: Colors.white,
      honey: Color(0xFFE59312),
      indigo: Color(0xFF6366F1),
      emerald: Color(0xFF10B981),
      error: Color(0xFFEF4444),
      cardShadow: [],
    );
  }

  factory ThemeColors.light() {
    return ThemeColors(
      isDark: false,
      backgroundPrimary: const Color(0xFFC4C3CC),
      backgroundSecondary: const Color(0xFFDFDFAB),
      textPrimary: const Color(0xFF000000),
      textSecondary: const Color(0xFF334155),
      surface: Colors.white.withOpacity(0.8),
      border: const Color(0xFF000000).withOpacity(0.3),
      iconColor: const Color(0xFF000000),
      honey: const Color(0xFFE59312),
      indigo: const Color(0xFF6366F1),
      emerald: const Color(0xFF10B981),
      error: const Color(0xFFEF4444),
      cardShadow: const [
        BoxShadow(
          color: Color(0x33000000),
          blurRadius: 20,
          offset: Offset(0, 10),
        ),
      ],
    );
  }
}

final themeColorsProvider = Provider<ThemeColors>((ref) {
  final mode = ref.watch(themeModeProvider);
  return mode == ThemeMode.dark ? ThemeColors.dark() : ThemeColors.light();
});
