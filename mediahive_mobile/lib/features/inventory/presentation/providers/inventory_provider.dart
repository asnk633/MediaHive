import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../../core/providers/user_provider.dart';
import '../../../../../core/services/sync_service.dart';
import '../../../../../core/services/realtime_service.dart';
import '../../data/datasources/inventory_local_datasource.dart';
import '../../data/repositories/supabase_inventory_repository.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/equipment_booking.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_item.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_request.dart';
import 'package:mediahive_mobile/features/inventory/domain/repositories/inventory_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'inventory_provider.g.dart';

@riverpod
class BookingList extends _$BookingList {
  @override
  Future<List<EquipmentBooking>> build() async {
    final repository = ref.watch(inventoryRepositoryProvider);
    final result = await repository.getBookings();
    return result.fold(
      (failure) => throw failure,
      (bookings) => bookings,
    );
  }
}

@riverpod
class InventoryRequestList extends _$InventoryRequestList {
  @override
  Future<List<InventoryRequest>> build() async {
    final repository = ref.watch(inventoryRepositoryProvider);
    final result = await repository.getRequests();
    return result.fold(
      (failure) => throw failure,
      (requests) => requests,
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    ref.invalidateSelf();
    await future;
  }

  Future<void> updateRequestStatus({
    required String requestId,
    required String status,
    String? rejectReason,
  }) async {
    final repository = ref.read(inventoryRepositoryProvider);
    final result = await repository.updateRequestStatus(
      requestId: requestId,
      status: status,
      rejectReason: rejectReason,
    );
    
    result.fold(
      (failure) => throw failure,
      (_) {
        ref.invalidateSelf();
      },
    );
  }
}

@riverpod
InventoryRepository inventoryRepository(InventoryRepositoryRef ref) {
  // Watch auth state to ensure repository is aware of user changes
  ref.watch(authStateProvider);
  
  final supabaseClient = Supabase.instance.client;
  final localDataSource = HiveInventoryLocalDataSource();
  final syncService = ref.watch(syncServiceProvider);
  
  
  return SupabaseInventoryRepository(
    supabaseClient,
    localDataSource,
    syncService,
  );
}

@riverpod
class InventoryList extends _$InventoryList {
  @override
  Future<List<InventoryItem>> build() async {
    print('[INVENTORY_PROVIDER] Building inventory list...');
    final repository = ref.watch(inventoryRepositoryProvider);
    
    // Listen for realtime updates via centralized service
    ref.listen(tableUpdateProvider('inventory'), (_, __) {
      ref.invalidateSelf();
    });

    final result = await repository.getInventory();
    return result.fold(
      (failure) => throw failure,
      (items) => items,
    );
  }

  Future<void> forceRefresh() async {
    state = const AsyncValue.loading();
    final repository = ref.read(inventoryRepositoryProvider);
    
    // Clear local cache first
    await HiveInventoryLocalDataSource().clearCache();
    
    // Invalidate and wait for new fetch
    ref.invalidateSelf();
    await future;
  }

  Future<void> addItem(InventoryItem item) async {
    final repository = ref.watch(inventoryRepositoryProvider);
    final previousState = state;
    state = AsyncValue.data([...state.value ?? [], item]);
    
    final result = await repository.addInventoryItem(item);
    result.fold(
      (failure) => state = previousState,
      (_) => null,
    );
  }

  Future<void> updateItem(InventoryItem item) async {
    final repository = ref.watch(inventoryRepositoryProvider);
    final previousState = state;
    state = AsyncValue.data(
      (state.value ?? []).map((i) => i.id == item.id ? item : i).toList(),
    );
    
    final result = await repository.updateInventoryItem(item);
    result.fold(
      (failure) => state = previousState,
      (_) => null,
    );
  }

  Future<void> deleteItem(String id) async {
    final repository = ref.watch(inventoryRepositoryProvider);
    final previousState = state;
    state = AsyncValue.data(
      (state.value ?? []).where((i) => i.id != id).toList(),
    );
    
    final result = await repository.deleteInventoryItem(id);
    result.fold(
      (failure) => state = previousState,
      (_) => null,
    );
  }

  Future<void> requestItem({
    required String itemName,
    required int quantity,
    required String notes,
  }) async {
    final repository = ref.read(inventoryRepositoryProvider);
    final result = await repository.requestInventoryItem(
      itemName: itemName,
      quantity: quantity,
      notes: notes,
    );
    
    result.fold(
      (failure) => throw failure,
      (_) => null,
    );
  }

  Future<void> bookItem({
    required String equipmentId,
    required DateTime startTime,
    required DateTime endTime,
    required int unitsRequested,
    String? taskId,
  }) async {
    final repository = ref.read(inventoryRepositoryProvider);
    final result = await repository.bookEquipment(
      equipmentId: equipmentId,
      startTime: startTime,
      endTime: endTime,
      unitsRequested: unitsRequested,
      taskId: taskId,
    );
    
    result.fold(
      (failure) => throw failure,
      (_) => null,
    );
  }
}
