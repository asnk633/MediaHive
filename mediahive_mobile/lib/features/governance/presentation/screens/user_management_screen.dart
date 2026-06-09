import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/mh_loading.dart';
import '../../../../shared/widgets/mh_button.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final userSearchQueryProvider = StateProvider<String>((ref) => '');
final userManagementTabProvider = StateProvider<int>((ref) => 0); // 0: Active, 1: Invitations

final usersListProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final query = ref.watch(userSearchQueryProvider);
  
  var request = supabase.from('profiles').select('*').order('full_name');
  
  final response = await request;
  final users = List<Map<String, dynamic>>.from(response);
  
  if (query.isEmpty) return users;
  
  return users.where((u) {
    final name = (u['full_name'] as String? ?? '').toLowerCase();
    final email = (u['email'] as String? ?? '').toLowerCase();
    final search = query.toLowerCase();
    return name.contains(search) || email.contains(search);
  }).toList();
});

final departmentsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final response = await supabase.from('departments').select('*').order('name');
  return List<Map<String, dynamic>>.from(response);
});

final institutionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final response = await supabase.from('institutions').select('*').order('name');
  return List<Map<String, dynamic>>.from(response);
});

final invitesListProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final response = await supabase.from('invites').select('*').order('created_at', ascending: false);
  return List<Map<String, dynamic>>.from(response);
});

