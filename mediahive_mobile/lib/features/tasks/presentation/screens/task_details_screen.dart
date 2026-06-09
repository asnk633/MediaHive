import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme_provider.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/providers/ui_providers.dart';
import '../providers/tasks_provider.dart';
import '../../domain/models/task.dart';

class TaskDetailsScreen extends ConsumerStatefulWidget {
  final Task task;

  const TaskDetailsScreen({
    super.key,
    required this.task,
  });

  @override
  ConsumerState<TaskDetailsScreen> createState() => _TaskDetailsScreenState();
}

class _TaskDetailsScreenState extends ConsumerState<TaskDetailsScreen> {
  bool _isLoading = false;

  bool get _isEditingAllowed {
    final profile = ref.read(currentUserProfileProvider).valueOrNull;
    if (profile == null) return false;
    final role = profile['role']?.toString().toLowerCase() ?? 'member';
    final currentUserId = profile['id'] as String?;
    final currentUserFullName = profile['full_name'] as String?;
    
    if (role == 'admin' || role == 'manager' || role == 'super admin' || role == 'super_admin') return true;
    
    // For others, only if they created it
    return (currentUserId != null && widget.task.createdBy == currentUserId) || 
           (currentUserFullName != null && widget.task.requester == currentUserFullName);
  }

  Future<void> _confirmDelete(BuildContext context, ThemeColors colors) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.backgroundSecondary,
        title: Text('Delete Task', style: AppTypography.h3.copyWith(color: colors.error, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to permanently delete this task? This action cannot be undone.', style: AppTypography.bodyM.copyWith(color: colors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: colors.error),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);
      ref.read(loadingMessageProvider.notifier).state = "Deleting Task...";
      ref.read(globalLoadingProvider.notifier).state = true;

      try {
        await ref.read(tasksListProvider.notifier).deleteTask(widget.task.id);
        ref.read(globalLoadingProvider.notifier).state = false;
        if (mounted) {
          context.pop(); // Go back to previous screen
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
          ref.read(globalLoadingProvider.notifier).state = false;
        }
      }
    }
  }

  String _formatDate(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'No Date';
    try {
      final date = DateTime.parse(isoString).toLocal();
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return isoString;
    }
  }

