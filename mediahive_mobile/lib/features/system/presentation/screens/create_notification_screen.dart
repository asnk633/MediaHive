import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:ui';
import '../providers/notifications_provider.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/services/upload_service.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/media_service.dart';
import '../../../../core/theme/app_typography.dart';

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

  final PageController _pageController = PageController();
  int _currentPage = 0;

  DateTime? _scheduledAt;
  final List<XFile> _attachments = [];
  final ImagePicker _picker = ImagePicker();

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    _pageController.dispose();
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
              'New Notification',
              style: AppTypography.h3.copyWith(color: colors.textPrimary, fontWeight: FontWeight.w900),
            ),
            Text(
              'BROADCAST INTELLIGENCE',
              style: AppTypography.caption.copyWith(color: colors.indigo, fontWeight: FontWeight.bold, letterSpacing: 1.0),
            ),
          ],
        ),
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.backgroundSecondary, colors.backgroundPrimary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                children: [
                  // Page 1
                  SingleChildScrollView(
                    padding: const EdgeInsets.only(top: 120, left: 24, right: 24, bottom: 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader(colors, LucideIcons.bell, 'NOTIFICATION TITLE *'),
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

                        _buildSectionHeader(colors, LucideIcons.users, 'TARGET AUDIENCE MODE *'),
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
                      ],
                    ),
                  ),

                  // Page 2
                  SingleChildScrollView(
                    padding: const EdgeInsets.only(top: 120, left: 24, right: 24, bottom: 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionHeader(colors, LucideIcons.calendar, 'SCHEDULE DELIVERY (OPTIONAL)'),
                        const SizedBox(height: 16),
                        _buildSchedulePicker(colors),

                        const SizedBox(height: 32),
                        _buildSectionHeader(colors, LucideIcons.paperclip, 'ATTACHMENTS'),
                        const SizedBox(height: 16),
                        _buildAttachmentPicker(colors),

                        const SizedBox(height: 48),
                        _buildSendButton(colors),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Bottom Navigation
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              color: Colors.transparent,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage > 0)
                    TextButton(
                      onPressed: () {
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: Text('Back', style: TextStyle(color: colors.textSecondary)),
                    )
                  else
                    const SizedBox(width: 64),
                  Row(
                    children: List.generate(2, (index) {
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 8,
                        width: _currentPage == index ? 24 : 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index ? colors.indigo : colors.border,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                  if (_currentPage < 1)
                    TextButton(
                      onPressed: () {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: Text('Next', style: TextStyle(color: colors.indigo, fontWeight: FontWeight.bold)),
                    )
                  else
                    const SizedBox(width: 64),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(ThemeColors colors, IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: colors.indigo, size: 16),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            color: colors.textSecondary,
            fontWeight: FontWeight.w800,
            fontSize: 12,
            letterSpacing: 1.0,
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
          contentPadding: const EdgeInsets.all(16),
          border: InputBorder.none, filled: false,
        ),
      ),
    );
  }

  Widget _buildSchedulePicker(ThemeColors colors) {
    final isScheduled = _scheduledAt != null;
    return InkWell(
      onTap: _selectSchedule,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isScheduled ? colors.indigo.withOpacity(0.5) : colors.border,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isScheduled ? LucideIcons.alarmClock : LucideIcons.clock,
              color: isScheduled ? colors.indigo : colors.textSecondary,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isScheduled 
                      ? DateFormat('EEEE, MMM d @ hh:mm a').format(_scheduledAt!)
                      : 'Send Immediately',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (!isScheduled)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        'Tap to set a future delivery time',
                        style: TextStyle(color: colors.textSecondary, fontSize: 12),
                      ),
                    ),
                ],
              ),
            ),
            if (isScheduled)
              IconButton(
                icon: Icon(LucideIcons.x, size: 18, color: colors.textPrimary),
                onPressed: () => setState(() => _scheduledAt = null),
                visualDensity: VisualDensity.compact,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentPicker(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_attachments.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _attachments.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
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
                          color: colors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: colors.border),
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
                                  color: colors.indigo,
                                  size: 28,
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => setState(() => _attachments.removeAt(index)),
                          child: Container(
                            padding: const EdgeInsets.all(4),
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
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            width: double.infinity,
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.plus, size: 18, color: colors.indigo),
                const SizedBox(width: 8),
                Text(
                  'Add Images, Videos or Files',
                  style: TextStyle(color: colors.indigo, fontWeight: FontWeight.bold),
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
              leading: Icon(LucideIcons.camera, color: colors.indigo),
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
              leading: Icon(LucideIcons.image, color: colors.indigo),
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
              leading: Icon(LucideIcons.video, color: colors.indigo),
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
              leading: Icon(LucideIcons.fileText, color: colors.indigo),
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
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
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
        color: colors.isDark ? colors.surface : colors.border.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
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
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? colors.indigo : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : colors.textSecondary,
              fontWeight: FontWeight.bold,
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
        height: 56,
        decoration: BoxDecoration(
          color: colors.indigo,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: colors.indigo.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: _isSubmitting
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.send, color: Colors.white, size: 18),
                    SizedBox(width: 12),
                    Text(
                      'SEND BROADCAST',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