class UserManagementScreen extends ConsumerWidget {
  const UserManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final usersAsync = ref.watch(usersListProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.backgroundSecondary, colors.backgroundPrimary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 100), // Increased to definitively clear the large shell header
              // Custom Header + Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(LucideIcons.chevronLeft, color: colors.textPrimary, size: 20),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'USER MANAGEMENT',
                            style: AppTypography.h1.copyWith(
                              color: colors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'GLOBAL ACCESS CONTROL',
                            style: AppTypography.caption.copyWith(
                              color: colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    MhButton(
                      label: 'Invite User',
                      onTap: () => _showInviteUser(context, ref, colors),
                      height: 32,
                      width: 90,
                    ).animate().fadeIn(delay: 200.ms).scale(),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1),
              
              const SizedBox(height: 10),
              
              // Tab Switcher
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: colors.surface.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _TabButton(
                          label: 'ACTIVE USERS',
                          isActive: ref.watch(userManagementTabProvider) == 0,
                          onTap: () => ref.read(userManagementTabProvider.notifier).state = 0,
                          colors: colors,
                        ),
                      ),
                      Expanded(
                        child: _TabButton(
                          label: 'INVITATIONS',
                          isActive: ref.watch(userManagementTabProvider) == 1,
                          onTap: () => ref.read(userManagementTabProvider.notifier).state = 1,
                          colors: colors,
                        ),
                      ),
                    ],
                  ),
                ),
              ).animate().fadeIn(delay: 200.ms),
              
              const SizedBox(height: 20),
              
              // Search Bar (Only for Active Users)
              if (ref.watch(userManagementTabProvider) == 0)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: colors.surface.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colors.border.withValues(alpha: 0.2)),
                    ),
                    child: TextField(
                      style: TextStyle(color: colors.textPrimary, fontSize: 14),
                      onChanged: (val) => ref.read(userSearchQueryProvider.notifier).state = val,
                      decoration: InputDecoration(
                        icon: Icon(LucideIcons.search, size: 18, color: colors.honey),
                        hintText: 'Search users...',
                        hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5), fontSize: 14),
                        border: InputBorder.none, filled: false,
                      ),
                    ),
                  ),
                ),
              
              const SizedBox(height: 20),
              
              // Content
              Expanded(
                child: ref.watch(userManagementTabProvider) == 0
                    ? _buildActiveUsersList(ref, colors)
                    : _buildInvitationsList(ref, colors),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveUsersList(WidgetRef ref, ThemeColors colors) {
    final usersAsync = ref.watch(usersListProvider);
    
    return usersAsync.when(
      data: (users) => ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: users.length,
        itemBuilder: (context, index) {
          final user = users[index];
          return _buildUserTile(context, user, colors);
        },
      ),
      loading: () => const Center(child: MhLoading()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildInvitationsList(WidgetRef ref, ThemeColors colors) {
    final invitesAsync = ref.watch(invitesListProvider);
    
    return invitesAsync.when(
      data: (invites) => invites.isEmpty 
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.mail, size: 48, color: colors.textSecondary.withValues(alpha: 0.2)),
                const SizedBox(height: 16),
                Text(
                  'NO PENDING INVITATIONS',
                  style: TextStyle(
                    color: colors.textSecondary.withValues(alpha: 0.5),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            itemCount: invites.length,
            itemBuilder: (context, index) {
              final invite = invites[index];
              return _buildInviteTile(context, invite, colors);
            },
          ),
      loading: () => const Center(child: MhLoading()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildInviteTile(BuildContext context, Map<String, dynamic> invite, ThemeColors colors) {
    final email = invite['email'] as String;
    final status = invite['status'] as String? ?? 'pending';
    final createdAt = invite['created_at'] != null 
        ? DateTime.parse(invite['created_at'].toString()) 
        : DateTime.now();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border.withValues(alpha: 0.1)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: colors.honey.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(LucideIcons.mail, color: colors.honey, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    email,
                    style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: colors.honey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          status.toUpperCase(),
                          style: TextStyle(color: colors.honey, fontSize: 8, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Sent ${createdAt.day}/${createdAt.month}/${createdAt.year}',
                        style: TextStyle(color: colors.textSecondary, fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.moreVertical, color: colors.textSecondary, size: 18),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1);
  }

  Widget _buildTab(String label, bool active, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: active ? colors.backgroundPrimary : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        boxShadow: active ? [
          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2)),
        ] : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? colors.textPrimary : colors.textSecondary.withValues(alpha: 0.6),
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildUserTile(BuildContext context, Map<String, dynamic> user, ThemeColors colors) {
    final fullName = user['full_name'] as String? ?? 'Unknown User';
    final email = user['email'] as String? ?? '';
    final rawRole = user['role'] as String? ?? 'member';
    final role = rawRole.toLowerCase() == 'guest' ? 'member' : rawRole;
    final avatarUrl = user['avatar_url'] as String?;

    Color roleColor;
    switch (role.toLowerCase()) {
      case 'admin':
        roleColor = colors.indigo;
        break;
      case 'manager':
        roleColor = colors.emerald;
        break;
      default:
        roleColor = colors.honey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showUserDetails(context, user, colors),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colors.border.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: roleColor.withValues(alpha: 0.5), width: 2),
                ),
                child: CircleAvatar(
                  radius: 24,
                  backgroundColor: colors.backgroundPrimary,
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null 
                      ? Text(fullName[0].toUpperCase(), style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold)) 
                      : null,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fullName,
                      style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: roleColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            role.toUpperCase(),
                            style: TextStyle(color: roleColor, fontSize: 8, fontWeight: FontWeight.w900),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            email.length > 5 ? email.replaceRange(1, email.indexOf('@'), '***') : email,
                            style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.7), fontSize: 10, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, size: 16, color: colors.textSecondary.withValues(alpha: 0.2)),
            ],
          ),
        ),
      ),
    );
  }

  void _showInviteUser(BuildContext context, WidgetRef ref, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) => _InviteUserModal(colors: colors),
    );
  }

  void _showUserDetails(BuildContext context, Map<String, dynamic> user, ThemeColors colors) {
    final fullName = user['full_name'] as String? ?? 'Unknown User';
    final email = user['email'] as String? ?? '';
    final rawRole = user['role'] as String? ?? 'member';
    final role = rawRole.toLowerCase() == 'guest' ? 'member' : rawRole;
    final avatarUrl = user['avatar_url'] as String?;
    final department = user['department'] as String? ?? 'GENERAL';

    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        height: MediaQuery.of(context).size.height * 0.85,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.textSecondary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 32),
            
            // Header
            Row(
              children: [
                Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: colors.backgroundPrimary,
                      backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                      child: avatarUrl == null 
                          ? Text(fullName[0].toUpperCase(), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)) 
                          : null,
                    ),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: colors.indigo,
                        shape: BoxShape.circle,
                        border: Border.all(color: colors.surface, width: 2),
                      ),
                      child: const Icon(LucideIcons.shieldCheck, color: Colors.white, size: 12),
                    ),
                  ],
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(fullName, style: TextStyle(color: colors.textPrimary, fontSize: 24, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildBadge(email.length > 5 ? email.replaceRange(1, email.indexOf('@'), '***') : email, LucideIcons.mail, colors.textSecondary.withValues(alpha: 0.1), colors.textSecondary, colors),
                          _buildBadge('GLOBAL ${role.toUpperCase()}', LucideIcons.shield, colors.indigo.withValues(alpha: 0.1), colors.indigo, colors),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildBadge(department.toUpperCase(), LucideIcons.mapPin, const Color(0xFF10B981).withValues(alpha: 0.1), const Color(0xFF10B981), colors),
                    ],
                  ),
                ),
                Column(
                  children: [
                    _buildIconButton(LucideIcons.trash2, Colors.redAccent.withValues(alpha: 0.1), Colors.redAccent),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(color: colors.border),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Deactivate', style: TextStyle(color: colors.textPrimary, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
            
            const SizedBox(height: 40),
            
            // Workspace Access
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.building2, color: colors.textSecondary.withValues(alpha: 0.5), size: 18),
                    const SizedBox(width: 8),
                    Text('WORKSPACE ACCESS CONTROL', style: TextStyle(color: colors.textSecondary, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                  ],
                ),
                Text('+ ADD WORKSPACE', style: TextStyle(color: colors.honey, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 20),
            
            _buildWorkspaceItem(department, 'PRIMARY DEPARTMENT', colors),
            
            const Spacer(),
            MhButton(
              label: 'Save Changes',
              onTap: () => Navigator.pop(context),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String label, IconData icon, Color bgColor, Color textColor, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: textColor),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: textColor, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildIconButton(IconData icon, Color bgColor, Color iconColor) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: iconColor, size: 18),
    );
  }

  Widget _buildWorkspaceItem(String title, String subtitle, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.backgroundPrimary.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.mapPin, color: Color(0xFF10B981), size: 18),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: colors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
                Text(subtitle, style: const TextStyle(color: Color(0xFF10B981), fontSize: 8, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('ASSIGNEE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
          ),
          const SizedBox(width: 12),
          Icon(LucideIcons.trash2, color: colors.textSecondary.withValues(alpha: 0.3), size: 16),
        ],
      ),
    );
  }
}

