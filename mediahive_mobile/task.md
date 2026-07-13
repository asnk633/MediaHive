# Task Checklist

- [x] Add `flutter_background_service: ^5.0.7` dependency in `pubspec.yaml`
- [x] Configure `android/app/src/main/AndroidManifest.xml` (permissions & service declaration)
- [x] Implement core background service logic in `lib/features/attendance/data/services/background_presence_service.dart`
- [x] Register service initialization and `requestRefresh` event listener in `lib/main.dart`
- [x] Integrate background service controls in `lib/features/attendance/presentation/providers/attendance_provider.dart`
- [x] Implement unit tests in `test/background_presence_test.dart`
- [x] Verify implementation via tests and app builds
