import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'shared/widgets/mh_loading_overlay.dart';
import 'core/design_tokens.dart';
import 'core/router/router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/config/env_config.dart';
import 'shared/widgets/mh_error_boundary.dart';

import 'shared/widgets/mh_offline_banner.dart';
import 'core/services/snackbar_service.dart';

import 'core/theme_provider.dart';
import 'core/services/logger_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/fcm_service.dart';
import 'core/providers/update_provider.dart';
import 'core/services/crash_log_service.dart';
import 'features/attendance/presentation/providers/attendance_provider.dart';
import 'features/attendance/data/services/attendance_reminder_service.dart';
// background_headless_task import removed — BGGeo headless tasks no longer used
import 'features/attendance/data/services/background_presence_service.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// flutter_background_geolocation removed (paid license required)
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'dart:ui';
import 'package:package_info_plus/package_info_plus.dart';

void main() {
  final crashLogService = CrashLogService();

  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await crashLogService.init();

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
      ErrorWidget.builder = (details) {
        // Record the Flutter error to disk as well
        crashLogService.record('FLUTTER_RENDER_ERROR', details.exception, details.stack);
        return MhGlobalErrorScreen(details: details);
      };

      await Hive.initFlutter();
      await Hive.openBox<bool>('sync_notifications');

      await Supabase.initialize(
        url: config.supabaseUrl,
        anonKey: config.supabaseAnonKey,
      );

      debugPrint('SUPABASE_INIT: URL=${config.supabaseUrl}');
      final session = Supabase.instance.client.auth.currentSession;
      final user = Supabase.instance.client.auth.currentUser;
      debugPrint('AUTH_STATE: LoggedIn=${session != null}, UserID=${user?.id}');

      final container = ProviderContainer(
        overrides: [
          crashLogServiceProvider.overrideWithValue(crashLogService),
        ],
      );
      final logger = container.read(loggerProvider.notifier);

      // Commented out to debug native startup crash on Android 15
      /*
      final bgPresenceService = BackgroundPresenceService();
      try {
        await bgPresenceService.initializeService();

        // Register token refresh handshake listener
        FlutterBackgroundService().on('requestRefresh').listen((event) async {
          try {
            debugPrint('BG_PRESENCE: Main isolate received requestRefresh event');
            final response = await Supabase.instance.client.auth.refreshSession();
            final newSession = response.session;
            if (newSession != null) {
              const storage = FlutterSecureStorage();
              await storage.write(key: 'access_token', value: newSession.accessToken);
              await storage.write(key: 'refresh_token', value: newSession.refreshToken);
              final expiresAt = DateTime.now().add(Duration(seconds: newSession.expiresIn ?? 3600));
              await storage.write(key: 'token_expires_at', value: expiresAt.toIso8601String());

              FlutterBackgroundService().invoke('tokenRefreshResponse', {
                'accessToken': newSession.accessToken,
                'refreshToken': newSession.refreshToken,
                'expiresAt': expiresAt.toIso8601String(),
              });
              debugPrint('BG_PRESENCE: Main isolate successfully refreshed token and sent response');
            }
          } catch (e) {
            debugPrint('BG_PRESENCE: Main isolate failed to refresh token: $e');
          }
        });
      } catch (e) {
        debugPrint('BG_PRESENCE_INIT_ERROR: $e');
      }
      */

      // Flutter Error Interception
      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        logger.error('FLUTTER_ERROR', details.exception, details.stack);
        crashLogService.record('FLUTTER_ERROR', details.exception, details.stack);
      };

      // Asynchronous Error Interception
      PlatformDispatcher.instance.onError = (error, stack) {
        logger.error('ASYNC_ERROR', error, stack);
        crashLogService.record('ASYNC_ERROR', error, stack);
        return true;
      };

      // Initialize Auth Monitoring
      container.read(authServiceProvider);

      // Initialize Notifications & FCM asynchronously so they do not block startup
      unawaited(container.read(notificationServiceProvider).initialize().catchError((e, stack) {
        logger.error('NOTIFICATION_INIT_ERROR', e, stack);
      }));
      unawaited(container.read(fcmServiceProvider).initialize().catchError((e, stack) {
        logger.error('FCM_INIT_ERROR', e, stack);
      }));

      // Warm update check provider to check for updates on startup
      container.read(updateInfoProvider);

      // Set up periodic update checks every 5 minutes while the app is active
      Timer.periodic(const Duration(minutes: 5), (timer) {
        container.invalidate(updateInfoProvider);
      });

      logger.info('APPLICATION_START: Flavor=development');

      // Sync any buffered presence logs from offline sessions
      BackgroundPresenceService().syncBufferedLogs();

      runApp(
        UncontrolledProviderScope(
          container: container,
          child: const SnackbarListener(
            child: MediaHiveApp(),
          ),
        ),
      );

      // ─── Background Presence Service Initialization ───────────────────────
      // Runs AFTER runApp so it cannot block or crash the startup sequence.
      // The try/catch isolates any Android-version-specific failures (e.g. Android 15
      // foreground service policy changes) from the rest of the app.
      unawaited(() async {
        try {
          final bgPresence = BackgroundPresenceService();
          await bgPresence.initializeService();
          logger.info('BG_PRESENCE: Service initialized successfully.');

          // Register token refresh handshake listener for the background isolate
          FlutterBackgroundService().on('requestRefresh').listen((event) async {
            try {
              debugPrint('BG_PRESENCE: Main isolate received requestRefresh event');
              final response = await Supabase.instance.client.auth.refreshSession();
              final newSession = response.session;
              if (newSession != null) {
                const storage = FlutterSecureStorage();
                await storage.write(key: 'access_token', value: newSession.accessToken);
                await storage.write(key: 'refresh_token', value: newSession.refreshToken);
                final expiresAt = DateTime.now().add(Duration(seconds: newSession.expiresIn ?? 3600));
                await storage.write(key: 'token_expires_at', value: expiresAt.toIso8601String());
                FlutterBackgroundService().invoke('tokenRefreshResponse', {
                  'accessToken': newSession.accessToken,
                  'refreshToken': newSession.refreshToken,
                  'expiresAt': expiresAt.toIso8601String(),
                });
                debugPrint('BG_PRESENCE: Token refresh handshake completed.');
              }
            } catch (e) {
              debugPrint('BG_PRESENCE: Token refresh handshake failed: $e');
            }
          });

          // ─── Session Resume: if the user was checked in when the app restarted
          // (e.g. after an OTA update, reboot, or force-close), restart the tracker.
          // Wait for Supabase to restore the persisted session from storage before
          // checking currentUser — it may be null immediately at startup.
          Future<void> tryResumeSession(String userId) async {
            try {
              final isAlreadyRunning = await FlutterBackgroundService().isRunning();
              if (isAlreadyRunning) {
                logger.info('BG_PRESENCE: Service already running, skipping resume.');
                return;
              }

              // Check Supabase for an active attendance session
              // NOTE: attendance.nfcTagId stores the nfc_tags UUID (primary key),
              //       NOT the raw hardware tag ID. So we look up nfc_tags by 'id'.
              final activeData = await Supabase.instance.client
                  .from('attendance')
                  .select('id, nfcTagId')
                  .eq('userId', userId)
                  .eq('attendanceState', 'active')
                  .order('checkInTime', ascending: false)
                  .limit(1)
                  .maybeSingle();

              if (activeData != null) {
                final attendanceId = activeData['id'] as String;
                final nfcTagUuid = activeData['nfcTagId'] as String?;

                if (nfcTagUuid != null) {
                  // Look up by nfc_tags.id (the UUID primary key)
                  final tagData = await Supabase.instance.client
                      .from('nfc_tags')
                      .select('latitude, longitude, radius')
                      .eq('id', nfcTagUuid)
                      .maybeSingle();

                  if (tagData != null) {
                    await bgPresence.startTracking(
                      attendanceId: attendanceId,
                      userId: userId,
                      officeLatitude: (tagData['latitude'] as num).toDouble(),
                      officeLongitude: (tagData['longitude'] as num).toDouble(),
                      officeRadiusMeters: (tagData['radius'] as num).toDouble(),
                    );
                    logger.info('BG_PRESENCE: Resumed tracking for existing active session $attendanceId');
                  } else {
                    logger.warning('BG_PRESENCE: No nfc_tags row found for UUID=$nfcTagUuid — cannot resume.');
                  }
                }
              } else {
                logger.info('BG_PRESENCE: No active attendance session found — tracker not started.');
              }
            } catch (e) {
              logger.warning('BG_PRESENCE: Session resume check failed (non-fatal): $e');
            }
          }

          // If the user is already available (cached session), resume immediately.
          // Otherwise, wait for the first auth state event (signedIn / tokenRefreshed).
          final immediateUser = Supabase.instance.client.auth.currentUser;
          if (immediateUser != null) {
            await tryResumeSession(immediateUser.id);
          } else {
            // Session may not be restored yet — wait for the auth stream.
            StreamSubscription? sub;
            sub = Supabase.instance.client.auth.onAuthStateChange.listen((data) async {
              final event = data.event;
              if (event == AuthChangeEvent.signedIn || event == AuthChangeEvent.tokenRefreshed) {
                final uid = data.session?.user.id;
                if (uid != null) {
                  await tryResumeSession(uid);
                }
                await sub?.cancel();
              }
            });
          }
        } catch (e, stack) {
          // Non-fatal: log but do not crash the app
          debugPrint('BG_PRESENCE_INIT_ERROR: $e');
          crashLogService.record('BG_PRESENCE_INIT_ERROR', e, stack);
        }
      }());

      // ─── Build Number Telemetry ───────────────────────────────────────────
      // Reports this device's build number to Supabase so the release script
      // can always determine the true highest build in the wild before releasing.
      // Uses MAX-only logic: never overwrites with a lower value.
      unawaited(() async {
        try {
          final info = await PackageInfo.fromPlatform();
          final thisBuild = int.tryParse(info.buildNumber) ?? 0;
          if (thisBuild > 0) {
            final stored = await Supabase.instance.client
                .from('system_config')
                .select('value')
                .eq('key', 'app_max_client_build')
                .maybeSingle();
            final storedMax = int.tryParse(stored?['value'] ?? '0') ?? 0;
            if (thisBuild > storedMax) {
              await Supabase.instance.client.from('system_config').upsert(
                {'key': 'app_max_client_build', 'value': thisBuild.toString()},
                onConflict: 'key',
              );
              debugPrint('BUILD_TELEMETRY: Reported new max build $thisBuild to Supabase (was $storedMax)');
            } else {
              debugPrint('BUILD_TELEMETRY: Build $thisBuild <= stored max $storedMax, no update needed.');
            }
          }
        } catch (e) {
          debugPrint('BUILD_TELEMETRY: Non-fatal error reporting build number: $e');
        }
      }());
    },
    (error, stack) {
      debugPrint('ZONE_ERROR: $error\n$stack');
      crashLogService.record('ZONE_ERROR', error, stack);
    },
  );
}

