import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme_provider.dart';

/// Provider for fetching presence logs for a specific attendance session.
final presenceLogsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, attendanceId) async {
    final result = await Supabase.instance.client
        .from('presence_logs')
        .select()
        .eq('attendanceId', attendanceId)
        .order('createdAt', ascending: false)
        .limit(100);
    return List<Map<String, dynamic>>.from(result);
  },
);

/// Timeline widget showing presence verification logs for an attendance session.
///
/// Displays each verification ping with:
/// - Timestamp
/// - Distance from office
/// - Whether the user was within geofence
/// - Verification method (GPS, WiFi, etc.)
/// - Mock location detection flag
class PresenceTimelineScreen extends ConsumerWidget {
  final String attendanceId;
  final String? memberName;

  const PresenceTimelineScreen({
    super.key,
    required this.attendanceId,
    this.memberName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final logsAsync = ref.watch(presenceLogsProvider(attendanceId));

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      appBar: AppBar(
        backgroundColor: colors.backgroundSecondary,
        title: Text(
          memberName != null ? '$memberName – Presence Log' : 'Presence Log',
          style: AppTypography.bodyM.copyWith(
            color: colors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(color: colors.textPrimary),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.download, size: 20, color: colors.textSecondary),
            onPressed: () => _exportPresenceLogs(context, logsAsync.valueOrNull ?? []),
          ),
          IconButton(
            icon: Icon(LucideIcons.refreshCw, size: 20, color: colors.textSecondary),
            onPressed: () => ref.invalidate(presenceLogsProvider(attendanceId)),
          ),
        ],
      ),
      body: logsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertCircle, size: 48, color: colors.textSecondary),
              const SizedBox(height: 12),
              Text('Failed to load logs', style: AppTypography.bodyM.copyWith(color: colors.textSecondary)),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(presenceLogsProvider(attendanceId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (logs) {
          if (logs.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.mapPinOff, size: 48, color: colors.textSecondary.withValues(alpha: 0.4)),
                  const SizedBox(height: 12),
                  Text(
                    'No Presence Logs',
                    style: AppTypography.h3.copyWith(color: colors.textSecondary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Verification logs will appear once the session begins.',
                    style: AppTypography.caption.copyWith(color: colors.textSecondary),
                  ),
                ],
              ),
            );
          }

          // Stats summary
          final totalLogs = logs.length;
          final withinGeofence = logs.where((l) => l['isWithinGeofence'] == true).length;
          final violations = totalLogs - withinGeofence;
          final mockDetected = logs.where((l) => l['isMockLocation'] == true).length;

