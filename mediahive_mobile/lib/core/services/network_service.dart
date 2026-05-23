import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../testing/chaos_controller.dart';

enum NetworkStatus { online, offline }

class NetworkService {
  final Connectivity _connectivity = Connectivity();
  final _controller = StreamController<NetworkStatus>.broadcast();

  NetworkService() {
    _connectivity.onConnectivityChanged.listen(_updateStatus);
  }

  void _updateStatus(ConnectivityResult result) {
    _controller.add(result == ConnectivityResult.none ? NetworkStatus.offline : NetworkStatus.online);
  }

  Future<bool> get isConnected async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }

  Stream<NetworkStatus> get statusStream async* {
    // Yield current status first
    final result = await _connectivity.checkConnectivity();
    yield result == ConnectivityResult.none ? NetworkStatus.offline : NetworkStatus.online;
    // Then yield from controller
    yield* _controller.stream;
  }

  void dispose() {
    _controller.close();
  }
}

final networkServiceProvider = Provider<NetworkService>((ref) {
  final service = NetworkService();
  ref.onDispose(() => service.dispose());
  return service;
});

final networkStatusProvider = StreamProvider<NetworkStatus>((ref) {
  final service = ref.watch(networkServiceProvider);
  final chaos = ref.watch(chaosProvider);
  
  if (chaos.isForcedOffline) {
    return Stream.value(NetworkStatus.offline);
  }
  
  return service.statusStream;
});
