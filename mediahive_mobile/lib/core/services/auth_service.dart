import 'dart:async';
import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';
import 'fcm_service.dart';
import '../errors/auth_error.dart';
import 'session_recovery_service.dart';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final SupabaseClient _client;
  final LoggerService _logger;
  final Ref _ref;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  StreamSubscription<AuthState>? _authSubscription;

  AuthService(this._client, this._logger, this._ref) {
    _init();
  }

  void _init() {
    _authSubscription = _client.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      _logger.info('Auth Event: ${event.name}');
      
      if (session == null && event != AuthChangeEvent.signedIn && event != AuthChangeEvent.initialSession) {
        // Session lost/expired -> trigger recovery
        SessionRecoveryService.handleExpiredSession();
      }

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
    } on AuthException catch (e) {
      _logger.error('Sign-in auth exception', e);
      throw AuthErrorMapper.map(e);
    } on SocketException catch (e) {
      _logger.error('Sign-in socket exception', e);
      throw const NetworkConnectionException();
    } on TimeoutException catch (e) {
      _logger.error('Sign-in timeout', e);
      throw const AuthDomainException(code: 'TIMEOUT', uiMessage: 'Sign-in timed out.');
    } catch (e) {
      _logger.error('Sign-in failed for: $email', e);
      throw AuthErrorMapper.map(e);
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
          // Note: role is now enforced by a DB trigger, we pass it but DB dictates truth
          'role': 'Member', 
        },
      );
      _logger.info('Sign-up successful for: $email');
      return response;
    } on AuthException catch (e) {
      _logger.error('Sign-up auth exception', e);
      throw AuthErrorMapper.map(e);
    } on SocketException catch (e) {
      _logger.error('Sign-up socket exception', e);
      throw const NetworkConnectionException();
    } on TimeoutException catch (e) {
      _logger.error('Sign-up timeout', e);
      throw const AuthDomainException(code: 'TIMEOUT', uiMessage: 'Sign-up timed out.');
    } catch (e) {
      _logger.error('Sign-up failed for: $email', e);
      throw AuthErrorMapper.map(e);
    }
  }

  Future<void> signOut() async {
    _logger.info('Signing out user');
    try {
      await _client.auth.signOut();
    } catch (e) {
      _logger.error('Sign out failed', e);
    }
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
    } on AuthException catch (e) {
      _logger.error('Password update auth exception', e);
      throw AuthErrorMapper.map(e);
    } on SocketException {
      throw const NetworkConnectionException();
    } catch (e) {
      _logger.error('Password update failed', e);
      throw AuthErrorMapper.map(e);
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    _logger.info('Requesting password reset email for: $email');
    try {
      await _client.auth.resetPasswordForEmail(email);
      _logger.info('Password reset email requested successfully');
    } on AuthException catch (e) {
      _logger.error('Password reset email auth exception', e);
      throw AuthErrorMapper.map(e);
    } on SocketException {
      throw const NetworkConnectionException();
    } catch (e) {
      _logger.error('Password reset email request failed', e);
      throw AuthErrorMapper.map(e);
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
    } on AuthException catch (e) {
      _logger.error('Recovery OTP verification auth exception', e);
      throw AuthErrorMapper.map(e);
    } on SocketException {
      throw const NetworkConnectionException();
    } catch (e) {
      _logger.error('Recovery OTP verification failed', e);
      throw AuthErrorMapper.map(e);
    }
  }

  Future<void> saveCredentials(String email, String password) async {
    await _storage.write(key: 'saved_email', value: email);
    await _storage.write(key: 'saved_password', value: password);
  }

  Future<Map<String, String>?> loadCredentials() async {
    final email = await _storage.read(key: 'saved_email');
    final password = await _storage.read(key: 'saved_password');
    if (email != null && password != null) {
      return {'email': email, 'password': password};
    }
    return null;
  }

  Future<void> clearCredentials() async {
    await _storage.delete(key: 'saved_email');
    await _storage.delete(key: 'saved_password');
  }

  Future<AuthResponse?> signInWithGoogle() async {
    _logger.info('Attempting Google Sign-In');
    try {
      const webClientId = '1072972448256-0534k3oaepkmdtvpp5q0ir4pjadeqvml.apps.googleusercontent.com'; // Replace with actual Web Client ID
      const iosClientId = 'YOUR_IOS_CLIENT_ID'; // Replace with actual iOS Client ID
      
      final GoogleSignIn googleSignIn = GoogleSignIn(
        serverClientId: webClientId,
        clientId: iosClientId,
      );
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        _logger.info('Google Sign-In canceled by user');
        return null;
      }
      final googleAuth = await googleUser.authentication;
      final accessToken = googleAuth.accessToken;
      final idToken = googleAuth.idToken;

      if (accessToken == null || idToken == null) {
        throw const AuthDomainException(code: 'GOOGLE_SIGN_IN_FAILED', uiMessage: 'Failed to retrieve Google tokens');
      }

      final response = await _client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );
      _logger.info('Google Sign-In successful');
      return response;
    } catch (e) {
      _logger.error('Google Sign-In failed', e);
      throw AuthErrorMapper.map(e);
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
