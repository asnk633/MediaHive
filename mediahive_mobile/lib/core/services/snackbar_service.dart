import 'package:flutter/material.dart';
import 'dart:async';

class SnackbarMessage {
  final String text;
  final Duration duration;
  const SnackbarMessage({required this.text, this.duration = const Duration(seconds: 3)});
}

class SnackbarService {
  static final _controller = StreamController<SnackbarMessage>.broadcast();
  
  /// Call this from anywhere (services, VMs, global error handlers)
  static void show({required String text, Duration? duration}) {
    _controller.sink.add(SnackbarMessage(text: text, duration: duration ?? const Duration(seconds: 3)));
  }

  static Stream<SnackbarMessage> get stream => _controller.stream;
  
  /// Call once at app bootstrap to clean up
  static void dispose() => _controller.close();
}

/// 📍 PLACEMENT: Add this to your root widget (e.g., MaterialApp builder or main.dart)
class SnackbarListener extends StatelessWidget {
  final Widget child;
  const SnackbarListener({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<SnackbarMessage>(
      stream: SnackbarService.stream,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          // addPostFrameCallback ensures ScaffoldMessenger is mounted in the next frame
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(snapshot.data!.text),
                duration: snapshot.data!.duration,
                behavior: SnackBarBehavior.floating,
              ),
            );
          });
        }
        return child;
      },
    );
  }
}
