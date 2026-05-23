import 'package:freezed_annotation/freezed_annotation.dart';

part 'inventory_item.freezed.dart';
part 'inventory_item.g.dart';

@freezed
class InventoryItem with _$InventoryItem {
  const factory InventoryItem({
    required String id,
    @JsonKey(name: 'asset_id') @Default('') String assetId,
    @JsonKey(name: 'item_name') required String name,
    required String category,
    required String condition, // Good, Need Repair, Damaged
    required int quantity,
    @JsonKey(name: 'available_quantity') @Default(0) int availableQuantity,
    required String status, // Available, In Use, Under Repair, Disposed
    @JsonKey(name: 'image_url') String? imageUrl,
    String? location,
    String? description,
    @JsonKey(name: 'purchase_amount') double? purchaseAmount,
    @JsonKey(name: 'purchase_date') String? purchaseDate,
    @JsonKey(name: 'serial_number') String? serialNumber,
    @Default({}) Map<String, dynamic> metadata,
    @JsonKey(name: 'institution_id') String? institutionId,
    @JsonKey(name: 'tenant_id') String? tenantId,
    @JsonKey(name: 'maintenance_due_date') String? maintenanceDueDate,
    @Default(1) @JsonKey(name: 'min_stock_level') int minStockLevel,
  }) = _InventoryItem;

  factory InventoryItem.fromJson(Map<String, dynamic> json) => _$InventoryItemFromJson(json);
}
