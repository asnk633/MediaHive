import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/utils/layout_helpers.dart';
import 'package:mediahive_mobile/core/providers/update_provider.dart';
import 'package:mediahive_mobile/features/chat/presentation/providers/chat_providers.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:mediahive_mobile/features/auth/presentation/widgets/profile_header.dart';
import 'package:mediahive_mobile/features/auth/presentation/widgets/profile_info_grid.dart';
import 'package:mediahive_mobile/features/auth/presentation/widgets/profile_settings_tiles.dart';
import 'package:mediahive_mobile/core/services/auth_service.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
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
    final headerHeight = ref.watch(headerHeightProvider);

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
          padding: EdgeInsets.only(
            left: 20, 
            right: 20, 
            top: headerHeight == 0 ? 140.0 : headerHeight, 
            bottom: 140,
          ),
          child: Column(
            children: [
              const ProfileHeader(),
              const SizedBox(height: 24),
              const ProfileInfoGrid(),
              const SizedBox(height: 24),
              const ProfileSettingsTiles(),
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
                  final version = snapshot.hasData
                      ? 'VERSION ${snapshot.data!.version}'
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
          await ref.read(authServiceProvider).signOut();
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


