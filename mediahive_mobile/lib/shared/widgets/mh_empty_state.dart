import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme_provider.dart';
import '../../core/design_tokens.dart';
import 'mh_button.dart';

class MhEmptyState extends ConsumerWidget {
  final String title;
  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const MhEmptyState({
    super.key,
    required this.title,
    required this.message,
    this.icon = LucideIcons.inbox,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                color: isLight
                    ? DesignTokens.lightSurface.withOpacity(0.8)
                    : AppColors.surface.withOpacity(0.5),
                shape: BoxShape.circle,
                border: isLight
                    ? Border.all(color: DesignTokens.lightBorder, width: 0.75)
                    : null,
                boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
              ),
              child: Icon(
                icon,
                size: 48,
                color: isLight
                    ? DesignTokens.lightTextMuted
                    : AppColors.textSecondary.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              title,
              style: AppTypography.h3.copyWith(color: colors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s),
            Text(
              message,
              style: AppTypography.bodyM.copyWith(color: colors.textSecondary),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.xxl),
              MhButton(
                label: actionLabel!,
                onTap: onAction!,
                type: MhButtonType.secondary,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
