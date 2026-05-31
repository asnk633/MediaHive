import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/campaigns_provider.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';

class CreateCampaignScreen extends ConsumerStatefulWidget {
  const CreateCampaignScreen({super.key});

  @override
  ConsumerState<CreateCampaignScreen> createState() => _CreateCampaignScreenState();
}

class _CreateCampaignScreenState extends ConsumerState<CreateCampaignScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 7));
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a campaign name')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final userProfile = ref.read(currentUserProfileProvider).value;
      final tenantId = userProfile?['tenant_id'] as String?;
      if (tenantId == null) {
        throw Exception('Unable to resolve tenant for current user');
      }
      
      await ref.read(campaignRepositoryProvider).createCampaign(
        name: name,
        description: _descriptionController.text,
        startDate: _startDate,
        endDate: _endDate,
        tenantId: tenantId,
        institutionId: userProfile?['institution_id'] as String?,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Campaign initialized successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget _buildSectionLabel(String text, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: colors.textSecondary,
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint,
    IconData? icon,
    ThemeColors colors, {
    int maxLines = 1,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: TextStyle(color: colors.textPrimary),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5)),
          prefixIcon: icon != null ? Icon(icon, size: 18, color: colors.textSecondary.withOpacity(0.5)) : null,
          contentPadding: const EdgeInsets.all(16),
          border: InputBorder.none, filled: false,
        ),
      ),
    );
  }

  Widget _buildDateTimePicker(String label, String value, IconData icon, ThemeColors colors, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: colors.indigo),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.textSecondary)),
                const SizedBox(height: 2),
                Text(value, style: TextStyle(fontSize: 14, color: colors.textPrimary, fontWeight: FontWeight.w500)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton(ThemeColors colors) {
    return GestureDetector(
      onTap: _isSubmitting ? null : _handleCreate,
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: colors.indigo,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: _isSubmitting
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.send, color: Colors.white, size: 18),
                    const SizedBox(width: 12),
                    Text(
                      'Create Campaign',
                      style: AppTypography.bodyL.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildNoteBox(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.indigo.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.indigo.withOpacity(0.1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.info, size: 18, color: colors.indigo),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NOTE',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: colors.indigo,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: TextStyle(fontSize: 13, color: colors.textSecondary, height: 1.4),
                    children: [
                      const TextSpan(text: 'New campaigns are created in the '),
                      TextSpan(
                        text: 'Planning',
                        style: TextStyle(
                          color: colors.indigo,
                          fontWeight: FontWeight.bold,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const TextSpan(text: ' phase by default. You can add tasks and production milestones once the campaign is initialized.'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDate(bool isStart, ThemeColors colors) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime.now(),
      lastDate: DateTime(2101),
      builder: (context, child) {
        return Theme(
          data: colors.isDark
              ? ThemeData.dark().copyWith(
                  colorScheme: ColorScheme.dark(
                    primary: colors.indigo,
                    onPrimary: Colors.white,
                    surface: colors.surface,
                    onSurface: colors.textPrimary,
                  ),
                )
              : ThemeData.light().copyWith(
                  colorScheme: ColorScheme.light(
                    primary: colors.indigo,
                    onPrimary: Colors.white,
                    surface: Colors.white,
                    onSurface: colors.textPrimary,
                  ),
                ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) {
            _endDate = _startDate.add(const Duration(days: 1));
          }
        } else {
          _endDate = picked.isBefore(_startDate)
              ? _startDate.add(const Duration(days: 1))
              : picked;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: colors.backgroundPrimary.withOpacity(0.8),
        elevation: 0,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.transparent),
          ),
        ),
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Create New Campaign', 
              style: AppTypography.h3.copyWith(color: colors.textPrimary, fontWeight: FontWeight.w900),
            ),
            Text(
              'Initialize a new media campaign for your institution', 
              style: AppTypography.caption.copyWith(color: colors.textSecondary, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colors.backgroundSecondary,
              colors.backgroundPrimary,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.only(top: 120, left: 24, right: 24, bottom: 40),
          children: [
            _buildSectionLabel('Campaign Name', colors),
            const SizedBox(height: 8),
            _buildTextField(
              _nameController,
              'E.g. Summer Festival 2026',
              LucideIcons.layout,
              colors,
            ),
            const SizedBox(height: 24),

            _buildSectionLabel('Description', colors),
            const SizedBox(height: 8),
            _buildTextField(
              _descriptionController,
              'Describe the goals and scope of this campaign...',
              null,
              colors,
              maxLines: 4,
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: _buildDateTimePicker(
                    'START DATE',
                    DateFormat('MMM d, yyyy').format(_startDate),
                    LucideIcons.calendar,
                    colors,
                    onTap: () => _selectDate(true, colors),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDateTimePicker(
                    'END DATE',
                    DateFormat('MMM d, yyyy').format(_endDate),
                    LucideIcons.calendar,
                    colors,
                    onTap: () => _selectDate(false, colors),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildSubmitButton(colors),
            const SizedBox(height: 32),
            _buildNoteBox(colors),
          ],
        ),
      ),
    );
  }
}