          return Column(
            children: [
              // Stats bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: colors.surface,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _statChip(colors, LucideIcons.mapPin, '$totalLogs', 'Total', AppColors.info),
                    _statChip(colors, LucideIcons.checkCircle, '$withinGeofence', 'In Zone', AppColors.success),
                    _statChip(colors, LucideIcons.alertTriangle, '$violations', 'Violations', AppColors.error),
                    if (mockDetected > 0)
                      _statChip(colors, LucideIcons.shield, '$mockDetected', 'Mock GPS', AppColors.error),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              // Timeline list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: logs.length,
                  itemBuilder: (context, index) => _buildTimelineEntry(colors, logs[index], index, logs.length),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _statChip(ThemeColors colors, IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(value, style: AppTypography.bodyM.copyWith(color: color, fontWeight: FontWeight.bold)),
          ],
        ),
        Text(label, style: AppTypography.caption.copyWith(color: colors.textSecondary, fontSize: 10)),
      ],
    );
  }

  Widget _buildTimelineEntry(ThemeColors colors, Map<String, dynamic> log, int index, int total) {
    final isWithin = log['isWithinGeofence'] == true;
    final isMock = log['isMockLocation'] == true;
    final distance = (log['distanceFromOffice'] as num?)?.toDouble();
    final method = log['verificationMethod'] as String? ?? 'gps';
    final accuracy = (log['accuracy'] as num?)?.toDouble();
    final createdAt = DateTime.tryParse(log['createdAt'] ?? '');
    final wifiSsid = log['wifiSsid'] as String?;

    final statusColor = isMock
        ? AppColors.error
        : isWithin
            ? AppColors.success
            : AppColors.warning;

    final statusIcon = isMock
        ? LucideIcons.shieldAlert
        : isWithin
            ? LucideIcons.checkCircle
            : LucideIcons.alertTriangle;

    final statusText = isMock
        ? 'Mock GPS Detected'
        : isWithin
            ? 'Within Geofence'
            : 'Outside Geofence';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline dot + line
        SizedBox(
          width: 24,
          child: Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: colors.backgroundPrimary, width: 2),
                ),
              ),
              if (index < total - 1)
                Container(
                  width: 2,
                  height: 80,
                  color: colors.textSecondary.withValues(alpha: 0.2),
                ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        // Content card
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: statusColor.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status + time row
                Row(
                  children: [
                    Icon(statusIcon, size: 14, color: statusColor),
                    const SizedBox(width: 6),
                    Text(
                      statusText,
                      style: AppTypography.caption.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    if (createdAt != null)
                      Text(
                        DateFormat('h:mm a').format(createdAt.toLocal()),
                        style: AppTypography.caption.copyWith(
                          color: colors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                // Details
                if (distance != null)
                  _detailRow(colors, LucideIcons.ruler, '${distance.toStringAsFixed(0)}m from office'),
                if (accuracy != null)
                  _detailRow(colors, LucideIcons.target, '±${accuracy.toStringAsFixed(0)}m accuracy'),
                _detailRow(colors, LucideIcons.radio, method.toUpperCase()),
                if (wifiSsid != null)
                  _detailRow(colors, LucideIcons.wifi, wifiSsid),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _detailRow(ThemeColors colors, IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Row(
        children: [
          Icon(icon, size: 12, color: colors.textSecondary.withValues(alpha: 0.6)),
          const SizedBox(width: 6),
          Text(
            text,
            style: AppTypography.caption.copyWith(
              color: colors.textSecondary,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _exportPresenceLogs(BuildContext context, List<Map<String, dynamic>> logs) async {
    if (logs.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No logs to export.')),
      );
      return;
    }

    try {
      final csvBuffer = StringBuffer();
      
      // Header
      csvBuffer.writeln('Timestamp (UTC),Timestamp (Local),Status,Distance from Office (m),Accuracy (m),Method,WiFi SSID,Battery Level (%)');
      
      for (final log in logs) {
        final createdAtStr = log['createdAt'] as String? ?? '';
        final createdAt = DateTime.tryParse(createdAtStr);
        final localTimeStr = createdAt != null ? DateFormat('yyyy-MM-dd HH:mm:ss').format(createdAt.toLocal()) : '';
        
        final isWithin = log['isWithinGeofence'] == true;
        final isMock = log['isMockLocation'] == true;
        final status = isMock ? 'Mock GPS' : (isWithin ? 'Inside Zone' : 'Violation');
        
        final distance = (log['distanceFromOffice'] as num?)?.toDouble().toStringAsFixed(1) ?? '';
        final accuracy = (log['accuracy'] as num?)?.toDouble().toStringAsFixed(1) ?? '';
        final method = log['verificationMethod'] as String? ?? 'gps';
        final wifiSsid = log['wifiSsid'] as String? ?? '';
        final battery = log['batteryLevel']?.toString() ?? '';
        
        // Escape wifi SSID if it contains commas or quotes
        var escapedWifi = wifiSsid;
        if (escapedWifi.contains(',') || escapedWifi.contains('"')) {
          escapedWifi = '"${escapedWifi.replaceAll('"', '""')}"';
        }
        
        csvBuffer.writeln('$createdAtStr,$localTimeStr,$status,$distance,$accuracy,$method,$escapedWifi,$battery');
      }

      final directory = await getTemporaryDirectory();
      final path = '${directory.path}/presence_logs_$attendanceId.csv';
      final file = File(path);
      await file.writeAsString(csvBuffer.toString());

      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'Presence Logs Report - Session ${attendanceId.substring(0, 8)}',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to export CSV: $e'), backgroundColor: AppColors.error),
      );
    }
  }
}
