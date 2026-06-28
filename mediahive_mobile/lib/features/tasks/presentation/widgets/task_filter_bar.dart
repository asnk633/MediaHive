import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../../core/theme_provider.dart';
import '../providers/tasks_provider.dart';

class TaskFilterBar extends ConsumerWidget {
  final VoidCallback? onSortTap;
  final VoidCallback? onFilterTap;

  const TaskFilterBar({
    super.key,
    this.onSortTap,
    this.onFilterTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        _buildSearchAndControls(context, ref),
        const SizedBox(height: AppSpacing.s),
        _buildStatusFilters(ref),
      ],
    );
  }

  Widget _buildSearchAndControls(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final query = ref.watch(tasksSearchQueryProvider);
    final sortOrder = ref.watch(tasksSortOrderProvider);
    final deptFilter = ref.watch(tasksDeptFilterProvider);
    final instFilter = ref.watch(tasksInstFilterProvider);
    final hasActiveFilters = deptFilter != null || instFilter != null;
    final isSorted = sortOrder != 'DEFAULT';

    return Row(
      children: [
        Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            constraints: const BoxConstraints(minHeight: 44),
            decoration: BoxDecoration(
              color: colors.isDark
                  ? colors.surface.withValues(alpha: 0.6)
                  : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: query.isNotEmpty
                    ? colors.honey.withValues(alpha: 0.6)
                    : colors.border.withValues(alpha: 0.3),
                width: query.isNotEmpty ? 1.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: colors.border.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              onChanged: (v) =>
                  ref.read(tasksSearchQueryProvider.notifier).state = v.trim(),
              style: AppTypography.bodyM.copyWith(
                color: colors.textPrimary,
                fontSize: 12,
              ),
              decoration: InputDecoration(
                hintText: 'Search tasks, assignees\u2026',
                hintStyle: AppTypography.bodyM.copyWith(
                  color: colors.textSecondary.withValues(alpha: 0.4),
                  fontSize: 12,
                ),
                prefixIcon: Padding(
                  padding: const EdgeInsets.only(left: 12, right: 6),
                  child: Icon(
                    LucideIcons.search,
                    size: 15,
                    color: query.isNotEmpty
                        ? colors.honey
                        : colors.textSecondary.withValues(alpha: 0.45),
                  ),
                ),
                prefixIconConstraints: const BoxConstraints(minWidth: 36),
                suffixIcon: query.isNotEmpty
                    ? GestureDetector(
                        onTap: () => ref
                            .read(tasksSearchQueryProvider.notifier)
                            .state = '',
                        child: Padding(
                          padding: const EdgeInsets.only(right: 10),
                          child: Icon(
                            LucideIcons.x,
                            size: 13,
                            color: colors.textSecondary.withValues(alpha: 0.55),
                          ),
                        ),
                      )
                    : null,
                border: InputBorder.none, filled: false,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 4, vertical: 11),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        _buildIconControlButton(
          icon: LucideIcons.arrowUpDown,
          isActive: isSorted,
          colors: colors,
          onTap: onSortTap ?? () {},
          badge: isSorted ? _sortShortLabel(sortOrder) : null,
        ),
        const SizedBox(width: 8),
        _buildIconControlButton(
          icon: LucideIcons.slidersHorizontal,
          isActive: hasActiveFilters,
          colors: colors,
          onTap: onFilterTap ?? () {},
          badge: hasActiveFilters
              ? '${(deptFilter != null ? 1 : 0) + (instFilter != null ? 1 : 0)}'
              : null,
        ),
      ],
    );
  }

  Widget _buildIconControlButton({
    required IconData icon,
    required bool isActive,
    required ThemeColors colors,
    required VoidCallback onTap,
    String? badge,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isActive
              ? colors.honey.withValues(alpha: 0.12)
              : colors.isDark
                  ? colors.surface.withValues(alpha: 0.6)
                  : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive
                ? colors.honey.withValues(alpha: 0.6)
                : colors.border.withValues(alpha: 0.3),
            width: isActive ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: colors.border.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive
                  ? colors.honey
                  : colors.textSecondary.withValues(alpha: 0.6),
            ),
            if (badge != null)
              Positioned(
                top: 7,
                right: 7,
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: colors.honey,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      badge,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        height: 1,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _sortShortLabel(String sortOrder) {
    switch (sortOrder) {
      case 'STATUS_ASC':
        return 'S\u2191';
      case 'STATUS_DESC':
        return 'S\u2193';
      case 'DATE_ASC':
        return 'D\u2191';
      case 'DATE_DESC':
        return 'D\u2193';
      default:
        return '';
    }
  }

  Widget _buildStatusFilters(WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final selectedStatus = ref.watch(tasksStatusFilterProvider);
    final statuses = ['ALL', 'TO DO', 'IN PROGRESS', 'REVIEW', 'DONE'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const ElasticScrollPhysics(),
      child: Row(
        children: statuses.map((status) {
          final isSelected = selectedStatus == status;
          return GestureDetector(
            onTap: () => ref.read(tasksStatusFilterProvider.notifier).state = status,
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? colors.honey.withValues(alpha: 0.1) : colors.surface.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? colors.honey : colors.border.withValues(alpha: 0.5),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Text(
                status,
                style: TextStyle(
                  color: isSelected ? colors.honey : colors.textSecondary.withValues(alpha: 0.7),
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
