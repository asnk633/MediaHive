import 'package:flutter/material.dart';

class DesignTokens {
  // Colors (Premium Dark Theme)
  static const Color backgroundPrimary = Color(0xFF000000);
  static const Color backgroundSecondary = Color(0xFF0A0E21);
  static const Color surface = Color(0xFF1A1F38);
  static const Color honey = Color(0xFFE59312); // Refined brand color
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color border = Color(0xFF1E293B);

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);

  // Gradients
  static const Gradient primaryGradient = LinearGradient(
    colors: [Color(0xFFE59312), Color(0xFFFFD54F)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient secondaryGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient successGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF34D399)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Spacing (8pt Grid)
  static const double spacingXs = 4.0;
  static const double spacingS = 8.0;
  static const double spacingM = 16.0;
  static const double spacingL = 24.0;
  static const double spacingXl = 32.0;

  // Border Radii
  static const double radiusS = 8.0;
  static const double radiusM = 12.0;
  static const double radiusL = 16.0;
  static const double radiusFull = 100.0;

  // Elevation & Glows
  static List<BoxShadow> glowPrimary = [
    BoxShadow(
      color: const Color(0xFFE59312).withOpacity(0.3),
      blurRadius: 12,
      spreadRadius: 2,
    ),
  ];
}
