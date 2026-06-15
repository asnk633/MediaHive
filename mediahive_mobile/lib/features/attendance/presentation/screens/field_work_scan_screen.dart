import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/attendance_provider.dart';
import '../providers/field_work_provider.dart';

/// Screen shown when a "field_work" type NFC tag is scanned.
///
/// Two modes:
/// 1. START field work — user is checked in, scans field work tag to declare out-of-office task
/// 2. END field work — user has active field work session, scans again to return
class FieldWorkScanScreen extends ConsumerStatefulWidget {
  final String tagName;
  final String tagUuid;
  final String? physicalTagId;

  const FieldWorkScanScreen({
    super.key,
    required this.tagName,
    required this.tagUuid,
    this.physicalTagId,
  });

  @override
  ConsumerState<FieldWorkScanScreen> createState() => _FieldWorkScanScreenState();
}

class _FieldWorkScanScreenState extends ConsumerState<FieldWorkScanScreen> {
  final _reasonController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeSession = ref.watch(activeAttendanceSessionProvider);
    final activeFieldWork = ref.watch(activeFieldWorkSessionProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Field Work'),
        centerTitle: true,
      ),
      body: activeSession.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (session) {
          if (session == null) {
            return _buildNotCheckedIn(theme);
          }

          return activeFieldWork.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => _buildStartFieldWork(theme, session.id),
            data: (fieldWorkSession) {
              if (fieldWorkSession != null) {
                return _buildEndFieldWork(theme, fieldWorkSession, session.id);
              }
              return _buildStartFieldWork(theme, session.id);
            },
          );
        },
      ),
    );
  }

  /// User is not checked in — can't start field work
  Widget _buildNotCheckedIn(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text(
              'Not Checked In',
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'You must check in first before declaring field work.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }

  /// User is checked in with no active field work — show START form
  Widget _buildStartFieldWork(ThemeData theme, String attendanceId) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                const Icon(Icons.work_outline, size: 48, color: Colors.amber),
                const SizedBox(height: 12),
                Text(
                  'Start Field Work',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'You are about to declare field work. Your manager will be notified '
                  'and must approve your request.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Tag info
          ListTile(
            leading: const Icon(Icons.nfc, color: Colors.amber),
            title: const Text('Field Work Tag'),
            subtitle: Text(widget.tagName),
            tileColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          const SizedBox(height: 16),

          // Reason input (optional but helpful)
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Reason for field work (optional)',
              hintText: 'e.g., Client meeting at XYZ office, Site inspection, etc.',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              prefixIcon: const Icon(Icons.note_alt_outlined),
            ),
          ),
          const SizedBox(height: 8),

          // Info callout
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 20, color: Colors.blue),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Location verification will pause during field work. '
                    'Your GPS will be captured periodically for records.',
                    style: theme.textTheme.bodySmall?.copyWith(color: Colors.blue),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Error / Success messages
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_errorMessage!, style: TextStyle(color: theme.colorScheme.error)),
            ),
            const SizedBox(height: 16),
          ],
          if (_successMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_successMessage!, style: const TextStyle(color: Colors.green)),
            ),
            const SizedBox(height: 16),
          ],

          // Action buttons
          FilledButton.icon(
            onPressed: _isLoading ? null : () => _startFieldWork(attendanceId),
            icon: _isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.play_arrow),
            label: const Text('Start Field Work'),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.amber,
              foregroundColor: Colors.black,
              minimumSize: const Size(double.infinity, 52),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  /// User has active field work — show END form with duration timer
  Widget _buildEndFieldWork(
    ThemeData theme,
    Map<String, dynamic> fieldWorkSession,
    String attendanceId,
  ) {
    final startedAt = DateTime.tryParse(fieldWorkSession['startedAt'] ?? '');
    final status = fieldWorkSession['status'] as String? ?? 'pending_approval';
    final reason = fieldWorkSession['reason'] as String?;
    final sessionId = fieldWorkSession['id'] as String;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                const Icon(Icons.work, size: 48, color: Colors.green),
                const SizedBox(height: 12),
                Text(
                  'Field Work Active',
                  style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                if (startedAt != null) ...[
                  _DurationTimer(startTime: startedAt),
                  const SizedBox(height: 8),
                ],
                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _getStatusLabel(status),
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (reason != null && reason.isNotEmpty) ...[
            ListTile(
              leading: const Icon(Icons.note_alt_outlined),
              title: const Text('Reason'),
              subtitle: Text(reason),
              tileColor: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            const SizedBox(height: 16),
          ],

          // Error / Success messages
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_errorMessage!, style: TextStyle(color: theme.colorScheme.error)),
            ),
            const SizedBox(height: 16),
          ],
          if (_successMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_successMessage!, style: const TextStyle(color: Colors.green)),
            ),
            const SizedBox(height: 16),
          ],

          // Cancel button — only when pending_approval (member can withdraw)
          if (status == 'pending_approval') ...[
            OutlinedButton.icon(
              onPressed: _isLoading ? null : () => _cancelFieldWork(sessionId, attendanceId),
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Cancel Request'),
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.error,
                side: BorderSide(color: theme.colorScheme.error.withValues(alpha: 0.5)),
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // End Field Work button — shown when approved or active
          if (status == 'approved' || status == 'auto_approved' || status == 'active')
            FilledButton.icon(
              onPressed: _isLoading ? null : () => _endFieldWork(sessionId, attendanceId),
              icon: _isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.stop),
              label: const Text('End Field Work & Return'),
              style: FilledButton.styleFrom(
                minimumSize: const Size(double.infinity, 52),
              ),
            ),
        ],
      ),
    );
  }

  // ─── Actions ──────────────────────────────────────────────

  Future<void> _startFieldWork(String attendanceId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      await ref.read(fieldWorkServiceProvider).startFieldWork(
            attendanceId: attendanceId,
            userId: ref.read(activeAttendanceSessionProvider).value!.userId,
            nfcTagId: widget.tagUuid,
            reason: _reasonController.text.trim().isEmpty ? null : _reasonController.text.trim(),
          );

      // Pause presence verification
      ref.read(presenceVerificationServiceProvider).pause();

      // Refresh providers
      ref.invalidate(activeFieldWorkSessionProvider);
      ref.invalidate(activeAttendanceSessionProvider);

      setState(() {
        _successMessage = 'Field work started! Manager has been notified.';
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _endFieldWork(String sessionId, String attendanceId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final userId = ref.read(activeAttendanceSessionProvider).value!.userId;
      await ref.read(fieldWorkServiceProvider).endFieldWork(
            sessionId: sessionId,
            attendanceId: attendanceId,
            userId: userId,
          );

      // Resume presence verification
      ref.read(presenceVerificationServiceProvider).resume();

      // Refresh providers
      ref.invalidate(activeFieldWorkSessionProvider);
      ref.invalidate(activeAttendanceSessionProvider);

      setState(() {
        _successMessage = 'Field work ended. Welcome back!';
      });

      // Navigate back after short delay
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.of(context).pop();
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _cancelFieldWork(String sessionId, String attendanceId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final userId = ref.read(activeAttendanceSessionProvider).value!.userId;
      await ref.read(fieldWorkServiceProvider).cancelFieldWork(
            sessionId: sessionId,
            attendanceId: attendanceId,
            userId: userId,
          );

      // Resume presence verification
      ref.read(presenceVerificationServiceProvider).resume();

      // Refresh providers
      ref.invalidate(activeFieldWorkSessionProvider);
      ref.invalidate(activeAttendanceSessionProvider);

      setState(() {
        _successMessage = 'Field work request cancelled.';
      });

      // Navigate back after short delay
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) Navigator.of(context).pop();
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending_approval':
        return Colors.orange;
      case 'approved':
      case 'auto_approved':
        return Colors.green;
      case 'active':
        return Colors.blue;
      case 'rejected':
        return Colors.red;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'pending_approval':
        return '⏳ Pending Manager Approval';
      case 'approved':
        return '✅ Approved (Awaiting Departure)';
      case 'auto_approved':
        return '✅ Auto-Approved (Awaiting Departure)';
      case 'active':
        return '🏃 In Field';
      case 'rejected':
        return '❌ Rejected';
      case 'completed':
        return '✔️ Completed';
      case 'cancelled':
        return '🚫 Cancelled';
      default:
        return status;
    }
  }
}

/// Live duration timer widget
class _DurationTimer extends StatefulWidget {
  final DateTime startTime;
  const _DurationTimer({required this.startTime});

  @override
  State<_DurationTimer> createState() => _DurationTimerState();
}

class _DurationTimerState extends State<_DurationTimer> {
  late Timer _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final duration = DateTime.now().difference(widget.startTime);
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');

    return Text(
      '$hours:$minutes:$seconds',
      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontFamily: 'monospace',
            fontWeight: FontWeight.bold,
          ),
    );
  }
}
