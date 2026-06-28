import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/services/auth_service.dart';
import 'package:mediahive_mobile/core/services/media_service.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/presentation/providers/navigation_provider.dart';

class ProfileHeader extends ConsumerStatefulWidget {
  const ProfileHeader({super.key});

  @override
  ConsumerState<ProfileHeader> createState() => _ProfileHeaderState();
}

class _ProfileHeaderState extends ConsumerState<ProfileHeader> {
  final ImagePicker _picker = ImagePicker();

  void _showImageSourcePicker() async {
    final colors = ref.read(themeColorsProvider);

    ref.read(bottomNavVisibleProvider.notifier).state = false;

    await showModalBottomSheet(
      context: context,
      useRootNavigator: true,
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

            await client.storage.from('avatars').upload(fileName, file);
            final url = client.storage.from('avatars').getPublicUrl(fileName);

            await client.from('profiles').update({'avatar_url': url}).eq('id', user.id);

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

  @override
  Widget build(BuildContext context) {
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

        final fullName = dbProfile?['full_name'] as String? ?? metadata['full_name'] as String? ?? 'Unknown User';
        final rawRole = dbProfile?['role'] as String? ?? metadata['role'] as String? ?? 'Member';
        final avatarUrl = dbProfile?['avatar_url'] as String?;

        String badgeText = rawRole.toUpperCase();
        Color badgeColor = Colors.grey;
        Color badgeBgColor = Colors.grey.withValues(alpha: 0.1);

        final normalized = rawRole.replaceAll(' ', '').replaceAll('_', '').toLowerCase();
        switch (normalized) {
          case 'admin':
          case 'superadmin':
            badgeText = 'ADMIN';
            badgeColor = const Color(0xFFEF4444);
            badgeBgColor = const Color(0xFFEF4444).withValues(alpha: 0.1);
            break;
          case 'manager':
          case 'globalmanager':
            badgeText = 'MANAGER';
            badgeColor = colors.indigo;
            badgeBgColor = colors.indigo.withValues(alpha: 0.1);
            break;
          case 'team':
            badgeText = 'TEAM';
            badgeColor = const Color(0xFF10B981);
            badgeBgColor = const Color(0xFF10B981).withValues(alpha: 0.1);
            break;
          default:
            badgeText = 'MEMBER';
            badgeColor = const Color(0xFF8B5CF6);
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
                onTap: _showImageSourcePicker,
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
}