class _InviteUserModal extends ConsumerStatefulWidget {
  final ThemeColors colors;
  const _InviteUserModal({required this.colors});

  @override
  ConsumerState<_InviteUserModal> createState() => _InviteUserModalState();
}

class _InviteUserModalState extends ConsumerState<_InviteUserModal> {
  final Set<String> selectedDepartments = {};
  final Set<String> selectedInstitutions = {};
  final TextEditingController emailController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final departmentsAsync = ref.watch(departmentsProvider);
    final institutionsAsync = ref.watch(institutionsProvider);

    return Container(
      padding: const EdgeInsets.all(24),
      height: MediaQuery.of(context).size.height * 0.9,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 80), // Clear the shell header area in modal
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Invite New User',
                    style: TextStyle(color: colors.textPrimary, fontSize: 20, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Provision multi-layer access controls',
                    style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.6), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: Icon(LucideIcons.x, color: colors.textSecondary),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          Text(
            'RECIPIENT EMAIL',
            style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: colors.backgroundPrimary.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.border.withValues(alpha: 0.3)),
            ),
            child: TextField(
              controller: emailController,
              style: TextStyle(color: colors.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                icon: Icon(LucideIcons.mail, size: 18, color: colors.textSecondary.withValues(alpha: 0.5)),
                hintText: 'user@example.com',
                hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.3), fontSize: 14),
                border: InputBorder.none, filled: false,
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          Expanded(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      'INSTITUTION ACCESS',
                      style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                    ),
                  ),
                ),
                institutionsAsync.when(
                  data: (institutions) => SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final inst = institutions[index];
                        final name = inst['name'] as String;
                        final id = inst['id'].toString();
                        final isSelected = selectedInstitutions.contains(id);
                        return _buildAccessTile(name, id, isSelected, () {
                          setState(() {
                            if (isSelected) {
                              selectedInstitutions.remove(id);
                            } else {
                              selectedInstitutions.add(id);
                            }
                          });
                        }, colors);
                      },
                      childCount: institutions.length,
                    ),
                  ),
                  loading: () => const SliverToBoxAdapter(child: MhLoading()),
                  error: (e, _) => SliverToBoxAdapter(child: Center(child: Text('Error: $e'))),
                ),
                
                const SliverToBoxAdapter(child: SizedBox(height: 32)),
                
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      'DEPARTMENT ACCESS',
                      style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                    ),
                  ),
                ),
                departmentsAsync.when(
                  data: (departments) => SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final dept = departments[index];
                        final name = dept['name'] as String;
                        final id = dept['id'].toString();
                        final isSelected = selectedDepartments.contains(id);
                        return _buildAccessTile(name, id, isSelected, () {
                          setState(() {
                            if (isSelected) {
                              selectedDepartments.remove(id);
                            } else {
                              selectedDepartments.add(id);
                            }
                          });
                        }, colors);
                      },
                      childCount: departments.length,
                    ),
                  ),
                  loading: () => const SliverToBoxAdapter(child: MhLoading()),
                  error: (e, _) => SliverToBoxAdapter(child: Center(child: Text('Error: $e'))),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          MhButton(
            label: 'Send Invitation',
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Invitation sent successfully')),
              );
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildAccessTile(String name, String id, bool isSelected, VoidCallback onTap, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: colors.surface.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? colors.indigo : colors.border.withValues(alpha: 0.2),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: isSelected ? colors.indigo : Colors.transparent,
                  border: Border.all(
                    color: isSelected ? colors.indigo : colors.textSecondary.withValues(alpha: 0.3),
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: isSelected 
                    ? const Icon(LucideIcons.check, color: Colors.white, size: 14)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  name,
                  style: TextStyle(
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontSize: 14,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final ThemeColors colors;

  const _TabButton({
    required this.label,
    required this.isActive,
    required this.onTap,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isActive ? colors.backgroundPrimary : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? colors.border.withValues(alpha: 0.2) : Colors.transparent,
          ),
          boxShadow: isActive ? [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ] : [],
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? colors.textPrimary : colors.textSecondary,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }
}
