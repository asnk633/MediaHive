// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'inventory_item.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

InventoryItem _$InventoryItemFromJson(Map<String, dynamic> json) {
  return _InventoryItem.fromJson(json);
}

/// @nodoc
mixin _$InventoryItem {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'asset_id')
  String get assetId => throw _privateConstructorUsedError;
  @JsonKey(name: 'item_name')
  String get name => throw _privateConstructorUsedError;
  String get category => throw _privateConstructorUsedError;
  String get condition =>
      throw _privateConstructorUsedError; // Good, Need Repair, Damaged
  int get quantity => throw _privateConstructorUsedError;
  @JsonKey(name: 'available_quantity')
  int get availableQuantity => throw _privateConstructorUsedError;
  String get status =>
      throw _privateConstructorUsedError; // Available, In Use, Under Repair, Disposed
  @JsonKey(name: 'image_url')
  String? get imageUrl => throw _privateConstructorUsedError;
  String? get location => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'purchase_amount')
  double? get purchaseAmount => throw _privateConstructorUsedError;
  @JsonKey(name: 'purchase_date')
  String? get purchaseDate => throw _privateConstructorUsedError;
  @JsonKey(name: 'serial_number')
  String? get serialNumber => throw _privateConstructorUsedError;
  Map<String, dynamic> get metadata => throw _privateConstructorUsedError;
  @JsonKey(name: 'institution_id')
  String? get institutionId => throw _privateConstructorUsedError;
  @JsonKey(name: 'tenant_id')
  String? get tenantId => throw _privateConstructorUsedError;
  @JsonKey(name: 'maintenance_due_date')
  String? get maintenanceDueDate => throw _privateConstructorUsedError;
  @JsonKey(name: 'min_stock_level')
  int get minStockLevel => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $InventoryItemCopyWith<InventoryItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InventoryItemCopyWith<$Res> {
  factory $InventoryItemCopyWith(
          InventoryItem value, $Res Function(InventoryItem) then) =
      _$InventoryItemCopyWithImpl<$Res, InventoryItem>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'asset_id') String assetId,
      @JsonKey(name: 'item_name') String name,
      String category,
      String condition,
      int quantity,
      @JsonKey(name: 'available_quantity') int availableQuantity,
      String status,
      @JsonKey(name: 'image_url') String? imageUrl,
      String? location,
      String? description,
      @JsonKey(name: 'purchase_amount') double? purchaseAmount,
      @JsonKey(name: 'purchase_date') String? purchaseDate,
      @JsonKey(name: 'serial_number') String? serialNumber,
      Map<String, dynamic> metadata,
      @JsonKey(name: 'institution_id') String? institutionId,
      @JsonKey(name: 'tenant_id') String? tenantId,
      @JsonKey(name: 'maintenance_due_date') String? maintenanceDueDate,
      @JsonKey(name: 'min_stock_level') int minStockLevel});
}

/// @nodoc
class _$InventoryItemCopyWithImpl<$Res, $Val extends InventoryItem>
    implements $InventoryItemCopyWith<$Res> {
  _$InventoryItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? assetId = null,
    Object? name = null,
    Object? category = null,
    Object? condition = null,
    Object? quantity = null,
    Object? availableQuantity = null,
    Object? status = null,
    Object? imageUrl = freezed,
    Object? location = freezed,
    Object? description = freezed,
    Object? purchaseAmount = freezed,
    Object? purchaseDate = freezed,
    Object? serialNumber = freezed,
    Object? metadata = null,
    Object? institutionId = freezed,
    Object? tenantId = freezed,
    Object? maintenanceDueDate = freezed,
    Object? minStockLevel = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      assetId: null == assetId
          ? _value.assetId
          : assetId // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      condition: null == condition
          ? _value.condition
          : condition // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      availableQuantity: null == availableQuantity
          ? _value.availableQuantity
          : availableQuantity // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      imageUrl: freezed == imageUrl
          ? _value.imageUrl
          : imageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      purchaseAmount: freezed == purchaseAmount
          ? _value.purchaseAmount
          : purchaseAmount // ignore: cast_nullable_to_non_nullable
              as double?,
      purchaseDate: freezed == purchaseDate
          ? _value.purchaseDate
          : purchaseDate // ignore: cast_nullable_to_non_nullable
              as String?,
      serialNumber: freezed == serialNumber
          ? _value.serialNumber
          : serialNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: null == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      institutionId: freezed == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String?,
      tenantId: freezed == tenantId
          ? _value.tenantId
          : tenantId // ignore: cast_nullable_to_non_nullable
              as String?,
      maintenanceDueDate: freezed == maintenanceDueDate
          ? _value.maintenanceDueDate
          : maintenanceDueDate // ignore: cast_nullable_to_non_nullable
              as String?,
      minStockLevel: null == minStockLevel
          ? _value.minStockLevel
          : minStockLevel // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InventoryItemImplCopyWith<$Res>
    implements $InventoryItemCopyWith<$Res> {
  factory _$$InventoryItemImplCopyWith(
          _$InventoryItemImpl value, $Res Function(_$InventoryItemImpl) then) =
      __$$InventoryItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'asset_id') String assetId,
      @JsonKey(name: 'item_name') String name,
      String category,
      String condition,
      int quantity,
      @JsonKey(name: 'available_quantity') int availableQuantity,
      String status,
      @JsonKey(name: 'image_url') String? imageUrl,
      String? location,
      String? description,
      @JsonKey(name: 'purchase_amount') double? purchaseAmount,
      @JsonKey(name: 'purchase_date') String? purchaseDate,
      @JsonKey(name: 'serial_number') String? serialNumber,
      Map<String, dynamic> metadata,
      @JsonKey(name: 'institution_id') String? institutionId,
      @JsonKey(name: 'tenant_id') String? tenantId,
      @JsonKey(name: 'maintenance_due_date') String? maintenanceDueDate,
      @JsonKey(name: 'min_stock_level') int minStockLevel});
}

