import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_spacing.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';

enum InventoryViewMode { grid, list }

class InventoryFilterBar extends StatelessWidget {
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final InventoryViewMode viewMode;
  final ValueChanged<InventoryViewMode> onViewModeChanged;
  final String sortLabel;
  final VoidCallback onSortTap;
  final String categoryLabel;
  final VoidCallback onCategoryTap;

  const InventoryFilterBar({
    super.key,
    required this.searchQuery,
    required this.onSearchChanged,
    required this.viewMode,
    required this.onViewModeChanged,
    required this.sortLabel,
    required this.onSortTap,
    required this.categoryLabel,
    required this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
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
                      Icon(LucideIcons.search, size: 18, color: colors.textSecondary.withValues(alpha: 0.6)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          onChanged: onSearchChanged,
                          decoration: InputDecoration(
                            hintText: 'Search by name or serial...',
                            hintStyle: AppTypography.bodyM.copyWith(color: colors.textSecondary.withValues(alpha: 0.5)),
                            border: InputBorder.none, filled: false,
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
                    onViewModeChanged(viewMode == InventoryViewMode.grid ? InventoryViewMode.list : InventoryViewMode.grid);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s),
          Row(
            children: [
              Expanded(
                child: _buildFilterDropdown(sortLabel, LucideIcons.arrowUpDown, colors, onSortTap),
              ),
              const SizedBox(width: AppSpacing.s),
              Expanded(
                child: _buildFilterDropdown(categoryLabel, LucideIcons.filter, colors, onCategoryTap),
              ),
            ],
          ),
        ],
      );
    });
  }

  Widget _buildFilterDropdown(String label, IconData icon, ThemeColors colors, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
      ),
    );
  }
}
