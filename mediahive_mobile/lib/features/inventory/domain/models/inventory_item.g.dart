// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inventory_item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$InventoryItemImpl _$$InventoryItemImplFromJson(Map<String, dynamic> json) =>
    _$InventoryItemImpl(
      id: json['id'] as String,
      assetId: json['asset_id'] as String? ?? '',
      name: json['item_name'] as String,
      category: json['category'] as String,
      condition: json['condition'] as String,
      quantity: (json['quantity'] as num).toInt(),
      availableQuantity: (json['available_quantity'] as num?)?.toInt() ?? 0,
      status: json['status'] as String,
      imageUrl: json['image_url'] as String?,
      location: json['location'] as String?,
      description: json['description'] as String?,
      purchaseAmount: (json['purchase_amount'] as num?)?.toDouble(),
      purchaseDate: json['purchase_date'] as String?,
      serialNumber: json['serial_number'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>? ?? const {},
      institutionId: json['institution_id'] as String?,
      tenantId: json['tenant_id'] as String?,
      maintenanceDueDate: json['maintenance_due_date'] as String?,
      minStockLevel: (json['min_stock_level'] as num?)?.toInt() ?? 1,
    );

Map<String, dynamic> _$$InventoryItemImplToJson(_$InventoryItemImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'asset_id': instance.assetId,
      'item_name': instance.name,
      'category': instance.category,
      'condition': instance.condition,
      'quantity': instance.quantity,
      'available_quantity': instance.availableQuantity,
      'status': instance.status,
      'image_url': instance.imageUrl,
      'location': instance.location,
      'description': instance.description,
      'purchase_amount': instance.purchaseAmount,
      'purchase_date': instance.purchaseDate,
      'serial_number': instance.serialNumber,
      'metadata': instance.metadata,
      'institution_id': instance.institutionId,
      'tenant_id': instance.tenantId,
      'maintenance_due_date': instance.maintenanceDueDate,
      'min_stock_level': instance.minStockLevel,
    };
