import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/theme_provider.dart';

class MhInput extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool isPassword;
  final TextInputType keyboardType;
  final IconData? prefixIcon;
  final String? errorText;
  final ValueChanged<String>? onChanged;

  const MhInput({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.isPassword = false,
    this.keyboardType = TextInputType.text,
    this.prefixIcon,
    this.errorText,
    this.onChanged,
  });

  @override
  State<MhInput> createState() => _MhInputState();
}

class _MhInputState extends State<MhInput> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        final colors = ref.watch(themeColorsProvider);
        final bgFillColor = _isFocused
            ? (colors.isDark ? colors.surface : Colors.white)
            : (colors.isDark ? colors.surface.withValues(alpha: 0.5) : Colors.white.withValues(alpha: 0.8));

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Text(
                widget.label.toUpperCase(),
                style: AppTypography.caption.copyWith(
                  color: widget.errorText != null ? colors.error : colors.textSecondary,
                  fontWeight: FontWeight.w900,
                  fontSize: 9,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Focus(
              onFocusChange: (hasFocus) => setState(() => _isFocused = hasFocus),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: bgFillColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: widget.errorText != null 
                        ? colors.error 
                        : (_isFocused ? colors.honey : colors.border),
                    width: _isFocused ? 1.5 : 1.0,
                  ),
                  boxShadow: _isFocused ? [
                    BoxShadow(
                      color: colors.honey.withValues(alpha: 0.1),
                      blurRadius: 10,
                      spreadRadius: 1,
                    )
                  ] : null,
                ),
                child: TextField(
                  controller: widget.controller,
                  obscureText: widget.isPassword,
                  keyboardType: widget.keyboardType,
                  onChanged: widget.onChanged,
                  spellCheckConfiguration: widget.isPassword ? null : const SpellCheckConfiguration(),
                  style: AppTypography.bodyM.copyWith(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: AppTypography.bodyM.copyWith(color: colors.textSecondary.withValues(alpha: 0.5)),
                    prefixIcon: widget.prefixIcon != null 
                      ? Icon(widget.prefixIcon, size: 18, color: _isFocused ? colors.honey : colors.textSecondary) 
                      : null,
                    border: InputBorder.none, filled: false,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
              ),
            ),
            if (widget.errorText != null) ...[
              const SizedBox(height: AppSpacing.xxs),
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Text(
                  widget.errorText!,
                  style: AppTypography.caption.copyWith(color: colors.error, fontSize: 10),
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}
