import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/screens/login_screen.dart';
import 'package:sharvic_mobile/screens/home_screen.dart';

class _NoMemberProfileScreen extends StatelessWidget {
  const _NoMemberProfileScreen();

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Account Not Linked')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.person_off, size: 72, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                'This login is not linked to a member profile.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              const Text(
                'Ask an administrator to create a member login for you.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: auth.logout,
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Sharvic Village Banking',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
          useMaterial3: true,
        ),
        debugShowCheckedModeBanner: false,
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (auth.isInitializing) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (!auth.isAuthenticated) return const LoginScreen();
            if (!auth.hasMemberProfile) return const _NoMemberProfileScreen();
            return const HomeScreen();
          },
        ),
      ),
    );
  }
}
