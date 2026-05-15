// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inventory_item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$InventoryItemImpl _$$InventoryItemImplFromJson(Map<String, dynamic> json) =>
    _$InventoryItemImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      condition: json['condition'] as String,
      quantity: (json['quantity'] as num).toInt(),
      status: json['status'] as String,
      imageUrl: json['imageUrl'] as String?,
      description: json['description'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>? ?? const {},
    );

Map<String, dynamic> _$$InventoryItemImplToJson(_$InventoryItemImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'category': instance.category,
      'condition': instance.condition,
      'quantity': instance.quantity,
      'status': instance.status,
      'imageUrl': instance.imageUrl,
      'description': instance.description,
      'metadata': instance.metadata,
    };
