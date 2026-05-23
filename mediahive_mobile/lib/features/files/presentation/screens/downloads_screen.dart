import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/mh_button.dart';
import '../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../providers/files_provider.dart';
import '../widgets/file_detail_modal.dart';
import '../widgets/upload_file_modal.dart';
import '../../domain/models/file_asset.dart';
import '../../../../core/utils/url_helpers.dart';
import '../../../../presentation/providers/navigation_provider.dart';

class DownloadsScreen extends ConsumerStatefulWidget {
  const DownloadsScreen({super.key});

  @override
  ConsumerState<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends ConsumerState<DownloadsScreen> {
  String _searchQuery = '';
  String? _selectedCategory;
  bool _isGridView = true;
  final TextEditingController _searchController = TextEditingController();

  String _formatSize(int bytes) {
    if (bytes <= 0) return "0 B";
    const suffixes = ["B", "KB", "MB", "GB", "TB"];
    var i = (math.log(bytes) / math.log(1024)).floor();
    return ((bytes / math.pow(1024, i)).toStringAsFixed(1)) + ' ' + suffixes[i];
  }

  List<FileAsset> _filterFiles(List<FileAsset> files) {
    return files.where((file) {
      final matchesSearch = file.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                           file.path.toLowerCase().contains(_searchQuery.toLowerCase());
      
      bool matchesCategory = true;
      if (_selectedCategory == 'image') {
        matchesCategory = file.mimeType.startsWith('image/');
      } else if (_selectedCategory == 'video') {
        matchesCategory = file.mimeType.startsWith('video/');
      } else if (_selectedCategory == 'document') {
        matchesCategory = !file.mimeType.startsWith('image/') && !file.mimeType.startsWith('video/');
      }

      return matchesSearch && matchesCategory;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final filesAsync = ref.watch(filesListProvider);

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
        child: MhRefreshIndicator(
          edgeOffset: 140,
          onRefresh: () => ref.refresh(filesListProvider.future),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(left: AppSpacing.l, right: AppSpacing.l, top: 140),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('DOWNLOADS', 
                                style: AppTypography.h1
                              ),
                              const SizedBox(height: 8),
                              Text('YOUR UNIFIED LIBRARY FOR ASSETS.', 
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.textSecondary, letterSpacing: 1.5)
                              ),
                            ],
                          ),
                          MhButton(
                            label: 'Upload File',
                            onTap: () => _showUploadDialog(colors),
                            height: 36,
                            type: MhButtonType.primary,
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      _buildSearchBar(colors),
                      const SizedBox(height: 24),
                      _buildCategoryTabs(colors),
                      const SizedBox(height: 24),
                      
                      _buildViewToggle(colors),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),

              // Files List/Grid
              filesAsync.when(
                loading: () => const SliverFillRemaining(child: Center(child: CircularProgressIndicator())),
                error: (e, _) => SliverFillRemaining(child: Center(child: Text('Error: $e', style: TextStyle(color: colors.textSecondary)))),
                data: (files) {
                  // Special handling for Folder category
                  if (_selectedCategory == 'folder') {
                    final albums = _groupFilesByAlbum(files);
                    if (albums.isEmpty) return SliverToBoxAdapter(child: _buildEmptyState(colors));
                    return SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      sliver: _buildFolderGrid(colors, albums),
                    );
                  }

                  final filtered = _filterFiles(files);
                  if (filtered.isEmpty) {
                    return SliverToBoxAdapter(child: _buildEmptyState(colors));
                  }
                  
                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: _isGridView 
                        ? _buildAssetGrid(colors, filtered)
                        : _buildAssetList(colors, filtered),
                  );
                },
              ),
              
