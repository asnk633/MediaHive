import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/network_service.dart';

class ChaosController extends StateNotifier<ChaosState> {
  final NetworkService _networkService;

  ChaosController(this._networkService) : super(const ChaosState());

  void toggleForcedOffline(bool value) {
    state = state.copyWith(isForcedOffline: value);
    // In a real app, this would wrap the network service to fake offline status
  }

  void toggleInjectedFailures(bool value) {
    state = state.copyWith(shouldInjectFailures: value);
  }
}

class ChaosState {
  final bool isForcedOffline;
  final bool shouldInjectFailures;

  const ChaosState({
    this.isForcedOffline = false,
    this.shouldInjectFailures = false,
  });

  ChaosState copyWith({
    bool? isForcedOffline,
    bool? shouldInjectFailures,
  }) {
    return ChaosState(
      isForcedOffline: isForcedOffline ?? this.isForcedOffline,
      shouldInjectFailures: shouldInjectFailures ?? this.shouldInjectFailures,
    );
  }
}

final chaosProvider = StateNotifierProvider<ChaosController, ChaosState>((ref) {
  final networkService = ref.watch(networkServiceProvider);
  return ChaosController(networkService);
});
