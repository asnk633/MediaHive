import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/services/logger_service.dart';
import '../../../../core/services/media_service.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../shared/widgets/mh_button.dart';
import '../../../../shared/widgets/mh_input.dart';
import '../providers/inventory_provider.dart';
import '../../domain/models/inventory_item.dart';
import '../../data/services/inventory_api_service.dart';
import '../../../../core/utils/url_helpers.dart';
import '../../../../core/theme_provider.dart';

class AddInventoryItemScreen extends ConsumerStatefulWidget {
  final InventoryItem? itemToEdit;
  const AddInventoryItemScreen({super.key, this.itemToEdit});

  @override
  ConsumerState<AddInventoryItemScreen> createState() => _AddInventoryItemScreenState();
}

class _AddInventoryItemScreenState extends ConsumerState<AddInventoryItemScreen> {
  @override
  void initState() {
    super.initState();
    // Proactive RBAC check
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profile = ref.read(currentUserProfileProvider).valueOrNull;
      final role = profile?['role']?.toString().toLowerCase() ?? 'member';
      if (role != 'admin' && role != 'manager') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Access Restricted: Admin or Manager only')),
        );
        context.pop();
      }
    });

    if (widget.itemToEdit != null) {
      final item = widget.itemToEdit!;
      _nameController.text = item.name;
      _quantityController.text = item.quantity.toString();
      _remarksController.text = item.description ?? '';
      
      if (_categories.contains(item.category)) {
        _selectedCategory = item.category;
      } else {
        _selectedCategory = _categories.firstWhere(
          (c) => c.toLowerCase() == item.category.toLowerCase(),
          orElse: () => _categories.first,
        );
      }
      
      final condDb = item.condition.toUpperCase();
      if (condDb == 'GOOD') {
        _selectedCondition = 'GOOD';
      } else if (condDb == 'FAIR' || condDb == 'NEED REPAIR' || condDb == 'NEED_REPAIR') {
        _selectedCondition = 'FAIR';
      } else if (condDb == 'POOR') {
        _selectedCondition = 'POOR';
      } else if (condDb == 'DAMAGED') {
        _selectedCondition = 'DAMAGED';
      } else {
        _selectedCondition = 'GOOD';
      }

      final statusDb = item.status.toUpperCase();
      if (statusDb == 'AVAILABLE') {
        _selectedStatus = 'AVAILABLE';
      } else if (statusDb == 'IN USE' || statusDb == 'IN_USE') {
        _selectedStatus = 'IN USE';
      } else if (statusDb == 'MAINTENANCE' || statusDb == 'UNDER REPAIR' || statusDb == 'UNDER_REPAIR') {
        _selectedStatus = 'MAINTENANCE';
      } else if (statusDb == 'RETIRED' || statusDb == 'DISPOSED') {
        _selectedStatus = 'RETIRED';
      } else {
        _selectedStatus = 'AVAILABLE';
      }

      final price = item.purchaseAmount ?? item.metadata['purchase_price'];
      if (price != null) {
        _priceController.text = price.toString();
      }
      final serial = item.serialNumber ?? item.metadata['serial_number'];
      if (serial != null) {
        _serialController.text = serial.toString();
      }
      final brand = item.metadata['brand'];
      if (brand != null) {
        _brandController.text = brand.toString();
      }
      final model = item.metadata['model'];
      if (model != null) {
        _modelController.text = model.toString();
      }
      final loc = item.location ?? item.metadata['location'];
      if (loc != null) {
        _locationController.text = loc.toString();
      }
      final pDate = item.purchaseDate ?? item.metadata['purchase_date'];
      if (pDate != null) {
        _purchaseDate = DateTime.tryParse(pDate.toString());
      }
    }
  }

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _priceController = TextEditingController();
  final _serialController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _locationController = TextEditingController();
  final _remarksController = TextEditingController();
  
  DateTime? _purchaseDate;
  String _selectedCategory = 'Cameras & Accessories';
  String _selectedCondition = 'GOOD';
  String _selectedStatus = 'AVAILABLE';
  File? _selectedImage;
  bool _isUploading = false;
  bool _isSaving = false;

  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<String> _categories = [
    'Cameras & Accessories',
    'Networking & Power Cables',
    'Audio & Sound Systems',
    'Office & Studio Gear',
    'General Asset',
  ];

  final List<String> _conditions = ['GOOD', 'FAIR', 'POOR', 'DAMAGED'];
  final List<String> _statuses = ['AVAILABLE', 'IN USE', 'MAINTENANCE', 'RETIRED'];

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _priceController.dispose();
    _serialController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _locationController.dispose();
    _remarksController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final mediaService = ref.read(mediaServiceProvider);
    final image = await mediaService.pickImage();
    if (image != null) {
      final cropped = await mediaService.cropImage(image);
      if (cropped != null) {
        setState(() => _selectedImage = cropped);
      }
    }
  }

  String _mapConditionToSchema(String cond) {
    switch (cond.toUpperCase()) {
      case 'NEW':
      case 'EXCELLENT':
      case 'GOOD':
        return 'Good';
      case 'FAIR':
        return 'Fair';
      case 'POOR':
        return 'Poor';
      case 'DAMAGED':
        return 'Damaged';
      default:
        return 'Good';
    }
  }

  String _mapStatusToSchema(String status) {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'Available';
      case 'IN USE':
      case 'IN_USE':
        return 'In Use';
      case 'MAINTENANCE':
      case 'UNDER REPAIR':
      case 'UNDER_REPAIR':
        return 'Maintenance';
      case 'RETIRED':
      case 'DISPOSED':
        return 'Retired';
      default:
        return 'Available';
    }
  }

  Future<void> _handleSave() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an item name')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      String? imageUrl = widget.itemToEdit?.imageUrl;
      String? driveFileId = widget.itemToEdit?.metadata['drive_file_id'];

      // Handle Image Upload if selected
      if (_selectedImage != null) {
        setState(() => _isUploading = true);
        final profile = ref.read(currentUserProfileProvider).valueOrNull;
        final apiService = InventoryApiService(ref.read(loggerProvider.notifier));
        
        final session = Supabase.instance.client.auth.currentSession;
        final result = await apiService.uploadImage(
          _selectedImage!, 
          profile?['id'] ?? 'unknown',
          profile?['full_name'] ?? profile?['email'] ?? 'Mobile User',
          token: session?.accessToken,
        );

        if (result != null && result['success'] == true) {
          imageUrl = result['viewLink'] ?? result['view_link'] ?? result['web_view_link'] ?? result['thumbnail_link'];
          driveFileId = result['file_id'] ?? result['drive_file_id'];
          debugPrint('[ADD_ASSET] Upload success. Image URL: $imageUrl, File ID: $driveFileId');
        } else {
          debugPrint('[ADD_ASSET] Upload failed or returned unexpected result: $result');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Image upload failed. Asset will be saved with its existing/no photo.'),
                backgroundColor: AppColors.warning,
              ),
            );
          }
        }
        setState(() => _isUploading = false);
      }

      final qty = int.tryParse(_quantityController.text) ?? 1;

      final savedItem = InventoryItem(
        id: widget.itemToEdit?.id ?? const Uuid().v4(),
        assetId: widget.itemToEdit?.assetId ?? 'TGMD${const Uuid().v4().substring(0, 4).toUpperCase()}',
        name: _nameController.text,
        category: _selectedCategory,
        condition: _mapConditionToSchema(_selectedCondition),
        quantity: qty,
        availableQuantity: widget.itemToEdit?.availableQuantity ?? qty,
        status: _mapStatusToSchema(_selectedStatus),
        imageUrl: imageUrl,
        description: _remarksController.text,
        serialNumber: _serialController.text.isNotEmpty ? _serialController.text : null,
        purchaseAmount: double.tryParse(_priceController.text),
        purchaseDate: _purchaseDate?.toIso8601String(),
        location: _locationController.text.isNotEmpty ? _locationController.text : null,
        metadata: {
          ...?widget.itemToEdit?.metadata,
          'purchase_price': double.tryParse(_priceController.text) ?? 0.0,
          'serial_number': _serialController.text,
          'brand': _brandController.text,
          'model': _modelController.text,
          'drive_file_id': driveFileId,
          'unit': 'piece',
          'location': _locationController.text,
          'purchase_date': _purchaseDate?.toIso8601String(),
        },
      );

      if (widget.itemToEdit != null) {
        await ref.read(inventoryListProvider.notifier).updateItem(savedItem);
      } else {
        await ref.read(inventoryListProvider.notifier).addItem(savedItem);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.itemToEdit != null ? 'Asset updated successfully' : 'Asset added successfully')),
        );
        context.pop();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving asset: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colors.backgroundSecondary,
              colors.backgroundPrimary,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          children: [
            _buildHeader(colors),
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
                    padding: const EdgeInsets.all(AppSpacing.l),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildImageSection(colors),
                        const SizedBox(height: AppSpacing.l),
                        MhInput(
                          label: 'ASSET NAME *',
                          hint: 'e.g. Sony A7 IV',
                          controller: _nameController,
                          prefixIcon: LucideIcons.tag,
                        ),
                        const SizedBox(height: AppSpacing.m),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDropdown(
                                label: 'CATEGORY *',
                                value: _selectedCategory,
                                items: _categories,
                                onChanged: (val) => setState(() => _selectedCategory = val!),
                                colors: colors,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.m),
                            Expanded(
                              child: _buildDropdown(
                                label: 'CONDITION *',
                                value: _selectedCondition,
                                items: _conditions,
                                onChanged: (val) => setState(() => _selectedCondition = val!),
                                colors: colors,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.m),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDropdown(
                                label: 'STATUS *',
                                value: _selectedStatus,
                                items: _statuses,
                                onChanged: (val) => setState(() => _selectedStatus = val!),
                                colors: colors,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.m),
                            Expanded(
                              child: MhInput(
                                label: 'QUANTITY *',
                                hint: '1',
                                controller: _quantityController,
                                keyboardType: TextInputType.number,
                                prefixIcon: LucideIcons.layers,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  // Page 2
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(AppSpacing.l),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: MhInput(
                                label: 'BRAND',
                                hint: 'e.g. Sony',
                                controller: _brandController,
                                prefixIcon: LucideIcons.building,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.m),
                            Expanded(
                              child: MhInput(
                                label: 'MODEL',
                                hint: 'e.g. A7 IV',
                                controller: _modelController,
                                prefixIcon: LucideIcons.cpu,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.m),
                        Row(
                          children: [
                            Expanded(
                              child: MhInput(
                                label: 'PURCHASE PRICE',
                                hint: '0.00',
                                controller: _priceController,
                                keyboardType: TextInputType.number,
                                prefixIcon: LucideIcons.dollarSign,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.m),
                            Expanded(
                              child: MhInput(
                                label: 'SERIAL NUMBER',
                                hint: 'Optional',
                                controller: _serialController,
                                prefixIcon: LucideIcons.hash,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.m),
                        Row(
                          children: [
                            Expanded(
                              child: MhInput(
                                label: 'LOCATION',
                                hint: 'e.g. Media Room',
                                controller: _locationController,
                                prefixIcon: LucideIcons.mapPin,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.m),
                            Expanded(
                              child: _buildDatePicker(
                                'PURCHASE DATE',
                                _purchaseDate == null
                                    ? 'Select date'
                                    : '${_purchaseDate!.day.toString().padLeft(2, '0')}-${_purchaseDate!.month.toString().padLeft(2, '0')}-${_purchaseDate!.year}',
                                LucideIcons.calendar,
                                colors,
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: _purchaseDate ?? DateTime.now(),
                                    firstDate: DateTime(2000),
                                    lastDate: DateTime(2100),
                                    builder: (context, child) {
                                      return Theme(
                                        data: colors.isDark
                                            ? ThemeData.dark().copyWith(
                                                colorScheme: ColorScheme.dark(
                                                  primary: colors.indigo,
                                                  onPrimary: Colors.white,
                                                  surface: colors.surface,
                                                  onSurface: colors.textPrimary,
                                                ),
                                              )
                                            : ThemeData.light().copyWith(
                                                colorScheme: ColorScheme.light(
                                                  primary: colors.indigo,
                                                  onPrimary: Colors.white,
                                                  surface: Colors.white,
                                                  onSurface: colors.textPrimary,
                                                ),
                                              ),
                                        child: child!,
                                      );
                                    },
                                  );
                                  if (picked != null) {
                                    setState(() => _purchaseDate = picked);
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.m),
                        MhInput(
                          label: 'REMARKS / DESCRIPTION',
                          hint: 'Additional notes about the asset...',
                          controller: _remarksController,
                          prefixIcon: LucideIcons.fileText,
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        MhButton(
                          label: _isSaving ? 'Saving...' : (widget.itemToEdit != null ? 'Save Changes' : 'Add Asset'),
                          onTap: _isSaving ? () {} : _handleSave,
                          isLoading: _isSaving,
                          icon: LucideIcons.save,
                          type: MhButtonType.primary,
                        ),
                        const SizedBox(height: AppSpacing.xxl),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Bottom Navigation & Progress Indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              color: colors.backgroundPrimary,
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
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.itemToEdit != null)
                          Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: TextButton(
                              onPressed: _isSaving ? null : _handleSave,
                              child: _isSaving
                                  ? SizedBox(
                                      width: 16, height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: colors.honey),
                                    )
                                  : Text('Save', style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        TextButton(
                          onPressed: () {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                          child: Text('Next', style: TextStyle(color: colors.indigo, fontWeight: FontWeight.bold)),
                        ),
                      ],
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

  Widget _buildHeader(ThemeColors colors) {
    final isEditing = widget.itemToEdit != null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: colors.isDark ? colors.surface.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: colors.isDark 
                      ? colors.border.withValues(alpha: 0.3) 
                      : colors.border.withValues(alpha: 0.12),
                ),
              ),
              child: Icon(LucideIcons.chevronLeft, color: colors.textPrimary, size: 20),
            ),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEditing ? 'EDIT ASSET' : 'ADD ASSET',
                  style: AppTypography.h2.copyWith(color: colors.textPrimary, letterSpacing: 1.5),
                ),
                Text(
                  isEditing ? 'UPDATE THE PROPERTIES OF THIS ITEM.' : 'REGISTER A NEW ITEM INTO THE INVENTORY.',
                  style: AppTypography.caption.copyWith(color: colors.textSecondary, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageSection(ThemeColors colors) {
    final directUrl = widget.itemToEdit?.imageUrl != null
        ? UrlHelpers.getDirectImageUrl(widget.itemToEdit!.imageUrl, driveFileId: widget.itemToEdit!.metadata['drive_file_id'])
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ASSET IMAGES',
          style: AppTypography.bodyS.copyWith(
            color: colors.textSecondary,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppSpacing.s),
        GestureDetector(
          onTap: _isUploading ? null : _pickImage,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(AppRadius.l),
              border: Border.all(
                color: colors.isDark 
                    ? colors.border.withValues(alpha: 0.5) 
                    : colors.border.withValues(alpha: 0.15), 
                style: BorderStyle.solid,
              ),
            ),
            child: _selectedImage != null
                ? Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(AppRadius.l),
                        child: Image.file(_selectedImage!, width: 120, height: 120, fit: BoxFit.cover),
                      ),
                      if (_isUploading)
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.black45,
                            borderRadius: BorderRadius.circular(AppRadius.l),
                          ),
                          child: Center(child: CircularProgressIndicator(color: colors.honey)),
                        ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedImage = null),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                            child: const Icon(LucideIcons.x, color: Colors.white, size: 14),
                          ),
                        ),
                      ),
                    ],
                  )
                : directUrl != null
                    ? Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(AppRadius.l),
                            child: Image.network(directUrl, width: 120, height: 120, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildPlaceholderPhotoIcon(colors)),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () {
                                _pickImage();
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                child: const Icon(LucideIcons.edit2, color: Colors.white, size: 14),
                              ),
                            ),
                          ),
                        ],
                      )
                    : _buildPlaceholderPhotoIcon(colors),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholderPhotoIcon(ThemeColors colors) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(LucideIcons.uploadCloud, color: colors.textSecondary, size: 32),
        const SizedBox(height: AppSpacing.s),
        Text('Add Photo', style: AppTypography.caption.copyWith(color: colors.textSecondary)),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required ThemeColors colors,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.bodyS.copyWith(
            color: colors.textSecondary,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
          decoration: BoxDecoration(
            color: colors.isDark ? colors.surface : Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: Border.all(color: colors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: colors.isDark ? colors.surface : Colors.white,
              icon: Icon(LucideIcons.chevronDown, size: 16, color: colors.textSecondary),
              style: AppTypography.bodyM.copyWith(color: colors.textPrimary),
              onChanged: onChanged,
              items: items.map((String item) {
                return DropdownMenuItem<String>(
                  value: item,
                  child: Text(item, style: TextStyle(color: colors.textPrimary)),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker(String label, String hint, IconData icon, ThemeColors colors, {VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            label.toUpperCase(),
            style: AppTypography.caption.copyWith(
              color: colors.textSecondary,
              fontWeight: FontWeight.w900,
              fontSize: 9,
              letterSpacing: 1.2,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: colors.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    hint,
                    style: AppTypography.bodyM.copyWith(
                      color: hint == 'Select date' ? colors.textSecondary.withValues(alpha: 0.5) : colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
