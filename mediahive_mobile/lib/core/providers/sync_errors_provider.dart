import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mediahive_mobile/core/models/sync_queue_item.dart';
import 'dart:convert';

class SyncErrorsState {
  final bool isLoading;
  final List<SyncQueueItem> failedItems;
  final bool hasSyncErrors;

  SyncErrorsState({
    required this.isLoading,
    required this.failedItems,
    required this.hasSyncErrors,
  });
}

class SyncErrorsNotifier extends StateNotifier<SyncErrorsState> {
  SyncErrorsNotifier() : super(SyncErrorsState(isLoading: true, failedItems: [], hasSyncErrors: false)) {
    _init();
  }

  void _init() {
    try {
      if (Hive.isBoxOpen('sync_queue')) {
        _listenToBox(Hive.box<String>('sync_queue'));
      } else {
        // Wait for it to open. We could also just try opening it here.
        Hive.openBox<String>('sync_queue').then((box) {
          _listenToBox(box);
        }).catchError((e) {
          // Handle error opening box
          state = SyncErrorsState(isLoading: false, failedItems: [], hasSyncErrors: false);
        });
      }
    } catch (e) {
      state = SyncErrorsState(isLoading: false, failedItems: [], hasSyncErrors: false);
    }
  }

  void _listenToBox(Box<String> box) {
    _updateState(box);
    box.listenable().addListener(() {
      _updateState(box);
    });
  }

  void _updateState(Box<String> box) {
    final List<SyncQueueItem> failed = [];
    for (var value in box.values) {
      try {
        final item = SyncQueueItem.fromJson(jsonDecode(value));
        if (item.status == 'failed') {
          failed.add(item);
        }
      } catch (_) {}
    }
    
    // Sort by timestamp descending (newest first)
    failed.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    
    state = SyncErrorsState(
      isLoading: false,
      failedItems: failed,
      hasSyncErrors: failed.isNotEmpty,
    );
  }
}

final syncErrorsProvider = StateNotifierProvider<SyncErrorsNotifier, SyncErrorsState>((ref) {
  return SyncErrorsNotifier();
});
