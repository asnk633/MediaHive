import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';

class MhHoneyLoader extends StatelessWidget {
  final double width;
  final double height;
  final Color? color;

  const MhHoneyLoader({
    super.key,
    this.width = 120,
    this.height = 22,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final loaderColor = color ?? AppColors.honey;
    
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(height),
        border: Border.all(color: loaderColor, width: 2),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(height),
        child: Stack(
          children: [
            Positioned.fill(
              child: Container(
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: loaderColor,
                  borderRadius: BorderRadius.circular(height),
                ),
              )
              .animate(onPlay: (controller) => controller.repeat())
              .custom(
                duration: 2.seconds,
                builder: (context, value, child) {
                  return FractionallySizedBox(
                    widthFactor: value,
                    heightFactor: 1.0,
                    alignment: Alignment.centerLeft,
                    child: child,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
