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

  return tasksAsync.maybeWhen(
    data: (tasks) {
      final inventory = inventoryAsync.valueOrNull ?? [];
      final profile = profileAsync.valueOrNull;
      final fullName = profile?['full_name'] as String?;
      final role = (profile?['role']?.toString() ?? 'member').toLowerCase();
      final isAdmin = role.contains('admin') || role.contains('manager');

      // 1. Common Data
      final now = DateTime.now();
      final todayStr = DateFormat('yyyy-MM-dd').format(now);
      final tomorrow = now.add(const Duration(days: 1));
      final tomorrowStr = DateFormat('yyyy-MM-dd').format(tomorrow);
      
      final teamTodayTasks = tasks.where((t) => t.dueDate == todayStr).toList();
      final events = eventsAsync.valueOrNull ?? [];

      // 2. Admin Metrics (Bottleneck Detection)
      Map<String, dynamic>? adminMetrics;
      if (isAdmin) {
        final totalTasks = tasks.length;
        final pendingTasks = tasks.where((t) => t.status != 'done').toList();
        final completedTasks = totalTasks - pendingTasks.length;
        
        // Overdue count
        final overdueCount = pendingTasks.where((t) {
          try {
            final d = DateTime.parse(t.dueDate);
            return d.isBefore(DateTime(now.year, now.month, now.day));
          } catch (_) { return false; }
        }).length;

        // Workload & Bottlenecks
        final Map<String, int> workload = {};
        for (var t in pendingTasks) {
          workload[t.assignee] = (workload[t.assignee] ?? 0) + 1;
        }
        
        final bottlenecks = workload.entries
            .where((e) => e.value >= 5)
            .map((e) => e.key)
            .toList();

        // Institutional Pressure Points (Events in next 48h)
        final pressurePoints = events.where((e) {
          try {
            final d = DateTime.parse(e.date);
            return d.isBefore(now.add(const Duration(hours: 48))) && d.isAfter(now.subtract(const Duration(hours: 1)));
          } catch (_) { return false; }
        }).length;

        // Inventory Alerts
        final lowStockCount = inventory.where((i) => i.quantity <= i.minStockLevel).length;

        adminMetrics = {
          'institutionalHealth': totalTasks > 0 ? (completedTasks / totalTasks * 100).toInt() : 0,
          'lowStockCount': lowStockCount,
          'workload': workload,
          'bottlenecks': bottlenecks,
          'pressurePoints': pressurePoints,
          'overdueCount': overdueCount,
          'alerts': [
            if (overdueCount > 0) '$overdueCount tasks are currently overdue',
            if (lowStockCount > 0) '$lowStockCount items require restocking',
            if (bottlenecks.isNotEmpty) '${bottlenecks.length} team members overloaded',
          ],
        };
      }

      // 3. Team Metrics (Immediate Priorities)
      final myTasks = tasks.where((t) => t.assignee == fullName || t.requester == fullName).toList();
      final myPending = myTasks.where((t) => t.status != 'done').toList();
      
      final myPriorities = myPending.where((t) {
        if (t.isBlocked) return true;
        try {
          final d = DateTime.parse(t.dueDate);
          return d.isBefore(tomorrow);
        } catch (_) { return false; }
      }).toList();
      
      final teamMetrics = {
        'myPendingCount': myPending.length,
        'myPrioritiesCount': myPriorities.length,
        'myPriorities': myPriorities,
        'productivity': myTasks.isNotEmpty 
            ? (myTasks.where((t) => t.status == 'done').length / myTasks.length * 100).toInt() 
            : 0,
      };

      final requestsList = tasks.where((t) => t.requester == fullName).toList();
      final myRequestsMetrics = {
        'total': requestsList.length,
        'pending': requestsList.where((t) => t.status == 'todo').length,
        'inProgress': requestsList.where((t) => t.status == 'in_progress').length,
        'inReview': requestsList.where((t) => t.status == 'review').length,
        'completed': requestsList.where((t) => t.status == 'done').length,
        'fulfilled': requestsList.where((t) => t.status == 'done').length,
        'progress': requestsList.isNotEmpty ? (requestsList.where((t) => t.status == 'done').length / requestsList.length * 100).toInt() : 0,
      };

      return {
        'isAdmin': isAdmin,
        'admin': adminMetrics,
        'team': teamMetrics,
        'myRequests': myRequestsMetrics,
        'systemStatus': {
          'dueToday': teamTodayTasks.where((t) => t.status != 'done').length.toString(),
          'inProgress': teamTodayTasks.where((t) => t.status == 'in_progress').length.toString(),
          'onHold': teamTodayTasks.where((t) => t.status == 'review' || t.isBlocked).length.toString(),
          'completed': teamTodayTasks.where((t) => t.status == 'done').length.toString(),
          'totalTodayCount': teamTodayTasks.length,
        },
        'completion': {
          'percentage': teamTodayTasks.isNotEmpty 
              ? (teamTodayTasks.where((t) => t.status == 'done').length / teamTodayTasks.length * 100).toInt() 
              : 0,
          'label': '${teamTodayTasks.where((t) => t.status == 'done').length} of ${teamTodayTasks.length} today tasks completed',
        },
      };
    },
    orElse: () => {
      'isAdmin': false,
      'myRequests': {
        'total': 0,
        'pending': 0,
        'inProgress': 0,
        'inReview': 0,
        'completed': 0,
        'fulfilled': 0,
        'progress': 0,
      },
      'systemStatus': {'dueToday': '0', 'inProgress': '0', 'onHold': '0', 'completed': '0', 'totalTodayCount': 0},
      'completion': {'percentage': 0, 'label': 'No tasks today'},
    },
  );
});
