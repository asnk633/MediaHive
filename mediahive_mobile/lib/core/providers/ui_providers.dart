import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider to control the visibility of the global loading overlay.
final globalLoadingProvider = StateProvider<bool>((ref) => false);

/// Provider to set the message displayed on the global loading overlay.
final loadingMessageProvider = StateProvider<String>((ref) => "Updating MediaHive...");
