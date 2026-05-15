import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
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

class AddInventoryItemScreen extends ConsumerStatefulWidget {
  const AddInventoryItemScreen({super.key});

  @override
  ConsumerState<AddInventoryItemScreen> createState() => _AddInventoryItemScreenState();
}

class _AddInventoryItemScreenState extends ConsumerState<AddInventoryItemScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _priceController = TextEditingController();
  final _serialController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _remarksController = TextEditingController();
  
  String _selectedCategory = 'Camera';
  String _selectedCondition = 'GOOD';
  String _selectedStatus = 'AVAILABLE';
  File? _selectedImage;
  bool _isUploading = false;
  bool _isSaving = false;

  final List<String> _categories = [
    'Camera', 'Audio', 'Lights', 'Cables', 'Lens', 'IT', 
    'Furniture', 'Decoration', 'Camera Support & Stabilization', 
    'Lenses & Optics', 'Grip & Rigging', 'Power & Batteries', 
    'Media & Storage', 'Computing & Monitoring', 'Production Consumables', 
    'Transport & Cases', 'Studio Infrastructure', 'Other'
  ];

  final List<String> _conditions = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
  final List<String> _statuses = ['AVAILABLE', 'IN USE', 'MAINTENANCE', 'RETIRED'];

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _priceController.dispose();
    _serialController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _remarksController.dispose();
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

  Future<void> _handleSave() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an item name')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      String? imageUrl;
      String? driveFileId;

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
          print('[ADD_ASSET] Upload success. Image URL: $imageUrl, File ID: $driveFileId');
        } else {
          print('[ADD_ASSET] Upload failed or returned unexpected result: $result');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Image upload failed. Asset will be created without a photo.'),
                backgroundColor: AppColors.warning,
              ),
            );
          }
        }
        setState(() => _isUploading = false);
      }

      final newItem = InventoryItem(
        id: const Uuid().v4(),
        name: _nameController.text,
        category: _selectedCategory,
        condition: _selectedCondition,
        quantity: int.tryParse(_quantityController.text) ?? 1,
        status: _selectedStatus,
        imageUrl: imageUrl,
        description: _remarksController.text,
        metadata: {
          'purchase_price': double.tryParse(_priceController.text) ?? 0.0,
          'serial_number': _serialController.text,
          'brand': _brandController.text,
          'model': _modelController.text,
          'drive_file_id': driveFileId,
          'unit': 'piece',
        },
      );

      await ref.read(inventoryListProvider.notifier).addItem(newItem);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Asset added successfully')),
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
    return Scaffold(
      backgroundColor: AppColors.backgroundPrimary,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.darkGradient,
        ),
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.l),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildImageSection(),
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
                          ),
                        ),
                        const SizedBox(width: AppSpacing.m),
                        Expanded(
                          child: _buildDropdown(
                            label: 'CONDITION *',
                            value: _selectedCondition,
                            items: _conditions,
                            onChanged: (val) => setState(() => _selectedCondition = val!),
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
                    const SizedBox(height: AppSpacing.m),
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
                    MhInput(
                      label: 'REMARKS / DESCRIPTION',
                      hint: 'Additional notes about the asset...',
                      controller: _remarksController,
                      prefixIcon: LucideIcons.fileText,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    MhButton(
                      label: _isSaving ? 'Saving...' : 'Add Asset',
                      onTap: _isSaving ? () {} : _handleSave,
                      isLoading: _isSaving,
                      icon: LucideIcons.save,
                      type: MhButtonType.primary,
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.surface.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.chevronLeft, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: AppSpacing.m),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ADD ASSET',
                style: AppTypography.h2.copyWith(color: Colors.white, letterSpacing: 1.5),
              ),
              Text(
                'REGISTER A NEW ITEM INTO THE INVENTORY.',
                style: AppTypography.caption.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ASSET IMAGES',
          style: AppTypography.bodyS.copyWith(
            color: AppColors.textSecondary,
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
              color: AppColors.surface.withOpacity(0.3),
              borderRadius: BorderRadius.circular(AppRadius.l),
              border: Border.all(color: AppColors.border.withOpacity(0.5), style: BorderStyle.solid),
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
                          child: const Center(child: CircularProgressIndicator(color: AppColors.honey)),
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
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.uploadCloud, color: AppColors.textSecondary, size: 32),
                      const SizedBox(height: AppSpacing.s),
                      Text('Add Photo', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.bodyS.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: AppColors.backgroundSecondary,
              icon: const Icon(LucideIcons.chevronDown, size: 16),
              style: AppTypography.bodyM.copyWith(color: Colors.white),
              onChanged: onChanged,
              items: items.map((String item) {
                return DropdownMenuItem<String>(
                  value: item,
                  child: Text(item),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }
}
