// DIAGNOSTIC RELOAD - Inventory Module Updated
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/analytics_service.dart';
import 'package:mediahive_mobile/features/inventory/presentation/providers/inventory_provider.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_item.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/equipment_booking.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../../../../shared/widgets/mh_empty_state.dart';
import 'package:mediahive_mobile/core/services/network_service.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/features/inventory/presentation/widgets/inventory_transaction_sheets.dart';

final inventoryCategoryProvider = StateProvider<String>((ref) => 'ALL');
final inventorySearchProvider = StateProvider<String>((ref) => '');
final inventorySortProvider = StateProvider<String>((ref) => 'NAME_ASC');
final inventoryTabProvider = StateProvider<int>((ref) => 0); // 0: Equipment, 1: Schedule
final inventoryGuideExpandedProvider = StateProvider<bool>((ref) => false);
enum InventoryViewMode { grid, list }
final inventoryViewModeProvider = StateProvider<InventoryViewMode>((ref) => InventoryViewMode.grid);

class InventoryScreen extends ConsumerWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('InventoryScreen');
    
    final inventoryAsync = ref.watch(inventoryListProvider);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;
    final selectedCategory = ref.watch(inventoryCategoryProvider);
    final searchQuery = ref.watch(inventorySearchProvider);
    final sortMethod = ref.watch(inventorySortProvider);
    final viewMode = ref.watch(inventoryViewModeProvider);
    final activeTab = ref.watch(inventoryTabProvider);
    final guideExpanded = ref.watch(inventoryGuideExpandedProvider);
    final profile = ref.watch(currentUserProfileProvider).valueOrNull;
    final isAdmin = profile?['role']?.toString().toLowerCase() == 'admin' || 
                    profile?['role']?.toString().toLowerCase() == 'manager';

    return Scaffold(
      backgroundColor: AppColors.backgroundPrimary,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.darkGradient,
        ),
        child: Column(
          children: [
            if (networkStatus == NetworkStatus.offline)
              _buildOfflineBanner(),
            Expanded(
              child: inventoryAsync.when(
                data: (items) => _buildContent(
                  context, 
                  ref, 
                  items, 
                  selectedCategory,
                  searchQuery,
                  sortMethod,
                  viewMode, 
                  activeTab, 
                  guideExpanded,
                  isAdmin,
                ),
                loading: () => _buildLoadingState(),
                error: (e, _) => _buildErrorState(ref, e),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflineBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      color: AppColors.warning.withOpacity(0.8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.wifiOff, size: 14, color: Colors.white),
          const SizedBox(width: AppSpacing.s),
          Text(
            'OFFLINE MODE — INVENTORY CHANGES WILL SYNC LATER',
            style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    List<InventoryItem> items,
    String selectedCategory,
    String searchQuery,
    String sortMethod,
    InventoryViewMode viewMode,
    int activeTab,
    bool guideExpanded,
    bool isAdmin,
  ) {
    var filteredItems = items;

    // Filter by Category
    if (selectedCategory != 'ALL') {
      filteredItems = filteredItems.where((i) => i.category.toUpperCase() == selectedCategory).toList();
    }

    // Filter by Search
    if (searchQuery.isNotEmpty) {
      final query = searchQuery.toLowerCase();
      filteredItems = filteredItems.where((i) {
        final nameMatch = i.name.toLowerCase().contains(query);
        final serialMatch = i.metadata['serial_number']?.toString().toLowerCase().contains(query) ?? false;
        return nameMatch || serialMatch;
      }).toList();
    }

    // Sort
    switch (sortMethod) {
      case 'NAME_ASC':
        filteredItems.sort((a, b) => a.name.compareTo(b.name));
        break;
      case 'NAME_DESC':
        filteredItems.sort((a, b) => b.name.compareTo(a.name));
        break;
      case 'CATEGORY':
        filteredItems.sort((a, b) => a.category.compareTo(b.category));
        break;
      case 'STATUS':
        filteredItems.sort((a, b) => a.status.compareTo(b.status));
        break;
      case 'NEWEST':
        // Assuming created_at is available or using ID as proxy
        filteredItems.sort((a, b) => b.id.compareTo(a.id));
        break;
      case 'OLDEST':
        filteredItems.sort((a, b) => a.id.compareTo(b.id));
        break;
      case 'QTY_ASC':
        filteredItems.sort((a, b) => a.quantity.compareTo(b.quantity));
        break;
      case 'QTY_DESC':
        filteredItems.sort((a, b) => b.quantity.compareTo(a.quantity));
        break;
    }

    return RefreshIndicator(
      onRefresh: () => ref.refresh(inventoryListProvider.future),
      color: AppColors.honey,
      backgroundColor: AppColors.surface,
      child: ListView(
        padding: const EdgeInsets.only(
          left: AppSpacing.l, 
          right: AppSpacing.l, 
          top: 140, 
          bottom: 120,
        ),
        children: [
          _buildPageHeader(context, ref, viewMode, isAdmin),
          const SizedBox(height: AppSpacing.xxl),
          _buildTabs(ref, activeTab),
          const SizedBox(height: AppSpacing.m),
          if (activeTab == 0) ...[
            _buildStatsGrid(items, isAdmin),
            const SizedBox(height: AppSpacing.m),
            _buildFilterSection(ref, guideExpanded, viewMode),
            const SizedBox(height: AppSpacing.l),
            if (filteredItems.isEmpty)
              _buildEmptyState()
            else if (viewMode == InventoryViewMode.grid)
              _buildInventoryGrid(filteredItems)
            else
              _buildInventoryList(filteredItems),
          ] else if (activeTab == 1)
            _buildBookingSchedule(ref)
          else
            _buildRequestsView(ref),
        ],
      ),
    );
  }

  Widget _buildFilterSection(WidgetRef ref, bool guideExpanded, InventoryViewMode viewMode) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.4),
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          _buildCategorizationGuide(ref, guideExpanded),
          const SizedBox(height: AppSpacing.m),
          _buildSearchAndFilters(ref, viewMode),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      padding: const EdgeInsets.only(left: AppSpacing.l, right: AppSpacing.l, top: 140),
      children: [
        const MhSkeleton(height: 60, width: double.infinity),
        const SizedBox(height: AppSpacing.m),
        Row(
          children: [
            Expanded(child: MhSkeleton(height: 80)),
            const SizedBox(width: AppSpacing.s),
            Expanded(child: MhSkeleton(height: 80)),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 0.75,
          ),
          itemCount: 6,
          itemBuilder: (_, __) => const MhSkeleton(borderRadius: 16),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return MhEmptyState(
      title: 'No Items Found',
      message: 'Adjust your filters or add a new asset to the studio inventory.',
      icon: LucideIcons.packageSearch,
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 48),
          const SizedBox(height: AppSpacing.m),
          Text('Failed to load inventory', style: AppTypography.h3),
          const SizedBox(height: AppSpacing.s),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: AppTypography.caption.copyWith(color: AppColors.error.withOpacity(0.7)),
            ),
          ),
          const SizedBox(height: AppSpacing.l),
          MhButton(
            label: 'Force Sync',
            onTap: () => ref.read(inventoryListProvider.notifier).forceRefresh(),
            type: MhButtonType.secondary,
            icon: LucideIcons.refreshCw,
          ),
        ],
      ),
    );
  }

  Widget _buildPageHeader(BuildContext context, WidgetRef ref, InventoryViewMode viewMode, bool isAdmin) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('INVENTORY', style: AppTypography.h1),
            if (isAdmin)
              MhButton(
                label: 'Add Asset',
                onTap: () => context.push('/inventory/create'),
                height: 40,
                type: MhButtonType.primary,
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          'MANAGE AND REQUEST STUDIO ASSETS.',
          style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, letterSpacing: 1.2),
        ),
        Consumer(builder: (context, ref, _) {
          final pendingCount = ref.watch(pendingSyncCountProvider).valueOrNull ?? 0;
          if (pendingCount == 0) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text('SYNCING $pendingCount CHANGES...', style: AppTypography.caption.copyWith(color: AppColors.info, fontSize: 8)),
          );
        }),
      ],
    );
  }

  Widget _buildCategorizationGuide(WidgetRef ref, bool expanded) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.transparent,
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => ref.read(inventoryGuideExpandedProvider.notifier).state = !expanded,
            borderRadius: BorderRadius.circular(AppRadius.m),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.s),
              child: Row(
                children: [
                  Icon(LucideIcons.info, size: 18, color: AppColors.info),
                  const SizedBox(width: AppSpacing.s),
                  Expanded(
                    child: Text(
                      'Media Inventory Categorization Guide',
                      style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  Icon(
                    expanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.m, 0, AppSpacing.m, AppSpacing.m),
              child: Column(
                children: [
                  const Divider(color: AppColors.border),
                  const SizedBox(height: AppSpacing.s),
                  _buildGuideRow('Camera', 'Bodies, action cams, drones, camcorders.', 'Audio', 'Mics, recorders, mixers, headphones.'),
                  _buildGuideRow('Lights', 'LED panels, tube lights, softboxes.', 'Cables', 'Video (HDMI), Audio (XLR), Data (USB).'),
                  _buildGuideRow('Lens', 'Prime, zoom, macro, adapters.', 'IT', 'Laptops, tablets, networking, licenses.'),
                  _buildGuideRow('Furniture', 'Studio chairs, desks, posing tables.', 'Decoration', 'Props, plants, rugs, background elements.'),
                  _buildGuideRow('Camera Support', 'Tripods, gimbals, shoulder rigs.', 'Grip & Rigging', 'Stands, clamps, sandbags, frames.'),
                  _buildGuideRow('Media & Storage', 'SD cards, SSDs, hard drives.', 'Production', 'Gaffer tape, gels, lens wipes.'),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGuideRow(String label1, String desc1, String label2, String desc2) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _buildGuideItem(label1, desc1)),
          const SizedBox(width: AppSpacing.m),
          Expanded(child: _buildGuideItem(label2, desc2)),
        ],
      ),
    );
  }

  Widget _buildGuideItem(String label, String desc) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        Text(desc, style: AppTypography.caption.copyWith(fontSize: 10, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildTabs(WidgetRef ref, int activeTab) {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
      ),
      child: Row(
        children: [
          Expanded(child: _buildTabItem(ref, 'Items', 0, activeTab == 0)),
          Expanded(child: _buildTabItem(ref, 'Schedule', 1, activeTab == 1)),
          Expanded(child: _buildTabItem(ref, 'Requests', 2, activeTab == 2)),
        ],
      ),
    );
  }

  Widget _buildTabItem(WidgetRef ref, String label, int index, bool active) {
    return GestureDetector(
      onTap: () => ref.read(inventoryTabProvider.notifier).state = index,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.info : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.s),
        ),
        child: Text(
          label,
          style: AppTypography.bodyS.copyWith(
            fontWeight: FontWeight.bold,
            color: active ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid(List<InventoryItem> items, bool isAdmin) {
    final totalItems = items.length;
    final inRepair = items.where((i) => i.status == 'MAINTENANCE').length;
    final activeBookings = 0; // Placeholder for future bookings module

    return GridView.count(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: AppSpacing.m,
      crossAxisSpacing: AppSpacing.m,
      childAspectRatio: 1.8,
      children: [
        _buildStatCard('TOTAL ITEMS', totalItems.toString(), LucideIcons.box, AppColors.info),
        _buildStatCard('ACTIVE BOOKINGS', activeBookings.toString(), LucideIcons.calendar, AppColors.info),
        if (isAdmin) ...[
          _buildStatCard('NEEDS REPAIR', inRepair.toString(), LucideIcons.alertCircle, AppColors.error),
          _buildStatCard('MAINTENANCE', '0', LucideIcons.wrench, AppColors.warning),
        ],
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value, style: AppTypography.h3),
          ),
          Text(
            label, 
            style: AppTypography.caption.copyWith(fontSize: 8, letterSpacing: 1.1),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildBookingSchedule(WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingListProvider);

    return bookingsAsync.when(
      data: (bookings) {
        if (bookings.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: AppSpacing.xl),
                Icon(LucideIcons.calendar, size: 64, color: AppColors.textSecondary.withOpacity(0.2)),
                const SizedBox(height: AppSpacing.m),
                Text('No active bookings found', style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: AppSpacing.m),
                MhButton(
                  label: 'Book Equipment',
                  onTap: () => ref.read(inventoryTabProvider.notifier).state = 0,
                  type: MhButtonType.secondary,
                  width: 160,
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: bookings.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final booking = bookings[index];
            return _buildBookingCard(booking);
          },
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Center(child: CircularProgressIndicator(color: AppColors.honey)),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Text('Failed to load bookings: $err', style: AppTypography.caption.copyWith(color: AppColors.error)),
        ),
      ),
    );
  }

  Widget _buildBookingCard(EquipmentBooking booking) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.info.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.m),
            ),
            child: const Icon(LucideIcons.calendar, color: AppColors.info, size: 20),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.equipmentName ?? 'Unknown Equipment',
                  style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Booked by: ${booking.bookedByName ?? 'Unknown User'}',
                  style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${booking.startTime.day}/${booking.startTime.month}',
                style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.bold, color: AppColors.honey),
              ),
              Text(
                '${booking.unitsRequested} units',
                style: AppTypography.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters(WidgetRef ref, InventoryViewMode viewMode) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.m),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.search, size: 18, color: AppColors.textSecondary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        onChanged: (val) => ref.read(inventorySearchProvider.notifier).state = val,
                        decoration: InputDecoration(
                          hintText: 'Search by name or serial...',
                          hintStyle: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        style: AppTypography.bodyM,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.s),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.m),
                border: Border.all(color: AppColors.border),
              ),
              child: IconButton(
                icon: Icon(
                  viewMode == InventoryViewMode.grid ? LucideIcons.layoutGrid : LucideIcons.list,
                  color: AppColors.honey,
                  size: 20,
                ),
                onPressed: () {
                  ref.read(inventoryViewModeProvider.notifier).state = 
                    viewMode == InventoryViewMode.grid ? InventoryViewMode.list : InventoryViewMode.grid;
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s),
        Row(
          children: [
            Expanded(
              child: _buildSortDropdown(ref),
            ),
            const SizedBox(width: AppSpacing.s),
            Expanded(
              child: _buildCategoryDropdown(ref),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSortDropdown(WidgetRef ref) {
    final sortMethod = ref.watch(inventorySortProvider);
    String label = 'Name (A-Z)';
    switch (sortMethod) {
      case 'NAME_DESC': label = 'Name (Z-A)'; break;
      case 'CATEGORY': label = 'Category'; break;
      case 'STATUS': label = 'Status'; break;
      case 'NEWEST': label = 'Newest First'; break;
      case 'OLDEST': label = 'Oldest First'; break;
      case 'QTY_ASC': label = 'Qty (Low-High)'; break;
      case 'QTY_DESC': label = 'Qty (High-Low)'; break;
    }

    return GestureDetector(
      onTap: () => _showSortPicker(ref.context, ref),
      child: _buildFilterDropdown(label, LucideIcons.arrowUpDown),
    );
  }

  Widget _buildCategoryDropdown(WidgetRef ref) {
    final category = ref.watch(inventoryCategoryProvider);
    final label = category == 'ALL' ? 'All Categories' : category;

    return GestureDetector(
      onTap: () => _showCategoryPicker(ref.context, ref),
      child: _buildFilterDropdown(label, LucideIcons.filter),
    );
  }

  void _showSortPicker(BuildContext context, WidgetRef ref) {
    final currentSort = ref.watch(inventorySortProvider);
    final List<Map<String, dynamic>> options = [
      {'id': 'NAME_ASC', 'label': 'Name (A-Z)', 'icon': LucideIcons.arrowUp},
      {'id': 'NAME_DESC', 'label': 'Name (Z-A)', 'icon': LucideIcons.arrowDown},
      {'id': 'CATEGORY', 'label': 'Category', 'icon': LucideIcons.layers},
      {'id': 'STATUS', 'label': 'Status', 'icon': LucideIcons.activity},
      {'id': 'NEWEST', 'label': 'Newest First', 'icon': LucideIcons.clock},
      {'id': 'OLDEST', 'label': 'Oldest First', 'icon': LucideIcons.history},
      {'id': 'QTY_ASC', 'label': 'Qty (Low-High)', 'icon': LucideIcons.arrowUp},
      {'id': 'QTY_DESC', 'label': 'Qty (High-Low)', 'icon': LucideIcons.arrowDown},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _buildPickerSheet(
        context,
        'Sort Inventory',
        options.map((opt) => _buildPickerItem(
          opt['label'],
          opt['icon'],
          currentSort == opt['id'],
          () {
            ref.read(inventorySortProvider.notifier).state = opt['id'];
            Navigator.pop(context);
          },
        )).toList(),
      ),
    );
  }

  void _showCategoryPicker(BuildContext context, WidgetRef ref) {
    final currentCategory = ref.watch(inventoryCategoryProvider);
    final List<String> categories = [
      'ALL', 'Camera', 'Audio', 'Lights', 'Cables', 'Lens', 'IT', 'Furniture',
      'Decoration', 'Camera Support & Stabilization', 'Lenses & Optics',
      'Grip & Rigging', 'Power & Batteries', 'Media & Storage',
      'Computing & Monitoring', 'Production Consumables', 'Transport & Cases',
      'Studio Infrastructure', 'Other'
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) {
          return _buildPickerSheet(
            context,
            'Filter by Category',
            categories.map((cat) => _buildPickerItem(
              cat == 'ALL' ? 'All Categories' : cat,
              LucideIcons.filter,
              currentCategory == cat,
              () {
                ref.read(inventoryCategoryProvider.notifier).state = cat;
                Navigator.pop(context);
              },
            )).toList(),
            showSearch: true,
            onSearch: (query) {
              // Internal search logic for the picker if needed
            },
          );
        }
      ),
    );
  }

  Widget _buildPickerSheet(
    BuildContext context, 
    String title, 
    List<Widget> items, {
    bool showSearch = false,
    Function(String)? onSearch,
  }) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.backgroundPrimary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        gradient: AppColors.darkGradient,
      ),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.s),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.textSecondary.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: AppTypography.h3),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          if (showSearch)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.m),
                  border: Border.all(color: AppColors.border),
                ),
                child: TextField(
                  onChanged: onSearch,
                  decoration: const InputDecoration(
                    hintText: 'Search categories...',
                    border: InputBorder.none,
                    icon: Icon(LucideIcons.search, size: 16),
                  ),
                ),
              ),
            ),
          const SizedBox(height: AppSpacing.m),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
              children: items,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickerItem(String label, IconData icon, bool isSelected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.m),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.info.withOpacity(0.15) : AppColors.surface.withOpacity(0.3),
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: Border.all(
              color: isSelected ? AppColors.info.withOpacity(0.5) : AppColors.border.withOpacity(0.3),
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: isSelected ? AppColors.info : AppColors.textSecondary),
              const SizedBox(width: AppSpacing.m),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodyM.copyWith(
                    color: isSelected ? AppColors.info : AppColors.textPrimary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
              if (isSelected)
                const Icon(LucideIcons.check, size: 16, color: AppColors.info),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterDropdown(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Icon(icon, size: 16, color: AppColors.honey),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    label, 
                    style: AppTypography.caption.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronDown, size: 14, color: AppColors.textSecondary),
        ],
      ),
    );
  }

  Widget _buildCategoryChips(WidgetRef ref, String selectedCategory) {
    final categories = ['ALL', 'CAMERAS', 'LIGHTING', 'AUDIO', 'STUDIO', 'COMPUTING'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: categories.map((cat) {
          final isSelected = cat == selectedCategory;
          return GestureDetector(
            onTap: () => ref.read(inventoryCategoryProvider.notifier).state = cat,
            child: Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.info : Colors.transparent,
                borderRadius: BorderRadius.circular(AppRadius.m),
                border: Border.all(color: isSelected ? Colors.transparent : AppColors.border),
              ),
              child: Text(
                cat,
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.bold, 
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildInventoryGrid(List<InventoryItem> items) {
    return GridView.builder(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.75,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        return _buildInventoryCard(context, items[index]);
      },
    );
  }

  Widget _buildInventoryList(List<InventoryItem> items) {
    return ListView.separated(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        return _buildInventoryListCard(context, items[index]);
      },
    );
  }

  Widget _buildInventoryListCard(BuildContext context, InventoryItem item) {
    return GestureDetector(
      onTap: () => _showItemDetails(context, item),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.m),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.l),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Row(
              children: [
                _buildItemPreview(item, size: 48, radius: AppRadius.m, isList: true),
                const SizedBox(width: AppSpacing.m),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          _buildCategoryBadge(item.category),
                          _buildAvailabilityIndicator(item.status),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.s),
                MhButton(
                  label: 'Request',
                  onTap: () => _showRequestSheet(context, item),
                  height: 32,
                  width: 80,
                  type: MhButtonType.secondary,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.m),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: AppSpacing.s),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text('CONDITION: ', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                    Text(item.condition.toUpperCase(), style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold)),
                  ],
                ),
                Text(
                  'QTY: ${item.quantity}',
                  style: AppTypography.caption.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryCard(BuildContext context, InventoryItem item) {
    return GestureDetector(
      onTap: () => _showItemDetails(context, item),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.l),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  _buildItemPreview(item, size: 40, radius: AppRadius.l, isList: false),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _buildAvailabilityIndicator(item.status, showText: false),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.s),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name, 
                    style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  _buildCategoryBadge(item.category),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(item.condition.toUpperCase(), style: AppTypography.caption.copyWith(fontSize: 8)),
                      Text('QTY: ${item.quantity}', style: AppTypography.caption.copyWith(fontSize: 8, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s),
                  MhButton(
                    label: 'Request',
                    onTap: () => _showRequestSheet(context, item),
                    height: 32,
                    type: MhButtonType.secondary,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String? _getDirectImageUrl(String? url, [String? driveFileId]) {
    final id = driveFileId ?? (url != null ? _extractDriveId(url) : null);
    if (id != null) {
      // Use w1000 for higher quality as seen in the web app
      return 'https://drive.google.com/thumbnail?id=$id&sz=w1000';
    }
    return url;
  }

  String? _extractDriveId(String url) {
    if (!url.contains('drive.google.com')) return null;
    final regExp = RegExp(r'id=([a-zA-Z0-9_-]+)|d/([a-zA-Z0-9_-]+)');
    final match = regExp.firstMatch(url);
    if (match != null) {
      return match.group(1) ?? match.group(2);
    }
    return null;
  }

  Widget _buildItemPreview(InventoryItem item, {required double size, required double radius, bool isList = false}) {
    final directUrl = _getDirectImageUrl(item.imageUrl, item.metadata['drive_file_id']);
    
    if (directUrl != null) {
      return ClipRRect(
        borderRadius: isList 
            ? BorderRadius.circular(radius) 
            : BorderRadius.vertical(top: Radius.circular(radius)),
        child: Image.network(
          directUrl,
          width: isList ? size : double.infinity,
          height: isList ? size : double.infinity, 
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            print('[INVENTORY_SCREEN] Image load error for ${item.name}: $error');
            return _buildFallbackIcon(item, size, radius, isList);
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              width: isList ? size : double.infinity,
              height: isList ? size : 200, // Give some height during load in grid
              color: AppColors.surface.withOpacity(0.3),
              child: const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.honey),
                ),
              ),
            );
          },
        ),
      );
    }
    
    return _buildFallbackIcon(item, size, radius, isList);
  }

  Widget _buildFallbackIcon(InventoryItem item, double size, double radius, bool isList) {
    return Container(
      width: isList ? size : double.infinity,
      height: isList ? size : double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.5),
        borderRadius: isList 
            ? BorderRadius.circular(radius) 
            : BorderRadius.vertical(top: Radius.circular(radius)),
      ),
      child: Center(
        child: Icon(
          _getCategoryIcon(item.category),
          size: isList ? size * 0.5 : size,
          color: AppColors.honey.withOpacity(isList ? 0.8 : 0.2),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    final cat = category.toUpperCase();
    if (cat.contains('CAMERA')) return LucideIcons.camera;
    if (cat.contains('AUDIO')) return LucideIcons.mic;
    if (cat.contains('LIGHT')) return LucideIcons.sun;
    if (cat.contains('LENS')) return LucideIcons.aperture;
    if (cat.contains('GRIP') || cat.contains('RIG')) return LucideIcons.wrench;
    if (cat.contains('POWER') || cat.contains('BATTERY')) return LucideIcons.batteryCharging;
    if (cat.contains('MEDIA') || cat.contains('STORAGE')) return LucideIcons.hardDrive;
    if (cat.contains('COMPUTING') || cat.contains('MONITOR') || cat.contains('IT')) return LucideIcons.monitor;
    if (cat.contains('CONSUMABLE')) return LucideIcons.zap;
    if (cat.contains('TRANSPORT') || cat.contains('CASE')) return LucideIcons.briefcase;
    if (cat.contains('STUDIO') || cat.contains('INFRASTRUCTURE')) return LucideIcons.building;
    if (cat.contains('FURNITURE')) return LucideIcons.armchair;
    if (cat.contains('DECORATION')) return LucideIcons.palette;
    
    return LucideIcons.package;
  }

  Widget _buildCategoryBadge(String category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      constraints: const BoxConstraints(maxWidth: 120),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.s),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        category.toUpperCase(),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppTypography.caption.copyWith(
          fontSize: 8,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  Widget _buildAvailabilityIndicator(String status, {bool showText = true}) {
    Color color = AppColors.success;
    String label = 'Available';
    
    if (status == 'MAINTENANCE') {
      color = AppColors.error;
      label = 'Maintenance';
    } else if (status == 'BOOKED') {
      color = AppColors.warning;
      label = 'Booked';
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.5),
                blurRadius: 4,
                spreadRadius: 1,
              ),
            ],
          ),
        ),
        if (showText) ...[
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 10,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildConditionBadge(String condition) {
    Color color = AppColors.textSecondary;
    if (condition == 'NEW' || condition == 'EXCELLENT') color = AppColors.success;
    if (condition == 'GOOD') color = AppColors.info;
    if (condition == 'FAIR') color = AppColors.warning;
    if (condition == 'POOR') color = AppColors.error;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        condition, 
        style: AppTypography.caption.copyWith(
          fontSize: 7, 
          fontWeight: FontWeight.bold, 
          color: color
        )
      ),
    );
  }

  Widget _buildRequestsView(WidgetRef ref) {
    return Column(
      children: [
        const SizedBox(height: AppSpacing.xl),
        Icon(LucideIcons.clipboardList, size: 64, color: AppColors.textSecondary.withOpacity(0.3)),
        const SizedBox(height: AppSpacing.m),
        Text(
          'No Requests Yet',
          style: AppTypography.h3.copyWith(color: AppColors.textPrimary),
        ),
        const SizedBox(height: AppSpacing.xs),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            'Track your equipment and studio resource requests here once they are submitted.',
            textAlign: TextAlign.center,
            style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        MhButton(
          label: 'New Request',
          onTap: () => ref.read(inventoryTabProvider.notifier).state = 0,
          icon: LucideIcons.plus,
          type: MhButtonType.primary,
        ),
      ],
    );
  }

  void _showItemDetails(BuildContext context, InventoryItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => EquipmentDetailsSheet(
        item: item,
        onRequest: () => _showRequestSheet(context, item),
        onBook: () => _showBookingSheet(context, item),
      ),
    );
  }

  void _showRequestSheet(BuildContext context, InventoryItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => EquipmentRequestSheet(item: item),
    );
  }

  void _showBookingSheet(BuildContext context, InventoryItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => EquipmentBookingSheet(item: item),
    );
  }
}
