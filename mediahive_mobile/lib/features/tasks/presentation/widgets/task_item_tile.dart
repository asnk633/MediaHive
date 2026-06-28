import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/theme_provider.dart';
import 'package:mediahive_mobile/features/tasks/domain/models/task.dart';

class TaskItemTile extends ConsumerWidget {
  final Task task;
  final bool isOffline;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final VoidCallback? onDeleted;
  final VoidCallback? onLeadingTap;
  final VoidCallback? onStatusTap;

  const TaskItemTile({
    super.key,
    required this.task,
    required this.isOffline,
    this.onTap,
    this.onLongPress,
    this.onDeleted,
    this.onLeadingTap,
    this.onStatusTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final isDone = task.status.toString().toLowerCase() == 'done';

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    DateTime? dueDate;
    try {
      dueDate = DateTime.parse(task.dueDate);
    } catch (_) {}

    final isOverdue = !isDone && dueDate != null && dueDate.isBefore(today);
    final isDueToday = !isDone && dueDate != null &&
        dueDate.year == today.year &&
        dueDate.month == today.month &&
        dueDate.day == today.day;

    Color dismissColor;
    final p = task.priority.toLowerCase();
    if (p == 'low') {
      dismissColor = Colors.grey.shade600;
    } else if (p == 'high') {
      dismissColor = Colors.amber.shade700;
    } else if (p == 'urgent') {
      dismissColor = Colors.red.shade700;
    } else {
      dismissColor = colors.error;
    }

    return Dismissible(
      key: Key(task.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: dismissColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Icon(LucideIcons.trash2, color: Colors.white),
      ),
      onDismissed: (direction) {
        onDeleted?.call();
      },
      child: GestureDetector(
        onTap: onTap,
        onLongPress: onLongPress,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 300),
          opacity: isDone ? 0.6 : 1.0,
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.isDark
                  ? colors.surface
                  : (isDone ? colors.surface.withValues(alpha: 0.5) : Colors.white),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isOverdue
                    ? colors.error.withValues(alpha: 0.5)
                    : (isDone
                        ? colors.emerald.withValues(alpha: 0.2)
                        : colors.border.withValues(alpha: colors.isDark ? 0.5 : 0.12)),
                width: isOverdue ? 1.5 : 1,
              ),
              boxShadow: [
                if (isOverdue)
                  BoxShadow(
                    color: colors.error.withValues(alpha: 0.1),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                if (!isDone && !isOverdue)
                  BoxShadow(
                    color: colors.border.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
              ],
            ),
            child: Row(
              children: [
                _buildTaskLeading(ref, colors, isOverdue: isOverdue),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              task.title,
                              style: AppTypography.bodyM.copyWith(
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                                decoration: isDone ? TextDecoration.lineThrough : null,
                                color: isOverdue ? colors.error : (isDone ? colors.textSecondary : colors.textPrimary),
                              ),
                            ),
                          ),
                          if (task.isBlocked)
                            Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: Icon(LucideIcons.lock, size: 12, color: colors.error),
                            ),
                          if (task.requiresReview)
                            Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: Icon(LucideIcons.eye, size: 12, color: colors.honey),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(LucideIcons.user, size: 10, color: colors.textSecondary.withValues(alpha: 0.4)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '${task.requester ?? 'System'} \u2192 ${task.assignee ?? 'Unassigned'}',
                              style: AppTypography.caption.copyWith(
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                                color: colors.textSecondary.withValues(alpha: 0.6),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          Semantics(
                            label: 'Priority: ${task.priority}',
                            child: _buildMiniTag(
                              context,
                              _getPriorityIcon(task.priority),
                              task.priority.toUpperCase(),
                              _getPriorityColor(task.priority, colors),
                            ),
                          ),
                          Semantics(
                            label: 'Due Date: ${_formatDate(task.dueDate)}',
                            child: _buildMiniTag(
                              context,
                              LucideIcons.calendar,
                              _formatDate(task.dueDate),
                              colors.textSecondary.withValues(alpha: 0.6),
                            ),
                          ),
                          if (task.department != null && task.department!.trim().isNotEmpty)
                            Semantics(
                              label: 'Department: ${task.department}',
                              child: _buildMiniTag(
                                context,
                                LucideIcons.building2,
                                task.department!.toUpperCase(),
                                colors.indigo.withValues(alpha: 0.8),
                              ),
                            ),
                          if (isDone && (task.completedByName != null || task.completionDate != null))
                            Semantics(
                              label: _formatCompletionInfo(task),
                              child: _buildMiniTag(
                                context,
                                LucideIcons.checkCircle2,
                                _formatCompletionInfo(task),
                                colors.emerald.withValues(alpha: 0.9),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                _buildStatusChip(ref, colors),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTaskLeading(WidgetRef ref, ThemeColors colors, {bool isOverdue = false}) {
    final isDone = task.status.toString().toLowerCase() == 'done';
    final color = isDone ? colors.emerald : (isOverdue ? colors.error : _getStatusColor(task.status, colors));

    return GestureDetector(
      onTap: onLeadingTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isDone ? colors.emerald.withValues(alpha: 0.1) : Colors.transparent,
          shape: BoxShape.circle,
          border: Border.all(
            color: isDone
                ? colors.emerald
                : (isOverdue ? colors.error : colors.border.withValues(alpha: 0.8)),
            width: 1.5,
          ),
        ),
        child: Center(
          child: isDone
              ? Icon(LucideIcons.check, size: 14, color: colors.emerald)
              : (isOverdue
                  ? Icon(LucideIcons.alertTriangle, size: 10, color: colors.error)
                  : null),
        ),
      ),
    );
  }

  Widget _buildStatusChip(WidgetRef ref, ThemeColors colors) {
    final status = task.status;
    final normalizedStatus = status.toLowerCase();
    Color chipColor = colors.textSecondary;
    String label = status.toUpperCase();

    if (normalizedStatus == 'done') chipColor = colors.emerald;
    if (normalizedStatus == 'in_progress') chipColor = colors.indigo;
    if (normalizedStatus == 'review') chipColor = colors.honey;
    if (normalizedStatus == 'todo' || normalizedStatus == 'to do') {
      chipColor = colors.textSecondary;
      label = 'TODO';
    }

    return GestureDetector(
      onTap: onStatusTap,
      child: Semantics(
        label: 'Status: $label',
        button: onStatusTap != null,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: chipColor.withValues(alpha: isOffline ? 0.05 : 0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: chipColor.withValues(alpha: isOffline ? 0.1 : 0.3)),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isOffline ? chipColor.withValues(alpha: 0.5) : chipColor,
              fontSize: 9,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status, ThemeColors colors) {
    final normalizedStatus = status.toLowerCase();
    if (normalizedStatus == 'done') return colors.emerald;
    if (normalizedStatus == 'in_progress') return colors.indigo;
    if (normalizedStatus == 'review') return colors.honey;
    return colors.textSecondary;
  }

  Widget _buildMiniTag(BuildContext context, IconData icon, String label, Color color) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width - 120),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 9,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getPriorityIcon(String priority) {
    final p = priority.toLowerCase();
    if (p == 'urgent' || p == 'high') return LucideIcons.alertTriangle;
    if (p == 'medium') return LucideIcons.gauge;
    return LucideIcons.chevronDown;
  }

  Color _getPriorityColor(String priority, ThemeColors colors) {
    final p = priority.toLowerCase();
    if (p == 'urgent') return colors.error;
    if (p == 'high') return colors.error;
    if (p == 'medium') return colors.honey;
    return colors.emerald;
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'No Date';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd-MM-yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  String _formatCompletionInfo(Task task) {
    String name = task.completedByName ?? '';
    if (name.trim().isEmpty) {
      name = task.assignee ?? '';
    }
    if (name.trim().toLowerCase() == 'unassigned') {
      name = '';
    }
    final namePart = name.isNotEmpty ? ' by $name' : '';

    String timePart = '';
    if (task.completionDate != null) {
      try {
        final dt = DateTime.parse(task.completionDate!).toLocal();
        timePart = ' at ${DateFormat('MMM d, h:mm a').format(dt)}';
      } catch (_) {}
    }
    return 'Completed$namePart$timePart';
  }
}
