import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/tasks/domain/models/task.dart';
import '../../features/calendar/domain/models/event.dart';
import '../../features/tasks/presentation/providers/tasks_provider.dart';
import '../../features/calendar/presentation/providers/events_provider.dart';

class WorkflowService {
  final Ref _ref;

  WorkflowService(this._ref);

  /// Get all tasks linked to a specific event
  List<Task> getTasksForEvent(String eventId) {
    final tasks = _ref.read(tasksListProvider).valueOrNull ?? [];
    return tasks.where((t) => t.eventId == eventId).toList();
  }

  /// Calculate the operational readiness percentage of an event based on linked tasks
  double getEventReadiness(String eventId) {
    final linkedTasks = getTasksForEvent(eventId);
    if (linkedTasks.isEmpty) return 1.0; // Assume ready if no prep tasks defined

    final completedTasks = linkedTasks.where((t) => t.status.toLowerCase() == 'done').length;
    return completedTasks / linkedTasks.length;
  }

  /// Check for bottlenecks (Team members with too many active tasks)
  Map<String, int> getTeamWorkload() {
    final tasks = _ref.read(tasksListProvider).valueOrNull ?? [];
    final activeTasks = tasks.where((t) => t.status.toLowerCase() != 'done');
    
    final workload = <String, int>{};
    for (final task in activeTasks) {
      workload[task.assignee] = (workload[task.assignee] ?? 0) + 1;
    }
    return workload;
  }

  /// Check if an equipment has any booking conflicts (overlapping times)
  bool hasBookingConflict(String equipmentId) {
    // Note: Real implementation would check overlapping intervals in the bookings list
    // For now, we'll return false to maintain stability until booking logic is fully reactive
    return false;
  }
}

final workflowServiceProvider = Provider<WorkflowService>((ref) {
  return WorkflowService(ref);
});
