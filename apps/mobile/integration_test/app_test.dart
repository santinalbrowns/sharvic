import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:sharvic_mobile/main.dart' as app;

Future<void> waitFor(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 20),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 250));
    if (finder.evaluate().isNotEmpty) return;
  }
  throw TestFailure('Timed out waiting for $finder');
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('member logs in and browses the app', (tester) async {
    // Start from a clean session so the login screen is shown.
    await const FlutterSecureStorage().deleteAll();

    app.main();

    await waitFor(tester, find.text('Sharvic Village Banking'));
    expect(find.text('Member Portal'), findsOneWidget);

    final fields = find.byType(TextFormField);
    expect(fields, findsNWidgets(2));
    await tester.enterText(fields.at(0), 'dem@sharvic.com');
    await tester.enterText(fields.at(1), 'demo123');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Login'));

    await waitFor(tester, find.text('Dashboard'));
    expect(find.text('Dem 3232'), findsWidgets);

    await tester.tap(find.text('Loans'));
    await waitFor(tester, find.text('My Loans'));
    await waitFor(tester, find.text('LN-24558274'));

    await tester.tap(find.text('Savings'));
    await waitFor(tester, find.text('My Savings'));

    await tester.tap(find.text('Profile'));
    await waitFor(tester, find.text('My Profile'));
    await waitFor(tester, find.text('Credit Score'));

    // Return to the dashboard and sign out.
    await tester.tap(find.text('Dashboard'));
    await waitFor(tester, find.text('Dashboard'));
    await tester.tap(find.byIcon(Icons.logout));
    await waitFor(tester, find.text('Sharvic Village Banking'));
  });
}
