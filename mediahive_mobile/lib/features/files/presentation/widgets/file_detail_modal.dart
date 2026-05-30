import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:photo_view/photo_view.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:intl/intl.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:gal/gal.dart';
import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../domain/models/file_asset.dart';
import '../providers/files_provider.dart';

class FileDetailModal extends ConsumerStatefulWidget {
  final FileAsset asset;

  const FileDetailModal({
    super.key,
    required this.asset,
  });

  @override
  ConsumerState<FileDetailModal> createState() => _FileDetailModalState();
}

class _FileDetailModalState extends ConsumerState<FileDetailModal> {
  VideoPlayerController? _videoPlayerController;
   ChewieController? _chewieController;
  bool _isDownloading = false;
  bool _isDeleting = false;
  double _downloadProgress = 0;
  String? _videoError;

  @override
  void initState() {
    super.initState();
    
    if (widget.asset.mimeType.startsWith('video/')) {
      _initializeVideoPlayer();
    }
  }

  Future<void> _initializeVideoPlayer() async {
    if (widget.asset.downloadLink == null) return;
    
    try {
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(widget.asset.downloadLink!),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );

      await _videoPlayerController!.initialize();
      
      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        autoPlay: true,
        looping: false,
        aspectRatio: _videoPlayerController!.value.aspectRatio,
        placeholder: Container(
          color: Colors.black,
          child: const Center(
            child: CircularProgressIndicator(color: Color(0xFFE59312)),
          ),
        ),
        materialProgressColors: ChewieProgressColors(
          playedColor: const Color(0xFFE59312),
          handleColor: const Color(0xFFE59312),
          backgroundColor: Colors.grey.withOpacity(0.5),
          bufferedColor: Colors.white.withOpacity(0.3),
        ),
      );
      
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) {
        setState(() {
          _videoError = e.toString();
        });
      }
    }
  }

  @override
  void dispose() {
    _videoPlayerController?.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  Future<void> _handleDownload() async {
    final isMedia = widget.asset.mimeType.startsWith('image/') || widget.asset.mimeType.startsWith('video/');
    
    if (isMedia) {
      await _saveToGallery();
    } else {
      await _downloadToFileSystem();
    }
  }

  Future<void> _saveToGallery() async {
    final colors = ref.read(themeColorsProvider);
    if (widget.asset.downloadLink == null) return;

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0;
    });

    try {
      // First download to a temp file
      final dio = Dio();
      final tempDir = await getTemporaryDirectory();
      final tempPath = '${tempDir.path}/${widget.asset.name}';
      
      await dio.download(
        widget.asset.downloadLink!,
        tempPath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
      );

      // Save to gallery
      if (widget.asset.mimeType.startsWith('video/')) {
        await Gal.putVideo(tempPath);
      } else {
        await Gal.putImage(tempPath);
      }
      
      if (mounted) {
        _showSuccessSnackBar(context, 'Saved to Gallery!', colors);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save to gallery: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  Future<void> _downloadToFileSystem() async {
    final colors = ref.read(themeColorsProvider);
    if (widget.asset.downloadLink == null) return;

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0;
    });

    try {
      final dio = Dio();
      Directory? directory;
      
      if (Platform.isAndroid) {
        directory = Directory('/storage/emulated/0/Download');
        if (!await directory.exists()) {
          directory = await getExternalStorageDirectory();
        }
      } else {
        directory = await getApplicationDocumentsDirectory();
      }

      final savePath = '${directory!.path}/${widget.asset.name}';
      
      await dio.download(
        widget.asset.downloadLink!,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
      );

      if (mounted) {
        _showSuccessSnackBar(context, 'Downloaded to ${widget.asset.name}', colors);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isDownloading = false);
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
                  color: colors.emerald.withOpacity(0.2),
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
        backgroundColor: colors.backgroundSecondary.withOpacity(0.9),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(24, 0, 24, 40),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: colors.emerald.withOpacity(0.3), width: 1.5),
        ),
        elevation: 0,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _shareFile() async {
    final linkToShare = widget.asset.viewLink ?? widget.asset.downloadLink;
    if (linkToShare == null) return;
    await Share.shareUri(Uri.parse(linkToShare));
  }

  Future<void> _openInBrowser() async {
    final linkToOpen = widget.asset.viewLink ?? widget.asset.downloadLink;
    if (linkToOpen == null) return;
    
    try {
      final url = Uri.parse(linkToOpen);
      // Use externalApplication as default for Drive links to trigger Drive app if installed
      final launched = await launchUrl(
        url, 
        mode: LaunchMode.externalApplication,
      );
      
      if (!launched && mounted) {
        // Fallback to platform default if external app fails
        await launchUrl(url, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open file: $e')),
        );
      }
    }
  }

  Future<void> _handleDelete() async {
    final colors = ref.read(themeColorsProvider);
    
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.backgroundSecondary,
        title: Text('Delete File?', style: TextStyle(color: colors.textPrimary)),
        content: Text('Are you sure you want to permanently delete this file? This action cannot be undone.', 
          style: TextStyle(color: colors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isDeleting = true);

    try {
      final supabase = Supabase.instance.client;
      
      // 1. Delete from storage if it's a Supabase file
      if (widget.asset.downloadLink != null && widget.asset.downloadLink!.contains('supabase.co/storage')) {
        try {
          final uri = Uri.parse(widget.asset.downloadLink!);
          final pathSegments = uri.pathSegments;
          // URL format: .../storage/v1/object/public/bucket_name/path/to/file
          // segments: [storage, v1, object, public, bucket_name, path, to, file]
          if (pathSegments.length > 5) {
            final bucket = pathSegments[4];
            final fullPath = pathSegments.sublist(5).join('/');
            await supabase.storage.from(bucket).remove([fullPath]);
          }
        } catch (e) {
          debugPrint('Storage deletion error (non-fatal): $e');
        }
      }

      // 2. Delete from DB
      await supabase.from('files').delete().eq('id', widget.asset.id);

      if (mounted) {
        ref.invalidate(filesListProvider);
        Navigator.pop(context); // Close modal
        _showSuccessSnackBar(context, 'File deleted successfully', colors);
      }
    } catch (e) {
      debugPrint('Delete error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isDeleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isImage = widget.asset.mimeType.startsWith('image/');
    final isVideo = widget.asset.mimeType.startsWith('video/');
    final isPdf = widget.asset.mimeType.contains('pdf');

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: colors.backgroundSecondary.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border.all(color: colors.border.withOpacity(0.5)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colors.textSecondary.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Close button and Title
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.asset.name,
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${(widget.asset.size / (1024 * 1024)).toStringAsFixed(2)} MB • ${DateFormat('MMM dd, yyyy').format(widget.asset.createdAt)}',
                            style: TextStyle(
                              color: colors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(LucideIcons.x, color: colors.textSecondary),
                      style: IconButton.styleFrom(
                        backgroundColor: colors.surface.withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ),

              // Preview Area
              Expanded(
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: colors.border.withOpacity(0.3)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: _buildPreview(isImage, isVideo, isPdf, colors),
                  ),
                ),
              ),

              // Actions
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 40), // Standard padding as dock is now hidden
                child: Column(
                  children: [
                    if (_isDownloading)
                      Column(
                        children: [
                          LinearProgressIndicator(
                            value: _downloadProgress,
                            backgroundColor: colors.surface,
                            valueColor: AlwaysStoppedAnimation<Color>(colors.honey),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Processing... ${(_downloadProgress * 100).toInt()}%',
                            style: TextStyle(color: colors.textSecondary, fontSize: 12),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    Row(
                      children: [
                        Expanded(
                          child: _ActionButton(
                            onPressed: _openInBrowser,
                            icon: LucideIcons.externalLink,
                            label: 'Open',
                            color: colors.indigo,
                            textColor: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _ActionButton(
                            onPressed: _isDownloading ? null : _handleDownload,
                            icon: widget.asset.mimeType.startsWith('image/') || widget.asset.mimeType.startsWith('video/') 
                                ? LucideIcons.image : LucideIcons.download,
                            label: widget.asset.mimeType.startsWith('image/') || widget.asset.mimeType.startsWith('video/')
                                ? 'Gallery' : 'Download',
                            color: colors.honey,
                            textColor: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _ActionButton(
                          onPressed: _shareFile,
                          icon: LucideIcons.share2,
                          label: '',
                          color: colors.surface,
                          textColor: colors.textPrimary,
                          isSquare: true,
                        ),
                        
                        // Delete Button for Admin/Manager or Uploader
                        Consumer(
                          builder: (context, ref, child) {
                            final profile = ref.watch(currentUserProfileProvider).value;
                            final role = profile?['role']?.toString().toLowerCase();
                            final userId = profile?['id']?.toString();
                            
                            final isAdminOrManager = role == 'admin' || role == 'manager';
                            final isUploader = userId != null && widget.asset.uploadedBy == userId;
                            
                            final canDelete = isAdminOrManager || (role == 'team' && isUploader);

                            if (!canDelete) return const SizedBox.shrink();

                            return Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: _isDeleting 
                                ? Container(
                                    width: 56,
                                    height: 56,
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.redAccent.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const CircularProgressIndicator(strokeWidth: 2, color: Colors.redAccent),
                                  )
                                : _ActionButton(
                                    onPressed: _handleDelete,
                                    icon: LucideIcons.trash2,
                                    label: '',
                                    color: Colors.redAccent.withOpacity(0.1),
                                    textColor: Colors.redAccent,
                                    isSquare: true,
                                  ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreview(bool isImage, bool isVideo, bool isPdf, ThemeColors colors) {
    if (isImage && widget.asset.downloadLink != null) {
      return PhotoView(
        imageProvider: NetworkImage(widget.asset.downloadLink!),
        backgroundDecoration: const BoxDecoration(color: Colors.transparent),
        minScale: PhotoViewComputedScale.contained,
        maxScale: PhotoViewComputedScale.covered * 2,
      );
    } else if (isVideo && _chewieController != null) {
      return Chewie(controller: _chewieController!);
    } else if (isVideo && _videoError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.alertTriangle, color: Colors.orange, size: 48),
              const SizedBox(height: 16),
              Text(
                'Could not stream video. Try downloading it.',
                style: TextStyle(color: colors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    } else if (isVideo) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: colors.honey),
            const SizedBox(height: 16),
            Text('Streaming...', style: TextStyle(color: colors.textSecondary)),
          ],
        ),
      );
    } else if (isPdf && widget.asset.downloadLink != null) {
      return SfPdfViewer.network(
        widget.asset.downloadLink!,
        enableDoubleTapZooming: true,
      );
    } else if (widget.asset.downloadLink == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.link2Off, color: Colors.redAccent, size: 48),
              const SizedBox(height: 16),
              Text(
                'This file has no accessible download link.',
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Please contact the administrator or re-upload the file.',
                style: TextStyle(color: colors.textSecondary, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    } else {
      // Document or other
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _getIconForMimeType(widget.asset.mimeType),
            size: 80,
            color: colors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Preview not available for this file type',
            style: TextStyle(color: colors.textSecondary),
          ),
        ],
      );
    }
  }

  IconData _getIconForMimeType(String mimeType) {
    if (mimeType.contains('pdf')) return LucideIcons.fileText;
    if (mimeType.contains('word') || mimeType.contains('officedocument')) return LucideIcons.fileText;
    if (mimeType.contains('excel') || mimeType.contains('sheet')) return LucideIcons.fileSpreadsheet;
    return LucideIcons.file;
  }
}

class _ActionButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final IconData icon;
  final String label;
  final Color color;
  final Color textColor;
  final bool isSquare;

  const _ActionButton({
    required this.onPressed,
    required this.icon,
    required this.label,
    required this.color,
    required this.textColor,
    this.isSquare = false,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: textColor,
        padding: EdgeInsets.symmetric(
          vertical: 16,
          horizontal: isSquare ? 0 : 16,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
        minimumSize: isSquare ? const Size(56, 56) : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          if (label.isNotEmpty) ...[
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
