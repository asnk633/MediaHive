import 'package:flutter/material.dart';

double textScaleOf(BuildContext context) {
  final mediaQuery = MediaQuery.maybeOf(context);
  if (mediaQuery == null) return 1.0;
  
  try {
    // scale(1.0) returns the raw text scale factor directly in newer Flutter versions
    final factor = mediaQuery.textScaler.scale(1.0);
    return factor.clamp(0.8, 1.3);
  } catch (_) {
    // Fallback for older Flutter versions
    // ignore: deprecated_member_use
    final factor = mediaQuery.textScaleFactor;
    return factor.clamp(0.8, 1.3);
  }
}
