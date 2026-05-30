import 'package:flutter_dotenv/flutter_dotenv.dart';

enum AppFlavor { development, staging, production }

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
          apiBaseUrl: 'https://api.mediahive.app',
          supabaseUrl: dotenv.env['SUPABASE_URL'] ?? 'PROD_URL',
          supabaseAnonKey: dotenv.env['SUPABASE_ANON_KEY'] ?? 'PROD_KEY',
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
          apiBaseUrl: 'http://localhost:3000',
          supabaseUrl: dotenv.env['SUPABASE_URL'] ?? 'https://fcctcorycpvebupluzpe.supabase.co',
          supabaseAnonKey: dotenv.env['SUPABASE_ANON_KEY'] ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNjQ1NDEsImV4cCI6MjA4Nzg0MDU0MX0.D2X24KYzoN5tNXZgPaVT7cMWDE2TxYlCeFEa5DHcn1M',
          enableAnalytics: false,
          enableDetailedLogging: true,
        );
    }
  }

  bool get isProduction => flavor == AppFlavor.production;
  bool get isDevelopment => flavor == AppFlavor.development;
}
