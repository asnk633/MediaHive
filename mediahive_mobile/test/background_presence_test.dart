import 'package:flutter_test/flutter_test.dart';
import 'package:mediahive_mobile/features/attendance/data/services/background_presence_service.dart';

void main() {
  group('BackgroundPresenceService - Haversine Distance Tests', () {
    test('Calculates distance as 0 for identical points', () {
      final distance = BackgroundPresenceService.haversineDistance(
        37.7749,
        -122.4194,
        37.7749,
        -122.4194,
      );
      expect(distance, closeTo(0.0, 0.01));
    });

    test('Calculates distance correctly for known points (SF to NY)', () {
      // Coordinates of San Francisco
      const sfLat = 37.7749;
      const sfLng = -122.4194;
      // Coordinates of New York City
      const nyLat = 40.7128;
      const nyLng = -74.0060;

      final distance = BackgroundPresenceService.haversineDistance(
        sfLat,
        sfLng,
        nyLat,
        nyLng,
      );

      // Distance should be approximately 4,130,000 meters (4130 km)
      expect(distance / 1000, closeTo(4130.0, 50.0));
    });

    test('Calculates distance correctly for small distances (office geofence scale)', () {
      // 100m geofence scale
      const officeLat = 10.0;
      const officeLng = 10.0;
      
      // Moving slightly north
      const userLatInside = 10.0004; // ~44 meters away
      const userLngInside = 10.0;
      
      const userLatOutside = 10.0015; // ~167 meters away
      const userLngOutside = 10.0;

      final distInside = BackgroundPresenceService.haversineDistance(
        officeLat,
        officeLng,
        userLatInside,
        userLngInside,
      );

      final distOutside = BackgroundPresenceService.haversineDistance(
        officeLat,
        officeLng,
        userLatOutside,
        userLngOutside,
      );

      expect(distInside, lessThan(100.0));
      expect(distOutside, greaterThan(100.0));
      expect(distInside, closeTo(44.4, 1.0));
      expect(distOutside, closeTo(166.7, 5.0));
    });
  });

  group('BackgroundPresenceService - Grace Period Calculations', () {
    test('Grace period logic correctly computes elapsed time and identifies timeout', () {
      final now = DateTime.now();
      
      // Case A: Just exited, elapsed < 15 mins (e.g. 5 minutes ago)
      final graceStartA = now.subtract(const Duration(minutes: 5));
      final elapsedA = now.difference(graceStartA).inMinutes;
      final isTimedOutA = elapsedA >= 15;
      
      expect(elapsedA, equals(5));
      expect(isTimedOutA, isFalse);

      // Case B: Exceeded 15 minutes (e.g. 16 minutes ago)
      final graceStartB = now.subtract(const Duration(minutes: 16));
      final elapsedB = now.difference(graceStartB).inMinutes;
      final isTimedOutB = elapsedB >= 15;

      expect(elapsedB, equals(16));
      expect(isTimedOutB, isTrue);

      // Case C: Exactly 15 minutes ago
      final graceStartC = now.subtract(const Duration(minutes: 15));
      final elapsedC = now.difference(graceStartC).inMinutes;
      final isTimedOutC = elapsedC >= 15;

      expect(elapsedC, equals(15));
      expect(isTimedOutC, isTrue);
    });
  });
}
