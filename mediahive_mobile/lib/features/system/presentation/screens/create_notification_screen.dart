import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../providers/notifications_provider.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/services/upload_service.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/media_service.dart';

class CreateNotificationScreen extends ConsumerStatefulWidget {
  const CreateNotificationScreen({super.key});

  @override
  ConsumerState<CreateNotificationScreen> createState() => _CreateNotificationScreenState();
}

class _CreateNotificationScreenState extends ConsumerState<CreateNotificationScreen> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  String _targetType = 'all'; // 'all', 'institution', 'department'
  String? _selectedInstitutionId;
  int? _selectedDepartmentId;
  bool _isSubmitting = false;

  DateTime? _scheduledAt;
  final List<XFile> _attachments = [];
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _sendBroadcast() async {
    if (_titleController.text.isEmpty || _bodyController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in both title and message')),
      );
      return;
    }

    final repo = ref.read(notificationRepositoryProvider);
    final uploadService = ref.read(uploadServiceProvider);

    setState(() => _isSubmitting = true);

    try {
      List<String> attachmentUrls = [];
      
      // 1. Upload Attachments
      if (_attachments.isNotEmpty) {
        for (var file in _attachments) {
          final url = await uploadService.uploadFile(
            File(file.path),
            'notifications/${DateTime.now().millisecondsSinceEpoch}_${file.name}',
          );
          if (url != null) attachmentUrls.add(url);
        }
      }

      await repo.broadcastNotification(
        title: _titleController.text,
        body: _bodyController.text,
        type: 'broadcast',
        targetType: _targetType,
        institutionId: _selectedInstitutionId,
        departmentId: _selectedDepartmentId,
        scheduledAt: _scheduledAt,
        metadata: {
          if (attachmentUrls.isNotEmpty) 'attachments': attachmentUrls,
        },
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Broadcast sent successfully')),
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

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final institutionsAsync = ref.watch(institutionsProvider);
    final departmentsAsync = ref.watch(departmentsProvider);

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
            children: [
              _buildAppBar(context, colors),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    _buildSectionHeader(colors, LucideIcons.bell, 'NOTIFICATION TITLE'),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _titleController,
                      hint: 'e.g. System Maintenance Update',
                      colors: colors,
                    ),
                    const SizedBox(height: 32),
                    
                    _buildSectionHeader(colors, LucideIcons.alignLeft, 'BROADCAST MESSAGE'),
                    const SizedBox(height: 12),
                    _buildTextField(
                      controller: _bodyController,
                      hint: 'Type your message here...',
                      colors: colors,
                      maxLines: 5,
                    ),
                    const SizedBox(height: 32),

                    _buildSectionHeader(colors, LucideIcons.users, 'TARGET AUDIENCE MODE'),
                    const SizedBox(height: 16),
                    _buildTargetSelector(colors),
                    const SizedBox(height: 24),

                    if (_targetType == 'institution') ...[
                      _buildSectionHeader(colors, LucideIcons.building, 'SELECT INSTITUTION'),
                      const SizedBox(height: 12),
                      institutionsAsync.when(
                        data: (insts) => _buildDropdown<String>(
                          value: _selectedInstitutionId,
                          items: insts.map<DropdownMenuItem<String>>((i) => DropdownMenuItem(
                            value: i.id,
                            child: Text(i.name),
                          )).toList(),
                          onChanged: (val) => setState(() => _selectedInstitutionId = val),
                          hint: 'Choose Institution',
                          colors: colors,
                        ),
                        loading: () => const LinearProgressIndicator(),
                        error: (_, __) => const Text('Error loading institutions'),
                      ),
                    ],

                    if (_targetType == 'department') ...[
                      _buildSectionHeader(colors, LucideIcons.briefcase, 'SELECT DEPARTMENT'),
                      const SizedBox(height: 12),
                      departmentsAsync.when(
                        data: (depts) => _buildDropdown<int>(
                          value: _selectedDepartmentId,
                          items: depts.map<DropdownMenuItem<int>>((d) => DropdownMenuItem(
                            value: d.id,
                            child: Text(d.name),
                          )).toList(),
                          onChanged: (val) => setState(() => _selectedDepartmentId = val),
                          hint: 'Choose Department',
                          colors: colors,
                        ),
                        loading: () => const LinearProgressIndicator(),
                        error: (_, __) => const Text('Error loading departments'),
                      ),
                    ],

                    const SizedBox(height: AppSpacing.xxl),
                    _buildSectionHeader(colors, LucideIcons.calendar, 'SCHEDULE DELIVERY (OPTIONAL)'),
                    const SizedBox(height: AppSpacing.m),
                    _buildSchedulePicker(),

                    const SizedBox(height: AppSpacing.xxl),
                    _buildSectionHeader(colors, LucideIcons.paperclip, 'ATTACHMENTS'),
                    const SizedBox(height: AppSpacing.m),
                    _buildAttachmentPicker(),

                    const SizedBox(height: 48),
                    _buildSendButton(colors),
                    const SizedBox(height: AppSpacing.huge),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Row(
        children: [
          IconButton(
            icon: Icon(LucideIcons.chevronLeft, color: colors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
          const Expanded(
            child: Column(
              children: [
                Text(
                  'New Notification',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                  ),
                ),
                Text(
                  'BROADCAST INTELLIGENCE',
                  style: TextStyle(
                    color: Color(0xFF3B82F6),
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                    letterSpacing: 2.0,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 48), // Spacer to balance back button
        ],
      ),
    );
  }

  Widget _buildSectionHeader(ThemeColors colors, IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF3B82F6), size: 16),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            color: colors.textSecondary,
            fontWeight: FontWeight.w900,
            fontSize: 11,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required ThemeColors colors,
    int maxLines = 1,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
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
          contentPadding: const EdgeInsets.all(20),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildSchedulePicker() {
    final isScheduled = _scheduledAt != null;
    return InkWell(
      onTap: _selectSchedule,
      borderRadius: BorderRadius.circular(AppRadius.m),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.l),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B).withOpacity(0.5),
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(
            color: isScheduled ? const Color(0xFF3B82F6).withOpacity(0.3) : Colors.transparent,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isScheduled ? LucideIcons.alarmClock : LucideIcons.clock,
              color: isScheduled ? const Color(0xFF3B82F6) : Colors.grey,
            ),
            const SizedBox(width: AppSpacing.m),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isScheduled 
                      ? DateFormat('EEEE, MMM d @ hh:mm a').format(_scheduledAt!)
                      : 'Send Immediately',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (!isScheduled)
                    const Text(
                      'Tap to set a future delivery time',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                ],
              ),
            ),
            if (isScheduled)
              IconButton(
                icon: const Icon(LucideIcons.x, size: 18, color: Colors.white),
                onPressed: () => setState(() => _scheduledAt = null),
                visualDensity: VisualDensity.compact,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_attachments.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.m),
            child: SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _attachments.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.s),
                itemBuilder: (context, index) {
                  final file = _attachments[index];
                  final ext = file.name.split('.').last.toLowerCase();
                  final isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(ext);
                  final isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].contains(ext);
                  final isPdf = ext == 'pdf';

                  return Stack(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(AppRadius.s),
                          image: isImage
                              ? DecorationImage(
                                  image: FileImage(File(file.path)),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: !isImage
                            ? Center(
                                child: Icon(
                                  isPdf
                                      ? LucideIcons.fileText
                                      : isVideo
                                          ? LucideIcons.video
                                          : LucideIcons.file,
                                  color: const Color(0xFF3B82F6),
                                  size: 28,
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: GestureDetector(
                          onTap: () => setState(() => _attachments.removeAt(index)),
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.x, size: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        InkWell(
          onTap: _pickAttachments,
          borderRadius: BorderRadius.circular(AppRadius.m),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.l),
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B).withOpacity(0.5),
              borderRadius: BorderRadius.circular(AppRadius.m),
              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.1)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.plus, size: 20, color: Color(0xFF3B82F6)),
                SizedBox(width: AppSpacing.s),
                Text(
                  'Add Images, Videos or Files',
                  style: TextStyle(color: Color(0xFF3B82F6), fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectSchedule() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _scheduledAt ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.honey,
            onPrimary: Colors.white,
            surface: AppColors.surface,
            onSurface: AppColors.textPrimary,
          ),
        ),
        child: child!,
      ),
    );

    if (date != null) {
      if (!mounted) return;
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_scheduledAt ?? DateTime.now()),
      );

      if (time != null) {
        if (!mounted) return;
        setState(() {
          _scheduledAt = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _pickAttachments() async {
    final colors = ref.read(themeColorsProvider);
    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: colors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(LucideIcons.camera, color: Color(0xFF3B82F6)),
              title: const Text('Capture Photo (Camera)', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final XFile? image = await _picker.pickImage(source: ImageSource.camera);
                if (image != null) {
                  setState(() {
                    _attachments.add(image);
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image, color: Color(0xFF3B82F6)),
              title: const Text('Add Multiple Images', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final List<XFile> images = await _picker.pickMultiImage();
                if (images.isNotEmpty) {
                  setState(() {
                    _attachments.addAll(images);
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.video, color: Color(0xFF3B82F6)),
              title: const Text('Add a Video', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
                if (video != null) {
                  setState(() {
                    _attachments.add(video);
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.fileText, color: Color(0xFF3B82F6)),
              title: const Text('Add Documents / Any File', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final mediaService = ref.read(mediaServiceProvider);
                final List<File> files = await mediaService.pickMultipleFiles();
                if (files.isNotEmpty) {
                  setState(() {
                    for (final f in files) {
                      _attachments.add(XFile(f.path, name: f.path.split(Platform.pathSeparator).last));
                    }
                  });
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown<T>({
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
    required String hint,
    required ThemeColors colors,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          items: items,
          onChanged: onChanged,
          dropdownColor: colors.surface,
          hint: Text(hint, style: TextStyle(color: colors.textSecondary.withOpacity(0.5))),
          style: TextStyle(color: colors.textPrimary),
          icon: Icon(LucideIcons.chevronDown, color: colors.textSecondary),
          isExpanded: true,
        ),
      ),
    );
  }

  Widget _buildTargetSelector(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          _buildTargetChip('BROADCAST', 'all', colors),
          _buildTargetChip('INSTITUTION', 'institution', colors),
          _buildTargetChip('DEPARTMENT', 'department', colors),
        ],
      ),
    );
  }

  Widget _buildTargetChip(String label, String type, ThemeColors colors) {
    final isSelected = _targetType == type;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _targetType = type),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : colors.textSecondary,
              fontWeight: FontWeight.w900,
              fontSize: 10,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSendButton(ThemeColors colors) {
    return GestureDetector(
      onTap: _isSubmitting ? null : _sendBroadcast,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Center(
          child: _isSubmitting
              ? const CircularProgressIndicator(color: Colors.white)
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.send, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text(
                      'SEND BROADCAST',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
