import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SystemLogger {
  static Future<void> log({
    required String title,
    required String description,
    required String actionType,
    String? actorName,
  }) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      final defaultActorName = user?.email?.split('@').first.toUpperCase() ?? 'SYSTEM';
      
      await Supabase.instance.client.from('system_activity_logs').insert({
        'title': title,
        'description': description,
        'action_type': actionType,
        'actor_name': actorName ?? defaultActorName,
        'actor_id': user?.id,
      });
    } catch (e) {
      // Silently fail logging rather than breaking the app
      debugPrint('Failed to insert system log: $e');
    }
  }
}
