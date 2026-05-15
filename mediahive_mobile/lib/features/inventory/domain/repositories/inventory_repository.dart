import 'package:dartz/dartz.dart';
import '../../../../core/error/failure.dart';
import '../models/inventory_item.dart';
import '../models/equipment_booking.dart';

abstract class InventoryRepository {
  Future<Either<Failure, List<InventoryItem>>> getInventory();
  Future<Either<Failure, void>> addInventoryItem(InventoryItem item);
  Future<Either<Failure, void>> updateInventoryItem(InventoryItem item);
  Future<Either<Failure, void>> deleteInventoryItem(String id);
  Future<Either<Failure, List<EquipmentBooking>>> getBookings();
}
