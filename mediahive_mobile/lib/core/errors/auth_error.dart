import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import 'dart:async';

/// 🔹 Domain-specific exceptions that carry UI-ready messages
class AuthDomainException implements Exception {
  final String code;
  final String uiMessage;
  const AuthDomainException({required this.code, required this.uiMessage});
}

class SessionExpiredException extends AuthDomainException {
  const SessionExpiredException() : super(code: 'SESSION_EXPIRED', uiMessage: 'Your session has expired. Redirecting to login...');
}

class NetworkConnectionException extends AuthDomainException {
  const NetworkConnectionException() : super(code: 'NETWORK_FAILURE', uiMessage: 'Unable to connect to the server. Please check your internet.');
}

class InvalidCredentialsException extends AuthDomainException {
  const InvalidCredentialsException({String? detail}) : super(
    code: 'INVALID_CREDENTIALS', 
    uiMessage: detail ?? 'Invalid email or password.'
  );
}

/// 🔹 Centralized mapper: Converts raw errors → domain exceptions
class AuthErrorMapper {
  static AuthDomainException map(dynamic error) {
    // Already mapped? Return as-is
    if (error is AuthDomainException) return error;

    // Supabase Auth Exceptions
    if (error is AuthException) {
      switch (error.code) {
        case 'refresh_token_not_found':
        case 'invalid_grant':
        case 'session_not_found':
          return const SessionExpiredException();
        case 'invalid_credentials':
        case 'user_already_exists':
          return InvalidCredentialsException(detail: error.message);
        case 'network_error':
          return const NetworkConnectionException();
        default:
          return AuthDomainException(
            code: 'AUTH_UNKNOWN',
            uiMessage: error.message ?? 'Authentication failed. Please try again.',
          );
      }
    }

    // Networking / IO Exceptions
    if (error is SocketException || error is FormatException) {
      return const NetworkConnectionException();
    }
    
    // Timeout handling
    if (error is TimeoutException) {
      return const AuthDomainException(code: 'TIMEOUT', uiMessage: 'Request timed out. Please try again.');
    }

    // Fallback for unexpected types
    return const AuthDomainException(
      code: 'UNKNOWN', 
      uiMessage: 'An unexpected error occurred.'
    );
  }
}
