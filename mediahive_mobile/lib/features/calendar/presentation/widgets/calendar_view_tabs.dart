import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';

class CalendarViewTabs extends ConsumerWidget {
  final String currentView;
  final ValueChanged<String> onViewChanged;

  const CalendarViewTabs({
    super.key,
    required this.currentView,
    required this.onViewChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    const views = [
      {'label': 'MONTH', 'icon': LucideIcons.calendar},
      {'label': 'WEEK', 'icon': LucideIcons.calendarDays},
      {'label': 'TIMELINE', 'icon': LucideIcons.gitBranch},
      {'label': 'LIST', 'icon': LucideIcons.list},
    ];

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: views.map((view) {
          final label = view['label'] as String;
          final isSelected = label == currentView;
          return Expanded(
            child: GestureDetector(
              onTap: () => onViewChanged(label),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? colors.indigo : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: colors.indigo.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      view['icon'] as IconData,
                      size: 14,
                      color: isSelected ? Colors.white : colors.textSecondary.withValues(alpha: 0.4),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: isSelected ? Colors.white : colors.textSecondary.withValues(alpha: 0.4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
