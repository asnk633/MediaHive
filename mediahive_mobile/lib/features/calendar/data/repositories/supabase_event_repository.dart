import 'package:dartz/dartz.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../../../core/error/failure.dart';
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
      print('[CALENDAR_REPO] Fetching events from remote...');
      
      // 1. Try to fetch from remote first
      try {
        final response = await _supabaseClient
            .from('events')
            .select('*, event_crew(user_id, profiles(*))')
            .eq('deleted', false)
            .order('start_at');
        
        print('[CALENDAR_REPO] Received ${(response as List).length} events from remote');
        
        final remoteEvents = response.map((json) {
          final startAt = DateTime.parse(json['start_at'].toString()).toLocal();
          
          final List<dynamic> crewRaw = json['event_crew'] as List<dynamic>? ?? [];
          final List<Map<String, dynamic>> assignedCrew = [];
          for (final c in crewRaw) {
            final profile = c['profiles'];
            if (profile != null) {
              assignedCrew.add(profile as Map<String, dynamic>);
            }
          }

          final List<String> mediaCoverage = (json['media_coverage'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList() ?? [];

          final Map<String, dynamic> mapped = {
            ...json,
            'date': DateFormat('yyyy-MM-dd').format(startAt),
            'time': '${startAt.hour.toString().padLeft(2, '0')}:${startAt.minute.toString().padLeft(2, '0')}',
            'type': json['status']?.toString().toUpperCase() ?? 'ADMIN',
            'createdBy': json['created_by'],
            'colorValue': _getStatusColor(json['status']?.toString()),
            'institutionId': json['institution_id'],
            'departmentId': json['department_id'],
            'onBehalfOf': json['on_behalf_of'],
            'mediaCoverage': mediaCoverage,
            'assignedCrew': assignedCrew,
          };
          
          return Event.fromJson(mapped);
        }).toList();
            
        await _localDataSource.cacheEvents(remoteEvents);
        print('[CALENDAR_REPO] Successfully mapped and cached ${remoteEvents.length} events');
        return Right(remoteEvents);
      } catch (e, stack) {
        print('[CALENDAR_REPO] Remote fetch failed: $e');
        print('[CALENDAR_REPO] Stack: $stack');
        
        // 2. Try to fallback to local cache
        try {
          final localEvents = await _localDataSource.getEvents();
          if (localEvents.isNotEmpty) {
            print('[CALENDAR_REPO] Returning ${localEvents.length} cached events as fallback');
            return Right(localEvents);
          }
        } catch (cacheEx) {
          print('[CALENDAR_REPO] Failed to read local cache fallback: $cacheEx');
          try {
            await _localDataSource.clearCache();
            print('[CALENDAR_REPO] Cleared corrupted local cache successfully');
          } catch (clearEx) {
            print('[CALENDAR_REPO] Failed to clear local cache: $clearEx');
          }
        }
        
        return Left(ServerFailure('Remote fetch failed: $e'));
      }
    } catch (e) {
      print('[CALENDAR_REPO] Fatal repository error: $e');
      return Left(CacheFailure('Repository error: $e'));
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
    final success = await _syncService.executeImmediate(
      'calendar',
      'create',
      event.toJson(),
      () async {
        final payload = _mapEventToPayload(event);
        payload['created_by'] = _supabaseClient.auth.currentUser?.id;
        
        await _supabaseClient.from('events').insert(payload);

        // Save event crew
        if (event.assignedCrew.isNotEmpty) {
          final crewPayloads = event.assignedCrew.map((c) => {
            'event_id': event.id,
            'user_id': c['id'],
            'tenant_id': payload['tenant_id'],
          }).toList();
          await _supabaseClient.from('event_crew').insert(crewPayloads);
        }
        
        await _localDataSource.addEvent(event);
      },
    );

    return success ? const Right(null) : Left(ServerFailure('Failed to add event'));
  }

  @override
  Future<Either<Failure, void>> updateEvent(Event event) async {
    // 1. Optimistic update
    final previousEvents = await _localDataSource.getEvents();
    final previousEvent = previousEvents.firstWhere((e) => e.id == event.id);
    await _localDataSource.updateEvent(event);

    final success = await _syncService.executeImmediate(
      'calendar',
      'update',
      event.toJson(),
      () async {
        final payload = _mapEventToPayload(event);
        await _supabaseClient.from('events').update(payload).eq('id', event.id);

        // Update event crew: delete existing crew and insert new crew
        await _supabaseClient.from('event_crew').delete().eq('event_id', event.id);
        if (event.assignedCrew.isNotEmpty) {
          final crewPayloads = event.assignedCrew.map((c) => {
            'event_id': event.id,
            'user_id': c['id'],
            'tenant_id': payload['tenant_id'],
          }).toList();
          await _supabaseClient.from('event_crew').insert(crewPayloads);
        }
      },
    );

    if (!success) {
      // Rollback
      await _localDataSource.updateEvent(previousEvent);
      return Left(ServerFailure('Failed to update event'));
    }

    return const Right(null);
  }

  @override
  Future<Either<Failure, void>> deleteEvent(String id) async {
    final success = await _syncService.executeImmediate(
      'calendar',
      'delete',
      {'id': id},
      () async {
        // Delete crew first due to foreign keys, then delete event
        await _supabaseClient.from('event_crew').delete().eq('event_id', id);
        await _supabaseClient.from('events').delete().eq('id', id);
        await _localDataSource.deleteEvent(id);
      },
    );

    return success ? const Right(null) : Left(ServerFailure('Failed to delete event'));
  }

  Map<String, dynamic> _mapEventToPayload(Event event) {
    final data = event.toJson();
    const String defaultTenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';
    
    // Parse as LOCAL time then convert to UTC — prevents the +5:30 offset shift
    final localStart = DateTime(
      int.parse((data['date'] as String).split('-')[0]),
      int.parse((data['date'] as String).split('-')[1]),
      int.parse((data['date'] as String).split('-')[2]),
      int.parse((data['time'] as String).split(':')[0]),
      int.parse((data['time'] as String).split(':')[1]),
    );
    final startAt = localStart.toUtc().toIso8601String();
    
    // Use stored end fields if present, otherwise +2h from start
    String endAt;
    if (data['endDate'] != null && data['endTime'] != null) {
      final localEnd = DateTime(
        int.parse((data['endDate'] as String).split('-')[0]),
        int.parse((data['endDate'] as String).split('-')[1]),
        int.parse((data['endDate'] as String).split('-')[2]),
        int.parse((data['endTime'] as String).split(':')[0]),
        int.parse((data['endTime'] as String).split(':')[1]),
      );
      endAt = localEnd.toUtc().toIso8601String();
    } else {
      endAt = localStart.add(const Duration(hours: 2)).toUtc().toIso8601String();
    }
    
    return {
      'id': data['id'],
      'title': data['title'],
      'description': data['description'],
      'location': data['location'],
      'start_at': startAt,
      'end_at': endAt,
      'status': data['type']?.toString().toLowerCase() ?? 'confirmed',
      'tenant_id': defaultTenantId,
      'institution_id': event.institutionId,
      'department_id': event.departmentId,
      'on_behalf_of': event.onBehalfOf,
      'media_coverage': event.mediaCoverage,
    };
  }
}
