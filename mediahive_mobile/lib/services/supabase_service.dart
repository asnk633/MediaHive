import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/institutional_data.dart';

class SupabaseService {
  final _client = Supabase.instance.client;

  Future<List<Institution>> getInstitutions() async {
    try {
      final response = await _client
          .from('institutions')
          .select('id, name')
          .eq('status', 'active')
          .order('name');
      
      return (response as List).map((json) => Institution.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch institutions: $e');
    }
  }

  Future<List<Department>> getDepartments() async {
    try {
      final response = await _client
          .from('departments')
          .select('id, name')
          .eq('status', 'active')
          .order('name');
      
      return (response as List).map((json) => Department.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch departments: $e');
    }
  }

  Future<List<UserProfile>> getMediaTeam() async {
    try {
      final response = await _client
          .from('profiles')
          .select('id, full_name, email, role, avatar_url')
          .filter('role', 'in', '("admin","manager","team")')
          .eq('status', 'active')
          .order('full_name');
      
      return (response as List).map((json) => UserProfile.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch media team: $e');
    }
  }

  // Auth Methods
  Future<AuthResponse> signIn(String email, String password) async {
    try {
      return await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
    } on AuthException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Sign in failed: $e');
    }
  }

  Future<AuthResponse> signUp(String email, String password, Map<String, dynamic> data) async {
    try {
      return await _client.auth.signUp(
        email: email,
        password: password,
        data: data,
      );
    } on AuthException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Sign up failed: $e');
    }
  }

  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } catch (e) {
      throw Exception('Sign out failed: $e');
    }
  }

  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
}
