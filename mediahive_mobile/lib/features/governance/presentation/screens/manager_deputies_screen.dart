import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';

// Providers for Manager Deputies Screen
final managerDeputiesListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final currentUser = supabase.auth.currentUser;
  if (currentUser == null) return [];

  // Fetch current user's profile to check role
  final userProfile = await supabase.from('profiles').select('role, organizationId').eq('id', currentUser.id).single();
  final role = (userProfile['role'] as String? ?? 'member').toLowerCase();
  
  var query = supabase.from('manager_deputies').select('*');
  
  // If not admin, only show where current user is the manager or deputy
  if (role != 'admin' && role != 'owner') {
    query = query.or('managerId.eq.${currentUser.id},deputyId.eq.${currentUser.id}');
  }
  
  final response = await query;
  return List<Map<String, dynamic>>.from(response);
});

final organizationManagersProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final currentUser = supabase.auth.currentUser;
  if (currentUser == null) return [];

  final userProfile = await supabase.from('profiles').select('organizationId').eq('id', currentUser.id).single();
  final orgId = userProfile['organizationId'] as String?;
  if (orgId == null) return [];

  // Fetch active managers/admins/owners in the same organization
  final response = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('organizationId', orgId)
      .inFilter('role', ['manager', 'admin', 'owner'])
      .eq('status', 'active');
      
  return List<Map<String, dynamic>>.from(response);
});

class ManagerDeputiesScreen extends ConsumerStatefulWidget {
  const ManagerDeputiesScreen({super.key});

  @override
  ConsumerState<ManagerDeputiesScreen> createState() => _ManagerDeputiesScreenState();
}

