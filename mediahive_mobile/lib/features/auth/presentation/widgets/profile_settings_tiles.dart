import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/services/notification_service.dart';
import 'package:mediahive_mobile/core/providers/sync_errors_provider.dart';
import 'package:mediahive_mobile/core/providers/labs_provider.dart';
import 'package:mediahive_mobile/core/services/auth_service.dart';
import 'package:mediahive_mobile/features/system/presentation/screens/system_health_screen.dart';
import 'package:mediahive_mobile/presentation/widgets/theme_toggle_button.dart';
import 'package:app_settings/app_settings.dart';

class ProfileSettingsTiles extends ConsumerStatefulWidget {
  const ProfileSettingsTiles({super.key});

  @override
  ConsumerState<ProfileSettingsTiles> createState() => _ProfileSettingsTilesState();
}

class _ProfileSettingsTilesState extends ConsumerState<ProfileSettingsTiles> {
  bool _pushNotifications = true;

  void _showChangePasswordBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _ChangePasswordSheet(),
    );
  }

  void _showLabsBottomSheet() {
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
                              'Experimental Labs',
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

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Column(
      children: [
        _buildSectionLabel(colors, 'NOTIFICATIONS'),
        _buildNotificationTile(),
        const SizedBox(height: 16),
        _buildNotificationPermissionTile(),
        const SizedBox(height: 24),
        _buildSectionLabel(colors, 'ACCOUNT & SECURITY'),
        _buildSecurityTile(),
        const SizedBox(height: 16),
        _buildBatteryDisclaimerTile(),
        const SizedBox(height: 16),
        _buildSyncErrorsTile(),
        const SizedBox(height: 24),
        _buildSectionLabel(colors, 'PREFERENCES'),
        _buildThemeToggleTile(),
        const SizedBox(height: 16),
        _buildLabsTile(),
        if (kDebugMode) ...[
          const SizedBox(height: 16),
          _buildSystemHealthTile(),
        ],
      ],
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
                  setState(() {});
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
            onPressed: _showChangePasswordBottomSheet,
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

  Widget _buildSyncErrorsTile() {
    final colors = ref.watch(themeColorsProvider);
    final syncErrors = ref.watch(syncErrorsProvider);
    final hasErrors = syncErrors.hasSyncErrors;

    return GestureDetector(
      onTap: () => context.push('/profile/sync-errors'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: hasErrors ? Colors.orangeAccent.withValues(alpha: 0.3) : colors.border),
          boxShadow: colors.cardShadow,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: hasErrors ? Colors.orangeAccent.withValues(alpha: 0.1) : Colors.grey.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                LucideIcons.refreshCcw,
                size: 18,
                color: hasErrors ? Colors.orangeAccent : colors.textSecondary,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sync Errors', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                  Text(
                    hasErrors
                      ? '${syncErrors.failedItems.length} failed offline mutation(s)'
                      : 'All offline changes synced',
                    style: TextStyle(
                      fontSize: 11,
                      color: hasErrors ? Colors.orangeAccent : colors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (hasErrors)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.orangeAccent,
                  shape: BoxShape.circle,
                ),
              ),
            const SizedBox(width: 8),
            Icon(LucideIcons.chevronRight, size: 16, color: colors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _buildBatteryDisclaimerTile() {
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
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(LucideIcons.battery, size: 18, color: Colors.green),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Background Presence', style: TextStyle(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                const SizedBox(height: 4),
                Text(
                  'Background tracking uses location services and may affect battery life.',
                  style: TextStyle(fontSize: 11, color: colors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () {
              AppSettings.openAppSettings(type: AppSettingsType.location);
            },
            style: TextButton.styleFrom(
              backgroundColor: colors.textPrimary.withValues(alpha: 0.05),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Manage', style: TextStyle(color: colors.textPrimary, fontSize: 12)),
          ),
        ],
      ),
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
            onPressed: _showLabsBottomSheet,
            icon: Icon(LucideIcons.chevronRight, size: 18, color: colors.textSecondary),
          ),
        ],
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
            backgroundColor: const Color(0xFF10B981),
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
