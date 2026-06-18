import 'package:flutter_dotenv/flutter_dotenv.dart';

enum AppFlavor { development, staging, production }

String _getSupabaseAnonKey() {
  final key = dotenv.env['SUPABASE_ANON_KEY'];
  if (key == null || key.isEmpty) {
    throw StateError('SUPABASE_ANON_KEY is missing from .env. App cannot start.');
  }
  return key;
}

class EnvConfig {
  final AppFlavor flavor;
  final String apiBaseUrl;
  final String supabaseUrl;
  final String supabaseAnonKey;
  final bool enableAnalytics;
  final bool enableDetailedLogging;

  const EnvConfig({
    required this.flavor,
    required this.apiBaseUrl,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    this.enableAnalytics = false,
    this.enableDetailedLogging = true,
  });

  static EnvConfig get current {
    const flavorStr = String.fromEnvironment('FLAVOR', defaultValue: 'development');
    
    switch (flavorStr) {
      case 'production':
        return EnvConfig(
          flavor: AppFlavor.production,
          apiBaseUrl: 'https://thaiba-garden-media-manager.vercel.app',
          supabaseUrl: dotenv.env['SUPABASE_URL'] ?? 'https://fcctcorycpvebupluzpe.supabase.co',
          supabaseAnonKey: _getSupabaseAnonKey(),
          enableAnalytics: true,
          enableDetailedLogging: false,
        );
      case 'staging':
        return const EnvConfig(
          flavor: AppFlavor.staging,
          apiBaseUrl: 'https://staging-api.mediahive.app',
          supabaseUrl: 'STAGING_URL',
          supabaseAnonKey: 'STAGING_KEY',
          enableAnalytics: true,
          enableDetailedLogging: true,
        );
      default:
        return EnvConfig(
          flavor: AppFlavor.development,
          apiBaseUrl: 'http://10.0.2.2:3000',
          supabaseUrl: dotenv.env['SUPABASE_URL'] ?? 'https://fcctcorycpvebupluzpe.supabase.co',
          supabaseAnonKey: _getSupabaseAnonKey(),
          enableAnalytics: false,
          enableDetailedLogging: true,
        );
    }
  }

  bool get isProduction => flavor == AppFlavor.production;
  bool get isDevelopment => flavor == AppFlavor.development;
}
