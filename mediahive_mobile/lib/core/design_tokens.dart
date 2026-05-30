import 'package:flutter/material.dart';
import 'dart:ui';

class DesignTokens {
  // ─── Dark Theme Palette (FinTech Plataforma Financeira) ──────────────────
  static const Color backgroundPrimary    = Color(0xFF000000);   // Pure Black — deepest canvas
  static const Color backgroundSecondary  = Color(0xFF1A1A1A);   // Dark Grey — mid-layer
  static const Color surface              = Color(0xFF1E1E1E);   // Dark card surface
  static const Color surfaceElevated      = Color(0xFF252525);   // Slightly elevated surface
  static const Color charcoal             = Color(0xFF333333);   // Charcoal accent surface
  static const Color honey                = Color(0xFFFFD700);   // Gold — primary accent
  static const Color softGold             = Color(0xFFC9A84C);   // Soft Gold — secondary accent
  static const Color textPrimary          = Colors.white;
  static const Color textSecondary        = Color(0xFFCCCCCC);
  static const Color border               = Color(0x26FFD700);   // Gold border @ 15% opacity
  static const Color borderStrong         = Color(0x4DFFD700);   // Gold border @ 30% opacity

  // ─── Light / Spatial UI (VisionOS) Palette ────────────────────────────────
  // Background: soft luminous white with a barely-there blue-sky tint
  static const Color lightBackground      = Color(0xFFF2F5FB);   // canvas
  static const Color lightBackgroundAlt   = Color(0xFFE8EDF8);   // subtle depth layer
  static const Color lightSurface         = Color(0xFFFFFFFF);   // frosted panel base
  static const Color lightSurfaceFrosted  = Color(0xCCFFFFFF);   // ~80 % white frost
  static const Color lightBorder          = Color(0x26AAAACC);   // ultra-thin glass rim
  static const Color lightBorderStrong    = Color(0x40AAAACC);   // slightly more visible
  static const Color lightTextPrimary     = Color(0xFF1D1D1F);
  static const Color lightTextSecondary   = Color(0xFF48484A);
  static const Color lightTextMuted       = Color(0xFF8E8E93);
  static const Color lightHoney           = Color(0xFF006EE6);   // vivid VisionOS blue
  static const Color lightHoneyGlow       = Color(0x330066CC);   // glow tint

  // ─── Status Colors (shared) ────────────────────────────────────────────────
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger  = Color(0xFFEF4444);

  // ─── Gradients ─────────────────────────────────────────────────────────────

