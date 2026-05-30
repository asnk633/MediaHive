import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:custom_refresh_indicator/custom_refresh_indicator.dart';

class MhRefreshIndicator extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final double edgeOffset;

  const MhRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
    this.edgeOffset = 0,
  });

  @override
  Widget build(BuildContext context) {
    return CustomRefreshIndicator(
      onRefresh: onRefresh,
      offsetToArmed: 80,
      trigger: IndicatorTrigger.leadingEdge,
      builder: (
        BuildContext context,
        Widget child,
        IndicatorController controller,
      ) {
        return Stack(
          children: <Widget>[
            child,
            AnimatedBuilder(
              animation: controller,
              builder: (BuildContext context, Widget? _) {
                if (controller.isIdle) return const SizedBox.shrink();
                
                final double dy = (controller.value * 100).clamp(0.0, 100.0);
                
                return Positioned(
                  top: edgeOffset + dy - 120, // Adjusted for larger size
                  left: 0,
                  right: 0,
                  child: Opacity(
                    opacity: controller.value.clamp(0.0, 1.0),
                    child: Center(
                      child: SizedBox(
                        width: 150,
                        height: 150,
                        child: Lottie.asset(
                          'assets/animations/honey_bee.json',
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
      child: child,
    );
  }
}
