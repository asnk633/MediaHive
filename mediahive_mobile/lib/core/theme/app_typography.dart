import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTypography {
  static const String primaryFont = '.SF Pro Text';
  static const String displayFont = '.SF Pro Display';
  static const String logoFont = 'BavistaSoulvare';

  static TextStyle get h1 => const TextStyle(
    fontFamily: displayFont,
    fontSize: 32,
    fontWeight: FontWeight.w900,
    letterSpacing: -0.28,
    height: 1.07,
  );

  static TextStyle get h2 => const TextStyle(
    fontFamily: displayFont,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.28,
    height: 1.10,
  );

  static TextStyle get h3 => const TextStyle(
    fontFamily: displayFont,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.224,
    height: 1.19,
  );

  static TextStyle get bodyL => const TextStyle(
    fontFamily: primaryFont,
    fontSize: 17, // Core Apple reading text size
    fontWeight: FontWeight.w400,
    letterSpacing: -0.374,
    height: 1.47,
  );

  static TextStyle get bodyM => const TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.224,
    height: 1.43,
  );

  static TextStyle get bodyS => const TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.12,
  );

  static TextStyle get caption => const TextStyle(
    fontFamily: primaryFont,
    fontSize: 10,
    fontWeight: FontWeight.w500,
    letterSpacing: -0.08,
  );

  static TextStyle get logoText => const TextStyle(
    fontFamily: logoFont,
    fontSize: 26,
    letterSpacing: 0.2,
    color: AppColors.honey,
  );
}
