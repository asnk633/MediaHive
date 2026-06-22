import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme_provider.dart';
import '../providers/attendance_provider.dart';

class OfflineDeadLetterSheet extends ConsumerWidget {
  const OfflineDeadLetterSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final dlqAsync = ref.watch(deadLetterQueueProvider);

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(LucideIcons.alertOctagon, color: AppColors.error, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'SYNC FAILURES',
                  style: AppTypography.h3.copyWith(color: colors.textPrimary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'The following offline scans failed to sync repeatedly. You can retry them or discard if invalid.',
            style: TextStyle(color: colors.textSecondary, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 20),
          
          dlqAsync.when(
            data: (items) {
              if (items.isEmpty) {
                // Auto-close if empty
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (Navigator.canPop(context)) Navigator.pop(context);
                });
                return const SizedBox.shrink();
              }

              return ConstrainedBox(
                constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.5),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final key = item['_dlqKey'] as String;
                    final type = item['type'] as String? ?? 'unknown';
                    final originalTimeStr = item['timestamp'] as String? ?? '';
                    final dt = DateTime.tryParse(originalTimeStr)?.toLocal();
                    
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                type == 'check_in' ? 'CHECK-IN' : (type == 'check_out' ? 'CHECK-OUT' : 'UNKNOWN SCAN'),
                                style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              Text(
                                dt != null ? DateFormat('MMM dd, hh:mm a').format(dt) : 'Unknown time',
                                style: TextStyle(color: colors.textSecondary, fontSize: 12),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: colors.textSecondary,
                                    side: BorderSide(color: colors.border),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: () {
                                    ref.read(deadLetterQueueProvider.notifier).clearItem(key);
                                  },
                                  child: const Text('DISCARD', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: colors.honey,
                                    foregroundColor: colors.backgroundPrimary,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: () {
                                    ref.read(deadLetterQueueProvider.notifier).retryItem(key);
                                  },
                                  child: const Text('RETRY SYNC', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Error: $e', style: const TextStyle(color: AppColors.error)),
          ),
          
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
