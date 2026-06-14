import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../presentation/widgets/theme_toggle_button.dart';
import '../../../../presentation/providers/navigation_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/theme_provider.dart';
import '../../../system/presentation/screens/system_health_screen.dart';
import '../../../../core/services/notification_service.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/providers/labs_provider.dart';
import '../../../../core/providers/update_provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import '../../../../core/services/media_service.dart';
import 'dart:io';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../dashboard/presentation/providers/dashboard_providers.dart';
import '../../../chat/presentation/providers/chat_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _pushNotifications = true;
  final ImagePicker _picker = ImagePicker();
  late final Future<PackageInfo> _packageInfoFuture;
  bool _isCheckingUpdate = false;

  @override
  void initState() {
    super.initState();
    _packageInfoFuture = PackageInfo.fromPlatform();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

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
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(
            left: 20, 
            right: 20, 
            top: 140, 
            bottom: 140,
          ),
          child: Column(
            children: [
              _buildHeader(context),
              const SizedBox(height: 24),
              _buildInfoGrid(),
              const SizedBox(height: 24),
              _buildStatsRow(),
              const SizedBox(height: 24),
              _buildSectionLabel(colors, 'NOTIFICATIONS'),
              _buildNotificationTile(),
              const SizedBox(height: 16),
              _buildNotificationPermissionTile(),
              const SizedBox(height: 24),
              _buildSectionLabel(colors, 'ACCOUNT & SECURITY'),
              _buildSecurityTile(),
              const SizedBox(height: 24),
              _buildSectionLabel(colors, 'PREFERENCES'),
              _buildThemeToggleTile(),
              const SizedBox(height: 16),
              _buildLabsTile(),
              const SizedBox(height: 16),
              _buildSystemHealthTile(),
              const SizedBox(height: 32),
              _buildSignOutButton(),
              const SizedBox(height: 40),
              _buildHelpSection(context),
              const SizedBox(height: 24),
              _buildAboutSection(),
              const SizedBox(height: 24),
              _buildDeveloperContact(context),
              const SizedBox(height: 40),
              FutureBuilder<PackageInfo>(
                future: _packageInfoFuture,
                builder: (context, snapshot) {
                  String buildNum = '';
                  if (snapshot.hasData) {
                    final rawBuild = snapshot.data!.buildNumber;
                    final code = int.tryParse(rawBuild);
                    buildNum = (code != null && code >= 1000)
                        ? (code % 1000).toString()
                        : rawBuild;
                  }
                  
                  final version = snapshot.hasData
                      ? 'VERSION ${snapshot.data!.version} (BETA $buildNum)'
                      : '';
                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        version.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          color: colors.textSecondary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildUpdateCheckButton(colors),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final profileImagePath = ref.watch(profileImagePathProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    
    return profileAsync.when(
      loading: () => Container(
        height: 120,
        alignment: Alignment.center,
        child: CircularProgressIndicator(color: colors.textPrimary),
      ),
      error: (_, __) => const SizedBox(),
      data: (dbProfile) {
        final auth = ref.read(authServiceProvider);
        final user = auth.currentUser;
        final metadata = user?.userMetadata ?? {};
        
        // Prefer live DB data over stale Auth metadata
        final fullName = dbProfile?['full_name'] as String? ?? metadata['full_name'] as String? ?? 'Unknown User';
        final rawRole = dbProfile?['role'] as String? ?? metadata['role'] as String? ?? 'Member';
        final avatarUrl = dbProfile?['avatar_url'] as String?;

        // Normalize the role for badge display
        String badgeText = rawRole.toUpperCase();
        Color badgeColor = Colors.grey;
        Color badgeBgColor = Colors.grey.withValues(alpha: 0.1);
        
        final normalized = rawRole.replaceAll(' ', '').replaceAll('_', '').toLowerCase();
        switch (normalized) {
          case 'admin':
          case 'superadmin':
            badgeText = 'ADMIN';
            badgeColor = const Color(0xFFEF4444); // Red
            badgeBgColor = const Color(0xFFEF4444).withValues(alpha: 0.1);
            break;
          case 'manager':
          case 'globalmanager':
            badgeText = 'MANAGER';
            badgeColor = colors.indigo; // Blue
            badgeBgColor = colors.indigo.withValues(alpha: 0.1);
            break;
          case 'team':
            badgeText = 'TEAM';
            badgeColor = const Color(0xFF10B981); // Green
            badgeBgColor = const Color(0xFF10B981).withValues(alpha: 0.1);
            break;
          default:
            badgeText = 'MEMBER';
            badgeColor = const Color(0xFF8B5CF6); // Purple
            badgeBgColor = const Color(0xFF8B5CF6).withValues(alpha: 0.1);
            break;
        }

        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: colors.border),
            boxShadow: colors.cardShadow ?? [],
          ),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => _showImageSourcePicker(context),
                child: Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: colors.textPrimary.withValues(alpha: 0.1), width: 2),
                      ),
                      child: ClipOval(
                        child: profileImagePath != null 
                          ? Image.file(File(profileImagePath), fit: BoxFit.cover)
                          : Image.network(
                              avatarUrl ?? 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: colors.surface,
                                  alignment: Alignment.center,
                                  child: Icon(LucideIcons.user, size: 40, color: colors.textSecondary),
                                );
                              },
                            ),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFF6366F1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(LucideIcons.settings, size: 12, color: colors.surface),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              fullName,
                              style: TextStyle(
                                fontSize: fullName.length < 15 ? 24 : fullName.length < 20 ? 20 : 16, 
                                fontWeight: FontWeight.bold, 
                                color: colors.textPrimary
                              ),
                              maxLines: 1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(LucideIcons.edit3, size: 16, color: colors.textPrimary.withValues(alpha: 0.3)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: badgeBgColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          badgeText,
                          style: TextStyle(fontSize: 10, color: badgeColor, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }


  void _showImageSourcePicker(BuildContext context) async {
    final colors = ref.read(themeColorsProvider);
    
    // Hide nav bar while picker is open
    ref.read(bottomNavVisibleProvider.notifier).state = false;
    
    await showModalBottomSheet(
      context: context,
      useRootNavigator: true, // Ensure it's above everything
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: colors.textSecondary.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 24),
            Text('Change Profile Picture', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary)),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(LucideIcons.camera, color: Colors.blue),
              title: Text('Take New Photo', style: TextStyle(color: colors.textPrimary)),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image, color: Colors.purple),
              title: Text('Upload from Gallery', style: TextStyle(color: colors.textPrimary)),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );

    // Restore nav bar after picker is closed
    if (mounted) {
      ref.read(bottomNavVisibleProvider.notifier).state = true;
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final mediaService = ref.read(mediaServiceProvider);
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        final croppedFile = await mediaService.cropImage(
          File(pickedFile.path),
          cropStyle: CropStyle.circle,
        );
        
        if (croppedFile != null) {
          await ref.read(profileImagePathProvider.notifier).updatePath(croppedFile.path);
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Uploading profile picture...')),
            );
          }

          final auth = ref.read(authServiceProvider);
          final user = auth.currentUser;
          if (user != null) {
            final file = croppedFile;
            final ext = croppedFile.path.split('.').last;
            final fileName = '${user.id}_${DateTime.now().millisecondsSinceEpoch}.$ext';
            
            final client = Supabase.instance.client;
            
            // Note: The bucket 'avatars' must exist and have public access enabled.
            await client.storage.from('avatars').upload(fileName, file);
            final url = client.storage.from('avatars').getPublicUrl(fileName);
            
            await client.from('profiles').update({'avatar_url': url}).eq('id', user.id);
            
            // Invalidate the provider to trigger a refresh of the profile data
            ref.invalidate(currentUserProfileProvider);
            
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile picture synced successfully!')),
              );
            }
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update image: $e')),
        );
      }
    }
  }

  Widget _buildInfoGrid() {
    final colors = ref.watch(themeColorsProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    
    return profileAsync.when(
      loading: () => Container(
        height: 120,
        alignment: Alignment.center,
        child: CircularProgressIndicator(color: colors.textPrimary),
      ),
      error: (_, __) => const SizedBox(),
      data: (dbProfile) {
        final auth = ref.read(authServiceProvider);
        final user = auth.currentUser;
        final metadata = user?.userMetadata ?? {};
        
        // Prefer live DB data over stale Auth metadata
        final rawRole = dbProfile?['role'] as String? ?? metadata['role'] as String? ?? 'Member';
        
        // Resolve names from the profile map (populated by provider)
        final institutionName = dbProfile?['institution_name'] as String? ?? metadata['institution_id']?.toString() ?? 'None';
        final departmentName = dbProfile?['department_name'] as String? ?? metadata['department_id']?.toString() ?? metadata['department']?.toString() ?? 'None';
        
        // Format join date
        String joinDate = 'Recently';
        if (user?.createdAt != null) {
          final date = DateTime.parse(user!.createdAt);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          joinDate = '${months[date.month - 1]} ${date.year}';
        }

        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colors.border),
            boxShadow: colors.cardShadow,
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(child: _buildInfoItem(colors, LucideIcons.landmark, 'INSTITUTION', institutionName)),
                  Expanded(child: _buildInfoItem(colors, LucideIcons.calendar, 'JOINED ON', joinDate, isRightAligned: true)),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: _buildInfoItem(colors, LucideIcons.layers, 'DEPARTMENT', departmentName)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }


  Widget _buildSectionLabel(ThemeColors colors, String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: colors.textSecondary,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem(ThemeColors colors, IconData icon, String label, String value, {bool isRightAligned = false}) {
    return Column(
      crossAxisAlignment: isRightAligned ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: isRightAligned ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            if (!isRightAligned) ...[
              Icon(icon, size: 12, color: colors.textSecondary),
              const SizedBox(width: 6),
            ],
            Text(label, style: TextStyle(fontSize: 10, color: colors.textSecondary, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            if (isRightAligned) ...[
              const SizedBox(width: 6),
              Icon(icon, size: 12, color: colors.textSecondary),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary)),
      ],
    );
  }

  Widget _buildNotificationTile() {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Row(
        children: [
          Icon(LucideIcons.bell, size: 20, color: colors.textSecondary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Push Notifications', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text('Receive updates about your tasks', style: TextStyle(fontSize: 11, color: colors.textSecondary)),
              ],
            ),
          ),
          Switch(
            value: _pushNotifications,
            onChanged: (v) => setState(() => _pushNotifications = v),
            activeThumbColor: const Color(0xFF4ADE80),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _ChangePasswordSheet(),
    );
  }

  Widget _buildSecurityTile() {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(LucideIcons.lock, size: 18, color: Colors.blue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Account Security', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text('Manage your authentication settings', style: TextStyle(fontSize: 11, color: colors.textSecondary)),
              ],
            ),
          ),
          TextButton(
            onPressed: () => _showChangePasswordBottomSheet(context),
            style: TextButton.styleFrom(
              backgroundColor: colors.textPrimary.withValues(alpha: 0.05),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Change Password', style: TextStyle(color: colors.textPrimary, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationPermissionTile() {
    final colors = ref.watch(themeColorsProvider);
    final notificationService = ref.watch(notificationServiceProvider);

    return FutureBuilder<bool>(
      future: notificationService.checkPermission(),
      builder: (context, snapshot) {
        final isAllowed = snapshot.data ?? false;
        
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
            boxShadow: colors.cardShadow,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isAllowed ? Colors.green : Colors.orange).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  isAllowed ? LucideIcons.bell : LucideIcons.bellOff,
                  size: 18,
                  color: isAllowed ? Colors.green : Colors.orange,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Institutional Alerts', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                    Text(
                      isAllowed ? 'Operational notifications are active' : 'Alerts are currently disabled',
                      style: TextStyle(fontSize: 11, color: colors.textSecondary),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () async {
                  if (isAllowed) {
                    await notificationService.openSettings();
                  } else {
                    await notificationService.requestPermission();
                  }
                  setState(() {}); // Refresh status
                },
                style: TextButton.styleFrom(
                  backgroundColor: colors.textPrimary.withValues(alpha: 0.05),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(
                  isAllowed ? 'Manage' : 'Enable',
                  style: TextStyle(color: colors.textPrimary, fontSize: 12),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildThemeToggleTile() {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.purple.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(LucideIcons.palette, size: 18, color: Colors.purple),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Theme Toggle', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text('Switch between light and dark modes', style: TextStyle(fontSize: 11, color: colors.textSecondary)),
              ],
            ),
          ),
          const ThemeToggleButton(),
        ],
      ),
    );
  }

  Widget _buildSystemHealthTile() {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(LucideIcons.activity, size: 18, color: Colors.amber),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('System Health', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text('Diagnostics, logs & chaos control', style: TextStyle(fontSize: 11, color: colors.textSecondary)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SystemHealthScreen())),
            icon: Icon(LucideIcons.chevronRight, size: 18, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildLabsTile() {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.purple.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(LucideIcons.flaskConical, size: 18, color: Colors.purple),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Experimental Labs', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text('Try out upcoming features', style: TextStyle(fontSize: 11, color: colors.textSecondary)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _showLabsBottomSheet(context),
            icon: Icon(LucideIcons.chevronRight, size: 18, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }

  void _showLabsBottomSheet(BuildContext context) {
    final colors = ref.read(themeColorsProvider);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Consumer(
        builder: (context, ref, child) {
          final labsState = ref.watch(labsProvider);
          final testDemoDataEnabled = labsState['testDemoData'] ?? false;

          return Container(
            decoration: BoxDecoration(
              color: colors.backgroundPrimary,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(32),
                topRight: Radius.circular(32),
              ),
              border: Border(top: BorderSide(color: colors.border)),
            ),
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 12,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
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
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.purple.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.flaskConical, color: Colors.purple, size: 22),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '🧪 Experimental Labs',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: colors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Try out upcoming, experimental features.',
                              style: TextStyle(fontSize: 12, color: colors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: colors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: colors.honey.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(LucideIcons.edit3, size: 18, color: colors.honey),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Test / Demo Data',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: colors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Enables a toggle to mark tasks and events as test/demo data, keeping them excluded from official reports.',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: colors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch.adaptive(
                          value: testDemoDataEnabled,
                          onChanged: (val) {
                            ref.read(labsProvider.notifier).toggleFeature('testDemoData');
                          },
                          activeColor: colors.honey,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsRow() {
    final colors = ref.watch(themeColorsProvider);
    final metrics = ref.watch(dashboardMetricsProvider);
    final requests = metrics['myRequests'] as Map<String, dynamic>?;
    
    final totalRequests = requests?['total']?.toString() ?? '0';
    final completedRequests = requests?['completed']?.toString() ?? '0';

    return Row(
      children: [
        Expanded(child: _buildStatCard(colors, 'TASKS REQUESTED', totalRequests, LucideIcons.pin, Colors.blue)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(colors, 'COMPLETED', completedRequests, LucideIcons.checkCircle, Colors.green)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(colors, 'LAST ACTIVE', 'Just now', LucideIcons.clock, Colors.purple)),
      ],
    );
  }

  Widget _buildStatCard(ThemeColors colors, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(label, style: TextStyle(fontSize: 8, color: color, fontWeight: FontWeight.bold, letterSpacing: 0.5))),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: colors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildHelpSection(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.helpCircle, size: 24, color: Colors.blue),
              const SizedBox(width: 16),
              Text('Need help?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary)),
            ],
          ),
          const SizedBox(height: 20),
          _buildHelpBullet(colors, 'Members can request tasks and events directly.'),
          _buildHelpBullet(colors, 'You cannot assign team members; admins handle assignment.'),
          _buildHelpBullet(colors, 'Priorities are managed by the Media Team based on workload.'),
          _buildHelpBullet(colors, 'For account changes or role updates, please contact your institution\'s Media & IT department.'),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showMemberGuide(context),
              icon: const Icon(LucideIcons.bookOpen, size: 16),
              label: const Text('View Full Member Guide'),
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.textPrimary.withValues(alpha: 0.05),
                foregroundColor: colors.textPrimary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeveloperContact(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Contact Developer', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textSecondary)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () async {
            try {
              // Opens a private 1-on-1 chat with the admin user.
              // The room is created if it doesn't exist yet; only 2 participants
              // are ever added (the current user + the admin).
              final roomId = await ref
                  .read(chatCreationProvider)
                  .getOrCreateAdminSupportChat();

              if (context.mounted) {
                context.push('/chat/$roomId');
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Could not open support chat: $e')),
                );
              }
            }
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
              boxShadow: colors.cardShadow,
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.messageSquare, size: 18, color: Colors.blue),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Abdul Shukoor Nurani', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                    Text('+91 8137 017 835', style: TextStyle(fontSize: 13, color: colors.textSecondary)),
                    const SizedBox(height: 4),
                    Text('Tap to open support chat', style: TextStyle(fontSize: 12, color: colors.textSecondary)),
                  ],
                ),
                const Spacer(),
                Icon(LucideIcons.chevronRight, size: 18, color: colors.honey),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showMemberGuide(BuildContext context) {
    final colors = ref.read(themeColorsProvider);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Padding(
          padding: const EdgeInsets.all(24.0),
          child: ListView(
            controller: scrollController,
            children: [
              RichText(
                text: TextSpan(
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: colors.textPrimary),
                  children: [
                    const TextSpan(text: 'Welcome to Thaiba '),
                    TextSpan(text: 'MediaHive!', style: TextStyle(color: colors.honey)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'This app is designed to streamline how you request media tasks and events for your Department / Institution. This guide will help you get started.',
                style: TextStyle(color: colors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 32),
              _buildGuideSection(colors, '1. First-Time Access & Registration', [
                '🚧 Important: You must register to use this app. There is no anonymous access.',
                'Open the App Link provided to you.',
                'Tap Create Account (do not try to log in yet).',
                'Fill in your details: Full Name, Email, Password.',
                'Select Your Context (Crucial):',
                'Institution: Select your main institution.',
                'Department / Institution: Select the specific department or institution you represent (e.g., "Media Department", "Primary Section").',
                'Note: All tasks you submit will be officially recorded in the system under the selected Department.',
                'Tap Create Account to finish.',
              ]),
              _buildGuideSection(colors, '2. Member Role Limitations', [
                'As a Member user, your account has limited permissions to ensure an organized workflow.',
                '❌ You Cannot Assign Tasks: You cannot choose which team member works on your request. Admins will handle this.',
                '❌ You Cannot Change Status: You cannot mark a task as "Done". The production team will update the status as they work.',
                '❌ You Cannot Set Priority: Member users cannot set priority. Admin manages priority internally.',
                '✅ Default Status: All your new requests will appear as "Pending" initially.',
              ]),
              _buildGuideSection(colors, '3. Creating a New Task', [
                'Use this for specific media requirements (e.g., "Design a poster," "Edit a video").',
                'Tap the (+) Plus Button at the bottom center of the screen.',
                'Select New Task.',
                'Fill in the Request Details (Title, Description, Due Date).',
                'Confirm Context: Ensure it shows "Requesting as [Your Institution Name]".',
                'Tap Submit Task.',
              ]),
              _buildGuideSection(colors, '4. Creating an Event', [
                'Use this for advance planning, media coverage preparation, and internal coordination.',
                'Tap the (+) Plus Button at the bottom center of the screen.',
                'Select New Event.',
                'Enter Event Details: Event Name, Date & Time, Location.',
                'Tap Create Event.',
                '*Tip: Submit events at least 48 hours in advance to ensure team availability.*',
              ]),
              _buildGuideSection(colors, '5. Viewing Your Requests', [
                'Go to the Profile Tab (bottom right icon).',
                'Look at the "Tasks Requested" counter.',
                'You can also see your recent activity on the Home Screen (Pending / In Progress / Done).',
              ]),
              _buildGuideSection(colors, '6. Usage Etiquette & Guidelines', [
                'Submit Early: Do not wait until the last minute.',
                'One Thing, One Task: Do not combine multiple requests.',
                'Be Clear: Avoid vague requests. Details prevent delays.',
                'Urgency: Only set deadlines for today/tomorrow if it is a genuine emergency.',
              ]),
              const SizedBox(height: 40),
              Center(
                child: Text('Contact Developer: Abdul Shukoor Nurani - +91 8137 017 835', style: TextStyle(fontSize: 12, color: colors.textSecondary)),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGuideSection(ThemeColors colors, String title, List<String> bullets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)),
        const SizedBox(height: 12),
        ...bullets.map((b) => Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('• ', style: TextStyle(color: colors.textSecondary)),
              Expanded(child: Text(b, style: TextStyle(color: colors.textSecondary, height: 1.4))),
            ],
          ),
        )),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildHelpBullet(ThemeColors colors, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6.0),
            child: CircleAvatar(radius: 2, backgroundColor: Colors.blue),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: colors.textSecondary))),
        ],
      ),
    );
  }

  Widget _buildAboutSection() {
    final colors = ref.watch(themeColorsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textSecondary),
            children: [
              const TextSpan(text: 'About '),
              TextSpan(text: 'MediaHive', style: TextStyle(color: colors.honey)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'MediaHive is the central workspace for Thaiba Garden\'s Media Team — built to manage tasks, events, creative workflows, and team coordination in one organized platform. Designed for fast-moving media operations, it helps teams plan, collaborate, and create efficiently.',
          style: TextStyle(fontSize: 12, color: colors.textSecondary.withValues(alpha: 0.6), height: 1.6),
        ),
      ],
    );
  }

  Widget _buildUpdateCheckButton(ThemeColors colors) {
    return _isCheckingUpdate
        ? const SizedBox(
            height: 36,
            width: 36,
            child: Padding(
              padding: EdgeInsets.all(8.0),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          )
        : TextButton.icon(
            onPressed: _performManualUpdateCheck,
            icon: Icon(LucideIcons.refreshCw, size: 14, color: colors.honey),
            label: Text(
              'CHECK FOR UPDATE',
              style: TextStyle(
                fontSize: 11,
                color: colors.honey,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.0,
              ),
            ),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              backgroundColor: colors.honey.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          );
  }

  Future<void> _performManualUpdateCheck() async {
    setState(() => _isCheckingUpdate = true);
    final colors = ref.read(themeColorsProvider);
    try {
      // Refresh the update check provider to fetch fresh DB data
      final updateInfo = await ref.refresh(updateInfoProvider.future);
      
      if (!mounted) return;
      setState(() => _isCheckingUpdate = false);

      if (updateInfo.isUpdateAvailable) {
        // Show update available dialog
        showDialog(
          context: context,
          builder: (dialogCtx) => AlertDialog(
            backgroundColor: colors.backgroundSecondary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            title: Row(
              children: [
                Icon(LucideIcons.sparkles, color: colors.honey, size: 24),
                const SizedBox(width: 12),
                const Text('Update Available'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'A new version (${updateInfo.latestVersion}) is ready to download.',
                  style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Text(
                  'Release Notes:',
                  style: TextStyle(color: colors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Container(
                  constraints: const BoxConstraints(maxHeight: 150),
                  width: double.maxFinite,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.border),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      updateInfo.releaseNotes,
                      style: TextStyle(color: colors.textPrimary, fontSize: 13, height: 1.4),
                    ),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx),
                child: Text('Later', style: TextStyle(color: colors.textSecondary)),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(dialogCtx);
                  // Trigger download via state notifier
                  ref.read(updateStateProvider.notifier).downloadUpdate(updateInfo.downloadUrl);
                  // Go to system health or navigate back to dashboard where the banner is visible
                  context.go('/dashboard');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.honey,
                  foregroundColor: colors.backgroundPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Update Now'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(LucideIcons.checkCircle, color: Colors.green, size: 20),
                const SizedBox(width: 12),
                Text(
                  'You are on the latest version! (${updateInfo.currentVersion})',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCheckingUpdate = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to check for updates: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  Widget _buildSignOutButton() {
    final colors = ref.watch(themeColorsProvider);

    return SizedBox(
      width: 200,
      child: OutlinedButton.icon(
        onPressed: () async {
          await Supabase.instance.client.auth.signOut();
          if (mounted) {
            context.go('/login');
          }
        },
        icon: const Icon(LucideIcons.logOut, size: 16),
        label: const Text('Sign Out'),
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.textSecondary,
          side: BorderSide(color: colors.border),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}

class _ChangePasswordSheet extends ConsumerStatefulWidget {
  const _ChangePasswordSheet();

  @override
  ConsumerState<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends ConsumerState<_ChangePasswordSheet> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.updatePassword(_passwordController.text.trim());

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(LucideIcons.checkCircle, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('Password updated successfully!'),
              ],
            ),
            backgroundColor: const Color(0xFF10B981), // Emerald green
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('AuthException: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      decoration: BoxDecoration(
        color: colors.backgroundPrimary,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(32),
          topRight: Radius.circular(32),
        ),
        border: Border(top: BorderSide(color: colors.border)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Pull handle
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
              const SizedBox(height: 24),
              
              // Header Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: colors.honey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(LucideIcons.lock, color: colors.honey, size: 22),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Change Password',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: colors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Keep your account secure with a strong password',
                          style: TextStyle(fontSize: 12, color: colors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.alertTriangle, color: Color(0xFFEF4444), size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // New Password Field
              Text(
                'NEW PASSWORD',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: colors.textSecondary,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: TextStyle(color: colors.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Enter at least 6 characters',
                  hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5), fontSize: 13),
                  filled: true,
                  fillColor: colors.surface,
                  prefixIcon: Icon(LucideIcons.keyRound, size: 16, color: colors.textSecondary),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                      size: 16,
                      color: colors.textSecondary,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.honey, width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Password is required';
                  }
                  if (value.trim().length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Confirm Password Field
              Text(
                'CONFIRM NEW PASSWORD',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: colors.textSecondary,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirmPassword,
                style: TextStyle(color: colors.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Re-enter your new password',
                  hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5), fontSize: 13),
                  filled: true,
                  fillColor: colors.surface,
                  prefixIcon: Icon(LucideIcons.checkSquare, size: 16, color: colors.textSecondary),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword ? LucideIcons.eyeOff : LucideIcons.eye,
                      size: 16,
                      color: colors.textSecondary,
                    ),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.honey, width: 1.5),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Confirm password is required';
                  }
                  if (value.trim() != _passwordController.text.trim()) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Action Button
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.honey,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Update Password',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
