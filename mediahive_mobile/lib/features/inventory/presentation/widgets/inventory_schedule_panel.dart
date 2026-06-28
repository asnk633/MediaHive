import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_spacing.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/equipment_booking.dart';
import 'package:mediahive_mobile/shared/widgets/mh_button.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';

class InventorySchedulePanel extends StatelessWidget {
  final List<EquipmentBooking> bookings;
  final bool isLoading;
  final String? error;
  final VoidCallback onBookEquipment;

  const InventorySchedulePanel({
    super.key,
    required this.bookings,
    this.isLoading = false,
    this.error,
    required this.onBookEquipment,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);

      if (isLoading) {
        return const MhLoading(size: 100);
      }

      if (error != null) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Text('Failed to load bookings: $error', style: AppTypography.caption.copyWith(color: colors.error)),
          ),
        );
      }

      if (bookings.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Icon(LucideIcons.calendar, size: 64, color: colors.textSecondary.withValues(alpha: 0.2)),
              const SizedBox(height: AppSpacing.m),
              Text('No active bookings found', style: AppTypography.bodyM.copyWith(color: colors.textSecondary)),
              const SizedBox(height: AppSpacing.m),
              MhButton(
                label: 'Book Equipment',
                onTap: onBookEquipment,
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
    });
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
              : colors.border.withValues(alpha: 0.12),
        ),
        boxShadow: colors.isDark
            ? []
            : [
                BoxShadow(
                  color: colors.border.withValues(alpha: 0.03),
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
              color: colors.indigo.withValues(alpha: 0.1),
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
}
