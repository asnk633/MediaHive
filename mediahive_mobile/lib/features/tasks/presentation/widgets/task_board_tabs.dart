import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme_provider.dart';
import '../providers/tasks_provider.dart';

class TaskBoardTabs extends ConsumerWidget {
  final int activeTab;

  const TaskBoardTabs({super.key, required this.activeTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          _buildTab(ref, 'TODAY', 0, activeTab == 0, colors),
          _buildTab(ref, 'ALL', 1, activeTab == 1, colors),
          _buildTab(ref, 'REQUESTS', 2, activeTab == 2, colors),
        ],
      ),
    );
  }

  Widget _buildTab(WidgetRef ref, String title, int index, bool isActive, ThemeColors colors) {
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(tasksTabProvider.notifier).state = index,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? colors.honey : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isActive ? [
              BoxShadow(
                color: colors.honey.withValues(alpha: 0.3),
                blurRadius: 10,
                offset: const Offset(0, 2),
              )
            ] : null,
          ),
          child: Center(
            child: Text(
              title,
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w900,
                fontSize: 10,
                letterSpacing: 1.0,
                color: isActive ? Colors.black : colors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