  /// FinTech dark — gold primary button gradient
  static const Gradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFFD700), Color(0xFFC9A84C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// FinTech dark — deep background gradient (black → dark grey)
  static const Gradient darkBackgroundGradient = LinearGradient(
    colors: [Color(0xFF000000), Color(0xFF1A1A1A)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const Gradient secondaryGradient = LinearGradient(
    colors: [Color(0xFFC9A84C), Color(0xFFFFD700)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient successGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF10B981)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  /// Spatial UI — light-mode button gradient (crisp blue → brighter blue)
  static const Gradient lightPrimaryGradient = LinearGradient(
    colors: [Color(0xFF006EE6), Color(0xFF40A0FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Spatial UI — ambient background gradient (sky canvas)
  static const Gradient lightBackgroundGradient = LinearGradient(
    colors: [Color(0xFFEFF3FC), Color(0xFFF7F9FF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ─── Spacing ───────────────────────────────────────────────────────────────
  static const double spacingXs      = 4.0;
  static const double spacingS       = 8.0;
  static const double spacingM       = 12.0;
  static const double spacingL       = 17.0; // Apple 17pt
  static const double spacingXl      = 24.0;
  static const double spacingXxl     = 32.0;
  static const double spacingSection = 80.0;

  // ─── Border Radii ──────────────────────────────────────────────────────────
  static const double radiusS    = 8.0;
  static const double radiusM    = 11.0;
  static const double radiusL    = 16.0;
  static const double radiusXl   = 24.0;   // Spatial card radius
  static const double radiusFull = 100.0;

  // ─── Shadows ───────────────────────────────────────────────────────────────

  // Shared non-gold shadow
  static List<BoxShadow> glowPrimary = [];
  static List<BoxShadow> glowHoney   = [];

  // Product photography shadow (shared)
  static List<BoxShadow> productShadow = [
    const BoxShadow(
      color: Color(0x38000000),
      offset: Offset(3, 5),
      blurRadius: 30,
      spreadRadius: 0,
    ),
  ];

  // ─── FinTech Dark — Gold Glow Shadows ─────────────────────────────────────

  /// FinTech — floating card shadow with a subtle gold halo
  static List<BoxShadow> get fintechCardShadow => [
    const BoxShadow(
      color: Color(0x1AFFD700), // Gold @ 10% — near crisp halo
      blurRadius: 15,
      spreadRadius: 0,
      offset: Offset(0, 4),
    ),
    const BoxShadow(
      color: Color(0x0D000000), // Black @ 5% — ambient depth
      blurRadius: 30,
      spreadRadius: 0,
      offset: Offset(0, 8),
    ),
  ];

  /// FinTech — dock/nav bar gold under-glow
  static List<BoxShadow> get fintechDockShadow => [
    const BoxShadow(
      color: Color(0x26FFD700), // Gold @ 15%
      blurRadius: 20,
      spreadRadius: 0,
      offset: Offset(0, -4),
    ),
    const BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 40,
      spreadRadius: -4,
      offset: Offset(0, 8),
    ),
  ];

  /// FinTech — chip/badge subtle gold glow
  static List<BoxShadow> get fintechChipShadow => [
    const BoxShadow(
      color: Color(0x1AFFD700), // Gold @ 10%
      blurRadius: 8,
      spreadRadius: 0,
      offset: Offset(0, 2),
    ),
  ];

  /// FinTech — gold glow for interactive elements (FAB, primary buttons)
  static List<BoxShadow> get fintechGlowGold => [
    const BoxShadow(
      color: Color(0x33FFD700), // Gold @ 20%
      blurRadius: 24,
      spreadRadius: 0,
      offset: Offset(0, 0),
    ),
    const BoxShadow(
      color: Color(0x1AFFD700), // Gold @ 10% wider spread
      blurRadius: 48,
      spreadRadius: -4,
      offset: Offset(0, 4),
    ),
  ];

  // ─── Spatial UI (Light Theme) Shadows ─────────────────────────────────────

  /// Spatial UI — floating card shadow (light theme)
  /// Two-layer: crisp near shadow + diffused ambient depth
  static List<BoxShadow> get spatialCardShadow => [
    const BoxShadow(
      color: Color(0x14000000), // 8 % black — near crisp
      blurRadius: 8,
      spreadRadius: 0,
      offset: Offset(0, 2),
    ),
    const BoxShadow(
      color: Color(0x22000000), // 13 % black — ambient depth
      blurRadius: 40,
      spreadRadius: -4,
      offset: Offset(0, 12),
    ),
  ];

  /// Spatial UI — subtle elevated shadow for chips/pills
  static List<BoxShadow> get spatialChipShadow => [
    const BoxShadow(
      color: Color(0x0F000000),
      blurRadius: 6,
      spreadRadius: 0,
      offset: Offset(0, 2),
    ),
  ];

  /// Spatial UI — deep inset / bottom dock shadow
  static List<BoxShadow> get spatialDockShadow => [
    const BoxShadow(
      color: Color(0x18000000),
      blurRadius: 20,
      spreadRadius: 0,
      offset: Offset(0, 6),
    ),
    const BoxShadow(
      color: Color(0x10000000),
      blurRadius: 60,
      spreadRadius: -8,
      offset: Offset(0, 24),
    ),
  ];

  /// Spatial UI — blue glow for interactive elements (light theme)
  static List<BoxShadow> get spatialGlowBlue => [
    const BoxShadow(
      color: lightHoneyGlow,
      blurRadius: 24,
      spreadRadius: 0,
      offset: Offset(0, 4),
    ),
  ];

  // ─── Glassmorphism helpers ─────────────────────────────────────────────────

  /// Generic glass box decoration.
  /// [opacity] controls how opaque the white fill is.
  /// In dark theme pass dark surface colors; in light theme use defaults.
  static BoxDecoration glassDecoration({
    double opacity = 0.1,
    double blur = 10.0,
    double borderRadius = 16.0,
    Color? borderColor,
    Color? fillColor,
  }) {
    return BoxDecoration(
      color: (fillColor ?? Colors.white).withOpacity(opacity),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? Colors.white.withOpacity(0.15),
        width: 0.75,
      ),
    );
  }

  /// Spatial UI frosted-glass box decoration (light theme variant).
  /// Produces a visionOS-style translucent panel.
  static BoxDecoration spatialGlassDecoration({
    double opacity = 0.72,
    double borderRadius = 24.0,
    Color? borderColor,
    List<BoxShadow>? shadows,
  }) {
    return BoxDecoration(
      color: Colors.white.withOpacity(opacity),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? lightBorder,
        width: 0.75,
      ),
      boxShadow: shadows ?? spatialCardShadow,
    );
  }

  // ─── Widget helpers ────────────────────────────────────────────────────────

  /// Dark-theme glassmorphic container (BackdropFilter + blur).
  static Widget glassMorphicContainer({
    required Widget child,
    double opacity = 0.05,
    double blur = 15.0,
    double borderRadius = 20.0,
    Color? borderColor,
    EdgeInsetsGeometry? padding,
    double? width,
    double? height,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          width: width,
          height: height,
          padding: padding,
          decoration: glassDecoration(
            opacity: opacity,
            borderRadius: borderRadius,
            borderColor: borderColor,
          ),
          child: child,
        ),
      ),
    );
  }

  /// Spatial UI frosted-glass container (light theme).
  /// Strong blur (σ=28) + high white opacity mimics visionOS panels.
  static Widget spatialContainer({
    required Widget child,
    double opacity = 0.72,
    double blur = 28.0,
    double borderRadius = 24.0,
    Color? borderColor,
    List<BoxShadow>? shadows,
    EdgeInsetsGeometry? padding,
    double? width,
    double? height,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          width: width,
          height: height,
          padding: padding,
          decoration: spatialGlassDecoration(
            opacity: opacity,
            borderRadius: borderRadius,
            borderColor: borderColor,
            shadows: shadows,
          ),
          child: child,
        ),
      ),
    );
  }
}
