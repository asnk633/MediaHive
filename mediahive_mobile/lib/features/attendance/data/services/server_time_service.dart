import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

class ServerTimeService {
  final SupabaseClient _client;
  final _logger = LoggerService();

  ServerTimeService(this._client);

  /// Fetch the authoritative UTC server time from Postgres.
  /// Falls back to local UTC time with a warning if the RPC fails.
  Future<DateTime> getServerTime() async {
    try {
      final response = await _client.rpc('get_server_time');
      if (response != null) {
        final parsed = DateTime.tryParse(response.toString());
        if (parsed != null) {
          return parsed.toUtc();
        }
      }
      _logger.warning('RPC get_server_time returned null/empty. Using local UTC time fallback.');
      return DateTime.now().toUtc();
    } catch (e) {
      _logger.error('Error fetching server time from RPC: $e. Using local UTC time fallback.');
      return DateTime.now().toUtc();
    }
  }
}
