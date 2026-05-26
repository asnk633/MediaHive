import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'design_tokens.dart';

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.dark) {
    _loadFromHive();
  }

  static const _boxName = 'app_settings';
  static const _key = 'theme_mode';

  Future<void> _loadFromHive() async {
    final box = await Hive.openBox(_boxName);
    final savedMode = box.get(_key) as String?;
    if (savedMode == 'dark') {
      state = ThemeMode.dark;
    } else if (savedMode == 'light') {
      state = ThemeMode.light;
    } else {
      state = ThemeMode.dark; // Default to Dark FinTech style
    }
  }

  Future<void> toggleTheme() async {
    final box = await Hive.openBox(_boxName);
    if (state == ThemeMode.dark) {
      state = ThemeMode.light;
      await box.put(_key, 'light');
    } else {
      state = ThemeMode.dark;
      await box.put(_key, 'dark');
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final box = await Hive.openBox(_boxName);
    state = mode;
    await box.put(_key, mode == ThemeMode.dark ? 'dark' : 'light');
  }
}

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

// ─── ThemeColors ──────────────────────────────────────────────────────────────

class ThemeColors {
  final bool isDark;
  final Color backgroundPrimary;
  final Color backgroundSecondary;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color surface;
  final Color border;
  final Color borderStrong;
  final List<BoxShadow> cardShadow;
  final List<BoxShadow> dockShadow;
  final List<BoxShadow> chipShadow;
  final List<BoxShadow> glowBlue;
  final Color iconColor;
  final Color honey;
  final Color indigo;
  final Color emerald;
  final Color error;

  // Glass decoration helpers (theme-aware)
  final double glassOpacity;
  final double glassBlur;
  final double glassBorderRadius;

  const ThemeColors({
    required this.isDark,
    required this.backgroundPrimary,
    required this.backgroundSecondary,
    required this.textPrimary,
    required this.textSecondary,
    this.textMuted = const Color(0xFF8E8E93),
    required this.surface,
    required this.border,
    this.borderStrong = const Color(0xFF3A3A3C),
    required this.cardShadow,
    this.dockShadow = const [],
    this.chipShadow = const [],
    this.glowBlue = const [],
    required this.iconColor,
    required this.honey,
    required this.indigo,
    required this.emerald,
    required this.error,
    this.glassOpacity = 0.08,
    this.glassBlur = 20.0,
    this.glassBorderRadius = 20.0,
  });

  // ── Dark — FinTech Plataforma Financeira ────────────────────────────────────
  factory ThemeColors.dark() {
    return ThemeColors(
      isDark: true,
      // ▸ Pure black base canvas — deepest layer
      backgroundPrimary: const Color(0xFF000000),
      // ▸ Dark Grey — mid-layer depth
      backgroundSecondary: const Color(0xFF1A1A1A),
      // ▸ Text
      textPrimary: Colors.white,
      textSecondary: const Color(0xFFCCCCCC),
      textMuted: const Color(0xFF666666),
      // ▸ Charcoal dark card surface
      surface: const Color(0xFF1E1E1E),
      // ▸ Gold-tinted hairline borders
      border: const Color(0x26FFD700),       // Gold @ 15%
      borderStrong: const Color(0x4DFFD700), // Gold @ 30%
      iconColor: Colors.white,
      // ▸ Gold — primary brand accent (buttons, active icons, highlights)
      honey: const Color(0xFFFFD700),
      // ▸ Soft Gold — secondary accent (subtitles, badges, charts)
      indigo: const Color(0xFFC9A84C),
      // ▸ Emerald — kept for success/positive states
      emerald: const Color(0xFF10B981),
      error: const Color(0xFFEF4444),
      // ▸ FinTech gold glow shadows
      cardShadow: DesignTokens.fintechCardShadow,
      dockShadow: DesignTokens.fintechDockShadow,
      chipShadow: DesignTokens.fintechChipShadow,
      glowBlue: DesignTokens.fintechGlowGold,
      // ▸ Subtle dark glass — charcoal @ 40% for dark overlays
      glassOpacity: 0.40,
      glassBlur: 20.0,
      glassBorderRadius: 16.0,
    );
  }

  // ── Light / Spatial UI (VisionOS) ────────────────────────────────────────────
  factory ThemeColors.light() {
    return ThemeColors(
      isDark: false,
      // ▸ Canvas: slightly warm white-blue sky — depth layer visible beneath cards
      backgroundPrimary: const Color(0xFFF0F4FC),
      backgroundSecondary: const Color(0xFFE7EDF8),
      // ▸ Text
      textPrimary: const Color(0xFF1D1D1F),
      textSecondary: const Color(0xFF48484A),
      textMuted: const Color(0xFF8E8E93),
      // ▸ Frosted glass surface (will be shown through BackdropFilter)
      surface: const Color(0xE6FFFFFF),    // ~90% white
      // ▸ Hairline borders — ultra-thin glass rim
      border: const Color(0x26AAAACC),
      borderStrong: const Color(0x50AAAACC),
      iconColor: const Color(0xFF1D1D1F),
      // ▸ VisionOS vivid blue — stays saturated even on bright backgrounds
      honey: const Color(0xFF006EE6),
      indigo: const Color(0xFF5E5CE6),
      emerald: const Color(0xFF10B981),
      error: const Color(0xFFEF4444),
      // ▸ Two-layer depth shadow (near + ambient)
      cardShadow: DesignTokens.spatialCardShadow,
      dockShadow: DesignTokens.spatialDockShadow,
      chipShadow: DesignTokens.spatialChipShadow,
      glowBlue: DesignTokens.spatialGlowBlue,
      // ▸ Glass parameters
      glassOpacity: 0.72,
      glassBlur: 28.0,
      glassBorderRadius: 24.0,
    );
  }

  // ── Convenience getters ──────────────────────────────────────────────────────

  /// Returns the right card background based on current theme.
  Color get cardSurface => isDark ? surface : const Color(0xF5FFFFFF);

  /// Returns the appropriate scaffold fill: plain black for dark, gradient-base for light.
  Color get scaffoldColor => isDark ? backgroundPrimary : backgroundPrimary;

  /// Glass fill color for use with ClipRRect + BackdropFilter.
  Color get glassFill =>
      isDark ? Colors.white.withOpacity(0.07) : Colors.white.withOpacity(glassOpacity);

  /// Glass border color.
  Color get glassBorderColor => isDark
      ? Colors.white.withOpacity(0.12)
      : const Color(0x26AAAACC);

  /// Button text color for primary buttons.
  Color get primaryButtonText => isDark ? Colors.black : Colors.white;
}

// ─── Providers ────────────────────────────────────────────────────────────────

final themeColorsProvider = Provider<ThemeColors>((ref) {
  final mode = ref.watch(themeModeProvider);
  return mode == ThemeMode.dark ? ThemeColors.dark() : ThemeColors.light();
});
