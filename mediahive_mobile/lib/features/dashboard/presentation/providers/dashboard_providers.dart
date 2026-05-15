import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../../../inventory/presentation/providers/inventory_provider.dart';
import '../../../calendar/presentation/providers/events_provider.dart';
import '../../../../core/providers/user_provider.dart';

final dashboardMetricsProvider = Provider((ref) {
  final tasksAsync = ref.watch(tasksListProvider);
  final inventoryAsync = ref.watch(inventoryListProvider);
  final eventsAsync = ref.watch(eventListProvider);
  final profileAsync = ref.watch(currentUserProfileProvider);

  final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
  final currentUserId = profileAsync.maybeWhen(data: (p) => p?['id'] as String?, orElse: () => null);

  return tasksAsync.maybeWhen(
    data: (tasks) {
      final profile = profileAsync.valueOrNull;
      final fullName = profile?['full_name'] as String?;

      // System Status (Team Today)
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final teamTodayTasks = tasks.where((t) => t.dueDate == today).toList();

      final dueToday = teamTodayTasks.where((t) => t.status == 'todo').length;
      final inProgress = teamTodayTasks.where((t) => t.status == 'in_progress').length;
      final inReview = teamTodayTasks.where((t) => t.status == 'review').length;
      final completedToday = teamTodayTasks.where((t) => t.status == 'done').length;

      // Completion Progress
      final totalToday = teamTodayTasks.length;
      final doneToday = completedToday;
      final completionPercentage = totalToday > 0 ? (doneToday / totalToday * 100).toInt() : 0;

      // My Requests
      final myTasks = tasks.where((t) => t.requester == fullName).toList();
      final myPendingCount = myTasks.where((t) => t.status == 'todo').length;
      final myInProgressCount = myTasks.where((t) => t.status == 'in_progress').length;
      final myInReviewCount = myTasks.where((t) => t.status == 'review').length;
      final myCompletedCount = myTasks.where((t) => t.status == 'done').length;
      final myTotal = myTasks.length;
      
      final requestProgressPercentage = myTotal > 0 ? (myCompletedCount / myTotal * 100).toInt() : 0;

      return {
        'systemStatus': {
          'dueToday': dueToday.toString(),
          'inProgress': inProgress.toString(),
          'onHold': inReview.toString(), // Mapping 'review' to 'onHold' for UI slots if needed, or just use it
          'completed': completedToday.toString(),
          'totalTodayCount': totalToday,
        },
        'completion': {
          'percentage': completionPercentage,
          'label': '$doneToday of $totalToday tasks completed',
        },
        'myRequests': {
          'total': myTotal.toString(),
          'pending': myPendingCount.toString(),
          'inProgress': myInProgressCount.toString(),
          'inReview': myInReviewCount.toString(),
          'completed': myCompletedCount.toString(),
          'fulfilled': myCompletedCount.toString(),
          'progress': requestProgressPercentage,
        },
        'inventoryCount': inventoryAsync.maybeWhen(data: (items) => items.length.toString(), orElse: () => '0'),
      };
    },
    orElse: () => {
      'systemStatus': {'dueToday': '0', 'inProgress': '0', 'onHold': '0', 'completed': '0', 'totalTodayCount': 0},
      'completion': {'percentage': 0, 'label': '0 of 0 tasks completed'},
      'myRequests': {
        'total': '0', 
        'pending': '0', 
        'inProgress': '0', 
        'inReview': '0', 
        'completed': '0',
        'fulfilled': '0',
        'progress': 0,
      },
      'inventoryCount': '0',
    },
  );
});
