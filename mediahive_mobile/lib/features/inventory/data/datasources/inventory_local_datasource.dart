import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/models/inventory_item.dart';

abstract class InventoryLocalDataSource {
  Future<List<InventoryItem>> getInventory();
  Future<void> cacheInventory(List<InventoryItem> items);
  Future<void> addItem(InventoryItem item);
  Future<void> updateItem(InventoryItem item);
  Future<void> deleteItem(String id);
  Future<void> clearCache();
}

class HiveInventoryLocalDataSource implements InventoryLocalDataSource {
  static const String _boxName = 'inventory_cache';

  Future<Box> _openBox() async {
    return await Hive.openBox(_boxName);
  }

  @override
  Future<List<InventoryItem>> getInventory() async {
    final box = await _openBox();
    final List<dynamic> rawItems = box.values.toList();
    final items = <InventoryItem>[];
    
    for (var raw in rawItems) {
      try {
        final Map<String, dynamic> json = _castMap(raw as Map);
        items.add(InventoryItem.fromJson(json));
      } catch (e) {
        print('[HIVE_LOCAL] Error parsing cached item: $e');
      }
    }
    return items;
  }

  Map<String, dynamic> _castMap(Map map) {
    return map.map((key, value) {
      if (value is Map) {
        return MapEntry(key.toString(), _castMap(value));
      }
      return MapEntry(key.toString(), value);
    });
  }

  @override
  Future<void> cacheInventory(List<InventoryItem> items) async {
    final box = await _openBox();
    await box.clear();
    final Map<String, dynamic> itemsMap = {
      for (var item in items) item.id: item.toJson()
    };
    await box.putAll(itemsMap);
  }

  @override
  Future<void> addItem(InventoryItem item) async {
    final box = await _openBox();
    await box.put(item.id, item.toJson());
  }

  @override
  Future<void> updateItem(InventoryItem item) async {
    final box = await _openBox();
    await box.put(item.id, item.toJson());
  }

  @override
  Future<void> deleteItem(String id) async {
    final box = await _openBox();
    await box.delete(id);
  }

  @override
  Future<void> clearCache() async {
    final box = await _openBox();
    await box.clear();
  }
}