/// @nodoc
class __$$InventoryItemImplCopyWithImpl<$Res>
    extends _$InventoryItemCopyWithImpl<$Res, _$InventoryItemImpl>
    implements _$$InventoryItemImplCopyWith<$Res> {
  __$$InventoryItemImplCopyWithImpl(
      _$InventoryItemImpl _value, $Res Function(_$InventoryItemImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? assetId = null,
    Object? name = null,
    Object? category = null,
    Object? condition = null,
    Object? quantity = null,
    Object? availableQuantity = null,
    Object? status = null,
    Object? imageUrl = freezed,
    Object? location = freezed,
    Object? description = freezed,
    Object? purchaseAmount = freezed,
    Object? purchaseDate = freezed,
    Object? serialNumber = freezed,
    Object? metadata = null,
    Object? institutionId = freezed,
    Object? tenantId = freezed,
    Object? maintenanceDueDate = freezed,
    Object? minStockLevel = null,
  }) {
    return _then(_$InventoryItemImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      assetId: null == assetId
          ? _value.assetId
          : assetId // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      condition: null == condition
          ? _value.condition
          : condition // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _value.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as int,
      availableQuantity: null == availableQuantity
          ? _value.availableQuantity
          : availableQuantity // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      imageUrl: freezed == imageUrl
          ? _value.imageUrl
          : imageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      purchaseAmount: freezed == purchaseAmount
          ? _value.purchaseAmount
          : purchaseAmount // ignore: cast_nullable_to_non_nullable
              as double?,
      purchaseDate: freezed == purchaseDate
          ? _value.purchaseDate
          : purchaseDate // ignore: cast_nullable_to_non_nullable
              as String?,
      serialNumber: freezed == serialNumber
          ? _value.serialNumber
          : serialNumber // ignore: cast_nullable_to_non_nullable
              as String?,
      metadata: null == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      institutionId: freezed == institutionId
          ? _value.institutionId
          : institutionId // ignore: cast_nullable_to_non_nullable
              as String?,
      tenantId: freezed == tenantId
          ? _value.tenantId
          : tenantId // ignore: cast_nullable_to_non_nullable
              as String?,
      maintenanceDueDate: freezed == maintenanceDueDate
          ? _value.maintenanceDueDate
          : maintenanceDueDate // ignore: cast_nullable_to_non_nullable
              as String?,
      minStockLevel: null == minStockLevel
          ? _value.minStockLevel
          : minStockLevel // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InventoryItemImpl implements _InventoryItem {
  const _$InventoryItemImpl(
      {required this.id,
      @JsonKey(name: 'asset_id') this.assetId = '',
      @JsonKey(name: 'item_name') required this.name,
      required this.category,
      required this.condition,
      required this.quantity,
      @JsonKey(name: 'available_quantity') this.availableQuantity = 0,
      required this.status,
      @JsonKey(name: 'image_url') this.imageUrl,
      this.location,
      this.description,
      @JsonKey(name: 'purchase_amount') this.purchaseAmount,
      @JsonKey(name: 'purchase_date') this.purchaseDate,
      @JsonKey(name: 'serial_number') this.serialNumber,
      final Map<String, dynamic> metadata = const {},
      @JsonKey(name: 'institution_id') this.institutionId,
      @JsonKey(name: 'tenant_id') this.tenantId,
      @JsonKey(name: 'maintenance_due_date') this.maintenanceDueDate,
      @JsonKey(name: 'min_stock_level') this.minStockLevel = 1})
      : _metadata = metadata;

  factory _$InventoryItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$InventoryItemImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'asset_id')
  final String assetId;
  @override
  @JsonKey(name: 'item_name')
  final String name;
  @override
  final String category;
  @override
  final String condition;
// Good, Need Repair, Damaged
  @override
  final int quantity;
  @override
  @JsonKey(name: 'available_quantity')
  final int availableQuantity;
  @override
  final String status;
// Available, In Use, Under Repair, Disposed
  @override
  @JsonKey(name: 'image_url')
  final String? imageUrl;
  @override
  final String? location;
  @override
  final String? description;
  @override
  @JsonKey(name: 'purchase_amount')
  final double? purchaseAmount;
  @override
  @JsonKey(name: 'purchase_date')
  final String? purchaseDate;
  @override
  @JsonKey(name: 'serial_number')
  final String? serialNumber;
  final Map<String, dynamic> _metadata;
  @override
  @JsonKey()
  Map<String, dynamic> get metadata {
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_metadata);
  }

  @override
  @JsonKey(name: 'institution_id')
  final String? institutionId;
  @override
  @JsonKey(name: 'tenant_id')
  final String? tenantId;
  @override
  @JsonKey(name: 'maintenance_due_date')
  final String? maintenanceDueDate;
  @override
  @JsonKey(name: 'min_stock_level')
  final int minStockLevel;

  @override
  String toString() {
    return 'InventoryItem(id: $id, assetId: $assetId, name: $name, category: $category, condition: $condition, quantity: $quantity, availableQuantity: $availableQuantity, status: $status, imageUrl: $imageUrl, location: $location, description: $description, purchaseAmount: $purchaseAmount, purchaseDate: $purchaseDate, serialNumber: $serialNumber, metadata: $metadata, institutionId: $institutionId, tenantId: $tenantId, maintenanceDueDate: $maintenanceDueDate, minStockLevel: $minStockLevel)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InventoryItemImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.assetId, assetId) || other.assetId == assetId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.condition, condition) ||
                other.condition == condition) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.availableQuantity, availableQuantity) ||
                other.availableQuantity == availableQuantity) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.imageUrl, imageUrl) ||
                other.imageUrl == imageUrl) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.purchaseAmount, purchaseAmount) ||
                other.purchaseAmount == purchaseAmount) &&
            (identical(other.purchaseDate, purchaseDate) ||
                other.purchaseDate == purchaseDate) &&
            (identical(other.serialNumber, serialNumber) ||
                other.serialNumber == serialNumber) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
            (identical(other.institutionId, institutionId) ||
                other.institutionId == institutionId) &&
            (identical(other.tenantId, tenantId) ||
                other.tenantId == tenantId) &&
            (identical(other.maintenanceDueDate, maintenanceDueDate) ||
                other.maintenanceDueDate == maintenanceDueDate) &&
            (identical(other.minStockLevel, minStockLevel) ||
                other.minStockLevel == minStockLevel));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        assetId,
        name,
        category,
        condition,
        quantity,
        availableQuantity,
        status,
        imageUrl,
        location,
        description,
        purchaseAmount,
        purchaseDate,
        serialNumber,
        const DeepCollectionEquality().hash(_metadata),
        institutionId,
        tenantId,
        maintenanceDueDate,
        minStockLevel
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$InventoryItemImplCopyWith<_$InventoryItemImpl> get copyWith =>
      __$$InventoryItemImplCopyWithImpl<_$InventoryItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InventoryItemImplToJson(
      this,
    );
  }
}

