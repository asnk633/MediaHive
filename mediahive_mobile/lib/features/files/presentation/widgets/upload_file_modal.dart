import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../calendar/presentation/providers/events_provider.dart';
import '../providers/files_provider.dart';
import '../../../../core/services/media_service.dart';

class UploadFileModal extends ConsumerStatefulWidget {
  const UploadFileModal({super.key});

  @override
  ConsumerState<UploadFileModal> createState() => _UploadFileModalState();
}

class _UploadFileModalState extends ConsumerState<UploadFileModal> {
  String _visibility = 'All Users';
  bool _isInstitution = false;
  String _selectedOrgId = '';
  String _selectedOrgName = 'Select Department';
  String _storageLocation = 'Auto-detect (Smart)';
  final String _albumName = '';
  String? _selectedEventId;
  String? _selectedEventTitle;
  
  final List<XFile> _selectedFiles = [];
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _albumController = TextEditingController();
  bool _isUploading = false;
  double _overallProgress = 0;

  final List<String> _storageOptions = [
    'Auto-detect (Smart)',
    'Essential Documents',
    'Brochures',
    'Posters',
    'Photos',
    'Videos',
    'Archives',
    'Events',
    'Create / Custom Folder',
  ];
  
  int _currentPage = 0;

  Future<void> _pickFiles() async {
    try {
      final colors = ref.read(themeColorsProvider);
      final ImagePicker picker = ImagePicker();
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
                  final XFile? image = await picker.pickImage(source: ImageSource.camera);
                  if (image != null) {
                    setState(() {
                      _selectedFiles.add(image);
                    });
                  }
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(LucideIcons.image, color: colors.indigo),
                title: const Text('Add Multiple Images', style: TextStyle(color: Colors.white)),
                onTap: () async {
                  final List<XFile> images = await picker.pickMultiImage();
                  if (images.isNotEmpty) {
                    setState(() {
                      _selectedFiles.addAll(images);
                    });
                  }
                  Navigator.pop(context);
                },
              ),
              ListTile(
                leading: Icon(LucideIcons.video, color: colors.indigo),
                title: const Text('Add a Video', style: TextStyle(color: Colors.white)),
                onTap: () async {
                  final XFile? video = await picker.pickVideo(source: ImageSource.gallery);
                  if (video != null) {
                    setState(() {
                      _selectedFiles.add(video);
                    });
                  }
                  Navigator.pop(context);
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
                        _selectedFiles.add(XFile(f.path, name: f.path.split(Platform.pathSeparator).last));
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
    } catch (e) {
      debugPrint('Error picking files: $e');
    }
  }

  void _removeFile(int index) {
    setState(() {
      _selectedFiles.removeAt(index);
    });
  }

  void _showSimplePicker({
    required String title,
    required List<Map<String, String>> options,
    required Function(String id, String name) onSelect,
    required ThemeColors colors,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        decoration: BoxDecoration(
          color: colors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.textSecondary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(title,
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold)),
            ),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final opt = options[index];
                  return InkWell(
                    onTap: () {
                      onSelect(opt['id']!, opt['name']!);
                      Navigator.pop(context);
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 16),
                      child: Text(opt['name']!,
                          style: TextStyle(
                              color: colors.textPrimary, fontSize: 16)),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final institutionsAsync = ref.watch(institutionsProvider);
    final departmentsAsync = ref.watch(departmentsProvider);
    final eventsAsync = ref.watch(eventListProvider);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: colors.backgroundSecondary,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: colors.border),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.5),
                blurRadius: 40,
                spreadRadius: 10),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: colors.indigo.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _selectedFiles.length > 1 ? LucideIcons.layers : LucideIcons.uploadCloud,
                          color: colors.indigo, 
                          size: 20
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        _selectedFiles.length > 1 ? 'Create Album' : 'Upload File',
                        style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.bold)
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(LucideIcons.x,
                        color: colors.textSecondary, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              if (_currentPage == 0) ...[
                // Multi-file selection area
                _buildDialogLabel('FILES SELECTION *', colors),
                const SizedBox(height: 12),
                _buildFilesList(colors),
                const SizedBox(height: 12),
                _buildAddMoreButton(colors),
                
                const SizedBox(height: 24),
                if (_selectedFiles.length > 1) ...[
                  _buildDialogLabel('ALBUM / FOLDER NAME', colors),
                  const SizedBox(height: 8),
                  _buildAlbumTextField('e.g. Event Highlights', colors),
                  const SizedBox(height: 20),
                ] else if (_selectedFiles.isNotEmpty) ...[
                  _buildDialogLabel('DISPLAY NAME (OPTIONAL)', colors),
                  const SizedBox(height: 8),
                  _buildDialogTextField('e.g. Annual Report 2024', colors),
                  const SizedBox(height: 20),
                ],

                _buildDialogLabel('LINK TO EVENT (OPTIONAL)', colors),
                const SizedBox(height: 8),
                _buildDialogDropdown(
                  _selectedEventTitle ?? 'Select Related Event',
                  LucideIcons.calendar,
                  colors,
                  onTap: () {
                    eventsAsync.whenData((list) {
                      _showSimplePicker(
                        title: 'Select Event',
                        options: list.map((e) => {'id': e.id, 'name': e.title}).toList(),
                        onSelect: (id, name) => setState(() {
                          _selectedEventId = id;
                          _selectedEventTitle = name;
                          // Auto-fill album name if empty
                          if (_albumController.text.isEmpty) {
                            _albumController.text = name;
                          }
                        }),
                        colors: colors,
                      );
                    });
                  },
                ),
                const SizedBox(height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Cancel',
                          style: TextStyle(
                              color: colors.textSecondary,
                              fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _currentPage = 1;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colors.indigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text('Next', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ] else ...[
                _buildDialogLabel('VISIBILITY SETTINGS *', colors),
                const SizedBox(height: 8),
                _buildDialogDropdown(
                  _visibility,
                  LucideIcons.chevronDown,
                  colors,
                  onTap: () => _showSimplePicker(
                    title: 'Visibility',
                    options: ['All Users', 'Managers Only', 'Private']
                        .map((e) => {'id': e, 'name': e})
                        .toList(),
                    onSelect: (id, name) => setState(() => _visibility = name),
                    colors: colors,
                  ),
                ),

                const SizedBox(height: 20),
                _buildDialogLabel('ORGANIZATION', colors),
                const SizedBox(height: 12),
                _buildOrganizationToggle(
                  colors,
                  _isInstitution,
                  (val) => setState(() {
                    _isInstitution = val;
                    _selectedOrgId = '';
                    _selectedOrgName = val ? 'Select Institution' : 'Select Department';
                  }),
                ),
                const SizedBox(height: 12),
                _buildDialogDropdown(
                  _selectedOrgName,
                  LucideIcons.chevronDown,
                  colors,
                  onTap: () {
                    if (_isInstitution) {
                      institutionsAsync.whenData((list) {
                        _showSimplePicker(
                          title: 'Institution',
                          options: list.map((e) => {'id': e.id.toString(), 'name': e.name}).toList(),
                          onSelect: (id, name) => setState(() {
                            _selectedOrgId = id;
                            _selectedOrgName = name;
                          }),
                          colors: colors,
                        );
                      });
                    } else {
                      departmentsAsync.whenData((list) {
                        _showSimplePicker(
                          title: 'Department',
                          options: list.map((e) => {'id': e.id.toString(), 'name': e.name}).toList(),
                          onSelect: (id, name) => setState(() {
                            _selectedOrgId = id;
                            _selectedOrgName = name;
                          }),
                          colors: colors,
                        );
                      });
                    }
                  },
                ),

                const SizedBox(height: 20),
                _buildDialogLabel('STORAGE LOCATION *', colors),
                const SizedBox(height: 8),
                _buildDialogDropdown(
                  _storageLocation,
                  LucideIcons.chevronDown,
                  colors,
                  icon: LucideIcons.sparkles,
                  onTap: () => _showSimplePicker(
                    title: 'Storage Location',
                    options: _storageOptions.map((e) => {'id': e, 'name': e}).toList(),
                    onSelect: (id, name) => setState(() => _storageLocation = name),
                    colors: colors,
                  ),
                ),

                const SizedBox(height: 40),
                if (_isUploading) ...[
                  LinearProgressIndicator(
                    value: _overallProgress,
                    backgroundColor: colors.surface,
                    valueColor: AlwaysStoppedAnimation<Color>(colors.indigo),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      'Uploading ${(_overallProgress * 100).toInt()}%...',
                      style: TextStyle(color: colors.textSecondary, fontSize: 12),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _currentPage = 0;
                        });
                      },
                      child: Text('Back',
                          style: TextStyle(
                              color: colors.textSecondary,
                              fontWeight: FontWeight.bold)),
                    ),
                    ElevatedButton(
                      onPressed: (_selectedFiles.isEmpty || _isUploading) ? null : _handleUpload,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colors.indigo,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: colors.border.withValues(alpha: 0.5),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text('Start Upload',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilesList(ThemeColors colors) {
    if (_selectedFiles.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40),
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.border, style: BorderStyle.none),
        ),
        child: Column(
          children: [
            Icon(LucideIcons.filePlus, color: colors.textSecondary.withValues(alpha: 0.2), size: 48),
            const SizedBox(height: 12),
            Text('No files selected', style: TextStyle(color: colors.textSecondary)),
          ],
        ),
      );
    }

    return Container(
      constraints: const BoxConstraints(maxHeight: 200),
      child: ListView.builder(
        shrinkWrap: true,
        itemCount: _selectedFiles.length,
        itemBuilder: (context, index) {
          final file = _selectedFiles[index];
          final ext = file.name.split('.').last.toLowerCase();
          final isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(ext);
          final isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].contains(ext);
          final isPdf = ext == 'pdf';
          
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colors.surface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 40,
                    height: 40,
                    color: colors.backgroundSecondary,
                    child: isImage 
                      ? Image.file(File(file.path), fit: BoxFit.cover)
                      : Icon(
                          isPdf 
                            ? LucideIcons.fileText 
                            : isVideo 
                              ? LucideIcons.video 
                              : LucideIcons.file, 
                          color: colors.indigo, 
                          size: 20,
                        ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    file.name,
                    style: TextStyle(color: colors.textPrimary, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  onPressed: () => _removeFile(index),
                  icon: const Icon(LucideIcons.trash2, color: Colors.redAccent, size: 16),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAddMoreButton(ThemeColors colors) {
    return InkWell(
      onTap: _pickFiles,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: colors.indigo.withValues(alpha: 0.3), style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.plus, color: colors.indigo, size: 16),
            const SizedBox(width: 8),
            Text('Add Photos, Videos or Files', 
              style: TextStyle(color: colors.indigo, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Future<void> _handleUpload() async {
    if (_selectedFiles.isEmpty) return;
    setState(() {
      _isUploading = true;
      _overallProgress = 0;
    });

    try {
      final supabase = Supabase.instance.client;
      final profile = ref.read(currentUserProfileProvider).value;
      final userId = supabase.auth.currentUser?.id;
      final tenantId = profile?['tenant_id'];

      // Final Album/Folder name
      final finalAlbumName = _selectedFiles.length > 1 
        ? (_albumController.text.isNotEmpty ? _albumController.text : 'New Album')
        : _storageLocation;

      int completed = 0;

      for (var file in _selectedFiles) {
        // 1. Upload to Supabase Storage
        final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.name}';
        final storagePath = 'media/$fileName';
        final fileBytes = await file.readAsBytes();

        // Infer mime type
        String mimeType = file.mimeType ?? 'application/octet-stream';
        if (mimeType == 'application/octet-stream') {
          final ext = file.name.split('.').last.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext)) {
            mimeType = 'image/$ext';
          } else if (['mp4', 'mov', 'avi'].contains(ext)) {
            mimeType = 'video/$ext';
          } else if (ext == 'pdf') {
            mimeType = 'application/pdf';
          }
        }

        await supabase.storage.from('avatars').uploadBinary(storagePath, fileBytes);
        final publicUrl = supabase.storage.from('avatars').getPublicUrl(storagePath);

        final isImage = mimeType.startsWith('image/');
        final isVideo = mimeType.startsWith('video/');

        // 2. Insert record into public.files
        await supabase.from('files').insert({
          'user_id': userId,
          'name': _selectedFiles.length == 1 && _nameController.text.isNotEmpty 
              ? _nameController.text : file.name,
          'path': finalAlbumName,
          'tenant_id': tenantId,
          'mime_type': mimeType,
          'size': fileBytes.length,
          'download_link': publicUrl,
          'thumbnail_link': (isImage || isVideo) ? publicUrl : null,
          'status': 'active',
          'type': isImage ? 'image' : (isVideo ? 'video' : 'document'),
          'upload_context': 'downloads_direct',
          'visibility': {'mode': _visibility == 'All Users' ? 'all' : 'internal'},
          'department': !_isInstitution ? _selectedOrgName : null,
          'institution': _isInstitution ? _selectedOrgName : null,
          'event_id': _selectedEventId,
          'uploaded_by': userId,
          'uploaded_by_name': profile?['full_name'],
          'uploaded_by_role': profile?['role'],
        });

        completed++;
        setState(() {
          _overallProgress = completed / _selectedFiles.length;
        });
      }

      if (mounted) {
        ref.invalidate(filesListProvider);
        Navigator.pop(context);
        _showSuccessSnackBar(
          context, 
          'Successfully uploaded ${_selectedFiles.length} files to $finalAlbumName', 
          ref.read(themeColorsProvider)
        );
      }
    } catch (e) {
      debugPrint('Upload error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showSuccessSnackBar(BuildContext context, String message, ThemeColors colors) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colors.emerald.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.checkCircle, color: colors.emerald, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
        backgroundColor: colors.backgroundSecondary.withValues(alpha: 0.9),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(24, 0, 24, 40),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: colors.emerald.withValues(alpha: 0.3), width: 1.5),
        ),
        elevation: 0,
      ),
    );
  }

  Widget _buildDialogDropdown(String text, IconData trailing, ThemeColors colors,
      {IconData? icon, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: colors.indigo, size: 16),
              const SizedBox(width: 12),
            ],
            Expanded(
                child: Text(text,
                    style: TextStyle(color: colors.textPrimary, fontSize: 14))),
            Icon(trailing, color: colors.textSecondary, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildDialogLabel(String text, ThemeColors colors) {
    return Text(text,
        style: TextStyle(
            color: colors.textSecondary,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2));
  }

  Widget _buildDialogTextField(String hint, ThemeColors colors) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: TextField(
        controller: _nameController,
        style: TextStyle(color: colors.textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.3)),
          border: InputBorder.none, filled: false,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        ),
      ),
    );
  }

  Widget _buildAlbumTextField(String hint, ThemeColors colors) {
    return Container(
      decoration: BoxDecoration(
        color: colors.indigo.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.indigo.withValues(alpha: 0.3)),
      ),
      child: TextField(
        controller: _albumController,
        style: TextStyle(color: colors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.3)),
          prefixIcon: Icon(LucideIcons.folder, color: colors.indigo, size: 18),
          border: InputBorder.none, filled: false,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        ),
      ),
    );
  }

  Widget _buildOrganizationToggle(
      ThemeColors colors, bool isInstitution, Function(bool) onToggle) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => onToggle(false),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !isInstitution
                      ? colors.indigo
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                    child: Text('Department',
                        style: TextStyle(
                            color: !isInstitution
                                ? Colors.white
                                : colors.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12))),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => onToggle(true),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isInstitution
                      ? colors.indigo
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                    child: Text('Institution',
                        style: TextStyle(
                            color: isInstitution
                                ? Colors.white
                                : colors.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12))),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
