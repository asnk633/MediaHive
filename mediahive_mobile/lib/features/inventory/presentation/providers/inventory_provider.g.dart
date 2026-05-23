// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inventory_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$inventoryRepositoryHash() =>
    r'a180a3d565df40cb46adc8dc746f55b31bf2b4bc';

/// See also [inventoryRepository].
@ProviderFor(inventoryRepository)
final inventoryRepositoryProvider =
    AutoDisposeProvider<InventoryRepository>.internal(
  inventoryRepository,
  name: r'inventoryRepositoryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$inventoryRepositoryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef InventoryRepositoryRef = AutoDisposeProviderRef<InventoryRepository>;
String _$bookingListHash() => r'868ea91d69afd1326639eb0f148e5eb5ef6ec2d0';

/// See also [BookingList].
@ProviderFor(BookingList)
final bookingListProvider = AutoDisposeAsyncNotifierProvider<BookingList,
    List<EquipmentBooking>>.internal(
  BookingList.new,
  name: r'bookingListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$bookingListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$BookingList = AutoDisposeAsyncNotifier<List<EquipmentBooking>>;
String _$inventoryRequestListHash() =>
    r'831430fece6347b0f1c463fe0919c556c6fbf096';

/// See also [InventoryRequestList].
@ProviderFor(InventoryRequestList)
final inventoryRequestListProvider = AutoDisposeAsyncNotifierProvider<
    InventoryRequestList, List<InventoryRequest>>.internal(
  InventoryRequestList.new,
  name: r'inventoryRequestListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$inventoryRequestListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$InventoryRequestList
    = AutoDisposeAsyncNotifier<List<InventoryRequest>>;
String _$inventoryListHash() => r'32b7f36928fdee2873e3fd8e98d9ff798d32a271';

/// See also [InventoryList].
@ProviderFor(InventoryList)
final inventoryListProvider = AutoDisposeAsyncNotifierProvider<InventoryList,
    List<InventoryItem>>.internal(
  InventoryList.new,
  name: r'inventoryListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$inventoryListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$InventoryList = AutoDisposeAsyncNotifier<List<InventoryItem>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