              const SliverToBoxAdapter(child: SizedBox(height: 120)),
            ],
          ),
        ),
      ),
    );
  }
  Map<String, List<FileAsset>> _groupFilesByAlbum(List<FileAsset> files) {
    final Map<String, List<FileAsset>> groups = {};
    for (var file in files) {
      // Ensure all files are visible by mapping placeholder paths to 'Uncategorized'
      final album = (file.path.isEmpty || file.path == 'Auto-detect (Smart)') ? 'Uncategorized' : file.path;
      groups.putIfAbsent(album, () => []).add(file);
    }
    return groups;
  }

  Widget _buildSectionLabel(String text, ThemeColors colors) {
    return Text(
      text,
      style: TextStyle(
        color: colors.textSecondary,
        fontSize: 10,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _buildAlbumsRow(Map<String, List<FileAsset>> albums, ThemeColors colors) {
    final albumList = albums.entries.toList();
    
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: albumList.length,
        itemBuilder: (context, index) {
          final album = albumList[index];
          final hasPreview = album.value.any((f) => f.thumbnailLink != null);
          final previewUrl = hasPreview ? album.value.firstWhere((f) => f.thumbnailLink != null).thumbnailLink : null;

          return GestureDetector(
            onTap: () {
              setState(() {
                _searchController.text = album.key;
                _searchQuery = album.key;
                _selectedCategory = null;
              });
            },
            child: Container(
              width: 140,
              margin: const EdgeInsets.only(right: 16),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.border),
                boxShadow: colors.cardShadow,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  if (previewUrl != null)
                    Positioned.fill(
                      child: Opacity(
                        opacity: 0.3,
                        child: Image.network(previewUrl, fit: BoxFit.cover),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Icon(LucideIcons.folder, color: Color(0xFF3B82F6), size: 20),
                        const SizedBox(height: 8),
                        Text(
                          album.key,
                          style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${album.value.length} items',
                          style: TextStyle(color: colors.textSecondary, fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showUploadDialog(ThemeColors colors) {
    showDialog(
      context: context,
      builder: (context) => const UploadFileModal(),
    );
  }

  Widget _buildSearchBar(ThemeColors colors) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val),
        style: TextStyle(color: colors.textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search library...',
          hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5)),
          prefixIcon: Icon(LucideIcons.search, size: 18, color: colors.textSecondary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
        ),
      ),
    );
  }

  Widget _buildCategoryTabs(ThemeColors colors) {
    final categories = [
      {'id': null, 'label': 'All Assets', 'icon': LucideIcons.layoutGrid},
      {'id': 'folder', 'label': 'Folders', 'icon': LucideIcons.folder},
      {'id': 'document', 'label': 'Docs', 'icon': LucideIcons.fileText},
      {'id': 'image', 'label': 'Photos', 'icon': LucideIcons.image},
      {'id': 'video', 'label': 'Videos', 'icon': LucideIcons.video},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((cat) {
          final isSelected = _selectedCategory == cat['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              onTap: () => setState(() => _selectedCategory = cat['id'] as String?),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? colors.textPrimary.withOpacity(0.1) : colors.surface.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? colors.textPrimary.withOpacity(0.2) : colors.border),
                ),
                child: Row(
                  children: [
                    if (cat['icon'] != null) ...[
                      Icon(cat['icon'] as IconData, size: 14, color: isSelected ? colors.textPrimary : colors.textSecondary),
                      const SizedBox(width: 8),
                    ],
                    Text(cat['label'] as String, 
                      style: TextStyle(
                        fontSize: 12, 
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? colors.textPrimary : colors.textSecondary
                      )
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFolderGrid(ThemeColors colors, Map<String, List<FileAsset>> albums) {
    final albumList = albums.entries.toList();
    
    return SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.4,
      ),
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final album = albumList[index];
          final hasPreview = album.value.any((f) => f.thumbnailLink != null);
          final previewUrl = hasPreview ? album.value.firstWhere((f) => f.thumbnailLink != null).thumbnailLink : null;

          return GestureDetector(
            onTap: () {
              setState(() {
                _searchController.text = album.key;
                _searchQuery = album.key;
                _selectedCategory = null; 
              });
            },
            child: Container(
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colors.border),
                boxShadow: colors.cardShadow,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  if (previewUrl != null)
                    Positioned.fill(
                      child: Opacity(
                        opacity: 0.3,
                        child: Image.network(previewUrl, fit: BoxFit.cover),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(LucideIcons.folder, color: Color(0xFF3B82F6), size: 24),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          album.key,
                          style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${album.value.length} assets',
                          style: TextStyle(color: colors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        childCount: albumList.length,
      ),
    );
  }
  Widget _buildViewToggle(ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '${(_selectedCategory ?? 'all').toUpperCase()} ASSETS',
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.textSecondary, letterSpacing: 1.5),
        ),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: colors.surface.withOpacity(0.5),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: colors.border),
          ),
          child: Row(
            children: [
              _buildToggleItem(LucideIcons.layoutGrid, _isGridView, () => setState(() => _isGridView = true), colors),
              _buildToggleItem(LucideIcons.list, !_isGridView, () => setState(() => _isGridView = false), colors),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildToggleItem(IconData icon, bool isActive, VoidCallback onTap, ThemeColors colors) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: isActive ? colors.textPrimary.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 16, color: isActive ? colors.textPrimary : colors.textSecondary),
      ),
    );
  }

  Widget _buildAssetGrid(ThemeColors colors, List<FileAsset> files) {
    void showFileDetails(FileAsset asset) {
      ref.read(bottomNavVisibleProvider.notifier).state = false;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => FileDetailModal(asset: asset),
      ).then((_) {
        ref.read(bottomNavVisibleProvider.notifier).state = true;
      });
    }

    return SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.1,
      ),
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final file = files[index];
          final isVideo = file.mimeType.startsWith('video/');
          final isImage = file.mimeType.startsWith('image/');
          final isPdf = file.mimeType.contains('pdf');
          
          return GestureDetector(
            onTap: () => showFileDetails(file),
            child: Container(
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: colors.border),
                boxShadow: colors.cardShadow,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Preview
                  if ((isImage || isVideo || isPdf) && file.thumbnailLink != null)
                    _buildPreviewImage(file.thumbnailLink!, colors, file)
                  else
                    _buildFileIcon(file, colors),
                  
                  // Badges
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isPdf ? Colors.red.withOpacity(0.8) : (isVideo ? const Color(0xFF3B82F6).withOpacity(0.8) : Colors.black.withOpacity(0.5)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isPdf ? 'PDF' : (isVideo ? 'VIDEO' : (isImage ? 'IMG' : 'FILE')),
                        style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
  
                  // Play icon for videos
                  if (isVideo)
                    Center(child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.4), shape: BoxShape.circle),
                      child: const Icon(LucideIcons.play, color: Colors.white, size: 20),
                    )),
  
                  // Gradient Overlay
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                          stops: const [0.5, 1.0],
                        ),
                      ),
                    ),
                  ),
  
                  // Name
                  Positioned(
                    bottom: 12,
                    left: 12,
                    right: 12,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          file.name,
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _formatSize(file.size),
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 9),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        childCount: files.length,
      ),
    );
  }

  Widget _buildAssetList(ThemeColors colors, List<FileAsset> files) {
    void showFileDetails(FileAsset asset) {
      ref.read(bottomNavVisibleProvider.notifier).state = false;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => FileDetailModal(asset: asset),
      ).then((_) {
        ref.read(bottomNavVisibleProvider.notifier).state = true;
      });
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final file = files[index];
          final isVideo = file.mimeType.contains('video');
          final isImage = file.mimeType.contains('image');
          
          return GestureDetector(
            onTap: () => showFileDetails(file),
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.border),
                boxShadow: colors.cardShadow,
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: colors.textPrimary.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Builder(
                      builder: (context) {
                        final isPdf = file.mimeType.contains('pdf');
                        final thumbUrl = UrlHelpers.getDirectImageUrl(file.thumbnailLink, driveFileId: file.driveFileId, mimeType: file.mimeType);
                        
                        if (thumbUrl != null && (isImage || isVideo || isPdf)) {
                          return Image.network(
                            thumbUrl, 
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              print('[DOWNLOADS] Thumb error: $error for $thumbUrl');
                              return Center(
                                child: Icon(
                                  isVideo ? LucideIcons.fileVideo : (isPdf ? LucideIcons.fileText : LucideIcons.image),
                                  color: colors.textSecondary.withOpacity(0.5),
                                  size: 20,
                                ),
                              );
                            },
                          );
                        }
                        
                        return Center(
                          child: Icon(
                            isVideo ? LucideIcons.fileVideo : (isPdf ? LucideIcons.fileText : LucideIcons.image),
                            color: colors.textSecondary.withOpacity(0.5),
                            size: 20,
                          ),
                        );
                      }
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          file.name,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${DateFormat('dd-MM-yyyy').format(file.createdAt)} • ${_formatSize(file.size)}',
                          style: TextStyle(fontSize: 10, color: colors.textSecondary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Icon(LucideIcons.moreVertical, size: 16, color: colors.textSecondary),
                ],
              ),
            ),
          );
        },
        childCount: files.length,
      ),
    );
  }

  Widget _buildPreviewImage(String url, ThemeColors colors, FileAsset file) {
    return Image.network(
      url,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(
          color: colors.surface,
          child: Center(
            child: CircularProgressIndicator(
              value: loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                  : null,
              strokeWidth: 2,
              color: colors.textSecondary.withOpacity(0.2),
            ),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        return _buildFileIcon(file, colors);
      },
    );
  }

  Widget _buildFileIcon(FileAsset file, ThemeColors colors) {
    IconData icon = LucideIcons.fileText;
    if (file.mimeType.startsWith('image/')) icon = LucideIcons.image;
    else if (file.mimeType.startsWith('video/')) icon = LucideIcons.video;
    
    return Container(
      color: colors.surface,
      child: Center(child: Icon(icon, color: colors.textSecondary.withOpacity(0.3), size: 40)),
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 80),
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: colors.surface.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(LucideIcons.download, size: 48, color: colors.textSecondary.withOpacity(0.3)),
          ),
          const SizedBox(height: 24),
          Text('NO ASSETS FOUND', style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(_searchQuery.isNotEmpty ? 'Try a different search query' : 'Start by uploading your first asset', 
            style: TextStyle(color: colors.textSecondary, fontSize: 12)
          ),
        ],
      ),
    );
  }
}

