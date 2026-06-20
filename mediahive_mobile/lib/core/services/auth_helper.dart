import 'dart:async';
import 'dart:developer' as developer;
import 'package:supabase_flutter/supabase_flutter.dart';

Completer<String?>? _refreshCompleter;

Future<String?> getFreshAccessToken([GoTrueClient? mockAuthClient]) async {
  final auth = mockAuthClient ?? Supabase.instance.client.auth;
  final session = auth.currentSession;
  if (session == null) return null;

  final expiresAt = session.expiresAt;
  
  // If expiresAt is null (unlikely but possible), safely treat it as expired to force a refresh.
  final isExpiredOrClose = expiresAt == null || 
      DateTime.fromMillisecondsSinceEpoch(expiresAt * 1000).difference(DateTime.now()).inSeconds < 60;

  if (isExpiredOrClose || session.isExpired) {
    if (_refreshCompleter != null) {
      developer.log(
        'Piggybacking on in-flight token refresh',
        name: 'AuthHelper',
      );
      try {
        return await _refreshCompleter!.future;
      } catch (_) {
        return null;
      }
    }

    _refreshCompleter = Completer<String?>();

    try {
      final res = await auth.refreshSession().timeout(const Duration(seconds: 15));
      final newToken = res.session?.accessToken;
      
      if (!_refreshCompleter!.isCompleted) {
        _refreshCompleter!.complete(newToken);
      }
      return newToken;
    } catch (e, stackTrace) {
      if (!_refreshCompleter!.isCompleted) {
        _refreshCompleter!.completeError(e, stackTrace);
      }
      return null;
    } finally {
      _refreshCompleter = null;
    }
  }
  
  return session.accessToken;
}
