import 'package:flutter/material.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';

class AppColors {
  // ─── Dark Theme Base (FinTech Plataforma Financeira) ────────────────────────────────
  static const Color backgroundPrimary    = DesignTokens.backgroundPrimary;
  static const Color backgroundSecondary  = DesignTokens.backgroundSecondary;
  static const Color surface              = DesignTokens.surface;
  static const Color surfaceElevated      = DesignTokens.surfaceElevated;
  static const Color charcoal             = DesignTokens.charcoal;
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
  static const Color textPrimary          = DesignTokens.textPrimary;
  static const Color textSecondary        = DesignTokens.textSecondary;
  static const Color textMuted            = Color(0xFF7A7A7A);

  // ─── Status ────────────────────────────────────────────────────────────────
  static const Color success              = DesignTokens.success;
  static const Color warning              = DesignTokens.warning;
  static const Color error               = DesignTokens.danger;
  static const Color info                 = Color(0xFF2997FF);

  // ─── Gradients ─────────────────────────────────────────────────────────────

  // FinTech dark — gold primary gradient
  static const Gradient primaryGradient = DesignTokens.primaryGradient;

  // FinTech dark — deep background gradient
  static const Gradient darkGradient = DesignTokens.darkBackgroundGradient;

  static const Gradient errorGradient = LinearGradient(
    colors: [error, error],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Spatial UI — light primary button gradient
  static const Gradient lightPrimaryGradient = DesignTokens.lightPrimaryGradient;

  // Spatial UI — sky canvas gradient (light background)
  static const Gradient lightBackgroundGradient = DesignTokens.lightBackgroundGradient;

  // ─── Glass helpers ─────────────────────────────────────────────────────────
  static Color glassBackground(double opacity)  => Colors.white.withValues(alpha: opacity);
  static Color glassBorder(double opacity)      => Colors.white.withValues(alpha: opacity);

  static const Color glassSurface     = Color(0x1AFFFFFF);  // dark glass fill
  static const Color glassBorderLight = Color(0x33FFFFFF);

  // Light-theme glass fill (higher opacity for VisionOS frosted look)
  static Color lightGlassFill(double opacity) => Colors.white.withValues(alpha: opacity);
  static Color lightGlassBorder() => const Color(0x26AAAACC);
}