abstract class _InventoryItem implements InventoryItem {
  const factory _InventoryItem(
      {required final String id,
      @JsonKey(name: 'asset_id') final String assetId,
      @JsonKey(name: 'item_name') required final String name,
      required final String category,
      required final String condition,
      required final int quantity,
      @JsonKey(name: 'available_quantity') final int availableQuantity,
      required final String status,
      @JsonKey(name: 'image_url') final String? imageUrl,
      final String? location,
      final String? description,
      @JsonKey(name: 'purchase_amount') final double? purchaseAmount,
      @JsonKey(name: 'purchase_date') final String? purchaseDate,
      @JsonKey(name: 'serial_number') final String? serialNumber,
      final Map<String, dynamic> metadata,
      @JsonKey(name: 'institution_id') final String? institutionId,
      @JsonKey(name: 'tenant_id') final String? tenantId,
      @JsonKey(name: 'maintenance_due_date') final String? maintenanceDueDate,
      @JsonKey(name: 'min_stock_level')
      final int minStockLevel}) = _$InventoryItemImpl;

  factory _InventoryItem.fromJson(Map<String, dynamic> json) =
      _$InventoryItemImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'asset_id')
  String get assetId;
  @override
  @JsonKey(name: 'item_name')
  String get name;
  @override
  String get category;
  @override
  String get condition;
  @override // Good, Need Repair, Damaged
  int get quantity;
  @override
  @JsonKey(name: 'available_quantity')
  int get availableQuantity;
  @override
  String get status;
  @override // Available, In Use, Under Repair, Disposed
  @JsonKey(name: 'image_url')
  String? get imageUrl;
  @override
  String? get location;
  @override
  String? get description;
  @override
  @JsonKey(name: 'purchase_amount')
  double? get purchaseAmount;
  @override
  @JsonKey(name: 'purchase_date')
  String? get purchaseDate;
  @override
  @JsonKey(name: 'serial_number')
  String? get serialNumber;
  @override
  Map<String, dynamic> get metadata;
  @override
  @JsonKey(name: 'institution_id')
  String? get institutionId;
  @override
  @JsonKey(name: 'tenant_id')
  String? get tenantId;
  @override
  @JsonKey(name: 'maintenance_due_date')
  String? get maintenanceDueDate;
  @override
  @JsonKey(name: 'min_stock_level')
  int get minStockLevel;
  @override
  @JsonKey(ignore: true)
  _$$InventoryItemImplCopyWith<_$InventoryItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
