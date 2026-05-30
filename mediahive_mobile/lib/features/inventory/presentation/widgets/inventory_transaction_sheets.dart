import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme/app_spacing.dart';
import 'package:mediahive_mobile/shared/widgets/mh_button.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_item.dart';
import 'package:mediahive_mobile/features/inventory/presentation/providers/inventory_provider.dart';
import 'package:mediahive_mobile/core/utils/url_helpers.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/theme/elastic_scroll_physics.dart';

class EquipmentRequestSheet extends ConsumerStatefulWidget {
  final InventoryItem item;

  const EquipmentRequestSheet({
    super.key,
    required this.item,
  });

  @override
  ConsumerState<EquipmentRequestSheet> createState() => _EquipmentRequestSheetState();
}

class _EquipmentRequestSheetState extends ConsumerState<EquipmentRequestSheet> {
  DateTime _pickupDate = DateTime.now();
  DateTime _returnDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _pickupTime = TimeOfDay.now();
  TimeOfDay _returnTime = TimeOfDay.now();
  int _units = 1;
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return _buildBaseSheet(
      context: context,
      title: 'Request Item',
      buttonLabel: 'Submit Request',
      colors: colors,
      onConfirm: () async {
        try {
          final datesNote = 'Dates: ${DateFormat('dd-MM-yyyy').format(_pickupDate)} to ${DateFormat('dd-MM-yyyy').format(_returnDate)}';
          final timesNote = 'Time: ${_pickupTime.format(context)} to ${_returnTime.format(context)}';
          final fullNote = '$datesNote\n$timesNote\n\n${_notesController.text}';

          await ref.read(inventoryListProvider.notifier).requestItem(
            itemName: widget.item.name,
            quantity: _units,
            notes: fullNote,
          );
          
          if (context.mounted) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Request submitted for ${widget.item.name}'),
                backgroundColor: AppColors.success,
              ),
            );
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to submit request: $e'),
                backgroundColor: colors.error,
              ),
            );
          }
        }
      },
      children: [
        _buildItemSummary(colors),
        const SizedBox(height: AppSpacing.xl),
        _buildLabel('Pick up Details', colors),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: _buildPicker(
                label: DateFormat('dd-MM-yyyy').format(_pickupDate),
                icon: LucideIcons.calendar,
                colors: colors,
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _pickupDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    builder: (context, child) => Theme(
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
                    ),
                  );
                  if (picked != null) {
                    setState(() {
                      _pickupDate = picked;
                      if (_returnDate.isBefore(_pickupDate)) {
                        _returnDate = _pickupDate.add(const Duration(days: 1));
                      }
                    });
                  }
                },
              ),
            ),
            const SizedBox(width: AppSpacing.m),
            Expanded(
              flex: 2,
              child: _buildPicker(
                label: _pickupTime.format(context),
                icon: LucideIcons.clock,
                colors: colors,
                onTap: () async {
                  final picked = await showTimePicker(
                    context: context,
                    initialTime: _pickupTime,
                    builder: (context, child) => Theme(
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
                    ),
                  );
                  if (picked != null) setState(() => _pickupTime = picked);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.m),
        _buildLabel('Return Details', colors),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: _buildPicker(
                label: DateFormat('dd-MM-yyyy').format(_returnDate),
                icon: LucideIcons.calendar,
                colors: colors,
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _returnDate,
                    firstDate: _pickupDate,
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    builder: (context, child) => Theme(
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
                    ),
                  );
                  if (picked != null) setState(() => _returnDate = picked);
                },
              ),
            ),
            const SizedBox(width: AppSpacing.m),
            Expanded(
              flex: 2,
              child: _buildPicker(
                label: _returnTime.format(context),
                icon: LucideIcons.clock,
                colors: colors,
                onTap: () async {
                  final picked = await showTimePicker(
                    context: context,
                    initialTime: _returnTime,
                    builder: (context, child) => Theme(
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
                    ),
                  );
                  if (picked != null) setState(() => _returnTime = picked);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.l),
        _buildLabel('Units Requested', colors),
        _buildUnitCounter(colors),
        const SizedBox(height: AppSpacing.l),
        _buildLabel('Purpose / Notes', colors),
        _buildTextField(
          controller: _notesController,
          hint: 'Enter the purpose of this request...',
          maxLines: 3,
          colors: colors,
        ),
      ],
    );
  }

  Widget _buildItemSummary(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface.withOpacity(0.5) : Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface : colors.border.withOpacity(0.12),
              borderRadius: BorderRadius.circular(AppRadius.m),
            ),
            child: Icon(LucideIcons.package, color: colors.honey),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.item.name, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text(widget.item.category, style: AppTypography.caption.copyWith(color: colors.textSecondary)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Available', style: AppTypography.caption.copyWith(color: colors.emerald, fontWeight: FontWeight.bold)),
              Text('${widget.item.quantity} in stock', style: AppTypography.caption.copyWith(color: colors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String label, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: AppTypography.bodyS.copyWith(color: colors.textSecondary, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildPicker({required String label, required IconData icon, required ThemeColors colors, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 12),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(child: Text(label, style: AppTypography.bodyS.copyWith(color: colors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis)),
            Icon(icon, size: 16, color: colors.honey),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitCounter(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(LucideIcons.minus, size: 16, color: colors.textPrimary),
            onPressed: _units > 1 ? () => setState(() => _units--) : null,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(_units.toString(), style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
          ),
          IconButton(
            icon: Icon(LucideIcons.plus, size: 16, color: colors.textPrimary),
            onPressed: _units < widget.item.quantity ? () => setState(() => _units++) : null,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String hint, int maxLines = 1, required ThemeColors colors}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: TextStyle(color: colors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: AppTypography.bodyS.copyWith(color: colors.textSecondary.withOpacity(0.5)),
        filled: true,
        fillColor: colors.isDark ? colors.surface : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: BorderSide(color: colors.border),
        ),
      ),
    );
  }

  Widget _buildBaseSheet({
    required BuildContext context,
    required String title,
    required String buttonLabel,
    required List<Widget> children,
    required VoidCallback onConfirm,
    required ThemeColors colors,
  }) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      padding: EdgeInsets.only(
        left: AppSpacing.l,
        right: AppSpacing.l,
        top: AppSpacing.l,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
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
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const ElasticScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AppSpacing.l),
                  decoration: BoxDecoration(
                    color: colors.textSecondary.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(title, style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                  IconButton(
                    icon: Icon(LucideIcons.x, size: 20, color: colors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.l),
              ...children,
              const SizedBox(height: AppSpacing.xl),
              MhButton(
                label: buttonLabel,
                onTap: onConfirm,
                type: MhButtonType.primary,
              ),
              const SizedBox(height: 100), // Clear FloatingDock
            ],
          ),
        ),
      ),
    );
  }
}

