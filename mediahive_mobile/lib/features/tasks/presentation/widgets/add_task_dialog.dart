import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:uuid/uuid.dart';
import '../../../../../core/services/media_service.dart';
import '../../../../../core/services/upload_service.dart';
import '../../../../../core/services/analytics_service.dart';
import '../../../../../core/models/upload_mutation.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../shared/widgets/mh_button.dart';

class AddTaskDialog extends ConsumerStatefulWidget {
  const AddTaskDialog({super.key});

  @override
  ConsumerState<AddTaskDialog> createState() => _AddTaskDialogState();
}

class _AddTaskDialogState extends ConsumerState<AddTaskDialog> {
  final _titleController = TextEditingController();
  File? _selectedFile;
  bool _isCompressing = false;

  Future<void> _pickFile() async {
    final mediaService = ref.read(mediaServiceProvider);
    
    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(LucideIcons.camera, color: AppColors.honey),
              title: const Text('Capture Photo (Camera)', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final image = await mediaService.capturePhoto();
                if (image != null) {
                  final cropped = await mediaService.cropImage(image);
                  if (cropped == null) return;
                  
                  setState(() => _isCompressing = true);
                  final compressed = await mediaService.compressImage(cropped);
                  setState(() {
                    _selectedFile = compressed;
                    _isCompressing = false;
                  });
                  ref.read(analyticsServiceProvider).logEvent('IMAGE_PICKED', {'size': await compressed?.length()});
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image, color: AppColors.honey),
              title: const Text('Add Image (Compressed)', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final image = await mediaService.pickImage();
                if (image != null) {
                  final cropped = await mediaService.cropImage(image);
                  if (cropped == null) return;
                  
                  setState(() => _isCompressing = true);
                  final compressed = await mediaService.compressImage(cropped);
                  setState(() {
                    _selectedFile = compressed;
                    _isCompressing = false;
                  });
                  ref.read(analyticsServiceProvider).logEvent('IMAGE_PICKED', {'size': await compressed?.length()});
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.video, color: AppColors.honey),
              title: const Text('Add a Video', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final video = await mediaService.pickVideo();
                if (video != null) {
                  setState(() {
                    _selectedFile = video;
                  });
                  ref.read(analyticsServiceProvider).logEvent('VIDEO_PICKED', {'size': await video.length()});
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.fileText, color: AppColors.honey),
              title: const Text('Add Document / Raw File', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final file = await mediaService.pickDocument();
                if (file != null) {
                  setState(() {
                    _selectedFile = file;
                  });
                  ref.read(analyticsServiceProvider).logEvent('DOCUMENT_PICKED', {'size': await file.length()});
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _submit() {
    if (_titleController.text.isEmpty) return;

    final taskId = const Uuid().v4();
    
    if (_selectedFile != null) {
      final ext = _selectedFile!.path.split('.').last.toLowerCase();
      final uploadMutation = UploadMutation(
        id: const Uuid().v4(),
        filePath: _selectedFile!.path,
        bucketName: 'task-attachments',
        destinationPath: 'tasks/$taskId/attachment.$ext',
        metadata: {'taskId': taskId},
        timestamp: DateTime.now(),
      );
      ref.read(uploadServiceProvider).queueUpload(uploadMutation);
    }

    ref.read(analyticsServiceProvider).logEvent('TASK_CREATED', {'hasAttachment': _selectedFile != null});
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('CREATE NEW TASK', style: AppTypography.h3),
            const SizedBox(height: 24),
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: 'Task title...',
                filled: true,
                fillColor: AppColors.backgroundSecondary,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: _isCompressing ? null : _pickFile,
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                ),
                child: _selectedFile != null
                    ? () {
                        final ext = _selectedFile!.path.split('.').last.toLowerCase();
                        final isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(ext);
                        final isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].contains(ext);
                        final isPdf = ext == 'pdf';
                        final fileName = _selectedFile!.path.split(Platform.pathSeparator).last;
                        
                        if (isImage) {
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(_selectedFile!, fit: BoxFit.cover),
                          );
                        }
                        
                        return Container(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.border.withValues(alpha: 0.3),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  isPdf
                                      ? LucideIcons.fileText
                                      : isVideo
                                          ? LucideIcons.video
                                          : LucideIcons.file,
                                  color: AppColors.honey,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      fileName,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      ext.toUpperCase(),
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(LucideIcons.x, color: Colors.white54, size: 16),
                                onPressed: () {
                                  setState(() {
                                    _selectedFile = null;
                                  });
                                },
                              ),
                            ],
                          ),
                        );
                      }()
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isCompressing ? LucideIcons.loader2 : LucideIcons.paperclip,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _isCompressing ? 'COMPRESSING...' : 'ADD ATTACHMENT',
                            style: AppTypography.caption,
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: MhButton(
                    label: 'Cancel',
                    onTap: () => Navigator.pop(context),
                    type: MhButtonType.secondary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: MhButton(
                    label: 'Create',
                    onTap: _submit,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
