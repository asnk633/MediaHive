import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
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
  File? _selectedImage;
  bool _isCompressing = false;

  Future<void> _pickImage() async {
    final mediaService = ref.read(mediaServiceProvider);
    final image = await mediaService.pickImage();
    if (image != null) {
      final cropped = await mediaService.cropImage(image);
      if (cropped == null) return;
      
      setState(() => _isCompressing = true);
      final compressed = await mediaService.compressImage(cropped);
      setState(() {
        _selectedImage = compressed;
        _isCompressing = false;
      });
      ref.read(analyticsServiceProvider).logEvent('IMAGE_PICKED', {'size': await compressed?.length()});
    }
  }

  void _submit() {
    if (_titleController.text.isEmpty) return;

    final taskId = const Uuid().v4();
    
    if (_selectedImage != null) {
      final uploadMutation = UploadMutation(
        id: const Uuid().v4(),
        filePath: _selectedImage!.path,
        bucketName: 'task-attachments',
        destinationPath: 'tasks/$taskId/attachment.jpg',
        metadata: {'taskId': taskId},
        timestamp: DateTime.now(),
      );
      ref.read(uploadServiceProvider).queueUpload(uploadMutation);
    }

    ref.read(analyticsServiceProvider).logEvent('TASK_CREATED', {'hasAttachment': _selectedImage != null});
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
              onTap: _isCompressing ? null : _pickImage,
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                ),
                child: _selectedImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(_selectedImage!, fit: BoxFit.cover),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isCompressing ? LucideIcons.loader2 : LucideIcons.camera,
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
