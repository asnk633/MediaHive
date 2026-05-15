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
  DateTime _returnDate = DateTime.now().add(const Duration(days: 1));
  int _units = 1;
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _buildBaseSheet(
      context: context,
      title: 'Request Item',
      buttonLabel: 'Submit Request',
      onConfirm: () {
        // TODO: Implement actual request logic via repository
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Request submitted for ${widget.item.name}'),
            backgroundColor: AppColors.success,
          ),
        );
      },
      children: [
        _buildItemSummary(),
        const SizedBox(height: AppSpacing.xl),
        _buildLabel('Return Date'),
        _buildDatePicker(
          label: DateFormat('MMM dd, yyyy').format(_returnDate),
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _returnDate,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 365)),
            );
            if (picked != null) setState(() => _returnDate = picked);
          },
        ),
        const SizedBox(height: AppSpacing.l),
        _buildLabel('Units Requested'),
        _buildUnitCounter(),
        const SizedBox(height: AppSpacing.l),
        _buildLabel('Purpose / Notes'),
        _buildTextField(
          controller: _notesController,
          hint: 'Enter the purpose of this request...',
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildItemSummary() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.m),
            ),
            child: const Icon(LucideIcons.package, color: AppColors.honey),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.item.name, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
                Text(widget.item.category, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Available', style: AppTypography.caption.copyWith(color: AppColors.success, fontWeight: FontWeight.bold)),
              Text('${widget.item.quantity} in stock', style: AppTypography.caption),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildDatePicker({required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: AppTypography.bodyM),
            const Icon(LucideIcons.calendar, size: 18, color: AppColors.honey),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitCounter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(LucideIcons.minus, size: 16),
            onPressed: _units > 1 ? () => setState(() => _units--) : null,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(_units.toString(), style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
          ),
          IconButton(
            icon: const Icon(LucideIcons.plus, size: 16),
            onPressed: _units < widget.item.quantity ? () => setState(() => _units++) : null,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String hint, int maxLines = 1}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: const BorderSide(color: AppColors.border),
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
  }) {
    return Container(
      padding: EdgeInsets.only(
        left: AppSpacing.l,
        right: AppSpacing.l,
        top: AppSpacing.l,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
      decoration: const BoxDecoration(
        color: AppColors.backgroundPrimary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        gradient: AppColors.darkGradient,
      ),
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
                color: AppColors.textSecondary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: AppTypography.h3),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20),
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
    // Reuse the same base logic as RequestSheet
    // We can refactor later if they diverge significantly
    return Container(
      padding: EdgeInsets.only(
        left: AppSpacing.l,
        right: AppSpacing.l,
        top: AppSpacing.l,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
      decoration: const BoxDecoration(
        color: AppColors.backgroundPrimary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        gradient: AppColors.darkGradient,
      ),
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
                color: AppColors.textSecondary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Book Now', style: AppTypography.h3),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.l),
          _buildItemSummary(),
          const SizedBox(height: AppSpacing.xl),
          _buildLabel('Reservation Period'),
          _buildDatePickerRange(),
          const SizedBox(height: AppSpacing.l),
          _buildLabel('Units'),
          _buildUnitCounter(),
          const SizedBox(height: AppSpacing.l),
          _buildLabel('Project Name'),
          _buildTextField(
            controller: _projectController,
            hint: 'e.g. Studio Session A',
          ),
          const SizedBox(height: AppSpacing.xl),
          MhButton(
            label: 'Confirm Booking',
            onTap: () {
              // TODO: Implement actual booking logic
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Booking confirmed for ${widget.item.name}'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            type: MhButtonType.primary,
          ),
          const SizedBox(height: 100), // Clear FloatingDock
        ],
      ),
    );
  }

  // Duplicate helpers for now to keep the file standalone, can refactor to mixin or common widgets
  Widget _buildItemSummary() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: AppColors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.m),
            ),
            child: const Icon(LucideIcons.calendar, color: AppColors.info),
          ),
          const SizedBox(width: AppSpacing.m),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.item.name, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
                Text(widget.item.category, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
              ],
            ),
          ),
          Text('${widget.item.quantity} Avail.', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildDatePickerRange() {
    final start = DateFormat('MMM dd').format(_dateRange.start);
    final end = DateFormat('MMM dd').format(_dateRange.end);

    return GestureDetector(
      onTap: () async {
        final picked = await showDateRangePicker(
          context: context,
          initialDateRange: _dateRange,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (picked != null) setState(() => _dateRange = picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$start - $end', style: AppTypography.bodyM),
            const Icon(LucideIcons.calendarRange, size: 18, color: AppColors.info),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitCounter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(LucideIcons.minus, size: 16),
            onPressed: _units > 1 ? () => setState(() => _units--) : null,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(_units.toString(), style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
          ),
          IconButton(
            icon: const Icon(LucideIcons.plus, size: 16),
            onPressed: _units < widget.item.quantity ? () => setState(() => _units++) : null,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String hint}) {
    return TextField(
      controller: controller,
      style: AppTypography.bodyM,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.m),
          borderSide: const BorderSide(color: AppColors.border),
        ),
      ),
    );
  }
}

class EquipmentDetailsSheet extends StatelessWidget {
  final InventoryItem item;
  final VoidCallback onRequest;
  final VoidCallback onBook;

  const EquipmentDetailsSheet({
    super.key,
    required this.item,
    required this.onRequest,
    required this.onBook,
  });

  String? _getDirectImageUrl(String? url, [String? driveFileId]) {
    final id = driveFileId ?? (url != null ? _extractDriveId(url) : null);
    if (id != null) {
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

  @override
  Widget build(BuildContext context) {
    final directUrl = _getDirectImageUrl(item.imageUrl, item.metadata['drive_file_id']);
    
    return Container(
      padding: const EdgeInsets.all(AppSpacing.l),
      decoration: const BoxDecoration(
        color: AppColors.backgroundPrimary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        gradient: AppColors.darkGradient,
      ),
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
                color: AppColors.textSecondary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Item Details', style: AppTypography.caption.copyWith(color: AppColors.textSecondary, letterSpacing: 1.2)),
                  Text(item.name, style: AppTypography.h3),
                ],
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20),
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
                AppColors.info
              ),
              const SizedBox(width: AppSpacing.m),
              _buildDetailCard(
                'CONDITION', 
                item.condition.toUpperCase(), 
                LucideIcons.shieldCheck, 
                AppColors.success
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.m),
          _buildInfoRow('STATUS', item.status, isStatus: true),
          _buildInfoRow('SERIAL NO.', item.metadata['serial_number']?.toString() ?? '-'),
          _buildInfoRow('ASSET ID', item.id.substring(0, 8).toUpperCase()),
          _buildInfoRow('QUANTITY', '${item.quantity} Units Available'),
          const SizedBox(height: AppSpacing.xl),
          Text('DESCRIPTION', style: AppTypography.caption.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            item.metadata['description']?.toString() ?? 'No description provided.',
            style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
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
          ),
          const SizedBox(height: 100), // Clear FloatingDock
          const SizedBox(height: AppSpacing.m),
        ],
      ),
    );
  }

  Widget _buildDetailCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.m),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 8),
            Text(label, style: AppTypography.caption.copyWith(fontSize: 8, color: AppColors.textSecondary)),
            Text(
              value, 
              style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.bold),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isStatus = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
          if (isStatus)
            _buildStatusChip(value)
          else
            Text(value, style: AppTypography.bodyS.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color = AppColors.success;
    if (status == 'MAINTENANCE') color = AppColors.error;
    if (status == 'BOOKED') color = AppColors.warning;

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
