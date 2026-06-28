import 'package:flutter/material.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';

class AppColors {
  // ─── Dark Theme Base (FinTech Plataforma Financeira) ────────────────────────────────
  static const Color backgroundPrimary    = DesignTokens.backgroundPrimary;
  static const Color backgroundSecondary  = DesignTokens.backgroundSecondary;
  static const Color surface              = DesignTokens.surface;
  static const Color surfaceElevated      = Color(0xFF252525);   // Elevated surface
  static const Color charcoal             = Color(0xFF333333);   // Charcoal
  static const Color border               = DesignTokens.border;
  static const Color borderStrong         = DesignTokens.borderStrong;

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
  static const Color honey                = DesignTokens.honey;
  static const Color softGold             = DesignTokens.softGold;
  static const Color lightHoney           = DesignTokens.lightHoney; // vivid VisionOS blue

  // ─── Text ──────────────────────────────────────────────────────────────────
  static const Color textPrimary          = Colors.white;
  static const Color textSecondary        = Color(0xFFCCCCCC);
  static const Color textMuted            = Color(0xFF7A7A7A);

  // ─── Status ────────────────────────────────────────────────────────────────
  static const Color success              = DesignTokens.success;
  static const Color warning              = DesignTokens.warning;
  static const Color error               = DesignTokens.danger;
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
  static Color glassBackground(double opacity)  => Colors.white.withValues(alpha: opacity);
  static Color glassBorder(double opacity)      => Colors.white.withValues(alpha: opacity);

  static const Color glassSurface     = Color(0x1AFFFFFF);  // dark glass fill
  static const Color glassBorderLight = Color(0x33FFFFFF);

  // Light-theme glass fill (higher opacity for VisionOS frosted look)
  static Color lightGlassFill(double opacity) => Colors.white.withValues(alpha: opacity);
  static Color lightGlassBorder() => const Color(0x26AAAACC);
}
