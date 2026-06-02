import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/design_tokens.dart';
import '../../core/theme_provider.dart';

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
    this.height = 56.0,
  });

  @override
  Widget build(BuildContext context) {
    final bool effectiveDisabled = isDisabled || isLoading || onTap == null;

    // Read the theme so decoration can adapt to light/dark mode
    return Consumer(
      builder: (context, ref, _) {
        final colors = ref.watch(themeColorsProvider);
        return MouseRegion(
          cursor: effectiveDisabled ? SystemMouseCursors.basic : SystemMouseCursors.click,
          child: _MhButtonPressable(
            onTap: effectiveDisabled ? null : onTap,
            isDisabled: effectiveDisabled,
            child: Container(
              width: width,
              constraints: BoxConstraints(minWidth: 48, minHeight: height),
              padding: EdgeInsets.symmetric(
                horizontal: (width != null && width! < 60) || height < 48
                    ? AppSpacing.s
                    : AppSpacing.m,
              ),
              decoration: _getDecoration(effectiveDisabled, colors),
              child: Center(
                child: isLoading
                    ? _buildLoader(colors)
                    : _buildContent(colors),
              ),
            ),
          ),
        );
      },
    );
  }

  BoxDecoration _getDecoration(bool disabled, ThemeColors colors) {
    final isLight = !colors.isDark;
    switch (type) {
      case MhButtonType.primary:
        return BoxDecoration(
          // Light: vivid spatial gradient | Dark: flat solid blue
          gradient: isLight
              ? AppColors.lightPrimaryGradient
              : AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(AppRadius.m),
          boxShadow: isLight
              ? DesignTokens.spatialGlowBlue
              : [
                  BoxShadow(
                    color: AppColors.honey.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        );
      case MhButtonType.secondary:
        return BoxDecoration(
          color: isLight ? AppColors.lightSurface : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(
            color: isLight ? AppColors.lightBorder : AppColors.border,
            width: isLight ? 0.75 : 1.0,
          ),
          boxShadow: isLight ? DesignTokens.spatialChipShadow : [],
        );
      case MhButtonType.outline:
        return BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(
            color: isLight ? AppColors.lightHoney : AppColors.honey,
            width: 1.5,
          ),
        );
      case MhButtonType.ghost:
        return const BoxDecoration();
    }
  }

  Widget _buildContent(ThemeColors colors) {
    final hasIcon = icon != null;
    final hasLabel = label.isNotEmpty;

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (hasIcon)
          Icon(icon, size: 18, color: _getTextColor(colors)),
        if (hasIcon && hasLabel)
          const SizedBox(width: AppSpacing.xs),
        if (hasLabel)
          Flexible(
            child: Text(
              label,
              style: AppTypography.bodyM.copyWith(
                color: _getTextColor(colors),
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }

  Widget _buildLoader(ThemeColors colors) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(_getTextColor(colors)),
      ),
    );
  }

  Color _getTextColor(ThemeColors colors) {
    final isLight = !colors.isDark;
    switch (type) {
      case MhButtonType.primary:
        // On light: white text over vivid blue gradient
        return isLight ? Colors.white : Colors.black;
      case MhButtonType.secondary:
      case MhButtonType.ghost:
        return colors.textPrimary;
      case MhButtonType.outline:
        return isLight ? AppColors.lightHoney : AppColors.honey;
    }
  }
}

class _MhButtonPressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final bool isDisabled;

  const _MhButtonPressable({
    required this.child,
    this.onTap,
    required this.isDisabled,
  });

  @override
  State<_MhButtonPressable> createState() => _MhButtonPressableState();
}

class _MhButtonPressableState extends State<_MhButtonPressable> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => widget.isDisabled ? null : _controller.forward(),
      onTapUp: (_) => widget.isDisabled ? null : _controller.reverse(),
      onTapCancel: () => widget.isDisabled ? null : _controller.reverse(),
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 150),
            opacity: widget.isDisabled ? 0.6 : 1.0,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