class EquipmentBookingSheet extends ConsumerStatefulWidget {
  final InventoryItem item;

  const EquipmentBookingSheet({
    super.key,
    required this.item,
  });

  @override
  ConsumerState<EquipmentBookingSheet> createState() => _EquipmentBookingSheetState();
}

class _EquipmentBookingSheetState extends ConsumerState<EquipmentBookingSheet> {
  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime.now(),
    end: DateTime.now().add(const Duration(days: 2)),
  );
  int _units = 1;
  final _projectController = TextEditingController();

  @override
  void dispose() {
    _projectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      padding: EdgeInsets.only(
        left: AppSpacing.l,
        right: AppSpacing.l,
        top: AppSpacing.l,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
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
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const ElasticScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AppSpacing.l),
                  decoration: BoxDecoration(
                    color: colors.textSecondary.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Book Now', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                  IconButton(
                    icon: Icon(LucideIcons.x, size: 20, color: colors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.l),
              _buildItemSummary(colors),
              const SizedBox(height: AppSpacing.xl),
              _buildLabel('Reservation Period', colors),
              _buildDatePickerRange(colors),
              const SizedBox(height: AppSpacing.l),
              _buildLabel('Units', colors),
              _buildUnitCounter(colors),
              const SizedBox(height: AppSpacing.l),
              _buildLabel('Project Name', colors),
              _buildTextField(
                controller: _projectController,
                hint: 'e.g. Studio Session A',
                colors: colors,
              ),
              const SizedBox(height: AppSpacing.xl),
              MhButton(
                label: 'Confirm Booking',
                onTap: () async {
                  try {
                    await ref.read(inventoryListProvider.notifier).bookItem(
                      equipmentId: widget.item.id,
                      startTime: _dateRange.start,
                      endTime: _dateRange.end,
                      unitsRequested: _units,
                    );
                    
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Booking confirmed for ${widget.item.name}'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Failed to book equipment: $e'),
                          backgroundColor: colors.error,
                        ),
                      );
                    }
                  }
                },
                type: MhButtonType.primary,
              ),
              const SizedBox(height: 100), // Clear FloatingDock
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildItemSummary(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface.withOpacity(0.5) : Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface : colors.border.withOpacity(0.12),
              borderRadius: BorderRadius.circular(AppRadius.m),
            ),
            child: Icon(LucideIcons.calendar, color: colors.indigo),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.item.name, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
                Text(widget.item.category, style: AppTypography.caption.copyWith(color: colors.textSecondary)),
              ],
            ),
          ),
          Text('${widget.item.quantity} Avail.', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildLabel(String label, ThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: AppTypography.bodyS.copyWith(color: colors.textSecondary, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildDatePickerRange(ThemeColors colors) {
    final start = DateFormat('dd-MM-yyyy').format(_dateRange.start);
    final end = DateFormat('dd-MM-yyyy').format(_dateRange.end);

    return GestureDetector(
      onTap: () async {
        final picked = await showDateRangePicker(
          context: context,
          initialDateRange: _dateRange,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) => Theme(
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
          ),
        );
        if (picked != null) setState(() => _dateRange = picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 12),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$start - $end', style: AppTypography.bodyM.copyWith(color: colors.textPrimary)),
            Icon(LucideIcons.calendarRange, size: 18, color: colors.indigo),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitCounter(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: Icon(LucideIcons.minus, size: 16, color: colors.textPrimary),
            onPressed: _units > 1 ? () => setState(() => _units--) : null,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(_units.toString(), style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary)),
          ),
          IconButton(
            icon: Icon(LucideIcons.plus, size: 16, color: colors.textPrimary),
            onPressed: _units < widget.item.quantity ? () => setState(() => _units++) : null,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String hint, required ThemeColors colors}) {
    return TextField(
      controller: controller,
      style: AppTypography.bodyM.copyWith(color: colors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: AppTypography.bodyS.copyWith(color: colors.textSecondary.withOpacity(0.5)),
        filled: true,
        fillColor: colors.isDark ? colors.surface : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: BorderSide(color: colors.border),
        ),
      ),
    );
  }
}

class EquipmentDetailsSheet extends ConsumerWidget {
  final InventoryItem item;
  final VoidCallback onRequest;
  final VoidCallback onBook;
  final bool isAdmin;
  final bool canBook;
  final VoidCallback? onDelete;
  final VoidCallback? onEdit;

  const EquipmentDetailsSheet({
    super.key,
    required this.item,
    required this.onRequest,
    required this.onBook,
    this.isAdmin = false,
    this.canBook = true,
    this.onDelete,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final directUrl = UrlHelpers.getDirectImageUrl(item.imageUrl, driveFileId: item.metadata['drive_file_id']);
    
    final condLower = item.condition.toLowerCase();
    final condColor = (condLower == 'good' || condLower == 'excellent' || condLower == 'new')
        ? colors.emerald 
        : (condLower == 'fair' || condLower == 'need repair' || condLower == 'need_repair' ? colors.honey : colors.error);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      padding: const EdgeInsets.all(AppSpacing.l),
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
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const ElasticScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AppSpacing.l),
                  decoration: BoxDecoration(
                    color: colors.textSecondary.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text('Item ID', style: AppTypography.caption.copyWith(color: colors.textSecondary, letterSpacing: 1.2)),
                            if (item.assetId.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: colors.honey.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: colors.honey.withOpacity(0.5)),
                                ),
                                child: Text(
                                  item.assetId,
                                  style: AppTypography.caption.copyWith(
                                    color: colors.honey,
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        Text(item.name, style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(LucideIcons.x, size: 20, color: colors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.l),
              if (directUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.l),
                  child: Image.network(
                    directUrl,
                    width: double.infinity,
                    height: 200,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(height: AppSpacing.l),
              ],
              Row(
                children: [
                  _buildDetailCard(
                    'CATEGORY', 
                    item.category.toUpperCase(), 
                    LucideIcons.package, 
                    colors.indigo,
                    colors,
                  ),
                  const SizedBox(width: AppSpacing.m),
                  _buildDetailCard(
                    'CONDITION', 
                    item.condition.toUpperCase(), 
                    LucideIcons.shieldCheck, 
                    condColor,
                    colors,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.m),
              _buildInfoRow('STATUS', item.status, colors, isStatus: true),
              _buildInfoRow('SERIAL NO.', item.serialNumber ?? item.metadata['serial_number']?.toString() ?? '-', colors),
              _buildInfoRow('AVAILABILITY', '${item.availableQuantity} of ${item.quantity} Units Available', colors),
              if (item.location != null && item.location!.isNotEmpty)
                _buildInfoRow('LOCATION', item.location!, colors),
              if (isAdmin) ...[
                _buildInfoRow(
                  'PURCHASE AMOUNT', 
                  item.purchaseAmount != null ? '₹${item.purchaseAmount!.toStringAsFixed(0)}' : '-',
                  colors,
                ),
                Builder(
                  builder: (context) {
                    String formattedDate = '-';
                    if (item.purchaseDate != null && item.purchaseDate!.isNotEmpty) {
                      try {
                        formattedDate = DateFormat('dd-MM-yyyy').format(DateTime.parse(item.purchaseDate!));
                      } catch (_) {
                        formattedDate = item.purchaseDate!;
                      }
                    }
                    return _buildInfoRow('PURCHASE DATE', formattedDate, colors);
                  }
                ),
              ],
              const SizedBox(height: AppSpacing.xl),
              Text('DESCRIPTION', style: AppTypography.caption.copyWith(color: colors.textSecondary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                item.description ?? item.metadata['description']?.toString() ?? 'No description provided.',
                style: AppTypography.bodyM.copyWith(color: colors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: MhButton(
                      label: 'Request',
                      onTap: () {
                        Navigator.pop(context);
                        onRequest();
                      },
                      type: MhButtonType.secondary,
                    ),
                  ),
                  if (canBook) ...[
                    const SizedBox(width: AppSpacing.m),
                    Expanded(
                      child: MhButton(
                        label: 'Book Now',
                        onTap: () {
                          Navigator.pop(context);
                          onBook();
                        },
                        type: MhButtonType.primary,
                      ),
                    ),
                  ],
                ],
              ),
              if (isAdmin) ...[
                const SizedBox(height: AppSpacing.m),
                Row(
                  children: [
                    Expanded(
                      child: MhButton(
                        label: 'Edit Asset',
                        onTap: () {
                          Navigator.pop(context); // Pop the bottom sheet
                          onEdit?.call();
                        },
                        type: MhButtonType.secondary,
                        icon: LucideIcons.edit3,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.m),
                    Expanded(
                      child: MhButton(
                        label: 'Delete Asset',
                        onTap: () {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              backgroundColor: colors.backgroundSecondary,
                              title: Text('Delete Asset', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                              content: Text('Are you sure you want to delete ${item.name}? This action cannot be undone.', style: AppTypography.bodyM.copyWith(color: colors.textSecondary)),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(context); // Pop ONLY the dialog
                                    onDelete?.call();
                                  },
                                  child: Text('Delete', style: TextStyle(color: colors.error)),
                                ),
                              ],
                            ),
                          );
                        },
                        type: MhButtonType.secondary,
                        icon: LucideIcons.trash2,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 100), // Clear FloatingDock
              const SizedBox(height: AppSpacing.l),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailCard(String label, String value, IconData icon, Color color, ThemeColors colors) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.m),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 8),
            Text(label, style: AppTypography.caption.copyWith(fontSize: 8, color: colors.textSecondary)),
            Text(
              value, 
              style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.bold, color: colors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, ThemeColors colors, {bool isStatus = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.caption.copyWith(color: colors.textSecondary)),
          if (isStatus)
            _buildStatusChip(value, colors)
          else
            Text(value, style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.w600, color: colors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status, ThemeColors colors) {
    final statusLower = status.toLowerCase();
    Color color = colors.emerald;
    if (statusLower == 'maintenance' || statusLower == 'under repair' || statusLower == 'under_repair') {
      color = colors.error;
    } else if (statusLower == 'booked' || statusLower == 'in use' || statusLower == 'in_use') {
      color = colors.honey;
    } else if (statusLower == 'retired' || statusLower == 'disposed') {
      color = colors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        status,
        style: AppTypography.caption.copyWith(color: color, fontWeight: FontWeight.bold, fontSize: 10),
      ),
    );
  }
}
