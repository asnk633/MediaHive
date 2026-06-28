import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/services/auth_service.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/features/dashboard/presentation/providers/dashboard_providers.dart';

class ProfileInfoGrid extends ConsumerWidget {
  const ProfileInfoGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    final metrics = ref.watch(dashboardMetricsProvider);
    final requests = metrics['myRequests'] as Map<String, dynamic>?;

    final totalRequests = requests?['total']?.toString() ?? '0';
    final completedRequests = requests?['completed']?.toString() ?? '0';

    return Column(
      children: [
        profileAsync.when(
          loading: () => Container(
            height: 120,
            alignment: Alignment.center,
            child: CircularProgressIndicator(color: colors.textPrimary),
          ),
          error: (_, __) => const SizedBox(),
          data: (dbProfile) {
            final auth = ref.read(authServiceProvider);
            final user = auth.currentUser;
            final metadata = user?.userMetadata ?? {};

            final rawRole = dbProfile?['role'] as String? ?? metadata['role'] as String? ?? 'Member';
            final institutionName = dbProfile?['institution_name'] as String? ?? metadata['institution_id']?.toString() ?? 'None';
            final departmentName = dbProfile?['department_name'] as String? ?? metadata['department_id']?.toString() ?? metadata['department']?.toString() ?? 'None';

            String joinDate = 'Recently';
            if (user?.createdAt != null) {
              final date = DateTime.parse(user!.createdAt);
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              joinDate = '${months[date.month - 1]} ${date.year}';
            }

            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: colors.border),
                boxShadow: colors.cardShadow,
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(child: _buildInfoItem(colors, LucideIcons.landmark, 'INSTITUTION', institutionName)),
                      Expanded(child: _buildInfoItem(colors, LucideIcons.calendar, 'JOINED ON', joinDate, isRightAligned: true)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: _buildInfoItem(colors, LucideIcons.layers, 'DEPARTMENT', departmentName)),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(child: _buildStatCard(colors, 'TASKS REQUESTED', totalRequests, LucideIcons.pin, Colors.blue)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard(colors, 'COMPLETED', completedRequests, LucideIcons.checkCircle, Colors.green)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard(colors, 'LAST ACTIVE', 'Just now', LucideIcons.clock, Colors.purple)),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoItem(ThemeColors colors, IconData icon, String label, String value, {bool isRightAligned = false}) {
    return Column(
      crossAxisAlignment: isRightAligned ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: isRightAligned ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            if (!isRightAligned) ...[
              Icon(icon, size: 12, color: colors.textSecondary),
              const SizedBox(width: 6),
            ],
            Text(label, style: TextStyle(fontSize: 10, color: colors.textSecondary, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            if (isRightAligned) ...[
              const SizedBox(width: 6),
              Icon(icon, size: 12, color: colors.textSecondary),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary)),
      ],
    );
  }

  Widget _buildStatCard(ThemeColors colors, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: colors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(label, style: TextStyle(fontSize: 8, color: color, fontWeight: FontWeight.bold, letterSpacing: 0.5))),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: colors.textPrimary)),
        ],
      ),
    );
  }
}
