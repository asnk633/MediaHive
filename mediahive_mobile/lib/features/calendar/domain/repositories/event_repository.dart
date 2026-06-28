import 'package:dartz/dartz.dart';
import 'package:mediahive_mobile/core/error/failure.dart';
import 'package:mediahive_mobile/features/calendar/domain/models/event.dart';

abstract class EventRepository {
  Future<Either<Failure, List<Event>>> getEvents();
  Future<Either<Failure, void>> addEvent(Event event);
  Future<Either<Failure, void>> updateEvent(Event event);
  Future<Either<Failure, void>> deleteEvent(String id);
}
