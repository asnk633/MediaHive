import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/mh_button.dart';
import '../../../../shared/widgets/mh_loading.dart';

final workspaceSearchQueryProvider = StateProvider<String>((ref) => '');
final workspaceTabProvider = StateProvider<int>((ref) => 0); // 0: Institutions, 1: Departments

final combinedWorkspacesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final query = ref.watch(workspaceSearchQueryProvider);
  
  // Fetch Institutions
  final instResponse = await supabase.from('institutions').select('*').order('name');
  final institutions = List<Map<String, dynamic>>.from(instResponse).map((e) => {
    ...e,
    'type': 'INSTITUTION',
    'is_archived': e['is_archived'] ?? false,
  }).toList();
  
  // Fetch Departments
  final deptResponse = await supabase.from('departments').select('*').order('name');
  final departments = List<Map<String, dynamic>>.from(deptResponse).map((e) => {
    ...e,
    'type': 'DEPARTMENT',
    'is_archived': e['is_archived'] ?? false,
  }).toList();
  
  final all = [...institutions, ...departments];
  
  if (query.isEmpty) return all;
  
  return all.where((w) {
    final name = (w['name'] as String? ?? '').toLowerCase();
    return name.contains(query.toLowerCase());
  }).toList();
});

class WorkspaceManagementScreen extends ConsumerWidget {
  const WorkspaceManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final workspacesAsync = ref.watch(combinedWorkspacesProvider);
    final activeTab = ref.watch(workspaceTabProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colors.backgroundPrimary,
              colors.backgroundSecondary.withOpacity(0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 100), // Clear shell header
              
              // Header Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
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
                            'WORKSPACES',
                            style: AppTypography.h1.copyWith(
                              color: colors.textPrimary,
                            ),
                          ),
                          Text(
                            'INSTITUTIONAL OVERSIGHT',
                            style: AppTypography.caption.copyWith(
                              color: colors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: colors.honey,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: colors.honey.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(LucideIcons.plus, color: Colors.black, size: 20),
                        onPressed: () => _showCreateWorkspace(context, colors),
                        padding: EdgeInsets.zero,
                      ),
                    ).animate().fadeIn(delay: 200.ms).scale(),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1),
              
              const SizedBox(height: 10),
              
              // Tab Switcher
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: colors.surface.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _WorkspaceTabButton(
                          label: 'INSTITUTIONS',
                          isActive: activeTab == 0,
                          onTap: () => ref.read(workspaceTabProvider.notifier).state = 0,
                          colors: colors,
                        ),
                      ),
                      Expanded(
                        child: _WorkspaceTabButton(
                          label: 'DEPARTMENTS',
                          isActive: activeTab == 1,
                          onTap: () => ref.read(workspaceTabProvider.notifier).state = 1,
                          colors: colors,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: colors.surface.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: colors.border.withOpacity(0.2)),
                  ),
                  child: TextField(
                    style: TextStyle(color: colors.textPrimary, fontSize: 14),
                    onChanged: (val) => ref.read(workspaceSearchQueryProvider.notifier).state = val,
                    decoration: InputDecoration(
                      icon: Icon(LucideIcons.search, size: 16, color: colors.textSecondary.withOpacity(0.5)),
                      hintText: 'Filter by name...',
                      hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.3), fontSize: 14),
                      border: InputBorder.none,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Content
              Expanded(
                child: workspacesAsync.when(
                  data: (workspaces) {
                    final filtered = workspaces.where((w) {
                      final type = w['type'] as String;
                      return activeTab == 0 ? type == 'INSTITUTION' : type == 'DEPARTMENT';
                    }).toList();
                    
                    if (filtered.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.layoutGrid, size: 48, color: colors.textSecondary.withOpacity(0.2)),
                            const SizedBox(height: 16),
                            Text(
                              'NO UNITS FOUND',
                              style: TextStyle(
                                color: colors.textSecondary.withOpacity(0.5),
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    
                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final workspace = filtered[index];
                        return _buildWorkspaceTile(context, workspace, colors);
                      },
                    );
                  },
                  loading: () => const Center(child: MhLoading()),
                  error: (e, _) => Center(child: Text('Error: $e')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWorkspaceTile(BuildContext context, Map<String, dynamic> workspace, ThemeColors colors) {
    final name = workspace['name'] as String? ?? 'Unnamed';
    final type = workspace['type'] as String;
    final isInstitution = type == 'INSTITUTION';
    
    final Color accentColor = isInstitution ? colors.indigo : colors.emerald;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showWorkspaceDetails(context, workspace, colors),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: accentColor.withOpacity(0.1)),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: colors.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: accentColor.withOpacity(0.2)),
                ),
                child: Icon(
                  isInstitution ? LucideIcons.building2 : LucideIcons.layers,
                  color: accentColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        color: colors.textPrimary, 
                        fontWeight: FontWeight.w800, 
                        fontSize: 15,
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildSmallBadge(type, accentColor),
                        const SizedBox(width: 8),
                        Text(
                          '0 MEMBERS',
                          style: TextStyle(
                            color: colors.textSecondary.withOpacity(0.6), 
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, color: colors.textSecondary.withOpacity(0.2), size: 16),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1);
  }

  Widget _buildSmallBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5),
      ),
    );
  }

  void _showWorkspaceDetails(BuildContext context, Map<String, dynamic> workspace, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => _WorkspaceDetailModal(workspace: workspace, colors: colors),
    );
  }

  void _showCreateWorkspace(BuildContext context, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => _CreateWorkspaceModal(colors: colors),
    );
  }
}

