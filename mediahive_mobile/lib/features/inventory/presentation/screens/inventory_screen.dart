// DIAGNOSTIC RELOAD - Inventory Module Updated
import 'dart:ui';
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
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_request.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../../../../shared/widgets/mh_empty_state.dart';
import '../../../../../shared/widgets/mh_refresh_indicator.dart';
import 'package:mediahive_mobile/core/services/network_service.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/features/inventory/presentation/widgets/inventory_transaction_sheets.dart';
import 'package:mediahive_mobile/core/utils/url_helpers.dart';
import 'package:mediahive_mobile/presentation/providers/navigation_provider.dart';
import '../../../../../shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/core/services/notification_service.dart';
import 'dart:async';
import 'package:mediahive_mobile/core/services/sound_service.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';

final inventoryCategoryProvider = StateProvider<String>((ref) => 'ALL');
final inventorySearchProvider = StateProvider<String>((ref) => '');
final inventorySortProvider = StateProvider<String>((ref) => 'NAME_ASC');
final inventoryTabProvider = StateProvider<int>((ref) => 0); // 0: Equipment, 1: Schedule
final inventoryGuideExpandedProvider = StateProvider<bool>((ref) => false);
enum InventoryViewMode { grid, list }
final inventoryViewModeProvider = StateProvider<InventoryViewMode>((ref) => InventoryViewMode.grid);

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  Timer? _notificationTimer;
  final Set<String> _notifiedRequestIds = {};

  @override
  void initState() {
    super.initState();
    _notificationTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _checkReturnNotifications();
    });
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        _checkReturnNotifications();
      }
    });
  }

  @override
  void dispose() {
    _notificationTimer?.cancel();
    super.dispose();
  }

  void _checkReturnNotifications() {
    final requestsAsync = ref.read(inventoryRequestListProvider);
    requestsAsync.whenData((requests) {
      for (final request in requests) {
        if (request.status == 'approved') {
          final returnDateTime = getReturnDateTime(request);
          if (returnDateTime != null && DateTime.now().isAfter(returnDateTime)) {
            if (!_notifiedRequestIds.contains(request.id)) {
              _notifiedRequestIds.add(request.id);
              ref.read(notificationServiceProvider).showAssetNotification(
                'RETURN ITEM REQUIRED',
                'The return time for "${request.itemName}" has been reached. Please mark the item as returned.',
              );
            }
          }
        }
      }
    });
  }

  DateTime? getReturnDateTime(InventoryRequest request) {
    if (request.notes == null) return null;
    final datesRegex = RegExp(r'Dates:\s*(\d{2}-\d{2}-\d{4})\s*to\s*(\d{2}-\d{2}-\d{4})');
    final datesMatch = datesRegex.firstMatch(request.notes!);
    if (datesMatch == null) return null;
    final returnDateStr = datesMatch.group(2);
    if (returnDateStr == null) return null;
    final timesRegex = RegExp(r'Time:\s*(.*?)\s*to\s*([0-9:APM\s]+)', caseSensitive: false);
    final timesMatch = timesRegex.firstMatch(request.notes!);
    String returnTimeStr = '23:59';
    if (timesMatch != null) {
      final rawTime = timesMatch.group(2)?.trim();
      if (rawTime != null) {
        returnTimeStr = rawTime;
      }
    }
    try {
      final dateParts = returnDateStr.split('-');
      final day = int.parse(dateParts[0]);
      final month = int.parse(dateParts[1]);
      final year = int.parse(dateParts[2]);
      int hour = 23;
      int minute = 59;
      final amPmRegex = RegExp(r'(\d+):(\d+)\s*(AM|PM)', caseSensitive: false);
      final amPmMatch = amPmRegex.firstMatch(returnTimeStr);
      if (amPmMatch != null) {
        hour = int.parse(amPmMatch.group(1)!);
        minute = int.parse(amPmMatch.group(2)!);
        final period = amPmMatch.group(3)!.toUpperCase();
        if (period == 'PM' && hour < 12) hour += 12;
        if (period == 'AM' && hour == 12) hour = 0;
      } else {
        final simpleRegex = RegExp(r'(\d+):(\d+)');
        final simpleMatch = simpleRegex.firstMatch(returnTimeStr);
        if (simpleMatch != null) {
          hour = int.parse(simpleMatch.group(1)!);
          minute = int.parse(simpleMatch.group(2)!);
        }
      }
      return DateTime(year, month, day, hour, minute);
    } catch (e) {
      return null;
    }
  }

  DateTime? getPickupDateTime(InventoryRequest request) {
    if (request.notes == null) return null;
    final datesRegex = RegExp(r'Dates:\s*(\d{2}-\d{2}-\d{4})\s*to\s*(\d{2}-\d{2}-\d{4})');
    final datesMatch = datesRegex.firstMatch(request.notes!);
    if (datesMatch == null) return null;
    final pickupDateStr = datesMatch.group(1);
    if (pickupDateStr == null) return null;
    final timesRegex = RegExp(r'Time:\s*(.*?)\s*to\s*([0-9:APM\s]+)', caseSensitive: false);
    final timesMatch = timesRegex.firstMatch(request.notes!);
    String pickupTimeStr = '00:00';
    if (timesMatch != null) {
      final rawTime = timesMatch.group(1)?.trim();
      if (rawTime != null) {
        pickupTimeStr = rawTime;
      }
    }
    try {
      final dateParts = pickupDateStr.split('-');
      final day = int.parse(dateParts[0]);
      final month = int.parse(dateParts[1]);
      final year = int.parse(dateParts[2]);
      int hour = 0;
      int minute = 0;
      final amPmRegex = RegExp(r'(\d+):(\d+)\s*(AM|PM)', caseSensitive: false);
      final amPmMatch = amPmRegex.firstMatch(pickupTimeStr);
      if (amPmMatch != null) {
        hour = int.parse(amPmMatch.group(1)!);
        minute = int.parse(amPmMatch.group(2)!);
        final period = amPmMatch.group(3)!.toUpperCase();
        if (period == 'PM' && hour < 12) hour += 12;
        if (period == 'AM' && hour == 12) hour = 0;
      } else {
        final simpleRegex = RegExp(r'(\d+):(\d+)');
        final simpleMatch = simpleRegex.firstMatch(pickupTimeStr);
        if (simpleMatch != null) {
          hour = int.parse(simpleMatch.group(1)!);
          minute = int.parse(simpleMatch.group(2)!);
        }
      }
      return DateTime(year, month, day, hour, minute);
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('InventoryScreen');
    
    final inventoryAsync = ref.watch(inventoryListProvider);
    final networkStatus = ref.watch(networkStatusProvider).valueOrNull ?? NetworkStatus.online;
    final isOffline = networkStatus == NetworkStatus.offline;
    final selectedCategory = ref.watch(inventoryCategoryProvider);
    final searchQuery = ref.watch(inventorySearchProvider);
    final sortMethod = ref.watch(inventorySortProvider);
    final viewMode = ref.watch(inventoryViewModeProvider);
    final activeTab = ref.watch(inventoryTabProvider);
    final guideExpanded = ref.watch(inventoryGuideExpandedProvider);
    final profile = ref.watch(currentUserProfileProvider).valueOrNull;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    final isAdmin = role == 'admin' || role == 'manager';
    final canBook = isAdmin || role == 'team';
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
            canBook,
            isOffline,
            colors,
          ),
          loading: () => _buildLoadingState(colors),
          error: (e, _) => _buildErrorState(ref, e, colors),
        ),
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
    bool canBook,
    bool isOffline,
    ThemeColors colors,
  ) {
    var filteredItems = items;

    // Filter by Category
    if (selectedCategory != 'ALL') {
      filteredItems = filteredItems.where((i) => i.category.toLowerCase() == selectedCategory.toLowerCase()).toList();
    }

    // Filter by Search
    if (searchQuery.isNotEmpty) {
      final query = searchQuery.toLowerCase();
      filteredItems = filteredItems.where((i) {
        final nameMatch = i.name.toLowerCase().contains(query);
        final serialMatch = (i.serialNumber ?? i.metadata['serial_number']?.toString() ?? '').toLowerCase().contains(query);
        final assetMatch = i.assetId.toLowerCase().contains(query);
        return nameMatch || serialMatch || assetMatch;
      }).toList();
    }

    // Filter by Sort-driven Status/Condition if applicable
    if (sortMethod.startsWith('STATUS_')) {
      filteredItems = filteredItems.where((i) {
        final s = i.status.toLowerCase();
        if (sortMethod == 'STATUS_AVAILABLE') {
          return s == 'available';
        } else if (sortMethod == 'STATUS_IN_USE') {
          return s == 'in use' || s == 'in_use';
        } else if (sortMethod == 'STATUS_MAINTENANCE') {
          return s == 'under repair' || s == 'under_repair' || s == 'maintenance';
        } else if (sortMethod == 'STATUS_RETIRED') {
          return s == 'disposed' || s == 'retired';
        }
        return true;
      }).toList();
    } else if (sortMethod.startsWith('CONDITION_')) {
      filteredItems = filteredItems.where((i) {
        final c = i.condition.toLowerCase();
        if (sortMethod == 'CONDITION_GOOD') {
          return c == 'good' || c == 'excellent' || c == 'new';
        } else if (sortMethod == 'CONDITION_FAIR') {
          return c == 'need repair' || c == 'need_repair' || c == 'fair';
        } else if (sortMethod == 'CONDITION_POOR') {
          return c == 'poor' || c == 'damaged';
        } else if (sortMethod == 'CONDITION_DAMAGED') {
          return c == 'damaged' || c == 'poor';
        }
        return true;
      }).toList();
    }

    // Sort
    switch (sortMethod) {
      case 'NAME_ASC':
        filteredItems.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        break;
      case 'NAME_DESC':
        filteredItems.sort((a, b) => b.name.toLowerCase().compareTo(a.name.toLowerCase()));
        break;
      case 'STATUS_AVAILABLE':
      case 'STATUS_IN_USE':
      case 'STATUS_MAINTENANCE':
      case 'STATUS_RETIRED':
      case 'CONDITION_GOOD':
      case 'CONDITION_FAIR':
      case 'CONDITION_POOR':
      case 'CONDITION_DAMAGED':
        filteredItems.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        break;
    }

    return MhRefreshIndicator(
      edgeOffset: 140,
      onRefresh: () async {
        if (activeTab == 0) await ref.refresh(inventoryListProvider.future);
        if (activeTab == 1) await ref.refresh(bookingListProvider.future);
        if (activeTab == 2) await ref.read(inventoryRequestListProvider.notifier).refresh();
      },
      child: ListView(
        padding: const EdgeInsets.only(
          left: AppSpacing.l, 
          right: AppSpacing.l, 
          top: 140, 
          bottom: 120,
        ),
        children: [
          _buildPageHeader(context, ref, viewMode, isAdmin, isOffline, colors),
          const SizedBox(height: AppSpacing.xxl),
          _buildTabs(ref, activeTab, colors),
          const SizedBox(height: AppSpacing.m),
          if (activeTab == 0) ...[
            _buildStatsGrid(items, isAdmin, colors),
            const SizedBox(height: AppSpacing.m),
            _buildFilterSection(ref, guideExpanded, viewMode, colors),
            const SizedBox(height: AppSpacing.l),
            if (filteredItems.isEmpty)
              _buildEmptyState(colors)
            else if (viewMode == InventoryViewMode.grid)
              _buildInventoryGrid(ref, filteredItems, isAdmin, canBook, isOffline, colors)
            else
              _buildInventoryList(ref, filteredItems, isAdmin, canBook, isOffline, colors),
          ] else if (activeTab == 1)
            _buildBookingSchedule(ref, colors)
          else
            _buildRequestsView(ref, isAdmin, colors),
        ],
      ),
    );
  }

  Widget _buildFilterSection(WidgetRef ref, bool guideExpanded, InventoryViewMode viewMode, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: colors.isDark 
              ? colors.border.withOpacity(0.5) 
              : colors.border.withOpacity(0.15),
        ),
      ),
      child: Column(
        children: [
          _buildCategorizationGuide(ref, guideExpanded, colors),
          const SizedBox(height: 8),
          _buildSearchAndFilters(ref, viewMode, colors),
        ],
      ),
    );
  }

  Widget _buildLoadingState(ThemeColors colors) {
    return const MhLoading();
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return MhEmptyState(
      title: 'No Items Found',
      message: 'Adjust your filters or add a new asset to the studio inventory.',
      icon: LucideIcons.packageSearch,
    );
  }

  Widget _buildErrorState(WidgetRef ref, Object error, ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.alertCircle, color: colors.error, size: 48),
          const SizedBox(height: AppSpacing.m),
          Text('Failed to load inventory', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
          const SizedBox(height: AppSpacing.s),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: AppTypography.caption.copyWith(color: colors.error.withOpacity(0.7)),
            ),
          ),
          const SizedBox(height: AppSpacing.l),
          MhButton(
            label: 'Force Refresh',
            onTap: () => ref.read(inventoryListProvider.notifier).forceRefresh(),
            type: MhButtonType.secondary,
            icon: LucideIcons.refreshCw,
          ),
        ],
      ),
    );
  }

  Widget _buildPageHeader(BuildContext context, WidgetRef ref, InventoryViewMode viewMode, bool isAdmin, bool isOffline, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('INVENTORY', style: AppTypography.h1.copyWith(color: colors.textPrimary)),
            if (isAdmin)
              MhButton(
                label: 'Add Asset',
                onTap: isOffline ? null : () => context.push('/inventory/create'),
                height: 40,
                type: isOffline ? MhButtonType.secondary : MhButtonType.primary,
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          'MANAGE AND REQUEST STUDIO ASSETS.',
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.bold, 
            letterSpacing: 1.2,
            color: colors.textSecondary.withOpacity(0.8),
          ),
        ),
      ],
    );
  }

  Widget _buildCategorizationGuide(WidgetRef ref, bool expanded, ThemeColors colors) {
    return Container(
      decoration: const BoxDecoration(
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
                  Icon(LucideIcons.info, size: 18, color: colors.indigo),
                  const SizedBox(width: AppSpacing.s),
                  Expanded(
                    child: Text(
                      'Media Inventory Categorization Guide',
                      style: AppTypography.bodyS.copyWith(
                        fontWeight: FontWeight.bold,
                        color: colors.textPrimary,
                      ),
                    ),
                  ),
                  Icon(
                    expanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: colors.textSecondary,
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
                  Divider(color: colors.border),
                  const SizedBox(height: AppSpacing.s),
                  _buildGuideRow('Camera', 'Bodies, action cams, drones, camcorders.', 'Audio', 'Mics, recorders, mixers, headphones.', colors),
                  _buildGuideRow('Lights', 'LED panels, tube lights, softboxes.', 'Cables', 'Video (HDMI), Audio (XLR), Data (USB).', colors),
                  _buildGuideRow('Lens', 'Prime, zoom, macro, adapters.', 'IT', 'Laptops, tablets, networking, licenses.', colors),
                  _buildGuideRow('Furniture', 'Studio chairs, desks, posing tables.', 'Decoration', 'Props, plants, rugs, background elements.', colors),
                  _buildGuideRow('Camera Support', 'Tripods, gimbals, shoulder rigs.', 'Grip & Rigging', 'Stands, clamps, sandbags, frames.', colors),
                  _buildGuideRow('Media & Storage', 'SD cards, SSDs, hard drives.', 'Production', 'Gaffer tape, gels, lens wipes.', colors),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGuideRow(String label1, String desc1, String label2, String desc2, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _buildGuideItem(label1, desc1, colors)),
          const SizedBox(width: AppSpacing.m),
          Expanded(child: _buildGuideItem(label2, desc2, colors)),
        ],
      ),
    );
  }

  Widget _buildGuideItem(String label, String desc, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
        Text(desc, style: AppTypography.caption.copyWith(fontSize: 10, color: colors.textSecondary)),
      ],
    );
  }

  Widget _buildTabs(WidgetRef ref, int activeTab, ThemeColors colors) {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(
          color: colors.isDark 
              ? colors.border 
              : colors.border.withOpacity(0.12),
        ),
      ),
      child: Row(
        children: [
          Expanded(child: _buildTabItem(ref, 'Items', 0, activeTab == 0, colors)),
          Expanded(child: _buildTabItem(ref, 'Schedule', 1, activeTab == 1, colors)),
          Expanded(child: _buildTabItem(ref, 'Requests', 2, activeTab == 2, colors)),
        ],
      ),
    );
  }

  Widget _buildTabItem(WidgetRef ref, String label, int index, bool active, ThemeColors colors) {
    return GestureDetector(
      onTap: () => ref.read(inventoryTabProvider.notifier).state = index,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? colors.indigo : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.s),
          boxShadow: active && !colors.isDark
              ? [
                  BoxShadow(
                    color: colors.indigo.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          label,
          style: AppTypography.bodyS.copyWith(
            fontWeight: FontWeight.bold,
            color: active ? Colors.white : colors.textSecondary.withOpacity(0.8),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid(List<InventoryItem> items, bool isAdmin, ThemeColors colors) {
    final totalItems = items.length;
    final inRepair = items.where((i) {
      final s = i.status.toLowerCase();
      return s == 'maintenance' || s == 'under repair' || s == 'under_repair';
    }).length;
    final activeBookings = 0; // Placeholder for future bookings module

    return Row(
      children: [
        Expanded(child: _buildStatCard('TOTAL ITEMS', totalItems.toString(), LucideIcons.box, colors.indigo, colors)),
        const SizedBox(width: AppSpacing.xs),
        Expanded(child: _buildStatCard('ACTIVE BOOKINGS', activeBookings.toString(), LucideIcons.calendar, colors.indigo, colors)),
        if (isAdmin) ...[
          const SizedBox(width: AppSpacing.xs),
          Expanded(child: _buildStatCard('NEEDS REPAIR', inRepair.toString(), LucideIcons.alertCircle, colors.error, colors)),
          const SizedBox(width: AppSpacing.xs),
          Expanded(child: _buildStatCard('MAINTENANCE', '0', LucideIcons.wrench, colors.honey, colors)),
        ],
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs, vertical: AppSpacing.s),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(
          color: colors.isDark 
              ? colors.border 
              : colors.border.withOpacity(0.12),
        ),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value, 
              style: AppTypography.h3.copyWith(color: colors.textPrimary), 
              textAlign: TextAlign.center
            ),
          ),
          Text(
            label, 
            style: AppTypography.caption.copyWith(
              fontSize: 8, 
              letterSpacing: 1.1,
              color: colors.textSecondary.withOpacity(0.7),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBookingSchedule(WidgetRef ref, ThemeColors colors) {
    final bookingsAsync = ref.watch(bookingListProvider);

    return bookingsAsync.when(
      data: (bookings) {
        if (bookings.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: AppSpacing.xl),
                Icon(LucideIcons.calendar, size: 64, color: colors.textSecondary.withOpacity(0.2)),
                const SizedBox(height: AppSpacing.m),
                Text('No active bookings found', style: AppTypography.bodyM.copyWith(color: colors.textSecondary)),
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
            return _buildBookingCard(booking, colors);
          },
        );
      },
      loading: () => const MhLoading(size: 100),
      error: (err, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Text('Failed to load bookings: $err', style: AppTypography.caption.copyWith(color: colors.error)),
        ),
      ),
    );
  }

  Widget _buildBookingCard(EquipmentBooking booking, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(
          color: colors.isDark 
              ? colors.border 
              : colors.border.withOpacity(0.12),
        ),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: colors.indigo.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.m),
            ),
            child: Icon(LucideIcons.calendar, color: colors.indigo, size: 20),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.equipmentName ?? 'Unknown Equipment',
                  style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary),
                ),
                Text(
                  'Booked by: ${booking.bookedByName ?? 'Unknown User'}',
                  style: AppTypography.caption.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${booking.startTime.day}/${booking.startTime.month}',
                style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.bold, color: colors.honey),
              ),
              Text(
                '${booking.unitsRequested} units',
                style: AppTypography.caption.copyWith(color: colors.textSecondary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters(WidgetRef ref, InventoryViewMode viewMode, ThemeColors colors) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 8),
                decoration: BoxDecoration(
                  color: colors.isDark ? colors.surface : Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.m),
                  border: Border.all(color: colors.border),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.search, size: 18, color: colors.textSecondary.withOpacity(0.6)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        onChanged: (val) => ref.read(inventorySearchProvider.notifier).state = val,
                        decoration: InputDecoration(
                          hintText: 'Search by name or serial...',
                          hintStyle: AppTypography.bodyM.copyWith(color: colors.textSecondary.withOpacity(0.5)),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        style: AppTypography.bodyM.copyWith(color: colors.textPrimary),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.s),
            Container(
              decoration: BoxDecoration(
                color: colors.isDark ? colors.surface : Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.m),
                border: Border.all(color: colors.border),
              ),
              child: IconButton(
                icon: Icon(
                  viewMode == InventoryViewMode.grid ? LucideIcons.layoutGrid : LucideIcons.list,
                  color: colors.honey,
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
              child: _buildSortDropdown(ref, colors),
            ),
            const SizedBox(width: AppSpacing.s),
            Expanded(
              child: _buildCategoryDropdown(ref, colors),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSortDropdown(WidgetRef ref, ThemeColors colors) {
    final sortMethod = ref.watch(inventorySortProvider);
    String label = 'Name (A-Z)';
    switch (sortMethod) {
      case 'NAME_DESC': label = 'Name (Z-A)'; break;
      case 'STATUS_AVAILABLE': label = 'Status: Available'; break;
      case 'STATUS_IN_USE': label = 'Status: In Use'; break;
      case 'STATUS_MAINTENANCE': label = 'Status: Maintenance'; break;
      case 'STATUS_RETIRED': label = 'Status: Retired'; break;
      case 'CONDITION_GOOD': label = 'Condition: Good'; break;
      case 'CONDITION_FAIR': label = 'Condition: Fair'; break;
      case 'CONDITION_POOR': label = 'Condition: Poor'; break;
      case 'CONDITION_DAMAGED': label = 'Condition: Damaged'; break;
    }

    return GestureDetector(
      onTap: () => _showSortPicker(ref.context, ref, colors),
      child: _buildFilterDropdown(label, LucideIcons.arrowUpDown, colors),
    );
  }

  Widget _buildCategoryDropdown(WidgetRef ref, ThemeColors colors) {
    final category = ref.watch(inventoryCategoryProvider);
    final label = category == 'ALL' ? 'All Categories' : category;

    return GestureDetector(
      onTap: () => _showCategoryPicker(ref.context, ref, colors),
      child: _buildFilterDropdown(label, LucideIcons.filter, colors),
    );
  }

  Widget _buildFilterDropdown(String label, IconData icon, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 8),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Icon(icon, size: 16, color: colors.honey),
                const SizedBox(width: AppSpacing.s),
                Flexible(
                  child: Text(
                    label,
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.bold,
                      color: colors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          Icon(LucideIcons.chevronDown, size: 16, color: colors.textSecondary),
        ],
      ),
    );
  }

  void _showSortPicker(BuildContext context, WidgetRef ref, ThemeColors colors) {
    bool? manualStatusExpanded;
    bool? manualConditionExpanded;

    ref.read(bottomNavVisibleProvider.notifier).state = false;

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          final currentSort = ref.watch(inventorySortProvider);
          final isStatusActive = currentSort.startsWith('STATUS_');
          final isConditionActive = currentSort.startsWith('CONDITION_');

          final statusExpanded = manualStatusExpanded ?? isStatusActive;
          final conditionExpanded = manualConditionExpanded ?? isConditionActive;

          return _buildPickerSheet(
            context,
            'Sort Inventory',
            [
              _buildPickerItem(
                'Name (A-Z)',
                LucideIcons.arrowUp,
                currentSort == 'NAME_ASC',
                () {
                  ref.read(inventorySortProvider.notifier).state = 'NAME_ASC';
                  Navigator.pop(context);
                },
                colors,
              ),
              _buildPickerItem(
                'Name (Z-A)',
                LucideIcons.arrowDown,
                currentSort == 'NAME_DESC',
                () {
                  ref.read(inventorySortProvider.notifier).state = 'NAME_DESC';
                  Navigator.pop(context);
                },
                colors,
              ),
              _buildPickerExpandableItem(
                'Status (Available/In use/Maintenance/Retired)',
                LucideIcons.activity,
                statusExpanded,
                isStatusActive,
                () {
                  setState(() {
                    manualStatusExpanded = !statusExpanded;
                  });
                },
                colors,
              ),
              if (statusExpanded) ...[
                _buildPickerSubItem(
                  'Available',
                  currentSort == 'STATUS_AVAILABLE',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'STATUS_AVAILABLE';
                    Navigator.pop(context);
                  },
                  colors,
                ),
                _buildPickerSubItem(
                  'In Use',
                  currentSort == 'STATUS_IN_USE',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'STATUS_IN_USE';
                    Navigator.pop(context);
                  },
                  colors,
                ),
                _buildPickerSubItem(
                  'Maintenance',
                  currentSort == 'STATUS_MAINTENANCE',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'STATUS_MAINTENANCE';
                    Navigator.pop(context);
                  },
                  colors,
                ),
                _buildPickerSubItem(
                  'Retired',
                  currentSort == 'STATUS_RETIRED',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'STATUS_RETIRED';
                    Navigator.pop(context);
                  },
                  colors,
                ),
              ],
              _buildPickerExpandableItem(
                'Condition (Good/Fair/Poor/Damaged)',
                LucideIcons.shieldCheck,
                conditionExpanded,
                isConditionActive,
                () {
                  setState(() {
                    manualConditionExpanded = !conditionExpanded;
                  });
                },
                colors,
              ),
              if (conditionExpanded) ...[
                _buildPickerSubItem(
                  'Good',
                  currentSort == 'CONDITION_GOOD',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'CONDITION_GOOD';
                    Navigator.pop(context);
                  },
                  colors,
                ),
                _buildPickerSubItem(
                  'Fair',
                  currentSort == 'CONDITION_FAIR',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'CONDITION_FAIR';
                    Navigator.pop(context);
                  },
                  colors,
                ),
                _buildPickerSubItem(
                  'Poor',
                  currentSort == 'CONDITION_POOR',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'CONDITION_POOR';
                    Navigator.pop(context);
                  },
                  colors,
                ),
                _buildPickerSubItem(
                  'Damaged',
                  currentSort == 'CONDITION_DAMAGED',
                  () {
                    ref.read(inventorySortProvider.notifier).state = 'CONDITION_DAMAGED';
                    Navigator.pop(context);
                  },
                  colors,
                ),
              ],
            ],
            colors,
          );
        },
      ),
    ).then((_) {
      ref.read(bottomNavVisibleProvider.notifier).state = true;
    });
  }

  void _showCategoryPicker(BuildContext context, WidgetRef ref, ThemeColors colors) {
    final currentCategory = ref.watch(inventoryCategoryProvider);
    final List<String> categories = [
      'ALL',
      'Cameras & Accessories',
      'Networking & Power Cables',
      'Audio & Sound Systems',
      'Office & Studio Gear',
      'General Asset',
    ];

    ref.read(bottomNavVisibleProvider.notifier).state = false;

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
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
              colors,
            )).toList(),
            colors,
            showSearch: true,
            onSearch: (query) {
              // Internal search logic for the picker if needed
            },
          );
        }
      ),
    ).then((_) {
      ref.read(bottomNavVisibleProvider.notifier).state = true;
    });
  }

  Widget _buildPickerSheet(
    BuildContext context, 
    String title, 
    List<Widget> items, 
    ThemeColors colors, {
    bool showSearch = false,
    Function(String)? onSearch,
  }) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: BoxDecoration(
        color: colors.backgroundPrimary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
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
          const SizedBox(height: AppSpacing.s),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colors.textSecondary.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                IconButton(
                  icon: Icon(LucideIcons.x, size: 20, color: colors.textPrimary),
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
                  color: colors.isDark ? colors.surface : Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.m),
                  border: Border.all(color: colors.border),
                ),
                child: TextField(
                  onChanged: onSearch,
                  style: TextStyle(color: colors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Search categories...',
                    hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5)),
                    border: InputBorder.none,
                    icon: Icon(LucideIcons.search, size: 16, color: colors.textSecondary),
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

  Widget _buildPickerItem(String label, IconData icon, bool isSelected, VoidCallback onTap, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.m),
          decoration: BoxDecoration(
            color: isSelected 
                ? colors.indigo.withOpacity(0.1) 
                : (colors.isDark ? colors.surface.withOpacity(0.3) : Colors.white.withOpacity(0.8)),
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: Border.all(color: isSelected ? colors.indigo : colors.border),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: isSelected ? colors.indigo : colors.textSecondary),
              const SizedBox(width: AppSpacing.m),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodyM.copyWith(
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
              if (isSelected) ...[
                const SizedBox(width: AppSpacing.s),
                Icon(LucideIcons.check, size: 18, color: colors.indigo),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPickerExpandableItem(
    String label, 
    IconData icon, 
    bool isExpanded, 
    bool isChildSelected,
    VoidCallback onTap,
    ThemeColors colors,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.m),
          decoration: BoxDecoration(
            color: isChildSelected 
                ? colors.indigo.withOpacity(0.05) 
                : (colors.isDark ? colors.surface.withOpacity(0.3) : Colors.white.withOpacity(0.8)),
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: Border.all(color: isChildSelected ? colors.indigo.withOpacity(0.3) : colors.border),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: isChildSelected ? colors.indigo : colors.textSecondary),
              const SizedBox(width: AppSpacing.m),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodyM.copyWith(
                    color: isChildSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isChildSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
              Icon(
                isExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown, 
                size: 18, 
                color: colors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPickerSubItem(String label, bool isSelected, VoidCallback onTap, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.only(left: 36, bottom: AppSpacing.s),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.s),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.s),
          decoration: BoxDecoration(
            color: isSelected ? colors.indigo.withOpacity(0.08) : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.s),
            border: Border.all(color: isSelected ? colors.indigo.withOpacity(0.5) : Colors.transparent),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.bodyS.copyWith(
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
              if (isSelected) Icon(LucideIcons.check, size: 14, color: colors.indigo),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInventoryGrid(WidgetRef ref, List<InventoryItem> items, bool isAdmin, bool canBook, bool isOffline, ThemeColors colors) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return _buildInventoryCard(context, ref, item, isAdmin, canBook, isOffline, colors);
      },
    );
  }

  Widget _buildInventoryList(WidgetRef ref, List<InventoryItem> items, bool isAdmin, bool canBook, bool isOffline, ThemeColors colors) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final item = items[index];
        return _buildInventoryListTile(context, ref, item, isAdmin, canBook, isOffline, colors);
      },
    );
  }

  Widget _buildInventoryCard(BuildContext context, WidgetRef ref, InventoryItem item, bool isAdmin, bool canBook, bool isOffline, ThemeColors colors) {
    final statusLower = item.status.toLowerCase();
    final statusColor = statusLower == 'available' 
        ? colors.emerald 
        : (statusLower == 'in use' || statusLower == 'in_use' ? colors.honey : (statusLower == 'under repair' || statusLower == 'maintenance' ? colors.error : colors.textSecondary));
    
    DateTime? maintenanceDate;
    try {
      if (item.maintenanceDueDate != null) maintenanceDate = DateTime.parse(item.maintenanceDueDate!);
    } catch (_) {}
    final isMaintenanceDue = maintenanceDate != null && maintenanceDate.isBefore(DateTime.now());
    
    return GestureDetector(
      onTap: () => _showItemDetails(context, ref, item, isAdmin, canBook, isOffline, colors),
      child: Container(
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark 
                ? colors.border 
                : colors.border.withOpacity(0.12),
          ),
          boxShadow: [
            if (isMaintenanceDue)
              BoxShadow(
                color: colors.error.withOpacity(0.15),
                blurRadius: 12,
                spreadRadius: 2,
              ),
            BoxShadow(
              color: colors.border.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Builder(
                        builder: (context) {
                          final directUrl = UrlHelpers.getDirectImageUrl(item.imageUrl, driveFileId: item.metadata['drive_file_id']);
                          return directUrl != null
                              ? Image.network(
                                  directUrl, 
                                  fit: BoxFit.cover, 
                                  errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(colors),
                                )
                              : _buildPlaceholderImage(colors);
                        }
                      ),
                    ),
                    if (item.assetId.isNotEmpty)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.65),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            item.assetId,
                            style: AppTypography.caption.copyWith(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.bodyS.copyWith(
                            fontWeight: FontWeight.w900, 
                            fontSize: 12,
                            color: colors.textPrimary,
                          ),
                        ),
                        Text(
                          item.category.toUpperCase(),
                          style: AppTypography.caption.copyWith(
                            fontSize: 8, 
                            fontWeight: FontWeight.w900, 
                            color: colors.textSecondary.withOpacity(0.5)
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        _buildStatusIndicator(item.status, statusColor, showText: true),
                        const SizedBox(width: 8),
                        Text(
                          'x${item.quantity}',
                          style: AppTypography.caption.copyWith(
                            fontWeight: FontWeight.w900,
                            color: colors.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                        if (isMaintenanceDue) ...[
                          const SizedBox(width: 8),
                          Icon(LucideIcons.wrench, size: 10, color: colors.error),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryListTile(BuildContext context, WidgetRef ref, InventoryItem item, bool isAdmin, bool canBook, bool isOffline, ThemeColors colors) {
    final statusLower = item.status.toLowerCase();
    final statusColor = statusLower == 'available' 
        ? colors.emerald 
        : (statusLower == 'in use' || statusLower == 'in_use' ? colors.honey : (statusLower == 'under repair' || statusLower == 'maintenance' ? colors.error : colors.textSecondary));
    
    DateTime? maintenanceDate;
    try {
      if (item.maintenanceDueDate != null) maintenanceDate = DateTime.parse(item.maintenanceDueDate!);
    } catch (_) {}
    final isMaintenanceDue = maintenanceDate != null && maintenanceDate.isBefore(DateTime.now());

    return GestureDetector(
      onTap: () => _showItemDetails(context, ref, item, isAdmin, canBook, isOffline, colors),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: colors.isDark 
                ? colors.border 
                : colors.border.withOpacity(0.12),
          ),
          boxShadow: colors.isDark
              ? []
              : [
                  BoxShadow(
                    color: colors.border.withOpacity(0.03),
                    blurRadius: 5,
                  )
                ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 44,
                height: 44,
                child: Builder(
                  builder: (context) {
                    final directUrl = UrlHelpers.getDirectImageUrl(item.imageUrl, driveFileId: item.metadata['drive_file_id']);
                    return directUrl != null
                        ? Image.network(directUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildPlaceholderImage(colors))
                        : _buildPlaceholderImage(colors);
                  }
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name, 
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.w900,
                      color: colors.textPrimary,
                    ),
                  ),
                  Text(
                    item.assetId.isNotEmpty ? '${item.assetId} • ${item.category}' : item.category, 
                    style: AppTypography.caption.copyWith(fontSize: 10, color: colors.textSecondary),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isMaintenanceDue) Icon(LucideIcons.wrench, size: 10, color: colors.error),
                    if (isMaintenanceDue) const SizedBox(width: 4),
                    _buildStatusIndicator(item.status, statusColor, showText: false),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'x${item.quantity}', 
                  style: AppTypography.caption.copyWith(
                    fontWeight: FontWeight.w900,
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
            Icon(LucideIcons.chevronRight, size: 14, color: colors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage(ThemeColors colors) {
    return Container(
      color: colors.isDark ? colors.surface.withOpacity(0.8) : colors.border.withOpacity(0.12),
      child: Center(
        child: Icon(LucideIcons.image, color: colors.textSecondary.withOpacity(0.6), size: 24),
      ),
    );
  }

  Widget _buildStatusIndicator(String label, Color color, {bool showText = true}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
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

  Widget _buildRequestsView(WidgetRef ref, bool isAdmin, ThemeColors colors) {
    final requestsAsync = ref.watch(inventoryRequestListProvider);

    return requestsAsync.when(
      data: (requests) {
        final activeRequests = requests.where((request) {
          final returnTime = getReturnDateTime(request);
          if (returnTime != null) {
            return DateTime.now().isBefore(returnTime);
          }
          return true;
        }).toList();

        if (activeRequests.isEmpty) {
          return Column(
            children: [
              const SizedBox(height: AppSpacing.xl),
              Icon(LucideIcons.clipboardList, size: 64, color: colors.textSecondary.withOpacity(0.3)),
              const SizedBox(height: AppSpacing.m),
              Text(
                'No Requests Yet',
                style: AppTypography.h3.copyWith(color: colors.textPrimary),
              ),
              const SizedBox(height: AppSpacing.xs),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  isAdmin 
                    ? 'All clear! No pending inventory requests to review at the moment.'
                    : 'Track your equipment and studio resource requests here once they are submitted.',
                  textAlign: TextAlign.center,
                  style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              if (!isAdmin)
                MhButton(
                  label: 'New Request',
                  onTap: () => ref.read(inventoryTabProvider.notifier).state = 0,
                  icon: LucideIcons.plus,
                  type: MhButtonType.primary,
                ),
            ],
          );
        }

        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: activeRequests.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final request = activeRequests[index];
            return _buildRequestCard(request, isAdmin, colors);
          },
        );
      },
      loading: () => const MhLoading(size: 100),
      error: (err, stack) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Text('Failed to load requests: $err', style: AppTypography.caption.copyWith(color: colors.error)),
        ),
      ),
    );
  }

  Widget _buildRequestCard(InventoryRequest request, bool isAdmin, ThemeColors colors) {
    Color statusColor = colors.honey;
    IconData statusIcon = LucideIcons.clock;
    
    if (request.status == 'approved') {
      statusColor = colors.emerald;
      statusIcon = LucideIcons.checkCircle;
    } else if (request.status == 'rejected') {
      statusColor = colors.error;
      statusIcon = LucideIcons.xCircle;
    } else if (request.status == 'issued') {
      statusColor = colors.indigo;
      statusIcon = LucideIcons.package;
    } else if (request.status == 'fulfilled') {
      statusColor = colors.emerald;
      statusIcon = LucideIcons.checkSquare;
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(
          color: colors.isDark 
              ? colors.border 
              : colors.border.withOpacity(0.12),
        ),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.itemName,
                      style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary),
                    ),
                    if (isAdmin)
                      Text(
                        'Requested by: ${request.requesterName ?? 'Unknown'}',
                        style: AppTypography.caption.copyWith(color: colors.textSecondary),
                      ),
                  ],
                ),
              ),
              _buildRequestStatusBadge(request.status, statusColor, statusIcon),
            ],
          ),
          const SizedBox(height: AppSpacing.m),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Qty: ${request.quantity}',
                style: AppTypography.bodyS.copyWith(color: colors.textSecondary),
              ),
              Text(
                DateFormat('MMM d, h:mm a').format(request.createdAt),
                style: AppTypography.caption.copyWith(color: colors.textSecondary),
              ),
            ],
          ),
          if (request.notes != null && request.notes!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s),
            Divider(color: colors.border),
            const SizedBox(height: AppSpacing.s),
            Text(
              request.notes!,
              style: AppTypography.caption.copyWith(fontStyle: FontStyle.italic, color: colors.textSecondary),
            ),
          ],
          if (request.rejectReason != null && request.rejectReason!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s),
            Container(
              padding: const EdgeInsets.all(AppSpacing.s),
              decoration: BoxDecoration(
                color: request.status.toLowerCase() == 'rejected' 
                  ? colors.error.withOpacity(0.05)
                  : colors.indigo.withOpacity(0.05),
                borderRadius: BorderRadius.circular(AppRadius.s),
                border: Border.all(
                  color: request.status.toLowerCase() == 'rejected' 
                    ? colors.error.withOpacity(0.2)
                    : colors.indigo.withOpacity(0.2),
                ),
              ),
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.m),
                decoration: BoxDecoration(
                  color: colors.error.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(AppRadius.m),
                  border: Border.all(color: colors.error.withOpacity(0.1)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      LucideIcons.alertCircle,
                      size: 16,
                      color: colors.error,
                    ),
                    const SizedBox(width: AppSpacing.s),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'REJECTION FEEDBACK',
                            style: AppTypography.caption.copyWith(
                              color: colors.error,
                              fontWeight: FontWeight.w900,
                              fontSize: 9,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            request.rejectReason ?? 'No feedback provided',
                            style: AppTypography.bodyS.copyWith(
                              color: colors.textPrimary,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (request.status == 'approved') ...[
            const SizedBox(height: AppSpacing.m),
            Divider(color: colors.border),
            const SizedBox(height: AppSpacing.s),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                MhButton(
                  label: 'Mark as Returned',
                  icon: LucideIcons.checkSquare,
                  type: MhButtonType.outline,
                  height: 36,
                  onTap: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    try {
                      await ref.read(inventoryRequestListProvider.notifier).updateRequestStatus(
                        requestId: request.id,
                        status: 'fulfilled',
                      );
                      ref.read(soundServiceProvider).playSuccess();
                      messenger.showSnackBar(
                        const SnackBar(
                          content: Text('Item marked as returned successfully'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Failed to update request: $e'),
                          backgroundColor: colors.error,
                        ),
                      );
                    }
                  },
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRequestStatusBadge(String status, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.s),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: AppTypography.caption.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 9,
            ),
          ),
        ],
      ),
    );
  }

  void _showItemDetails(BuildContext context, WidgetRef ref, InventoryItem item, bool isAdmin, bool canBook, bool isOffline, ThemeColors colors) {
    final profile = ref.read(currentUserProfileProvider).valueOrNull;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    
    // Admins and Managers can edit and delete. Team can only edit (all items, as created_by is missing in schema).
    final canEdit = isAdmin || role == 'team';
    final canDelete = isAdmin;

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => EquipmentDetailsSheet(
        item: item,
        isAdmin: isAdmin,
        canBook: isOffline ? false : canBook, // Disable booking when offline
        onRequest: () => _showRequestSheet(context, item),
        onBook: () => _showBookingSheet(context, item),
        onEdit: (isOffline || !canEdit) ? null : () {
          context.push('/inventory/create', extra: item);
        },
        onDelete: (isOffline || !canDelete) ? null : () async {
          // First pop the bottom sheet
          if (context.mounted) {
            Navigator.pop(context);
          }
          
          // Then perform deletion
          await ref.read(inventoryListProvider.notifier).deleteItem(item.id);
          
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${item.name} deleted successfully'),
                backgroundColor: AppColors.success,
              ),
            );
          }
        },
      ),
    );
  }

  void _showRequestSheet(BuildContext context, InventoryItem item) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => EquipmentRequestSheet(item: item),
    );
  }

  void _showBookingSheet(BuildContext context, InventoryItem item) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => EquipmentBookingSheet(item: item),
    );
  }
}
