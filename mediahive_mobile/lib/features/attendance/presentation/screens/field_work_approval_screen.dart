import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/field_work_provider.dart';

/// Manager-facing screen to review and approve/reject field work requests.
///
/// Shows a list of all pending field work sessions with approve/reject actions.
/// On rejection, prompts for a reason and triggers the grace period workflow.
class FieldWorkApprovalScreen extends ConsumerStatefulWidget {
  const FieldWorkApprovalScreen({super.key});

  @override
  ConsumerState<FieldWorkApprovalScreen> createState() => _FieldWorkApprovalScreenState();
}

class _FieldWorkApprovalScreenState extends ConsumerState<FieldWorkApprovalScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pendingSessions = ref.watch(pendingFieldWorkSessionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Field Work Requests'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(pendingFieldWorkSessionsProvider),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: pendingSessions.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load requests: $e'),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => ref.invalidate(pendingFieldWorkSessionsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (sessions) {
          if (sessions.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline, size: 64,
                      color: theme.colorScheme.primary.withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  Text(
                    'No Pending Requests',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'All field work requests have been handled.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(pendingFieldWorkSessionsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _buildRequestCard(theme, sessions[index]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRequestCard(ThemeData theme, Map<String, dynamic> session) {
    final sessionId = session['id'] as String;
    final userId = session['userId'] as String? ?? '';
    final reason = session['reason'] as String?;
    final startedAt = DateTime.tryParse(session['startedAt'] ?? '');
    final attendanceId = session['attendanceId'] as String? ?? '';

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.orange.withValues(alpha: 0.2),
                  child: const Icon(Icons.work_outline, color: Colors.orange),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Field Work Request',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'User: ${userId.substring(0, 8)}...',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '⏳ Pending',
                    style: TextStyle(fontSize: 12, color: Colors.orange, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Details
            if (startedAt != null) ...[
              _infoRow(Icons.access_time, 'Started',
                  DateFormat('MMM d, yyyy – h:mm a').format(startedAt.toLocal())),
              const SizedBox(height: 4),
              _infoRow(Icons.timer, 'Duration',
                  _formatDuration(DateTime.now().difference(startedAt))),
              const SizedBox(height: 4),
            ],
            if (reason != null && reason.isNotEmpty)
              _infoRow(Icons.note_alt_outlined, 'Reason', reason),

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showRejectDialog(sessionId, attendanceId, userId),
                    icon: const Icon(Icons.close, color: Colors.red),
                    label: const Text('Reject', style: TextStyle(color: Colors.red)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.red),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _approveFieldWork(sessionId),
                    icon: const Icon(Icons.check),
                    label: const Text('Approve'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.green,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
      ],
    );
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    if (hours > 0) return '${hours}h ${minutes}m ago';
    return '${minutes}m ago';
  }

  Future<void> _approveFieldWork(String sessionId) async {
    try {
      final managerId = Supabase.instance.client.auth.currentUser?.id ?? '';
      await ref.read(fieldWorkServiceProvider).approveFieldWork(
            sessionId: sessionId,
            managerId: managerId,
          );
      ref.invalidate(pendingFieldWorkSessionsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Field work approved ✅'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to approve: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _showRejectDialog(String sessionId, String attendanceId, String userId) async {
    final reasonController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Field Work'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'The team member will receive a notification to return to the office '
              'within the grace period. If they don\'t return, they will be auto-checked out.',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Reason for rejection',
                hintText: 'e.g., No approved task, unauthorized absence...',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final managerId = Supabase.instance.client.auth.currentUser?.id ?? '';
        await ref.read(fieldWorkServiceProvider).rejectFieldWork(
              sessionId: sessionId,
              attendanceId: attendanceId,
              userId: userId,
              managerId: managerId,
              rejectionReason: reasonController.text.trim().isEmpty
                  ? null
                  : reasonController.text.trim(),
            );
        ref.invalidate(pendingFieldWorkSessionsProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Field work rejected. Grace period notification sent.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to reject: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
    reasonController.dispose();
  }
}
