import 'package:freezed_annotation/freezed_annotation.dart';

part 'nfc_tag.freezed.dart';
part 'nfc_tag.g.dart';

@freezed
class NfcTag with _$NfcTag {
  const factory NfcTag({
    required String id,
    required String tagName,
    required String tagId,
    @Default('attendance') String tagType, // 'attendance', 'equipment', 'location', 'mixed'
    String? entityId,
    String? entityType, // 'attendance', 'equipment', 'room', 'vehicle', 'location', 'mixed'
    required double latitude,
    required double longitude,
    @Default(50.0) double radius,
    @Default(true) bool active,
    String? deletedAt,
    String? campusId,
    String? campusName,
    String? locationGroup,
    double? accuracy,
    @JsonKey(name: 'wifi_ssids') String? wifiSsids,
    required String createdAt,
  }) = _NfcTag;

  factory NfcTag.fromJson(Map<String, dynamic> json) => _$NfcTagFromJson(json);
}
