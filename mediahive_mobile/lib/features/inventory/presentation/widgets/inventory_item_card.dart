import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/utils/url_helpers.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_item.dart';
import 'inventory_filter_bar.dart';

class InventoryItemCard extends StatelessWidget {
  final InventoryItem item;
  final InventoryViewMode viewMode;
  final bool isOffline;
  final VoidCallback? onTap;
  final VoidCallback? onBook;
  final VoidCallback? onRequest;

  const InventoryItemCard({
    super.key,
    required this.item,
    required this.viewMode,
    this.isOffline = false,
    this.onTap,
    this.onBook,
    this.onRequest,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      if (viewMode == InventoryViewMode.grid) {
        return _buildGridCard(colors);
      } else {
        return _buildListTile(colors);
      }
    });
  }

  Color _statusColor(String status, ThemeColors colors) {
    final s = status.toLowerCase();
    if (s == 'available') return colors.emerald;
    if (s == 'in use' || s == 'in_use') return colors.honey;
    if (s == 'under repair' || s == 'maintenance') return colors.error;
    return colors.textSecondary;
  }

  DateTime? _parseMaintenanceDate() {
    try {
      if (item.maintenanceDueDate != null) return DateTime.parse(item.maintenanceDueDate!);
    } catch (_) {}
    return null;
  }

  Widget _buildPlaceholderImage(ThemeColors colors) {
    return Container(
      color: colors.isDark ? colors.surface.withValues(alpha: 0.8) : colors.border.withValues(alpha: 0.12),
      child: Center(
        child: Icon(LucideIcons.image, color: colors.textSecondary.withValues(alpha: 0.6), size: 24),
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
                color: color.withValues(alpha: 0.5),
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

  Widget _buildGridCard(ThemeColors colors) {
    final statusLower = item.status.toLowerCase();
    final statusColor = _statusColor(statusLower, colors);
    final maintenanceDate = _parseMaintenanceDate();
    final isMaintenanceDue = maintenanceDate != null && maintenanceDate.isBefore(DateTime.now());

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark
                ? colors.border
                : colors.border.withValues(alpha: 0.12),
          ),
          boxShadow: [
            if (isMaintenanceDue)
              BoxShadow(
                color: colors.error.withValues(alpha: 0.15),
                blurRadius: 12,
                spreadRadius: 2,
              ),
            BoxShadow(
              color: colors.border.withValues(alpha: 0.05),
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
                        },
                      ),
                    ),
                    if (item.assetId.isNotEmpty)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
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
                            color: colors.textSecondary.withValues(alpha: 0.5),
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

  Widget _buildListTile(ThemeColors colors) {
    final statusLower = item.status.toLowerCase();
    final statusColor = _statusColor(statusLower, colors);
    final maintenanceDate = _parseMaintenanceDate();
    final isMaintenanceDue = maintenanceDate != null && maintenanceDate.isBefore(DateTime.now());

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(12),
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
                  },
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
}
