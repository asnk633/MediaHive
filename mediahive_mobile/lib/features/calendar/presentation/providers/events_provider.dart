import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/services/sync_service.dart';
import '../../../../core/services/realtime_service.dart';
import '../../data/datasources/event_local_datasource.dart';
import '../../data/repositories/supabase_event_repository.dart';
import '../../domain/models/event.dart';
import '../../domain/repositories/event_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

part 'events_provider.g.dart';

@riverpod
EventRepository eventRepository(EventRepositoryRef ref) {
  final supabaseClient = Supabase.instance.client;
  final localDataSource = HiveEventLocalDataSource();
  final syncService = ref.watch(syncServiceProvider);
  
  
  return SupabaseEventRepository(
    supabaseClient,
    localDataSource,
    syncService,
  );
}

@riverpod
class EventList extends _$EventList {
  @override
  Future<List<Event>> build() async {
    final repository = ref.watch(eventRepositoryProvider);
    
    // Listen for realtime updates via centralized service
    ref.listen(tableUpdateProvider('events'), (_, __) {
      ref.invalidateSelf();
    });

    final result = await repository.getEvents();
    return result.fold(
      (failure) => throw failure,
      (events) => events,
    );
  }

  Future<void> addEvent(Event event) async {
    final repository = ref.watch(eventRepositoryProvider);
    final previousState = state;
    state = AsyncValue.data([...state.value ?? [], event]);
    
    final result = await repository.addEvent(event);
    result.fold(
      (failure) => state = previousState,
      (_) => null,
    );
  }

  Future<void> updateEvent(Event event) async {
    final repository = ref.watch(eventRepositoryProvider);
    final previousState = state;
    state = AsyncValue.data(
      (state.value ?? []).map((e) => e.id == event.id ? event : e).toList(),
    );
    
    final result = await repository.updateEvent(event);
    result.fold(
      (failure) => state = previousState,
      (_) => null,
    );
  }

  Future<void> deleteEvent(String id) async {
    final repository = ref.watch(eventRepositoryProvider);
    final previousState = state;
    state = AsyncValue.data(
      (state.value ?? []).where((e) => e.id != id).toList(),
    );
    
    final result = await repository.deleteEvent(id);
    result.fold(
      (failure) => state = previousState,
      (_) => null,
    );
  }
}

@riverpod
class CalendarView extends _$CalendarView {
  @override
  String build() => 'MONTH';
  void setView(String view) => state = view;
}

@riverpod
class SelectedDate extends _$SelectedDate {
  @override
  String build() => DateTime.now().day.toString();
  void setDate(String date) => state = date;
}

final activeMonthProvider = StateProvider<DateTime>((ref) => DateTime.now());