class MediaHiveApp extends ConsumerWidget {
  const MediaHiveApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Warm up the attendance location exit monitor
    ref.watch(attendanceLocationMonitorProvider);
    ref.watch(attendanceReminderServiceProvider);

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
      // ── Spatial UI (VisionOS) Light Theme ─────────────────────────────────
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        fontFamily: 'Muli',
        textTheme: const TextTheme(
          // ── Display — Hero/splash text ────────────────────────────
          displayLarge:  TextStyle(fontSize: 34, fontWeight: FontWeight.w800, height: 1.15, letterSpacing: -0.5, color: DesignTokens.lightTextPrimary),
          displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, height: 1.18, letterSpacing: -0.3, color: DesignTokens.lightTextPrimary),
          displaySmall:  TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.20, letterSpacing: -0.2, color: DesignTokens.lightTextPrimary),
          // ── Headline — Section headers ────────────────────────────
          headlineLarge:  TextStyle(fontSize: 22, fontWeight: FontWeight.w700, height: 1.22, letterSpacing: -0.15, color: DesignTokens.lightTextPrimary),
          headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, height: 1.25, letterSpacing: -0.1, color: DesignTokens.lightTextPrimary),
          headlineSmall:  TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.28, color: DesignTokens.lightTextPrimary),
          // ── Title — Card/list titles ──────────────────────────────
          titleLarge:  TextStyle(fontSize: 17, fontWeight: FontWeight.w600, height: 1.30, color: DesignTokens.lightTextPrimary),
          titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, height: 1.35, color: DesignTokens.lightTextPrimary),
          titleSmall:  TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.35, letterSpacing: 0.1, color: DesignTokens.lightTextSecondary),
          // ── Body — Paragraph / description text ───────────────────
          bodyLarge:  TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.50, color: DesignTokens.lightTextPrimary),
          bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.50, color: DesignTokens.lightTextSecondary),
          bodySmall:  TextStyle(fontSize: 12, fontWeight: FontWeight.w400, height: 1.45, color: DesignTokens.lightTextMuted),
          // ── Label — Buttons, badges, uppercase category tags ──────
          labelLarge:  TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.20, letterSpacing: 0.3, color: DesignTokens.lightTextPrimary),
          labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.20, letterSpacing: 0.5, color: DesignTokens.lightTextSecondary),
          labelSmall:  TextStyle(fontSize: 10, fontWeight: FontWeight.w700, height: 1.20, letterSpacing: 0.8, color: DesignTokens.lightTextMuted),
        ),
        // Sky-canvas background — cards float above it via depth shadows
        scaffoldBackgroundColor: DesignTokens.lightBackground,
        colorScheme: ColorScheme.fromSeed(
          seedColor: DesignTokens.lightHoney,
          brightness: Brightness.light,
          primary: DesignTokens.lightHoney,
          onPrimary: Colors.white,
          secondary: const Color(0xFF5E5CE6),   // VisionOS indigo
          onSecondary: Colors.white,
          surface: DesignTokens.lightSurface,
          onSurface: DesignTokens.lightTextPrimary,
          error: DesignTokens.danger,
          onError: Colors.white,
          outline: DesignTokens.lightBorder,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          foregroundColor: DesignTokens.lightTextPrimary,
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        dividerColor: DesignTokens.lightBorder,
        snackBarTheme: SnackBarThemeData(
          backgroundColor: DesignTokens.lightSurface.withValues(alpha: 0.9),
          contentTextStyle: const TextStyle(color: DesignTokens.lightTextPrimary),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusM),
          ),
          behavior: SnackBarBehavior.floating,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: DesignTokens.lightSurface.withValues(alpha: 0.7),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusL),
            borderSide: const BorderSide(color: DesignTokens.lightBorder, width: 0.75),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusL),
            borderSide: const BorderSide(color: DesignTokens.lightBorder, width: 0.75),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusL),
            borderSide: const BorderSide(color: DesignTokens.lightHoney, width: 1.5),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: DesignTokens.lightHoney,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: DesignTokens.lightTextPrimary,
            side: BorderSide(color: DesignTokens.lightBorder.withValues(alpha: 0.6), width: 0.75),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
          ),
        ),
      ),
      // ── Dark Theme ──────────────────────────────────────────────────────────
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: 'Muli',
        textTheme: const TextTheme(
          // ── Display — Hero/splash text ────────────────────────────
          displayLarge:  TextStyle(fontSize: 34, fontWeight: FontWeight.w800, height: 1.15, letterSpacing: -0.5, color: Colors.white),
          displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, height: 1.18, letterSpacing: -0.3, color: Colors.white),
          displaySmall:  TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.20, letterSpacing: -0.2, color: Colors.white),
          // ── Headline — Section headers ────────────────────────────
          headlineLarge:  TextStyle(fontSize: 22, fontWeight: FontWeight.w700, height: 1.22, letterSpacing: -0.15, color: Colors.white),
          headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, height: 1.25, letterSpacing: -0.1, color: Colors.white),
          headlineSmall:  TextStyle(fontSize: 18, fontWeight: FontWeight.w600, height: 1.28, color: Colors.white),
          // ── Title — Card/list titles ──────────────────────────────
          titleLarge:  TextStyle(fontSize: 17, fontWeight: FontWeight.w600, height: 1.30, color: Colors.white),
          titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, height: 1.35, color: Colors.white),
          titleSmall:  TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.35, letterSpacing: 0.1, color: DesignTokens.textSecondary),
          // ── Body — Paragraph / description text ───────────────────
          bodyLarge:  TextStyle(fontSize: 16, fontWeight: FontWeight.w400, height: 1.50, color: Colors.white),
          bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, height: 1.50, color: DesignTokens.textSecondary),
          bodySmall:  TextStyle(fontSize: 12, fontWeight: FontWeight.w400, height: 1.45, color: Color(0xFF9E9E9E)),
          // ── Label — Buttons, badges, uppercase category tags ──────
          labelLarge:  TextStyle(fontSize: 14, fontWeight: FontWeight.w600, height: 1.20, letterSpacing: 0.3, color: Colors.white),
          labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.20, letterSpacing: 0.5, color: DesignTokens.textSecondary),
          labelSmall:  TextStyle(fontSize: 10, fontWeight: FontWeight.w700, height: 1.20, letterSpacing: 0.8, color: Color(0xFF9E9E9E)),
        ),
        scaffoldBackgroundColor: DesignTokens.backgroundPrimary,
        colorScheme: ColorScheme.fromSeed(
          seedColor: DesignTokens.honey,
          brightness: Brightness.dark,
          primary: DesignTokens.honey,       // Gold
          onPrimary: Colors.black,
          secondary: DesignTokens.softGold,     // Soft Gold
          onSecondary: Colors.black,
          surface: DesignTokens.surface,
          onSurface: Colors.white,
          error: DesignTokens.danger,
          onError: Colors.white,
          outline: DesignTokens.border,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        dividerColor: DesignTokens.border,
        snackBarTheme: SnackBarThemeData(
          backgroundColor: DesignTokens.surface,
          contentTextStyle: const TextStyle(color: Colors.white),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusM),
          ),
          behavior: SnackBarBehavior.floating,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: DesignTokens.surface,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusL),
            borderSide: const BorderSide(color: DesignTokens.border, width: 0.75),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusL),
            borderSide: const BorderSide(color: DesignTokens.border, width: 0.75),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(DesignTokens.radiusL),
            borderSide: const BorderSide(color: DesignTokens.honey, width: 1.5),
          ),
          labelStyle: const TextStyle(color: DesignTokens.textSecondary),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: DesignTokens.honey,
            foregroundColor: Colors.black,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            side: BorderSide(color: DesignTokens.border.withValues(alpha: 0.5), width: 0.75),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
          ),
        ),
      ),
      themeMode: themeMode,
    );
  }
}