class _CreateWorkspaceModal extends StatefulWidget {
  final ThemeColors colors;
  const _CreateWorkspaceModal({required this.colors});

  @override
  State<_CreateWorkspaceModal> createState() => _CreateWorkspaceModalState();
}

class _CreateWorkspaceModalState extends State<_CreateWorkspaceModal> {
  final TextEditingController nameController = TextEditingController();
  String selectedType = 'INSTITUTION'; // INSTITUTION or DEPARTMENT

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final accentColor = selectedType == 'INSTITUTION' ? colors.indigo : colors.emerald;

    return Container(
      padding: const EdgeInsets.all(24),
      height: MediaQuery.of(context).size.height * 0.8,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 24), // Optimized spacing
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'New Workspace',
                    style: TextStyle(color: colors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Provision a new organizational entity',
                    style: TextStyle(color: colors.textSecondary.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: Icon(LucideIcons.x, color: colors.textSecondary),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          Text(
            'ENTITY TYPE',
            style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _TypeButton(
                  label: 'INSTITUTION',
                  icon: LucideIcons.building2,
                  isActive: selectedType == 'INSTITUTION',
                  activeColor: colors.indigo,
                  colors: colors,
                  onTap: () => setState(() => selectedType = 'INSTITUTION'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _TypeButton(
                  label: 'DEPARTMENT',
                  icon: LucideIcons.layers,
                  isActive: selectedType == 'DEPARTMENT',
                  activeColor: colors.emerald,
                  colors: colors,
                  onTap: () => setState(() => selectedType = 'DEPARTMENT'),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          Text(
            'DISPLAY NAME',
            style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: colors.surface.withOpacity(0.3),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: accentColor.withOpacity(0.2)),
            ),
            child: TextField(
              controller: nameController,
              style: TextStyle(color: colors.textPrimary, fontSize: 15, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: selectedType == 'INSTITUTION' ? 'e.g. Media Academy' : 'e.g. Production Dept',
                hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.3), fontSize: 14),
                border: InputBorder.none,
              ),
            ),
          ),
          
          const Spacer(),
          
          MhButton(
            label: 'Create $selectedType',
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: accentColor,
                  content: const Text(
                    'Workspace created successfully',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _TypeButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final Color activeColor;
  final ThemeColors colors;
  final VoidCallback onTap;

  const _TypeButton({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.activeColor,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isActive ? activeColor.withOpacity(0.1) : colors.surface.withOpacity(0.3),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? activeColor : colors.border.withOpacity(0.2),
            width: isActive ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: isActive ? activeColor : colors.textSecondary, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: isActive ? colors.textPrimary : colors.textSecondary,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkspaceTabButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final ThemeColors colors;

  const _WorkspaceTabButton({
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
            color: isActive ? colors.border.withOpacity(0.2) : Colors.transparent,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? colors.textPrimary : colors.textSecondary,
            fontSize: 9,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

class _WorkspaceDetailModal extends StatefulWidget {
  final Map<String, dynamic> workspace;
  final ThemeColors colors;

  const _WorkspaceDetailModal({required this.workspace, required this.colors});

  @override
  State<_WorkspaceDetailModal> createState() => _WorkspaceDetailModalState();
}

class _WorkspaceDetailModalState extends State<_WorkspaceDetailModal> {
  // Mock features matching web app
  final Map<String, bool> features = {
    'TASK MANAGEMENT': true,
    'EVENTS & CALENDAR': true,
    'EQUIPMENT INVENTORY': true,
    'DIGITAL ASSETS': true,
  };

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final name = widget.workspace['name'] as String? ?? 'Unnamed';
    final type = widget.workspace['type'] as String;
    final id = widget.workspace['id']?.toString() ?? '8';
    final isInstitution = type == 'INSTITUTION';
    final accentColor = isInstitution ? colors.indigo : colors.emerald;

    return Container(
      padding: const EdgeInsets.all(24),
      height: MediaQuery.of(context).size.height * 0.85,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 80), // Clear shell header in modal
          
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  isInstitution ? LucideIcons.building2 : LucideIcons.layers,
                  color: accentColor,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(color: colors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildBadge('TYPE: $type', accentColor),
                        _buildBadge('STATUS: ACTIVE', const Color(0xFF10B981)),
                        _buildBadge('ID: $id', colors.textSecondary),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          Row(
            children: [
              Icon(LucideIcons.zap, color: colors.honey, size: 18),
              const SizedBox(width: 8),
              Text(
                'FEATURE CONTROL CENTER',
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1),
              ),
              const Spacer(),
              Text(
                'CHANGES TAKE EFFECT IMMEDIATELY',
                style: TextStyle(color: colors.textSecondary.withOpacity(0.5), fontSize: 8, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: features.entries.map((f) => _buildFeatureCard(f.key, f.value, accentColor)).toList(),
            ),
          ),
          
          const SizedBox(height: 20),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.honey.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.honey.withOpacity(0.1)),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.layout, color: colors.honey, size: 20),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PREVIEW FOR MEMBERS',
                        style: TextStyle(color: colors.honey, fontWeight: FontWeight.w900, fontSize: 10),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Disabled modules will be hidden from the sidebar for all members of this institution.',
                        style: TextStyle(color: colors.textSecondary.withOpacity(0.7), fontSize: 9),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          MhButton(
            label: 'Save Changes',
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900),
      ),
    );
  }

  Widget _buildFeatureCard(String title, bool isEnabled, Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: widget.colors.surface.withOpacity(0.3),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: widget.colors.border.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(LucideIcons.key, color: accentColor, size: 16),
              ),
              Icon(
                isEnabled ? LucideIcons.checkCircle2 : LucideIcons.circle,
                color: isEnabled ? const Color(0xFF10B981) : widget.colors.textSecondary.withOpacity(0.2),
                size: 16,
              ),
            ],
          ),
          const Spacer(),
          Text(
            title,
            style: TextStyle(color: widget.colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 0.5),
          ),
          const SizedBox(height: 4),
          Text(
            'To-do lists, assignments...',
            style: TextStyle(color: widget.colors.textSecondary, fontSize: 8),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
