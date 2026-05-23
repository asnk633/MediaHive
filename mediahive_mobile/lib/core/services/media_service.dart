import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:video_compress/video_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';

import 'package:file_picker/file_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class MediaService {
  final ImagePicker _picker = ImagePicker();
  final LoggerService _logger;

  MediaService(this._logger);

  Future<File?> pickDocument() async {
    try {
      _logger.info('📂 Opening document picker...');
      final result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        allowMultiple: false,
      );
      if (result != null && result.files.single.path != null) {
        final pickedFile = File(result.files.single.path!);
        _logger.info('✅ Document picked: ${pickedFile.path}');
        return pickedFile;
      }
    } catch (e) {
      _logger.error('❌ Error picking document: $e');
    }
    return null;
  }

  Future<List<File>> pickMultipleFiles() async {
    try {
      _logger.info('📂 Opening multiple documents picker...');
      final result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        allowMultiple: true,
      );
      if (result != null && result.paths.isNotEmpty) {
        final files = result.paths
            .where((path) => path != null)
            .map((path) => File(path!))
            .toList();
        _logger.info('✅ Total files picked: ${files.length}');
        return files;
      }
    } catch (e) {
      _logger.error('❌ Error picking multiple files: $e');
    }
    return [];
  }

  Future<File?> cropImage(File file, {CropStyle cropStyle = CropStyle.rectangle}) async {
    _logger.info('✂️ Opening image cropper: ${file.path}');
    
    final croppedFile = await ImageCropper().cropImage(
      sourcePath: file.path,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Edit Image',
          toolbarColor: AppColors.backgroundSecondary,
          toolbarWidgetColor: Colors.white,
          activeControlsWidgetColor: AppColors.honey,
          initAspectRatio: CropAspectRatioPreset.original,
          lockAspectRatio: false,
          aspectRatioPresets: [
            CropAspectRatioPreset.square,
            CropAspectRatioPreset.ratio3x2,
            CropAspectRatioPreset.original,
            CropAspectRatioPreset.ratio4x3,
            CropAspectRatioPreset.ratio16x9
          ],
          hideBottomControls: false,
          cropStyle: cropStyle,
        ),
        IOSUiSettings(
          title: 'Edit Image',
          aspectRatioLockEnabled: false,
          resetAspectRatioEnabled: true,
          aspectRatioPresets: [
            CropAspectRatioPreset.square,
            CropAspectRatioPreset.ratio3x2,
            CropAspectRatioPreset.original,
            CropAspectRatioPreset.ratio4x3,
            CropAspectRatioPreset.ratio16x9
          ],
          cropStyle: cropStyle,
        ),
      ],
    );

    if (croppedFile == null) {
      _logger.info('🚫 Image cropping cancelled');
      return null;
    }

    return File(croppedFile.path);
  }

  Future<File?> pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return null;
    return File(image.path);
  }

  Future<File?> capturePhoto() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image == null) return null;
    return File(image.path);
  }

  Future<File?> pickVideo() async {
    final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
    if (video == null) return null;
    return File(video.path);
  }

  Future<File?> compressImage(File file) async {
    _logger.info('🖼️ Compressing image: ${file.path}');
    final dir = await getTemporaryDirectory();
    final targetPath = p.join(dir.path, "${DateTime.now().millisecondsSinceEpoch}.jpg");

    final result = await FlutterImageCompress.compressAndGetFile(
      file.absolute.path,
      targetPath,
      quality: 70,
    );

    if (result == null) {
      _logger.error('❌ Image compression failed');
      return null;
    }

    final compressedFile = File(result.path);
    _logger.info('✅ Image compressed: ${(await compressedFile.length()) / 1024} KB');
    return compressedFile;
  }

  Future<File?> compressVideo(File file) async {
    _logger.info('📹 Compressing video: ${file.path}');
    
    final MediaInfo? mediaInfo = await VideoCompress.compressVideo(
      file.path,
      quality: VideoQuality.MediumQuality,
      deleteOrigin: false,
    );

    if (mediaInfo == null || mediaInfo.file == null) {
      _logger.error('❌ Video compression failed');
      return null;
    }

    _logger.info('✅ Video compressed: ${(await mediaInfo.file!.length()) / (1024 * 1024)} MB');
    return mediaInfo.file;
  }

  Future<void> cleanTemp() async {
    await VideoCompress.deleteAllCache();
  }
}

final mediaServiceProvider = Provider<MediaService>((ref) {
  final logger = ref.watch(loggerProvider.notifier);
  return MediaService(logger);
});