class _ManagerDeputiesScreenState extends ConsumerState<ManagerDeputiesScreen> {
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final deputiesAsync = ref.watch(managerDeputiesListProvider);
    final managersAsync = ref.watch(organizationManagersProvider);

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
              const SizedBox(height: 100), // Visual offset to clear the shell header
              _buildHeader(context, colors),
              const SizedBox(height: 16),
              Expanded(
                child: deputiesAsync.when(
                  data: (deputies) {
                    return managersAsync.when(
                      data: (managers) {
                        return _buildContent(context, deputies, managers, colors);
                      },
                      loading: () => const Center(child: MhLoading(size: 60)),
                      error: (err, _) => _buildError(err.toString(), colors),
                    );
                  },
                  loading: () => const Center(child: MhLoading(size: 60)),
                  error: (err, _) => _buildError(err.toString(), colors),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: colors.honey,
        onPressed: () => _showAddDeputyDialog(context, colors),
        child: const Icon(LucideIcons.plus, color: Colors.white),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ThemeColors colors) {
    return Padding(
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
                  'MANAGER DEPUTIES',
                  style: AppTypography.h1.copyWith(
                    color: colors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'FALLBACK APPROVAL ROUTING',
                  style: AppTypography.caption.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    List<Map<String, dynamic>> deputies,
    List<Map<String, dynamic>> managers,
    ThemeColors colors,
  ) {
    if (deputies.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.users, size: 64, color: colors.textSecondary.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(
              'No fallback deputies configured',
              style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 48),
              child: Text(
                'Configure fallback deputies to handle field work approvals when primary managers are offline.',
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.textSecondary, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    // Index managers by ID for quick lookup
    final managerMap = {for (var m in managers) m['id'] as String: m};

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      itemCount: deputies.length,
      itemBuilder: (context, index) {
        final deputy = deputies[index];
        final id = deputy['id'] as String;
        final managerId = deputy['managerId'] as String;
        final deputyId = deputy['deputyId'] as String;
        final isActive = deputy['isActive'] as bool? ?? true;

        final managerProfile = managerMap[managerId];
        final deputyProfile = managerMap[deputyId];

        final managerName = managerProfile != null ? (managerProfile['full_name'] as String? ?? 'Unknown') : 'Unknown Manager';
        final deputyName = deputyProfile != null ? (deputyProfile['full_name'] as String? ?? 'Unknown') : 'Unknown Deputy';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border.withValues(alpha: 0.5)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (isActive ? colors.honey : colors.textSecondary).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.userCheck,
                  color: isActive ? colors.honey : colors.textSecondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Manager: $managerName',
                      style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Deputy: $deputyName',
                      style: TextStyle(color: colors.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isActive,
                activeColor: colors.honey,
                onChanged: (val) => _toggleDeputyStatus(id, val),
              ),
              IconButton(
                icon: const Icon(LucideIcons.trash2, color: AppColors.error, size: 18),
                onPressed: () => _deleteDeputy(id),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1);
      },
    );
  }

  Widget _buildError(String message, ThemeColors colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Text(
          'Error loading data: $message',
          style: const TextStyle(color: AppColors.error),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Future<void> _toggleDeputyStatus(String id, bool isActive) async {
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('manager_deputies').update({
        'isActive': isActive,
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', id);

      ref.invalidate(managerDeputiesListProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _deleteDeputy(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        final colors = ref.read(themeColorsProvider);
        return AlertDialog(
          backgroundColor: colors.surface,
          title: Text('Delete Assignment', style: TextStyle(color: colors.textPrimary)),
          content: Text('Are you sure you want to remove this fallback deputy mapping?', style: TextStyle(color: colors.textSecondary)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('CANCEL', style: TextStyle(color: colors.textSecondary)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('DELETE', style: TextStyle(color: AppColors.error)),
            ),
          ],
        );
      },
    );

    if (confirm == true) {
      try {
        final supabase = Supabase.instance.client;
        await supabase.from('manager_deputies').delete().eq('id', id);
        ref.invalidate(managerDeputiesListProvider);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete deputy: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }

  Future<void> _showAddDeputyDialog(BuildContext context, ThemeColors colors) async {
    final managersAsync = ref.read(organizationManagersProvider);
    final managers = managersAsync.valueOrNull ?? [];
    if (managers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No eligible managers found to pair.'), backgroundColor: AppColors.error),
      );
      return;
    }

    final supabase = Supabase.instance.client;
    final currentUser = supabase.auth.currentUser;
    if (currentUser == null) return;

    // Fetch current user's profile to default manager if they are a manager
    final userProfile = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
    final userRole = (userProfile['role'] as String? ?? 'member').toLowerCase();
    final isUserAdmin = userRole == 'admin' || userRole == 'owner';

    String? selectedManagerId = isUserAdmin ? null : currentUser.id;
    String? selectedDeputyId;
    bool isActive = true;

    if (!isUserAdmin) {
      // Check if current user is indeed in the managers list
      final hasCurrentUser = managers.any((m) => m['id'] == currentUser.id);
      if (!hasCurrentUser) {
        // Not a manager/admin, cannot assign deputies
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Only managers or admins can configure deputies.'), backgroundColor: AppColors.error),
          );
        }
        return;
      }
    }

    if (mounted) {
      showDialog(
        context: context,
        builder: (dialogContext) {
          return StatefulBuilder(
            builder: (context, setDialogState) {
              final availableDeputies = managers.where((m) => m['id'] != selectedManagerId).toList();

              return AlertDialog(
                backgroundColor: colors.surface,
                title: Text(
                  'Add Deputy Assignment',
                  style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
                ),
                content: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Manager Dropdown (Visible/editable only if Admin)
                      if (isUserAdmin) ...[
                        DropdownButtonFormField<String>(
                          value: selectedManagerId,
                          decoration: InputDecoration(
                            labelText: 'Primary Manager',
                            labelStyle: TextStyle(color: colors.textSecondary),
                            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: colors.border)),
                          ),
                          dropdownColor: colors.surface,
                          style: TextStyle(color: colors.textPrimary),
                          items: managers.map((m) {
                            return DropdownMenuItem<String>(
                              value: m['id'] as String,
                              child: Text('${m['full_name']} (${m['role']})'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setDialogState(() {
                              selectedManagerId = val;
                              if (selectedDeputyId == selectedManagerId) {
                                selectedDeputyId = null;
                              }
                            });
                          },
                        ),
                        const SizedBox(height: 16),
                      ] else ...[
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Assigning deputy for yourself',
                            style: TextStyle(color: colors.textSecondary, fontSize: 12, fontStyle: FontStyle.italic),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                      // Deputy Dropdown
                      DropdownButtonFormField<String>(
                        value: selectedDeputyId,
                        decoration: InputDecoration(
                          labelText: 'Fallback Deputy',
                          labelStyle: TextStyle(color: colors.textSecondary),
                          enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: colors.border)),
                        ),
                        dropdownColor: colors.surface,
                        style: TextStyle(color: colors.textPrimary),
                        items: availableDeputies.map((m) {
                          return DropdownMenuItem<String>(
                            value: m['id'] as String,
                            child: Text(m['full_name'] as String? ?? ''),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setDialogState(() {
                            selectedDeputyId = val;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      // Active Switch
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Is Active', style: TextStyle(color: colors.textPrimary)),
                          Switch(
                            value: isActive,
                            activeColor: colors.honey,
                            onChanged: (val) {
                              setDialogState(() {
                                isActive = val;
                              });
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: Text('CANCEL', style: TextStyle(color: colors.textSecondary)),
                  ),
                  if (_isSaving)
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16.0),
                      child: MhLoading(size: 24),
                    )
                  else
                    TextButton(
                      onPressed: selectedManagerId == null || selectedDeputyId == null
                          ? null
                          : () async {
                              setDialogState(() => _isSaving = true);
                              try {
                                final userProfile = await supabase.from('profiles').select('organizationId').eq('id', currentUser.id).single();
                                final orgId = userProfile['organizationId'] as String?;
                                
                                await supabase.from('manager_deputies').insert({
                                  'managerId': selectedManagerId,
                                  'deputyId': selectedDeputyId,
                                  'organizationId': orgId,
                                  'isActive': isActive,
                                  'createdAt': DateTime.now().toUtc().toIso8601String(),
                                  'updatedAt': DateTime.now().toUtc().toIso8601String(),
                                });
                                ref.invalidate(managerDeputiesListProvider);
                                if (mounted) {
                                  Navigator.pop(dialogContext);
                                }
                              } catch (e) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Failed to save assignment: $e'), backgroundColor: AppColors.error),
                                  );
                                }
                              } finally {
                                setDialogState(() => _isSaving = false);
                              }
                            },
                      child: Text('SAVE', style: TextStyle(color: colors.honey)),
                    ),
                ],
              );
            },
          );
        },
      );
    }
  }
}
