import 'package:freezed_annotation/freezed_annotation.dart';

part 'inventory_request.freezed.dart';
part 'inventory_request.g.dart';

@freezed
class InventoryRequest with _$InventoryRequest {
  const factory InventoryRequest({
    required String id,
    @JsonKey(name: 'tenant_id') required String tenantId,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'institution_id') required String institutionId,
    @JsonKey(name: 'item_name') required String itemName,
    required int quantity,
    required String status,
    String? notes,
    @JsonKey(name: 'reject_reason') String? rejectReason,
    @JsonKey(name: 'issue_id') String? issueId,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
    // Joined data
    @JsonKey(name: 'requester_name') String? requesterName,
  }) = _InventoryRequest;

  factory InventoryRequest.fromJson(Map<String, dynamic> json) =>
      _$InventoryRequestFromJson(json);
}
