import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/models/event.dart';

abstract class EventLocalDataSource {
  Future<List<Event>> getEvents();
  Future<void> cacheEvents(List<Event> events);
  Future<void> addEvent(Event event);
  Future<void> updateEvent(Event event);
  Future<void> deleteEvent(String id);
  Future<void> clearCache();
}

class HiveEventLocalDataSource implements EventLocalDataSource {
  static const String _boxName = 'events_cache';

  Future<Box> _openBox() async {
    return await Hive.openBox(_boxName);
  }

  @override
  Future<List<Event>> getEvents() async {
    final box = await _openBox();
    final List<dynamic> rawEvents = box.values.toList();
    return rawEvents.map((json) => Event.fromJson(Map<String, dynamic>.from(json))).toList();
  }

  @override
  Future<void> cacheEvents(List<Event> events) async {
    final box = await _openBox();
    await box.clear();
    final Map<String, dynamic> eventsMap = {
      for (var event in events) event.id: event.toJson()
    };
    await box.putAll(eventsMap);
  }

  @override
  Future<void> addEvent(Event event) async {
    final box = await _openBox();
    await box.put(event.id, event.toJson());
  }

  @override
  Future<void> updateEvent(Event event) async {
    final box = await _openBox();
    await box.put(event.id, event.toJson());
  }

  @override
  Future<void> deleteEvent(String id) async {
    final box = await _openBox();
    await box.delete(id);
  }

  @override
  Future<void> clearCache() async {
    final box = await _openBox();
    await box.clear();
  }
}
