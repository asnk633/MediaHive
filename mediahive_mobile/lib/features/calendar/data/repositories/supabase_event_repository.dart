import 'package:dartz/dartz.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import '../../../../../core/error/failure.dart';
import '../../../../../core/models/sync_mutation.dart';
import '../../../../../core/services/sync_service.dart';
import '../../domain/models/event.dart';
import '../../domain/repositories/event_repository.dart';
import '../datasources/event_local_datasource.dart';

class SupabaseEventRepository implements EventRepository {
  final SupabaseClient _supabaseClient;
  final EventLocalDataSource _localDataSource;
  final SyncService _syncService;

  SupabaseEventRepository(
    this._supabaseClient,
    this._localDataSource,
    this._syncService,
  );

  @override
  Future<Either<Failure, List<Event>>> getEvents() async {
    try {
      final localEvents = await _localDataSource.getEvents();
      
      try {
        final response = await _supabaseClient
            .from('events')
            .select()
            .eq('deleted', false)
            .order('start_at');
        
        final remoteEvents = (response as List).map((json) {
          final startAt = DateTime.parse(json['start_at'].toString()).toLocal();
          
          final Map<String, dynamic> mapped = {
            ...json,
            'date': DateFormat('yyyy-MM-dd').format(startAt),
            'time': '${startAt.hour.toString().padLeft(2, '0')}:${startAt.minute.toString().padLeft(2, '0')}',
            'type': json['status']?.toString().toUpperCase() ?? 'ADMIN',
            'colorValue': _getStatusColor(json['status']?.toString()),
          };
          
          return Event.fromJson(mapped);
        }).toList();
            
        await _localDataSource.cacheEvents(remoteEvents);
        return Right(remoteEvents);
      } catch (e) {
        print('[CALENDAR_REPO] Error mapping events: $e');
        if (localEvents.isNotEmpty) return Right(localEvents);
        return Left(ServerFailure('Remote fetch failed: $e'));
      }
    } catch (e) {
      return Left(CacheFailure('Local cache read failed: $e'));
    }
  }

  int _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 0xFF10B981; // Green
      case 'pending': return 0xFFF59E0B; // Amber
      case 'cancelled': return 0xFFEF4444; // Red
      default: return 0xFF2563EB; // Blue
    }
  }

  @override
  Future<Either<Failure, void>> addEvent(Event event) async {
    try {
      await _localDataSource.addEvent(event);
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'create',
        feature: 'calendar',
        data: event.toJson(),
        timestamp: DateTime.now(),
      );
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue event: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> updateEvent(Event event) async {
    try {
      await _localDataSource.updateEvent(event);
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'update',
        feature: 'calendar',
        data: event.toJson(),
        timestamp: DateTime.now(),
      );
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue update: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteEvent(String id) async {
    try {
      await _localDataSource.deleteEvent(id);
      final mutation = SyncMutation(
        id: const Uuid().v4(),
        type: 'delete',
        feature: 'calendar',
        data: {'id': id},
        timestamp: DateTime.now(),
      );
      await _syncService.addMutation(mutation);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to queue deletion: $e'));
    }
  }
}
