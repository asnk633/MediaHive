import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'presentation/screens/shell_screen.dart';
import 'shared/widgets/mh_loading_overlay.dart';
import 'features/auth/presentation/screens/startup_screen.dart';
import 'core/design_tokens.dart';
import 'core/router/router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/config/env_config.dart';
import 'shared/widgets/mh_error_boundary.dart';

import 'shared/widgets/mh_offline_banner.dart';

import 'core/theme_provider.dart';
import 'core/services/logger_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/fcm_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'dart:ui';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('FIREBASE_INIT_ERROR: $e');
  }
  
  await dotenv.load(fileName: ".env");
  final config = EnvConfig.current;
  
  // Production Error Handling
  ErrorWidget.builder = (details) => MhGlobalErrorScreen(details: details);
  
  await Hive.initFlutter();
  
  await Supabase.initialize(
    url: config.supabaseUrl,
    anonKey: config.supabaseAnonKey,
  );

  print('SUPABASE_INIT: URL=${config.supabaseUrl}');
  final session = Supabase.instance.client.auth.currentSession;
  final user = Supabase.instance.client.auth.currentUser;
  print('AUTH_STATE: LoggedIn=${session != null}, UserID=${user?.id}');

  final container = ProviderContainer();
  final logger = container.read(loggerProvider.notifier);
  
  // Flutter Error Interception
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    logger.error('FLUTTER_ERROR', details.exception, details.stack);
  };

  // Asynchronous Error Interception
  PlatformDispatcher.instance.onError = (error, stack) {
    final errStr = error.toString();
    if (errStr.contains('refresh_token_not_found') || errStr.contains('Invalid Refresh Token')) {
      logger.info('Session recovery bypassed: Refresh token expired or not found.');
      return true;
    }
    logger.error('ASYNC_ERROR', error, stack);
    return true;
  };

  // Initialize Auth Monitoring
  container.read(authServiceProvider);
  
  // Initialize Notifications & FCM
  await container.read(notificationServiceProvider).initialize();
  await container.read(fcmServiceProvider).initialize();

  logger.info('APPLICATION_START: Flavor=development');

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
      builder: (context, child) {
        return Stack(
          children: [
            Column(
              children: [
                const MhOfflineBanner(),
                if (child != null) Expanded(child: child),
              ],
            ),
            const MhLoadingOverlay(),
          ],
        );
      },
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
