import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'presentation/screens/shell_screen.dart';
import 'features/auth/presentation/screens/startup_screen.dart';
import 'core/design_tokens.dart';
import 'core/router/router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/config/env_config.dart';
import 'shared/widgets/mh_error_boundary.dart';

import 'core/theme_provider.dart';
import 'core/services/logger_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/notification_service.dart';
import 'dart:ui';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await dotenv.load(fileName: ".env");
  final config = EnvConfig.current;
  
  // Production Error Handling
  ErrorWidget.builder = (details) => MhGlobalErrorScreen(details: details);
  
  await Hive.initFlutter();
  
  await Supabase.initialize(
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
  );

  final container = ProviderContainer();
  final logger = container.read(loggerProvider.notifier);
  
  // Flutter Error Interception
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    logger.error('FLUTTER_ERROR', details.exception, details.stack);
  };

  // Asynchronous Error Interception
  PlatformDispatcher.instance.onError = (error, stack) {
    logger.error('ASYNC_ERROR', error, stack);
    return true;
  };

  // Initialize Auth Monitoring
  container.read(authServiceProvider);
  
  // Initialize Notifications
  await container.read(notificationServiceProvider).initialize();
  
  logger.info('APPLICATION_START: Flavor=${config.flavor.name}');

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const MediaHiveApp(),
    ),
  );
}

class MediaHiveApp extends ConsumerWidget {
  const MediaHiveApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'MediaHive',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        fontFamily: 'Muli',
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: 'Muli',
        scaffoldBackgroundColor: DesignTokens.backgroundPrimary,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
      ),
      themeMode: themeMode,
    );
  }
}
