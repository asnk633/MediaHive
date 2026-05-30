import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/providers/user_provider.dart';

enum UserRole { admin, manager, team, member }

class MhRoleGuard extends ConsumerWidget {
  final List<UserRole> allowedRoles;
  final Widget child;
  final Widget? fallback;

  const MhRoleGuard({
    super.key,
    required this.allowedRoles,
    required this.child,
    this.fallback,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authServiceProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    final user = auth.currentUser;
    
    if (user == null) return _buildUnauthorized();

    return profileAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _buildUnauthorized(),
      data: (dbProfile) {
        // Prefer live DB role over Auth metadata
        final roleStr = dbProfile?['role'] as String? ?? user.userMetadata?['role'] as String?;
        final userRole = _parseRole(roleStr);

        if (allowedRoles.contains(userRole)) {
          return child;
        }

        return fallback ?? _buildUnauthorized();
      },
    );
  }

  UserRole _parseRole(String? role) {
    if (role == null) return UserRole.member;
    
    // Normalize string: remove spaces and underscores, convert to lowercase
    final normalized = role.replaceAll(' ', '').replaceAll('_', '').toLowerCase();
    
    switch (normalized) {
      case 'admin':
      case 'superadmin':
        return UserRole.admin;
      case 'manager':
      case 'globalmanager':
        return UserRole.manager;
      case 'team':
        return UserRole.team;
      default:
        return UserRole.member;
    }
  }

  Widget _buildUnauthorized() {
    return const SizedBox.shrink();
  }
}
