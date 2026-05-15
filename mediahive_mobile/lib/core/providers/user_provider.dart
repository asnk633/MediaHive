import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../services/auth_service.dart';

/// Provider to manage the local profile image path globally with Hive persistence.
final profileImagePathProvider = StateNotifierProvider<ProfileImagePathNotifier, String?>((ref) {
  return ProfileImagePathNotifier();
});

class ProfileImagePathNotifier extends StateNotifier<String?> {
  ProfileImagePathNotifier() : super(null) {
    _loadFromHive();
  }

  static const _boxName = 'app_settings';
  static const _key = 'profile_image_path';

  Future<void> _loadFromHive() async {
    final box = await Hive.openBox(_boxName);
    state = box.get(_key) as String?;
  }

  Future<void> updatePath(String? path) async {
    final box = await Hive.openBox(_boxName);
    await box.put(_key, path);
    state = path;
  }
}

/// Provider to fetch and cache all departments for ID mapping.
final departmentsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await Supabase.instance.client
      .from('departments')
      .select('id, name');
  return List<Map<String, dynamic>>.from(response);
});

/// Provider to fetch and cache all institutions for ID mapping.
final institutionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await Supabase.instance.client
      .from('institutions')
      .select('id, name');
  return List<Map<String, dynamic>>.from(response);
});

/// Provider to fetch the live user profile from the database, ensuring
/// global roles and names (Institution, Department) are resolved.
final currentUserProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final auth = ref.watch(authServiceProvider);
  final user = auth.currentUser;
  if (user == null) return null;

  try {
    print('[USER_PROVIDER] Fetching profile for: ${user.id}');
    
    // Fetch profile
    final profile = await Supabase.instance.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
    if (profile == null) {
      print('[USER_PROVIDER] Profile not found in database');
      return null;
    }

    // 1. Resolve Institution Name
    String? institutionName;
    try {
      final institutionsAsync = await ref.read(institutionsProvider.future);
      final instId = profile['institution_id']?.toString();
      
      if (instId != null) {
        final inst = institutionsAsync.firstWhere(
          (i) => i['id'].toString() == instId,
          orElse: () => <String, dynamic>{},
        );
        institutionName = inst['name'] as String?;
      }

      if (institutionName == null) {
        final allowed = profile['allowed_institutions'] as List?;
        if (allowed != null && allowed.isNotEmpty) {
          final firstAllowedId = allowed.first.toString();
          final inst = institutionsAsync.firstWhere(
            (i) => i['id'].toString() == firstAllowedId,
            orElse: () => <String, dynamic>{},
          );
          institutionName = inst['name'] as String?;
        }
      }
    } catch (e) {
      print('[USER_PROVIDER] Error resolving institution: $e');
    }

    institutionName ??= 'ThaiBa Garden';

    // 2. Resolve Department Name
    String? departmentName;
    try {
      final departmentsAsync = await ref.read(departmentsProvider.future);
      final deptId = profile['department_id']?.toString();
      
      if (deptId != null) {
        final dept = departmentsAsync.firstWhere(
          (d) => d['id'].toString() == deptId,
          orElse: () => <String, dynamic>{},
        );
        departmentName = dept['name'] as String?;
      }
    } catch (e) {
      print('[USER_PROVIDER] Error resolving department: $e');
    }

    departmentName ??= 'General';

    // 3. Resolve Avatar URL (ensure Drive links are accessible)
    String? avatarUrl = profile['avatar_url'] as String?;
    if (avatarUrl != null && avatarUrl.contains('drive.google.com')) {
      String? fileId;
      final uri = Uri.tryParse(avatarUrl);
      
      // Handle query parameter id=...
      fileId = uri?.queryParameters['id'];
      
      // Handle path-based ID: /file/d/ID/view
      if (fileId == null && avatarUrl.contains('/d/')) {
        final parts = avatarUrl.split('/d/');
        if (parts.length > 1) {
          fileId = parts[1].split('/')[0];
        }
      }

      if (fileId != null) {
        avatarUrl = 'https://lh3.googleusercontent.com/d/$fileId=s1000';
      }
    }

    print('[USER_PROVIDER] Resolved profile for ${profile['full_name']}: $institutionName / $departmentName');

    return {
      ...profile,
      'avatar_url': avatarUrl,
      'institution_name': institutionName,
      'department_name': departmentName,
    };
  } catch (e) {
    print('[USER_PROVIDER] Critical error in provider: $e');
    return null;
  }
});
