import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/repositories/notification_repository.dart';
import '../../../../core/services/logger_service.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final logger = ref.watch(loggerProvider.notifier);
  return NotificationRepository(Supabase.instance.client, logger);
});

final currentTimeProvider = StreamProvider<DateTime>((ref) {
  return Stream.periodic(const Duration(minutes: 1), (_) => DateTime.now().toUtc());
});

final notificationsStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  final repository = ref.watch(notificationRepositoryProvider);
  final now = ref.watch(currentTimeProvider).value ?? DateTime.now().toUtc();
  
  return repository.getNotifications().map((list) {
    return list.where((n) {
      final scheduledAtStr = n['scheduled_at'] as String?;
      if (scheduledAtStr == null) return true;
      
      final scheduledAt = DateTime.tryParse(scheduledAtStr)?.toUtc();
      if (scheduledAt == null) return true;
      
      return scheduledAt.isBefore(now);
    }).toList();
  });
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notificationsAsync = ref.watch(notificationsStreamProvider);
  return notificationsAsync.when(
    data: (notifications) => notifications.where((n) => n['read'] == false).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
