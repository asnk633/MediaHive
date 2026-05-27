import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

class LabsNotifier extends StateNotifier<Map<String, bool>> {
  LabsNotifier() : super({'testDemoData': false}) {
    _loadFromHive();
  }

  static const _boxName = 'app_settings';
  static const _keyPrefix = 'labs_';

  Future<void> _loadFromHive() async {
    try {
      final box = await Hive.openBox(_boxName);
      final testDemoData = box.get('${_keyPrefix}testDemoData', defaultValue: false) as bool;
      state = {
        'testDemoData': testDemoData,
      };
    } catch (_) {
      // Fallback if hive is not initialized/accessible
      state = {'testDemoData': false};
    }
  }

  Future<void> toggleFeature(String featureKey) async {
    final box = await Hive.openBox(_boxName);
    final currentValue = state[featureKey] ?? false;
    final newValue = !currentValue;
    
    final newState = Map<String, bool>.from(state);
    newState[featureKey] = newValue;
    state = newState;
    
    await box.put('${_keyPrefix}$featureKey', newValue);
  }
}

final labsProvider = StateNotifierProvider<LabsNotifier, Map<String, bool>>((ref) {
  return LabsNotifier();
});
