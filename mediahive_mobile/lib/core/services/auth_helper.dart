import 'package:supabase_flutter/supabase_flutter.dart';

Future<String?> getFreshAccessToken() async {
  final auth = Supabase.instance.client.auth;
  final session = auth.currentSession;
  if (session == null) return null;
  if (session.isExpired) {
    final res = await auth.refreshSession();
    return res.session?.accessToken;
  }
  return session.accessToken;
}
