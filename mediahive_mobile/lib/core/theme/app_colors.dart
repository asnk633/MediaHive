import 'package:flutter/material.dart';
import '../design_tokens.dart';

class AppColors {
  // ─── Dark Theme Base (FinTech Plataforma Financeira) ────────────────────────────────
  static const Color backgroundPrimary    = Color(0xFF000000);   // Pure Black
  static const Color backgroundSecondary  = Color(0xFF1A1A1A);   // Dark Grey
  static const Color surface              = Color(0xFF1E1E1E);   // Dark card surface
  static const Color surfaceElevated      = Color(0xFF252525);   // Elevated surface
  static const Color charcoal             = Color(0xFF333333);   // Charcoal
  static const Color border               = Color(0x26FFD700);   // Gold @ 15%
  static const Color borderStrong         = Color(0x4DFFD700);   // Gold @ 30%

  // ─── Light / Spatial UI (VisionOS) Palette ─────────────────────────────────
  static const Color lightBackground      = DesignTokens.lightBackground;
  static const Color lightBackgroundAlt   = DesignTokens.lightBackgroundAlt;
  static const Color lightSurface         = DesignTokens.lightSurface;
  static const Color lightSurfaceFrosted  = DesignTokens.lightSurfaceFrosted;
  static const Color lightBorder          = DesignTokens.lightBorder;
  static const Color lightBorderStrong    = DesignTokens.lightBorderStrong;
  static const Color lightTextPrimary     = DesignTokens.lightTextPrimary;
  static const Color lightTextSecondary   = DesignTokens.lightTextSecondary;
  static const Color lightTextMuted       = DesignTokens.lightTextMuted;

  // ─── Brand Identity ─────────────────────────────────────────────────────────────
  static const Color honey                = Color(0xFFFFD700);   // Gold — dark-theme primary
  static const Color softGold             = Color(0xFFC9A84C);   // Soft Gold — secondary
  static const Color lightHoney           = DesignTokens.lightHoney; // vivid VisionOS blue

  // ─── Text ──────────────────────────────────────────────────────────────────
  static const Color textPrimary          = Colors.white;
  static const Color textSecondary        = Color(0xFFCCCCCC);
  static const Color textMuted            = Color(0xFF7A7A7A);

  // ─── Status ────────────────────────────────────────────────────────────────
  static const Color success              = Color(0xFF10B981);
  static const Color warning              = Color(0xFFF59E0B);
  static const Color error               = Color(0xFFEF4444);
  static const Color info                 = Color(0xFF2997FF);

  // ─── Gradients ─────────────────────────────────────────────────────────────

  // FinTech dark — gold primary gradient
  static const Gradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFFD700), Color(0xFFC9A84C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // FinTech dark — deep background gradient
  static const Gradient darkGradient = LinearGradient(
    colors: [Color(0xFF000000), Color(0xFF1A1A1A)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const Gradient errorGradient = LinearGradient(
    colors: [error, error],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Spatial UI — light primary button gradient
  static const Gradient lightPrimaryGradient = LinearGradient(
    colors: [Color(0xFF006EE6), Color(0xFF40A0FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Spatial UI — sky canvas gradient (light background)
  static const Gradient lightBackgroundGradient = LinearGradient(
    colors: [Color(0xFFEFF3FC), Color(0xFFF7F9FF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ─── Glass helpers ─────────────────────────────────────────────────────────
  static Color glassBackground(double opacity)  => Colors.white.withOpacity(opacity);
  static Color glassBorder(double opacity)      => Colors.white.withOpacity(opacity);

  static const Color glassSurface     = Color(0x1AFFFFFF);  // dark glass fill
  static const Color glassBorderLight = Color(0x33FFFFFF);

  // Light-theme glass fill (higher opacity for VisionOS frosted look)
  static Color lightGlassFill(double opacity) => Colors.white.withOpacity(opacity);
  static Color lightGlassBorder() => const Color(0x26AAAACC);
}
