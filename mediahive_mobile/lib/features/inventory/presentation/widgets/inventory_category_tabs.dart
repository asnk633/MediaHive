import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mediahive_mobile/core/theme/app_spacing.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';

class InventoryCategoryTabs extends StatelessWidget {
  final int activeTab;
  final ValueChanged<int> onTabChanged;

  const InventoryCategoryTabs({
    super.key,
    required this.activeTab,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      return Container(
        height: 48,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(
            color: colors.isDark
                ? colors.border
                : colors.border.withValues(alpha: 0.12),
          ),
        ),
        child: Row(
          children: [
            Expanded(child: _buildTabItem('Items', 0, activeTab == 0, colors)),
            Expanded(child: _buildTabItem('Schedule', 1, activeTab == 1, colors)),
            Expanded(child: _buildTabItem('Requests', 2, activeTab == 2, colors)),
          ],
        ),
      );
    });
  }

  Widget _buildTabItem(String label, int index, bool active, ThemeColors colors) {
    return GestureDetector(
      onTap: () => onTabChanged(index),
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? colors.indigo : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.s),
          boxShadow: active && !colors.isDark
              ? [
                  BoxShadow(
                    color: colors.indigo.withValues(alpha: 0.3),
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
            color: active ? Colors.white : colors.textSecondary.withValues(alpha: 0.8),
          ),
        ),
      ),
    );
  }
}
