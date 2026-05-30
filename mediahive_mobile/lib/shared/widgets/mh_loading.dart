import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

class MhLoading extends StatelessWidget {
  final double size;
  
  const MhLoading({
    super.key,
    this.size = 150,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Lottie.asset(
        'assets/animations/bee_looking.json',
        width: size,
        height: size,
        fit: BoxFit.contain,
      ),
    );
  }
}
