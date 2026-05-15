// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inventory_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$inventoryRepositoryHash() =>
    r'27a915e52204416c2ff648bbdd4d15b671f4f757';

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
String _$inventoryListHash() => r'3d48711f112003c05a5e47fd02c980ad02f4f6ad';

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
