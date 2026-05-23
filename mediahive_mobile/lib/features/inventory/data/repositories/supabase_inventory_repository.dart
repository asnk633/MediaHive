import 'package:dartz/dartz.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../../../../../core/error/failure.dart';
import '../../../../../core/services/sync_service.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_item.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/equipment_booking.dart';
import 'package:mediahive_mobile/features/inventory/domain/models/inventory_request.dart';
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
        print('[INVENTORY_REPO] Querying inventory_items table...');
        final response = await _supabaseClient
            .from('inventory_items')
            .select('*')
            .order('item_name');
        
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
            
            // Build metadata from flat columns with explicit typing for backward compatibility
            final Map<String, dynamic> metadata = {
              'purchase_price': itemMap['purchase_amount'],
              'purchase_date': itemMap['purchase_date'],
              'serial_number': itemMap['serial_number'],
              'location': itemMap['location'],
              'drive_file_id': null,
              'unit': 'piece',
            };

            return InventoryItem.fromJson({
              ...itemMap,
              'item_name': itemMap['item_name'],
              'asset_id': itemMap['asset_id'] ?? '',
              'available_quantity': itemMap['available_quantity'] ?? itemMap['quantity'] ?? 0,
              'purchase_amount': itemMap['purchase_amount'] != null ? (itemMap['purchase_amount'] as num).toDouble() : null,
              'purchase_date': itemMap['purchase_date']?.toString(),
              'status': (itemMap['status'] ?? 'Available').toString(),
              'condition': (itemMap['condition'] ?? 'Good').toString(),
              'category': (itemMap['category'] ?? 'General').toString(),
              'image_url': itemMap['image_url'],
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
    final success = await _syncService.executeImmediate(
      'inventory',
      'create',
      item.toJson(),
      () async {
        final payload = _mapItemToPayload(item);
        
        await _supabaseClient.from('inventory_items').insert(payload);
        await _localDataSource.addItem(item);
      },
    );

    return success ? const Right(null) : Left(ServerFailure('Failed to add item'));
  }

  @override
  Future<Either<Failure, void>> updateInventoryItem(InventoryItem item) async {
    // 1. Optimistic update
    final previousItems = await _localDataSource.getInventory();
    final previousItem = previousItems.firstWhere((i) => i.id == item.id);
    await _localDataSource.updateItem(item);

    final success = await _syncService.executeImmediate(
      'inventory',
      'update',
      item.toJson(),
      () async {
        final payload = _mapItemToPayload(item);
        await _supabaseClient.from('inventory_items').update(payload).eq('id', item.id);
      },
    );

    if (!success) {
      // Rollback
      await _localDataSource.updateItem(previousItem);
      return Left(ServerFailure('Failed to update item'));
    }

    return const Right(null);
  }

  @override
  Future<Either<Failure, void>> deleteInventoryItem(String id) async {
    final success = await _syncService.executeImmediate(
      'inventory',
      'delete',
      {'id': id},
      () async {
        await _supabaseClient.from('inventory_items').delete().eq('id', id);
        await _localDataSource.deleteItem(id);
      },
    );

    return success ? const Right(null) : Left(ServerFailure('Failed to delete item'));
  }

  Map<String, dynamic> _mapItemToPayload(InventoryItem item) {
    final data = item.toJson();
    final userMetadata = _supabaseClient.auth.currentUser?.userMetadata ?? {};
    
    // The tenant ID for ThaiBa Garden (MediaHive)
    const String defaultTenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';
    // Default institution ID (Thaiba Garden Main)
    const String defaultInstitutionId = '2db97c34-c1c7-4c03-9485-8e8e2721cb06';

    final tenantId = userMetadata['tenant_id']?.toString() ?? userMetadata['institution_id']?.toString() ?? defaultTenantId;
    final instId = userMetadata['institution_id']?.toString() ?? defaultInstitutionId;

    return {
      'id': data['id'],
      'asset_id': data['asset_id'] ?? data['assetId'] ?? '',
      'item_name': data['item_name'] ?? data['name'],
      'category': data['category'] ?? 'General',
      'condition': data['condition'] ?? 'Good',
      'status': data['status'] ?? 'Available',
      'serial_number': data['serial_number'] ?? data['serialNumber'],
      'quantity': data['quantity'],
      'available_quantity': data['available_quantity'] ?? data['availableQuantity'] ?? data['quantity'],
      'location': data['location'],
      'description': data['description'],
      'purchase_amount': data['purchase_amount'] ?? data['purchaseAmount'],
      'purchase_date': data['purchase_date'] ?? data['purchaseDate'],
      'image_url': data['image_url'] ?? data['imageUrl'],
      'tenant_id': tenantId,
      'institution_id': instId,
      'updated_at': DateTime.now().toIso8601String(),
    };
  }

  @override
  Future<Either<Failure, List<EquipmentBooking>>> getBookings() async {
    try {
      final response = await _supabaseClient
          .from('equipment_bookings')
          .select('*, equipment:inventory!equipment_bookings_equipment_id_fkey(name), booked_by:profiles!equipment_bookings_booked_by_fkey(full_name)')
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

  @override
  Future<Either<Failure, List<InventoryRequest>>> getRequests() async {
    try {
      final user = _supabaseClient.auth.currentUser;
      if (user == null) return Left(AuthFailure('User not logged in'));

      final profileResponse = await _supabaseClient
          .from('profiles')
          .select('role, tenant_id')
          .eq('id', user.id)
          .single();
      
      final role = profileResponse['role']?.toString().toLowerCase() ?? 'member';
      final isAdmin = role == 'admin' || role == 'manager';
      final tenantId = profileResponse['tenant_id'];

      var query = _supabaseClient
          .from('inventory_requests')
          .select('*, requester:profiles!inventory_requests_user_id_fkey(full_name)')
          .eq('tenant_id', tenantId);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      final response = await query.order('created_at', ascending: false);
      final List<dynamic> data = response as List<dynamic>;

      final requests = data.map((json) {
        try {
          final Map<String, dynamic> map = Map<String, dynamic>.from(json);
          final requesterName = map['requester']?['full_name'] as String?;
          return InventoryRequest.fromJson({
            ...map,
            'requester_name': requesterName,
          });
        } catch (e) {
          print('[INVENTORY_REPO] Error mapping request: $e');
          rethrow;
        }
      }).toList();

      return Right(requests);
    } catch (e) {
      print('[INVENTORY_REPO] Failed to fetch requests: $e');
      return Left(ServerFailure('Failed to fetch requests: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> requestInventoryItem({
    required String itemName,
    required int quantity,
    required String notes,
  }) async {
    try {
      final user = _supabaseClient.auth.currentUser;
      if (user == null) return Left(AuthFailure('User not logged in'));

      // Fetch profile to get tenant_id and institution_id
      final profile = await _supabaseClient
          .from('profiles')
          .select('tenant_id, institution_id')
          .eq('id', user.id)
          .single();

      await _supabaseClient.from('inventory_requests').insert({
        'user_id': user.id,
        'tenant_id': profile['tenant_id'],
        'institution_id': profile['institution_id'],
        'item_name': itemName,
        'quantity': quantity,
        'notes': notes,
        'status': 'pending',
      });

      return const Right(null);
    } catch (e) {
      print('[INVENTORY_REPO] Failed to submit request: $e');
      return Left(ServerFailure('Failed to submit request: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> bookEquipment({
    required String equipmentId,
    required DateTime startTime,
    required DateTime endTime,
    required int unitsRequested,
    String? taskId,
  }) async {
    try {
      final user = _supabaseClient.auth.currentUser;
      if (user == null) return Left(AuthFailure('User not logged in'));

      final profile = await _supabaseClient
          .from('profiles')
          .select('tenant_id, institution_id')
          .eq('id', user.id)
          .single();

      await _supabaseClient.from('equipment_bookings').insert({
        'equipment_id': equipmentId,
        'booked_by': user.id,
        'tenant_id': profile['tenant_id'],
        'institution_id': profile['institution_id'],
        'start_time': startTime.toIso8601String(),
        'end_time': endTime.toIso8601String(),
        'units_requested': unitsRequested,
        'task_id': taskId,
      });

      return const Right(null);
    } catch (e) {
      print('[INVENTORY_REPO] Failed to book equipment: $e');
      return Left(ServerFailure('Failed to book equipment: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> updateRequestStatus({
    required String requestId,
    required String status,
    String? rejectReason,
  }) async {
    try {
      final updateData = {
        'status': status,
        'updated_at': DateTime.now().toIso8601String(),
      };
      if (rejectReason != null) {
        updateData['reject_reason'] = rejectReason;
      }
      
      await _supabaseClient
          .from('inventory_requests')
          .update(updateData)
          .eq('id', requestId);
          
      return const Right(null);
    } catch (e) {
      print('[INVENTORY_REPO] Failed to update request status: $e');
      return Left(ServerFailure('Failed to update request status: $e'));
    }
  }
}

