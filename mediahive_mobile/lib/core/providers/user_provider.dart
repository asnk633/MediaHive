import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../services/auth_service.dart';
import '../../models/institutional_data.dart';

/// Provider to manage the local profile image path globally with Hive persistence.
final authStateProvider = StreamProvider<AuthState>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange;
});

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
final departmentsProvider = FutureProvider<List<Department>>((ref) async {
  final response = await Supabase.instance.client
      .from('departments')
      .select('id, name');
  return (response as List).map((d) => Department.fromJson(d)).toList();
});

/// Provider to fetch and cache all institutions for ID mapping.
final institutionsProvider = FutureProvider<List<Institution>>((ref) async {
  final response = await Supabase.instance.client
      .from('institutions')
      .select('id, name');
  return (response as List).map((i) => Institution.fromJson(i)).toList();
});

/// Provider to fetch the live user profile from the database, ensuring
/// global roles and names (Institution, Department) are resolved.
final currentUserProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  // Watch auth state to ensure we re-run on login/logout/signup
  final authState = ref.watch(authStateProvider);
  final user = authState.value?.session?.user ?? Supabase.instance.client.auth.currentUser;
  
  if (user == null) {
    print('[USER_PROVIDER] No authenticated user found');
    return null;
  }

  try {
    print('[USER_PROVIDER] Fetching profile for: ${user.id}');
    
    // Fetch profile from DB
    final profileResponse = await Supabase.instance.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
    // Metadata fallback if profile record doesn't exist yet (race condition after signup)
    final metadata = user.userMetadata ?? {};
    final bool isVirtual = profileResponse == null;
    
    final Map<String, dynamic> profile = profileResponse ?? {
      'id': user.id,
      'full_name': metadata['full_name'] ?? user.email?.split('@').first ?? 'Unknown User',
      'role': metadata['role'] ?? 'Member',
      'institution_id': metadata['institution_id'],
      'department_id': metadata['department_id'] ?? metadata['department'],
      'avatar_url': metadata['avatar_url'],
      'is_virtual': true,
    };

    if (isVirtual) {
      print('[USER_PROVIDER] Profile not found in DB, using virtual profile from metadata');
    }

    // 1. Resolve Institution Name
    String? institutionName;
    try {
      final institutionsAsync = await ref.read(institutionsProvider.future);
      final instId = profile['institution_id']?.toString();
      
      if (instId != null && instId.isNotEmpty) {
        final inst = institutionsAsync.firstWhere(
          (i) => i.id.toString() == instId,
          orElse: () => Institution(id: '', name: 'Unknown'),
        );
        if (inst.name != 'Unknown') {
          institutionName = inst.name;
        }
      }

      // Check allowed_institutions if primary id failed
      if (institutionName == null) {
        final allowed = profile['allowed_institutions'] as List?;
        if (allowed != null && allowed.isNotEmpty) {
          final firstAllowedId = allowed.first.toString();
          final inst = institutionsAsync.firstWhere(
            (i) => i.id.toString() == firstAllowedId,
            orElse: () => Institution(id: '', name: 'Unknown'),
          );
          if (inst.name != 'Unknown') {
            institutionName = inst.name;
          }
        }
      }
    } catch (e) {
      print('[USER_PROVIDER] Error resolving institution: $e');
    }

    institutionName ??= 'None';

    // 2. Resolve Department Name
    String? departmentName;
    try {
      final departmentsAsync = await ref.read(departmentsProvider.future);
      final deptId = profile['department_id']?.toString();
      
      if (deptId != null && deptId.isNotEmpty) {
        final dept = departmentsAsync.firstWhere(
          (d) => d.id.toString() == deptId,
          orElse: () => Department(id: 0, name: 'General'),
        );
        if (dept.name != 'General') {
          departmentName = dept.name;
        }
      }
    } catch (e) {
      print('[USER_PROVIDER] Error resolving department: $e');
    }

    departmentName ??= 'None';

    // 3. Resolve Avatar URL (ensure Drive links are accessible)
    String? avatarUrl = profile['avatar_url'] as String?;
    if (avatarUrl != null && avatarUrl.contains('drive.google.com')) {
      String? fileId;
      final uri = Uri.tryParse(avatarUrl);
      
      fileId = uri?.queryParameters['id'];
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

    print('[USER_PROVIDER] Resolved profile for ${profile['full_name']}: $institutionName / $departmentName (Virtual: $isVirtual)');

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

/// Provider to fetch all user profiles for assignment lists
final allUsersProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  try {
    final response = await Supabase.instance.client
        .from('profiles')
        .select('id, full_name, role, avatar_url, email, department_id, institution_id')
        .order('full_name', ascending: true);
        
    return List<Map<String, dynamic>>.from(response);
  } catch (e) {
    print('[USER_PROVIDER] Error fetching all users: $e');
    return [];
  }
});
