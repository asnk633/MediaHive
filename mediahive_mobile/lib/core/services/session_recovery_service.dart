import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'snackbar_service.dart';
import 'package:mediahive_mobile/core/router/router.dart';

class SessionRecoveryService {
  static Future<void> handleExpiredSession() async {
    // 1. Notify UI (context-free, works from anywhere)
    SnackbarService.show(
      text: 'Session expired. Please sign in again.',
      duration: const Duration(seconds: 2),
    );

    // 2. Redirect & clear backstack
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final context = rootNavigatorKey.currentContext;
      if (context != null) {
        context.go('/login');
      }
    });
  }
}
