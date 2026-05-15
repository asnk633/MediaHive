import 'package:dartz/dartz.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../../../../../core/error/failure.dart';
import '../../../../../core/models/sync_mutation.dart';
import '../../../../../core/services/sync_service.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_item.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/equipment_booking.dart';
import 'package:mediahive_mobile/features/inventory/domain/repositories/inventory_repository.dart';
import '../datasources/inventory_local_datasource.dart';

class SupabaseInventoryRepository implements InventoryRepository {
  final SupabaseClient _supabaseClient;
  final InventoryLocalDataSource _localDataSource;
  final SyncService _syncService;

  SupabaseInventoryRepository(
    this._supabaseClient,
    this._localDataSource,
    this._syncService,
  );

  @override
  Future<Either<Failure, List<InventoryItem>>> getInventory() async {
    try {
      final user = _supabaseClient.auth.currentUser;
      print('[INVENTORY_REPO] Current user: ${user?.id} (${user?.email})');
      
      final localItems = await _localDataSource.getInventory();
      
      try {
        print('[INVENTORY_REPO] Querying inventory table...');
        final response = await _supabaseClient
            .from('inventory')
            .select('*')
            .eq('deleted', false)
            .order('name');
        
        if (response == null) {
          print('[INVENTORY_REPO] Received null response from Supabase');
          return const Right([]);
        }

        final List<dynamic> data = response as List<dynamic>;
        print('[INVENTORY_REPO] Received ${data.length} raw items from remote');

        if (data.isNotEmpty) {
          print('[INVENTORY_REPO] First item raw sample: ${data.first}');
        }
        
        final remoteItems = data.map((json) {
          try {
            final Map<String, dynamic> itemMap = Map<String, dynamic>.from(json);
            
            // Build metadata from flat columns with explicit typing
            final Map<String, dynamic> metadata = {
              'purchase_price': itemMap['purchase_price'],
              'purchase_date': itemMap['purchase_date'],
              'serial_number': itemMap['serial_number'],
              'brand': itemMap['brand'],
              'model': itemMap['model'],
              'drive_file_id': itemMap['drive_file_id'],
              'unit': itemMap['unit'] ?? 'piece',
            };

            return InventoryItem.fromJson({
              ...itemMap,
              'status': (itemMap['asset_status'] ?? itemMap['status'] ?? 'AVAILABLE').toString().toUpperCase(),
              'condition': (itemMap['condition'] ?? 'GOOD').toString().toUpperCase(),
              'category': (itemMap['category'] ?? 'GENERAL').toString().toUpperCase(),
              'imageUrl': itemMap['image_url'] ?? itemMap['imageUrl'] ?? (itemMap['metadata'] != null ? itemMap['metadata']['image_url'] : null),
              'metadata': metadata,
            });
          } catch (e, stack) {
            print('[INVENTORY_REPO] Error mapping item ${json['id']}: $e');
            print('[INVENTORY_REPO] JSON content: $json');
            print('[INVENTORY_REPO] Stack: $stack');
            rethrow;
          }
        }).toList();
            
        await _localDataSource.cacheInventory(remoteItems);
        print('[INVENTORY_REPO] Successfully mapped and cached ${remoteItems.length} items');
        return Right(remoteItems);
      } catch (e) {
        print('[INVENTORY_REPO] Remote fetch failed: $e');
        if (localItems.isNotEmpty) {
          print('[INVENTORY_REPO] Returning ${localItems.length} cached items due to remote failure');
          return Right(localItems);
        }
        return Left(ServerFailure('Remote fetch failed: $e'));
      }
    } catch (e) {
      return Left(CacheFailure('Local cache read failed: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> addInventoryItem(InventoryItem item) async {
    try {
      await _localDataSource.addItem(item);
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'create',
        feature: 'inventory',
        data: item.toJson(),
        timestamp: DateTime.now(),
      );
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue item: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> updateInventoryItem(InventoryItem item) async {
    try {
      await _localDataSource.updateItem(item);
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'update',
        feature: 'inventory',
        data: item.toJson(),
        timestamp: DateTime.now(),
      );
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue update: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteInventoryItem(String id) async {
    try {
      await _localDataSource.deleteItem(id);
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'delete',
        feature: 'inventory',
        data: {'id': id},
        timestamp: DateTime.now(),
      );
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue deletion: $e'));
    }
  }

  @override
  Future<Either<Failure, List<EquipmentBooking>>> getBookings() async {
    try {
      final response = await _supabaseClient
          .from('equipment_bookings')
          .select('*, equipment:inventory(name), booked_by:profiles(full_name)')
          .order('start_time');

      final List<dynamic> data = response as List<dynamic>;
      final bookings = data.map((json) {
        try {
          final Map<String, dynamic> map = Map<String, dynamic>.from(json);
          
          // Flatten the joined data for the model
          final equipmentName = map['equipment']?['name'] as String?;
          final bookedByName = map['booked_by']?['full_name'] as String?;

          return EquipmentBooking.fromJson({
            ...map,
            'equipment_name': equipmentName,
            'booked_by_name': bookedByName,
          });
        } catch (e) {
          print('[INVENTORY_REPO] Error mapping booking: $e');
          print('[INVENTORY_REPO] Booking JSON: $json');
          rethrow;
        }
      }).toList();

      return Right(bookings);
    } catch (e, stack) {
      print('[INVENTORY_REPO] Failed to fetch bookings: $e');
      print('[INVENTORY_REPO] Stack: $stack');
      return Left(ServerFailure('Failed to fetch bookings: $e'));
    }
  }
}
