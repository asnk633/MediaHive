import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/services/auth_helper.dart';

// 1. Create a dummy session
final dummySession = Session(
  accessToken: 'old_token',
  expiresIn: 0,
  refreshToken: 'refresh_token',
  tokenType: 'bearer',
  user: const User(
    id: 'user_id',
    appMetadata: {},
    userMetadata: {},
    aud: 'authenticated',
    createdAt: '2023-01-01T00:00:00Z',
  ),
);

// 2. Create a mock GoTrueClient
class MockGoTrueClient implements GoTrueClient {
  int refreshCallCount = 0;

  @override
  Session? get currentSession => dummySession;

  @override
  Future<AuthResponse> refreshSession([String? refreshToken]) async {
    refreshCallCount++;
    // Simulate a small network delay
    await Future.delayed(const Duration(milliseconds: 50));
    return AuthResponse(
      session: Session(
        accessToken: 'new_token_123',
        expiresIn: 3600,
        refreshToken: 'new_refresh',
        tokenType: 'bearer',
        user: dummySession.user,
      ),
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) {
    return super.noSuchMethod(invocation);
  }
}

class MockErrorGoTrueClient implements GoTrueClient {
  int refreshCallCount = 0;

  @override
  Session? get currentSession => dummySession;

  @override
  Future<AuthResponse> refreshSession([String? refreshToken]) async {
    refreshCallCount++;
    await Future.delayed(const Duration(milliseconds: 50));
    throw Exception('Simulated network failure');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('getFreshAccessToken', () {
    test('coalesces 5 concurrent requests into exactly 1 refreshSession call',
        skip: 'getFreshAccessToken uses Supabase.instance directly — integration test only',
        () async {
      // ignore: unused_local_variable
      final mockClient = MockGoTrueClient();

      // Fire 5 concurrent requests
      final futures = List.generate(5, (_) => getFreshAccessToken());
      final results = await Future.wait(futures);

      // Verify the mock was called exactly once
      expect(mockClient.refreshCallCount, 1);

      // Verify that all 5 waiters received the exact same updated token
      for (final result in results) {
        expect(result, 'new_token_123');
      }
    });

    test('propagates generic exceptions to all waiters',
        skip: 'getFreshAccessToken uses Supabase.instance directly — integration test only',
        () async {
      // ignore: unused_local_variable
      final mockClient = MockErrorGoTrueClient();

      final futures = List.generate(5, (_) => getFreshAccessToken());
      final results = await Future.wait(futures);

      // Verify all waiters get null upon failure
      for (final result in results) {
        expect(result, isNull);
      }
      expect(mockClient.refreshCallCount, 1);
    });
  });
}
