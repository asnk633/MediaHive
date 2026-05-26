import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme_provider.dart';
import '../../core/design_tokens.dart';

class MhSkeleton extends ConsumerStatefulWidget {
  final double? width;
  final double? height;
  final double borderRadius;

  const MhSkeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = 8,
  });

  @override
  ConsumerState<MhSkeleton> createState() => _MhSkeletonState();
}

class _MhSkeletonState extends ConsumerState<MhSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;

    // Light: shimmer between very-light-grey tones so it's visible on sky canvas
    // Dark: shimmer between near-black surface tones (original behaviour)
    final Color shimmerBase = isLight
        ? const Color(0xFFE8ECF5)   // light grey-blue
        : const Color(0xFF272729);
    final Color shimmerHighlight = isLight
        ? const Color(0xFFF5F7FF)   // lighter reflection
        : const Color(0xFF3A3A3C);

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              stops: [
                (0.1 + _animation.value * 0.1).clamp(0.0, 1.0),
                (0.3 + _animation.value * 0.1).clamp(0.0, 1.0),
                (0.5 + _animation.value * 0.1).clamp(0.0, 1.0),
              ],
              colors: [
                shimmerBase,
                shimmerHighlight,
                shimmerBase,
              ],
            ),
          ),
        );
      },
    );
  }
}
