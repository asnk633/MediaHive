import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/sync_errors_provider.dart';
import '../../../../core/utils/time_ago_helper.dart';
import '../../../../core/services/sync_service.dart';
import 'dart:convert';

class SyncErrorsScreen extends ConsumerWidget {
  const SyncErrorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final state = ref.watch(syncErrorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: colors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Sync Errors',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary),
        ),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : state.failedItems.isEmpty
              ? _buildEmptyState(colors)
              : _buildErrorsList(context, ref, colors, state),
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.checkCircle, size: 64, color: const Color(0xFF10B981).withValues(alpha: 0.5)),
          const SizedBox(height: 24),
          Text(
            'All clear — no sync errors',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Your offline changes have been synced successfully.',
            style: TextStyle(fontSize: 14, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorsList(BuildContext context, WidgetRef ref, ThemeColors colors, SyncErrorsState state) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: state.failedItems.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = state.failedItems[index];
        final mutationType = item.mutation['type']?.toString().toUpperCase() ?? 'UNKNOWN';
        final entity = item.entity.toUpperCase();

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$mutationType $entity',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFEF4444),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        timeAgo(item.timestamp),
                        style: TextStyle(fontSize: 11, color: colors.textSecondary),
                      ),
                    ],
                  ),
                  const Icon(LucideIcons.alertTriangle, size: 16, color: Color(0xFFEF4444)),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Entity ID: ${item.entityId}',
                style: TextStyle(fontSize: 12, color: colors.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                'Retries: ${item.retries}',
                style: TextStyle(fontSize: 11, color: colors.textSecondary),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton.icon(
                    onPressed: () => _confirmDiscard(context, ref, colors, item.id),
                    icon: Icon(LucideIcons.trash2, size: 16, color: colors.textSecondary),
                    label: Text(
                      'Discard',
                      style: TextStyle(color: colors.textSecondary),
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () => _retryItem(ref, item.id),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(LucideIcons.refreshCw, size: 16),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _confirmDiscard(BuildContext context, WidgetRef ref, ThemeColors colors, String itemId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Discard this change?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary)),
        content: Text(
          'This action will permanently delete this unsynced data. It cannot be undone.',
          style: TextStyle(fontSize: 14, color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _discardItem(itemId);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              elevation: 0,
            ),
            child: const Text('Discard'),
          ),
        ],
      ),
    );
  }

  void _discardItem(String itemId) async {
    try {
      final box = Hive.box<String>('sync_queue');
      await box.delete(itemId);
    } catch (_) {}
  }

  void _retryItem(WidgetRef ref, String itemId) async {
    try {
      final box = Hive.box<String>('sync_queue');
      final jsonStr = box.get(itemId);
      if (jsonStr != null) {
        final itemJson = jsonDecode(jsonStr);
        itemJson['status'] = 'pending';
        itemJson['retries'] = 0;
        await box.put(itemId, jsonEncode(itemJson));
        // Trigger queue processing
        ref.read(syncServiceProvider).processQueue();
      }
    } catch (_) {}
  }
}
