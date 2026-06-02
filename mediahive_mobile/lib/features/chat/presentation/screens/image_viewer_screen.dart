import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:photo_view/photo_view.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/utils/file_download_helper.dart';

class ImageViewerScreen extends ConsumerWidget {
  final String imageUrl;
  final String title;

  const ImageViewerScreen({
    super.key,
    required this.imageUrl,
    required this.title,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.download),
            onPressed: () => FileDownloadHelper.downloadAndShare(context, imageUrl, title),
          ),
        ],
      ),
      body: Center(
        child: PhotoView(
          imageProvider: NetworkImage(imageUrl),
          minScale: PhotoViewComputedScale.contained,
          maxScale: PhotoViewComputedScale.covered * 3,
          backgroundDecoration: const BoxDecoration(
            color: Colors.black,
          ),
          errorBuilder: (context, error, stackTrace) {
            return const Center(
              child: Icon(
                LucideIcons.imageOff,
                color: Colors.white54,
                size: 64,
              ),
            );
          },
          loadingBuilder: (context, event) {
            return const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            );
          },
        ),
      ),
    );
  }
}
