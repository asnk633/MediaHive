import 'package:flutter/material.dart';

/// A custom bouncing scroll physics with professional-grade spring coefficients
/// designed to simulate organic elastic overscroll dynamics.
class ElasticScrollPhysics extends BouncingScrollPhysics {
  const ElasticScrollPhysics({super.parent});

  @override
  ElasticScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return ElasticScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 0.8,
        stiffness: 120,
        damping: 14,
      );
}
