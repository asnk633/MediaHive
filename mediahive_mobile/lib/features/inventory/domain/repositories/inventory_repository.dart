import 'package:dartz/dartz.dart';
import '../../../../core/error/failure.dart';
import '../models/inventory_item.dart';
import '../models/equipment_booking.dart';
import '../models/inventory_request.dart';

abstract class InventoryRepository {
  Future<Either<Failure, List<InventoryItem>>> getInventory();
  Future<Either<Failure, void>> addInventoryItem(InventoryItem item);
  Future<Either<Failure, void>> updateInventoryItem(InventoryItem item);
  Future<Either<Failure, void>> deleteInventoryItem(String id);
  Future<Either<Failure, List<EquipmentBooking>>> getBookings();
  Future<Either<Failure, List<InventoryRequest>>> getRequests();
  Future<Either<Failure, void>> requestInventoryItem({
    required String itemName,
    required int quantity,
    required String notes,
  });
  Future<Either<Failure, void>> bookEquipment({
    required String equipmentId,
    required DateTime startTime,
    required DateTime endTime,
    required int unitsRequested,
    String? taskId,
  });
  Future<Either<Failure, void>> updateRequestStatus({
    required String requestId,
    required String status,
    String? rejectReason,
  });
}

