// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'events_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$eventRepositoryHash() => r'a48e20350d50865a129c0d05d3ee943f5c57a722';

/// See also [eventRepository].
@ProviderFor(eventRepository)
final eventRepositoryProvider = AutoDisposeProvider<EventRepository>.internal(
  eventRepository,
  name: r'eventRepositoryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$eventRepositoryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef EventRepositoryRef = AutoDisposeProviderRef<EventRepository>;
String _$eventListHash() => r'3c8690c6bb228f7615d1d5cd6a9d0c129aa6edff';

/// See also [EventList].
@ProviderFor(EventList)
final eventListProvider =
    AutoDisposeAsyncNotifierProvider<EventList, List<Event>>.internal(
  EventList.new,
  name: r'eventListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$eventListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$EventList = AutoDisposeAsyncNotifier<List<Event>>;
String _$calendarViewHash() => r'39958b0aec90b5bdd66202243988cca8e796a139';

/// See also [CalendarView].
@ProviderFor(CalendarView)
final calendarViewProvider =
    AutoDisposeNotifierProvider<CalendarView, String>.internal(
  CalendarView.new,
  name: r'calendarViewProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$calendarViewHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$CalendarView = AutoDisposeNotifier<String>;
String _$selectedDateHash() => r'8fab48924fe47813bb6e95f049db6bfba29aa71d';

/// See also [SelectedDate].
@ProviderFor(SelectedDate)
final selectedDateProvider =
    AutoDisposeNotifierProvider<SelectedDate, String>.internal(
  SelectedDate.new,
  name: r'selectedDateProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$selectedDateHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SelectedDate = AutoDisposeNotifier<String>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
