import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';
import 'fcm_service.dart';

class AuthService {
  final SupabaseClient _client;
  final LoggerService _logger;
  final Ref _ref;
  StreamSubscription<AuthState>? _authSubscription;

  AuthService(this._client, this._logger, this._ref) {
    _init();
  }

  void _init() {
    _authSubscription = _client.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      _logger.info('Auth Event: ${event.name}');
      
      if (event == AuthChangeEvent.signedIn) {
        _logger.info('User signed in: ${session?.user.email}');
        _ref.read(fcmServiceProvider).initialize();
        _ref.read(fcmServiceProvider).uploadTokenForCurrentUser();
      } else if (event == AuthChangeEvent.signedOut) {
        _logger.info('User signed out');
        _ref.read(fcmServiceProvider).deregisterToken();
      } else if (event == AuthChangeEvent.tokenRefreshed) {
        _logger.info('Session token refreshed successfully');
      } else if (event == AuthChangeEvent.userUpdated) {
        _logger.info('User metadata updated');
      }
    });
  }

  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;

  Future<AuthResponse> signInWithEmail(String email, String password) async {
    _logger.info('Attempting sign-in for: $email');
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _logger.info('Sign-in successful for: $email');
      return response;
    } catch (e) {
      _logger.error('Sign-in failed for: $email', e);
      rethrow;
    }
  }

  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    required String name,
    String? institutionId,
    String? departmentId,
  }) async {
    _logger.info('Attempting sign-up for: $email');
    try {
      final response = await _client.auth.signUp(
        email: email,
        password: password,
        data: {
          'full_name': name,
          'institution_id': institutionId,
          'department_id': departmentId,
          'department': departmentId, // Backward compatibility
          'role': 'Member', // Default role
        },
      );
      _logger.info('Sign-up successful for: $email');
      return response;
    } catch (e) {
      _logger.error('Sign-up failed for: $email', e);
      rethrow;
    }
  }

  Future<void> signOut() async {
    _logger.info('Signing out user');
    await _client.auth.signOut();
  }

  Future<UserResponse> updatePassword(String newPassword) async {
    _logger.info('Attempting password update for current user');
    try {
      final response = await _client.auth.updateUser(
        UserAttributes(
          password: newPassword,
        ),
      );
      _logger.info('Password update successful');
      return response;
    } catch (e) {
      _logger.error('Password update failed', e);
      rethrow;
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    _logger.info('Requesting password reset email for: $email');
    try {
      await _client.auth.resetPasswordForEmail(email);
      _logger.info('Password reset email requested successfully');
    } catch (e) {
      _logger.error('Password reset email request failed', e);
      rethrow;
    }
  }

  Future<AuthResponse> verifyRecoveryOtp({
    required String email,
    required String token,
  }) async {
    _logger.info('Verifying recovery OTP for: $email');
    try {
      final response = await _client.auth.verifyOTP(
        email: email,
        token: token,
        type: OtpType.recovery,
      );
      _logger.info('Recovery OTP verification successful');
      return response;
    } catch (e) {
      _logger.error('Recovery OTP verification failed', e);
      rethrow;
    }
  }

  void dispose() {
    _authSubscription?.cancel();
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  final client = Supabase.instance.client;
  final logger = ref.watch(loggerProvider.notifier);
  return AuthService(client, logger, ref);
});
