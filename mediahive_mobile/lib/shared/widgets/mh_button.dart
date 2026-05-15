import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

enum MhButtonType { primary, secondary, outline, ghost }

class MhButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final MhButtonType type;
  final bool isLoading;
  final bool isDisabled;
  final IconData? icon;
  final double? width;
  final double height;

  const MhButton({
    super.key,
    required this.label,
    this.onTap,
    this.type = MhButtonType.primary,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.width,
    this.height = 56.0, // Standard production height
  });

  @override
  Widget build(BuildContext context) {
    final bool effectiveDisabled = isDisabled || isLoading || onTap == null;
    
    return MouseRegion(
      cursor: effectiveDisabled ? SystemMouseCursors.basic : SystemMouseCursors.click,
      child: GestureDetector(
        onTap: effectiveDisabled ? null : onTap,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 150),
          opacity: effectiveDisabled ? 0.6 : 1.0,
          child: Container(
            width: width,
            height: height,
            constraints: const BoxConstraints(minWidth: 48, minHeight: 32),
            padding: EdgeInsets.symmetric(
              horizontal: (width != null && width! < 60) || height < 48 
                  ? AppSpacing.s 
                  : AppSpacing.m,
            ),
            decoration: _getDecoration(effectiveDisabled),
            child: Center(
              child: isLoading
                  ? _buildLoader()
                  : _buildContent(),
            ),
          ),
        ),
      ),
    );
  }

  BoxDecoration _getDecoration(bool disabled) {
    switch (type) {
      case MhButtonType.primary:
        return BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(AppRadius.m),
          boxShadow: [
            BoxShadow(
              color: AppColors.honey.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        );
      case MhButtonType.secondary:
        return BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border),
        );
      case MhButtonType.outline:
        return BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.honey, width: 1.5),
        );
      case MhButtonType.ghost:
        return const BoxDecoration();
    }
  }

  Widget _buildContent() {
    final hasIcon = icon != null;
    final hasLabel = label.isNotEmpty;

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (hasIcon)
          Icon(icon, size: 18, color: _getTextColor()),
        if (hasIcon && hasLabel)
          const SizedBox(width: AppSpacing.xs),
        if (hasLabel)
          Flexible(
            child: Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: _getTextColor(),
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
      ],
    );
  }

  Widget _buildLoader() {
    return SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(_getTextColor()),
      ),
    );
  }

  Color _getTextColor() {
    switch (type) {
      case MhButtonType.primary:
        return Colors.black;
      case MhButtonType.secondary:
      case MhButtonType.ghost:
        return AppColors.textPrimary;
      case MhButtonType.outline:
        return AppColors.honey;
    }
  }
}
