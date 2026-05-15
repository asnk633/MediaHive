import 'package:flutter/material.dart';

class AppColors {
  // Dark Theme Base
  static const Color backgroundPrimary = Color(0xFF000000);
  static const Color backgroundSecondary = Color(0xFF0A0E21);
  static const Color surface = Color(0xFF1A1F38);
  static const Color border = Color(0xFF1E293B);

  // Brand Identity
  static const Color honey = Color(0xFFFFB300);
  static const Color honeyLight = Color(0xFFFFD54F);

  // Text
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Gradients
  static const Gradient primaryGradient = LinearGradient(
    colors: [honey, honeyLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient darkGradient = LinearGradient(
    colors: [backgroundSecondary, backgroundPrimary],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
