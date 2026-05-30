// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inventory_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$InventoryRequestImpl _$$InventoryRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$InventoryRequestImpl(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      userId: json['user_id'] as String,
      institutionId: json['institution_id'] as String,
      itemName: json['item_name'] as String,
      quantity: (json['quantity'] as num).toInt(),
      status: json['status'] as String,
      notes: json['notes'] as String?,
      rejectReason: json['reject_reason'] as String?,
      issueId: json['issue_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] == null
          ? null
          : DateTime.parse(json['updated_at'] as String),
      requesterName: json['requester_name'] as String?,
    );

Map<String, dynamic> _$$InventoryRequestImplToJson(
        _$InventoryRequestImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'tenant_id': instance.tenantId,
      'user_id': instance.userId,
      'institution_id': instance.institutionId,
      'item_name': instance.itemName,
      'quantity': instance.quantity,
      'status': instance.status,
      'notes': instance.notes,
      'reject_reason': instance.rejectReason,
      'issue_id': instance.issueId,
      'created_at': instance.createdAt.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
      'requester_name': instance.requesterName,
    };
