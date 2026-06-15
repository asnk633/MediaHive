import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/services/field_work_service.dart';
import '../../data/services/presence_verification_service.dart';
import '../../data/services/mock_location_detector.dart';
import '../../../../core/providers/user_provider.dart';

// ─── Field Work Service Provider ─────────────────────────────

final fieldWorkServiceProvider = Provider<FieldWorkService>((ref) {
  return FieldWorkService(Supabase.instance.client);
});

/// Active field work session for the current user.
/// Returns null if no active session, or the session map if one exists.
final activeFieldWorkSessionProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final authState = ref.watch(authStateProvider);
  final userId = authState.value?.session?.user.id ??
      Supabase.instance.client.auth.currentUser?.id;
  if (userId == null) return null;

  final service = ref.watch(fieldWorkServiceProvider);
  return service.getActiveFieldWorkSession(userId);
});

/// Pending field work sessions for manager approval view.
final pendingFieldWorkSessionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(fieldWorkServiceProvider);
  return service.getPendingFieldWorkSessions();
});

/// Field work history for current user.
final fieldWorkHistoryProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final authState = ref.watch(authStateProvider);
  final userId = authState.value?.session?.user.id ??
      Supabase.instance.client.auth.currentUser?.id;
  if (userId == null) return [];

  final service = ref.watch(fieldWorkServiceProvider);
  return service.getFieldWorkHistory(userId);
});

// ─── Presence Verification Service Provider ──────────────────

final presenceVerificationServiceProvider = Provider<PresenceVerificationService>((ref) {
  final mockDetector = MockLocationDetector();
  final service = PresenceVerificationService(Supabase.instance.client, mockDetector);

  // Clean up on dispose
  ref.onDispose(() => service.stop());

  return service;
});

/// Whether presence verification is currently active.
final isPresenceVerificationActiveProvider = Provider<bool>((ref) {
  return ref.watch(presenceVerificationServiceProvider).isActive;
});

/// Whether the system is in shadow mode (log-only, no enforcement).
final isShadowModeProvider = Provider<bool>((ref) {
  return ref.watch(presenceVerificationServiceProvider).isShadowMode;
});
