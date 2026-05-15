import 'package:freezed_annotation/freezed_annotation.dart';

part 'inventory_item.freezed.dart';
part 'inventory_item.g.dart';

@freezed
class InventoryItem with _$InventoryItem {
  const factory InventoryItem({
    required String id,
    required String name,
    required String category,
    required String condition, // NEW, EXCELLENT, GOOD, FAIR, POOR
    required int quantity,
    required String status, // AVAILABLE, BOOKED, MAINTENANCE
    String? imageUrl,
    String? description,
    @Default({}) Map<String, dynamic> metadata,
  }) = _InventoryItem;

  factory InventoryItem.fromJson(Map<String, dynamic> json) => _$InventoryItemFromJson(json);
}
