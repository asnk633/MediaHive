import 'package:flutter_riverpod/flutter_riverpod.dart';

class HeaderHeightNotifier extends AutoDisposeNotifier<double> {
  @override
  double build() => 0.0;

  void updateHeight(double height) {
    if (state != height) {
      state = height;
    }
  }
}

final headerHeightProvider = NotifierProvider.autoDispose<HeaderHeightNotifier, double>(
  HeaderHeightNotifier.new,
);
