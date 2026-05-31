import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mediahive_mobile/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProviderScope(child: MediaHiveApp()));

    // Verify that the app starts at the Dashboard
    expect(find.text('MEDIAHIVE'), findsOneWidget);
  });
}
