import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/mh_button.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../providers/files_provider.dart';
import '../../domain/models/file_asset.dart';

class DownloadsScreen extends ConsumerStatefulWidget {
  const DownloadsScreen({super.key});

  @override
  ConsumerState<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends ConsumerState<DownloadsScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'all';
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
      final matchesSearch = file.name.toLowerCase().contains(_searchQuery.toLowerCase());
      
      bool matchesCategory = true;
      if (_selectedCategory == 'photos') {
        matchesCategory = file.mimeType.startsWith('image/');
      } else if (_selectedCategory == 'videos') {
        matchesCategory = file.mimeType.startsWith('video/');
      } else if (_selectedCategory == 'docs') {
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
        child: RefreshIndicator(
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


  void _showUploadDialog(ThemeColors colors) {
    String visibility = 'All Users';
    bool isInstitution = false;
    String selectedOrg = 'Select Office / Unit';
    String storageLocation = 'Auto-detect (Smart)';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colors.backgroundSecondary,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: colors.border),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 40, spreadRadius: 10),
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
                              color: const Color(0xFF3B82F6).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.uploadCloud, color: Color(0xFF3B82F6), size: 20),
                          ),
                          const SizedBox(width: 16),
                          Text('Upload File', style: TextStyle(color: colors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: Icon(LucideIcons.x, color: colors.textSecondary, size: 20),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildDialogLabel('FILE SELECTION', colors),
                  const SizedBox(height: 8),
                  _buildFilePickerField(colors),
                  const SizedBox(height: 20),
                  _buildDialogLabel('DISPLAY NAME (OPTIONAL)', colors),
                  const SizedBox(height: 8),
                  _buildDialogTextField('e.g. Annual Report 2024', colors),
                  
                  const Divider(height: 40, thickness: 0.5, color: Colors.white10),
                  
                  _buildDialogLabel('VISIBILITY SETTINGS', colors),
                  const SizedBox(height: 8),
                  _buildDialogDropdown(
                    visibility, 
                    LucideIcons.chevronDown, 
                    colors,
                    onTap: () => _showSimplePicker(
                      context, 
                      'Visibility', 
                      ['All Users', 'Managers Only', 'Private'],
                      (val) => setDialogState(() => visibility = val),
                      colors,
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  _buildDialogLabel('ORGANIZATION', colors),
                  const SizedBox(height: 12),
                  _buildOrganizationToggle(
                    colors, 
                    isInstitution, 
                    (val) => setDialogState(() {
                      isInstitution = val;
                      selectedOrg = val ? 'Select Institution' : 'Select Office / Unit';
                    }),
                  ),
                  const SizedBox(height: 12),
                  _buildDialogDropdown(
                    selectedOrg, 
                    LucideIcons.chevronDown, 
                    colors,
                    onTap: () => _showSimplePicker(
                      context, 
                      isInstitution ? 'Institution' : 'Office / Unit', 
                      isInstitution 
                        ? ['Main Campus', 'City Center', 'Global Reach']
                        : ['Admin Office', 'Creative Studio', 'Media Lab', 'Tech Center'],
                      (val) => setDialogState(() => selectedOrg = val),
                      colors,
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  _buildDialogLabel('STORAGE LOCATION', colors),
                  const SizedBox(height: 8),
                  _buildDialogDropdown(
                    storageLocation, 
                    LucideIcons.chevronDown, 
                    colors, 
                    icon: LucideIcons.sparkles,
                    onTap: () => _showSimplePicker(
                      context, 
                      'Storage Location', 
                      ['Auto-detect (Smart)', 'Google Drive', 'Supabase Cloud', 'Local Server'],
                      (val) => setDialogState(() => storageLocation = val),
                      colors,
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text('Cancel', style: TextStyle(color: colors.textSecondary, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Uploading to $storageLocation...'), 
                              backgroundColor: const Color(0xFF3B82F6)
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        child: const Text('Upload File', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showSimplePicker(BuildContext context, String title, List<String> options, Function(String) onSelect, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: colors.backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: colors.textSecondary.withOpacity(0.2), borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(title, style: TextStyle(color: colors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            ...options.map((opt) => InkWell(
              onTap: () {
                onSelect(opt);
                Navigator.pop(context);
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Text(opt, style: TextStyle(color: colors.textPrimary, fontSize: 16)),
              ),
            )).toList(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildOrganizationToggle(ThemeColors colors, bool isInstitution, Function(bool) onToggle) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
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
                  color: !isInstitution ? const Color(0xFF3B82F6) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text('Office / Unit', 
                    style: TextStyle(
                      color: !isInstitution ? Colors.white : colors.textSecondary, 
                      fontWeight: FontWeight.bold, 
                      fontSize: 12
                    )
                  )
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => onToggle(true),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isInstitution ? const Color(0xFF3B82F6) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text('Institution', 
                    style: TextStyle(
                      color: isInstitution ? Colors.white : colors.textSecondary, 
                      fontWeight: FontWeight.bold, 
                      fontSize: 12
                    )
                  )
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDialogDropdown(String text, IconData trailing, ThemeColors colors, {IconData? icon, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        decoration: BoxDecoration(
          color: colors.surface.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: const Color(0xFFFDBA74), size: 16),
              const SizedBox(width: 12),
            ],
            Expanded(child: Text(text, style: TextStyle(color: colors.textPrimary, fontSize: 14))),
            Icon(trailing, color: colors.textSecondary, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildDialogLabel(String text, ThemeColors colors) {
    return Text(text, style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2));
  }

  Widget _buildFilePickerField(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: colors.textPrimary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('Choose File', style: TextStyle(color: colors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Text('No file chosen', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildDialogTextField(String hint, ThemeColors colors) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: TextField(
        style: TextStyle(color: colors.textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.3)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        ),
      ),
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
      {'id': 'all', 'label': 'All Assets', 'icon': LucideIcons.layoutGrid},
      {'id': 'docs', 'label': 'Docs', 'icon': LucideIcons.fileText},
      {'id': 'photos', 'label': 'Photos', 'icon': LucideIcons.image},
      {'id': 'videos', 'label': 'Videos', 'icon': LucideIcons.video},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((cat) {
          final isSelected = _selectedCategory == cat['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => setState(() => _selectedCategory = cat['id'] as String),
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
                    Icon(cat['icon'] as IconData, size: 14, color: isSelected ? colors.textPrimary : colors.textSecondary),
                    const SizedBox(width: 8),
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

  Widget _buildViewToggle(ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '${_selectedCategory.toUpperCase()} ASSETS',
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
          
          return Container(
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
                if ((isImage || isVideo) && file.thumbnailLink != null)
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
          );
        },
        childCount: files.length,
      ),
    );
  }

  Widget _buildAssetList(ThemeColors colors, List<FileAsset> files) {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final file = files[index];
          final isVideo = file.mimeType.contains('video');
          final isImage = file.mimeType.contains('image');
          
          return Container(
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
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colors.textPrimary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    isVideo ? LucideIcons.fileVideo : (isImage ? LucideIcons.image : LucideIcons.fileText),
                    size: 18,
                    color: const Color(0xFF3B82F6),
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
                        '${DateFormat('MMM dd').format(file.createdAt).toUpperCase()} • ${_formatSize(file.size)}',
                        style: TextStyle(fontSize: 10, color: colors.textSecondary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                Icon(LucideIcons.moreVertical, size: 16, color: colors.textSecondary),
              ],
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