  Color _getPriorityColor(String priority, ThemeColors colors) {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'high':
        return colors.error;
      case 'medium':
        return colors.honey;
      case 'low':
        return colors.emerald;
      default:
        return colors.textSecondary;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'high':
        return LucideIcons.alertTriangle;
      case 'medium':
        return LucideIcons.clock;
      case 'low':
        return LucideIcons.arrowDownCircle;
      default:
        return LucideIcons.circle;
    }
  }

  Color _getStatusColor(String status, ThemeColors colors) {
    switch (status.toLowerCase()) {
      case 'todo':
      case 'to do':
        return colors.textSecondary;
      case 'in_progress':
      case 'in progress':
      case 'inprogress':
        return colors.honey;
      case 'review':
      case 'in review':
      case 'inreview':
        return colors.indigo;
      case 'done':
      case 'completed':
        return colors.emerald;
      case 'on_hold':
      case 'on hold':
        return colors.error.withValues(alpha: 0.8);
      default:
        return colors.textSecondary;
    }
  }

  Widget _buildDetailRow(String label, String value, IconData icon, ThemeColors colors, {Color? iconColor, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: iconColor ?? colors.textSecondary.withValues(alpha: 0.7)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: TextStyle(
                    color: colors.textSecondary.withValues(alpha: 0.7),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    color: valueColor ?? colors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Removed _buildMetadataTags and _buildMiniTag

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isDone = widget.task.status.toLowerCase() == 'done';
    
    // Formatting completion info if done
    String? completionText;
    if (isDone) {
      String name = widget.task.completedByName ?? '';
      if (name.trim().isEmpty) {
        name = widget.task.assignee ?? '';
      }
      if (name.trim().toLowerCase() == 'unassigned') {
        name = '';
      }
      final namePart = name.isNotEmpty ? ' by $name' : '';
      
      String timePart = '';
      if (widget.task.completionDate != null) {
        try {
          final dt = DateTime.parse(widget.task.completionDate!).toLocal();
          timePart = ' at ${DateFormat('MMM d, h:mm a').format(dt)}';
        } catch (_) {}
      }
      completionText = 'Completed$namePart$timePart';
    }

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: colors.backgroundPrimary.withValues(alpha: 0.8),
        elevation: 0,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.transparent),
          ),
        ),
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colors.textPrimary),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (_isEditingAllowed) ...[
            IconButton(
              icon: Icon(LucideIcons.edit2, color: colors.textPrimary),
              tooltip: 'Edit Task',
              onPressed: () {
                context.push('/create-task', extra: widget.task);
              },
            ),
            IconButton(
              icon: Icon(LucideIcons.trash2, color: colors.error),
              tooltip: 'Delete Task',
              onPressed: () => _confirmDelete(context, colors),
            ),
          ],
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colors.backgroundSecondary,
              colors.backgroundPrimary,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: _isLoading 
          ? Center(child: CircularProgressIndicator(color: colors.indigo))
          : SingleChildScrollView(
              padding: const EdgeInsets.only(top: 140, left: 24, right: 24, bottom: 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.task.title,
                    style: AppTypography.h2.copyWith(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w900,
                      decoration: isDone ? TextDecoration.lineThrough : null,
                      decorationColor: colors.textSecondary,
                    ),
                  ),
                  
                  if (completionText != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: colors.emerald.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: colors.emerald.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.checkCircle2, size: 14, color: colors.emerald),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              completionText,
                              style: TextStyle(
                                color: colors.emerald,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: 32),
                  
                  Text(
                    'DESCRIPTION',
                    style: TextStyle(
                      color: colors.textSecondary.withValues(alpha: 0.7),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colors.surface.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: colors.border.withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      (widget.task.description != null && widget.task.description!.trim().isNotEmpty)
                          ? widget.task.description!
                          : 'No description provided.',
                      style: TextStyle(
                        color: (widget.task.description != null && widget.task.description!.trim().isNotEmpty)
                            ? colors.textSecondary
                            : colors.textSecondary.withValues(alpha: 0.5),
                        fontStyle: (widget.task.description != null && widget.task.description!.trim().isNotEmpty)
                            ? FontStyle.normal
                            : FontStyle.italic,
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  Text(
                    'DETAILS',
                    style: TextStyle(
                      color: colors.textSecondary.withValues(alpha: 0.7),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colors.surface.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: colors.border.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      children: [
                        _buildDetailRow(
                          'Priority',
                          widget.task.priority.toUpperCase(),
                          _getPriorityIcon(widget.task.priority),
                          colors,
                          iconColor: _getPriorityColor(widget.task.priority, colors),
                          valueColor: _getPriorityColor(widget.task.priority, colors),
                        ),
                        Divider(color: colors.border.withValues(alpha: 0.3), height: 1),
                        _buildDetailRow(
                          'Status',
                          widget.task.status.toUpperCase(),
                          LucideIcons.activity,
                          colors,
                          iconColor: _getStatusColor(widget.task.status, colors),
                          valueColor: _getStatusColor(widget.task.status, colors),
                        ),
                        Divider(color: colors.border.withValues(alpha: 0.3), height: 1),
                        if (widget.task.department != null && widget.task.department!.isNotEmpty) ...[
                          _buildDetailRow(
                            'Department / Inst.',
                            widget.task.department!.toUpperCase(),
                            LucideIcons.building2,
                            colors,
                            iconColor: colors.indigo,
                          ),
                          Divider(color: colors.border.withValues(alpha: 0.3), height: 1),
                        ],
                        _buildDetailRow(
                          'Due Date',
                          _formatDate(widget.task.dueDate),
                          LucideIcons.calendar,
                          colors,
                          iconColor: colors.indigo,
                        ),
                        Divider(color: colors.border.withValues(alpha: 0.3), height: 1),
                        _buildDetailRow(
                          'Assignee',
                          widget.task.assignee ?? 'Unassigned',
                          LucideIcons.user,
                          colors,
                          iconColor: colors.honey,
                        ),
                        Divider(color: colors.border.withValues(alpha: 0.3), height: 1),
                        _buildDetailRow(
                          'Requested By',
                          widget.task.requester ?? 'Unknown',
                          LucideIcons.userPlus,
                          colors,
                          iconColor: colors.emerald,
                        ),
                        Divider(color: colors.border.withValues(alpha: 0.3), height: 1),
                        _buildDetailRow(
                          'Created On',
                          _formatDate(widget.task.createdAt),
                          LucideIcons.calendarPlus,
                          colors,
                          iconColor: colors.textSecondary,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
      ),
    );
  }
}
