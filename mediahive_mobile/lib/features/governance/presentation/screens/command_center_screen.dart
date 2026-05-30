import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'user_management_screen.dart';
import 'workspace_management_screen.dart';
import 'leave_management_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/design_tokens.dart';
import '../../../dashboard/presentation/providers/dashboard_providers.dart';
import '../providers/command_metrics_provider.dart';
import '../../../../shared/widgets/mh_loading.dart';

class CommandCenterScreen extends ConsumerWidget {
  const CommandCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final metricsAsync = ref.watch(commandCenterMetricsStreamProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
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
        child: MhRefreshIndicator(
          edgeOffset: 140,
          onRefresh: () async {
            // Refresh logic for command center
            ref.invalidate(dashboardMetricsProvider);
            await Future.delayed(const Duration(seconds: 1));
          },
          child: CustomScrollView(
            physics: const ElasticScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 140, 20, 20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildTitleSection(colors),
                    const SizedBox(height: 16),
                    metricsAsync.when(
                      data: (metrics) => _buildSystemMetrics(metrics, colors),
                      loading: () => const MhLoading(size: 80),
                      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
                    ),
                    const SizedBox(height: 16),
                    _buildCriticalActions(context, colors),
                    const SizedBox(height: 16),
                    _buildRecentSystemActivity(context, colors),
                    const SizedBox(height: 100), // Space for nav bar
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTitleSection(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'COMMAND CENTER',
          style: AppTypography.h1.copyWith(
            color: colors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'GLOBAL SYSTEM STATE & OVERSIGHT',
          style: AppTypography.caption.copyWith(
            color: colors.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          height: 1,
          width: 60,
          color: colors.honey.withOpacity(0.5),
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1);
  }

  Widget _buildSystemMetrics(Map<String, int> metrics, ThemeColors colors) {
    return Row(
      children: [
        Expanded(
          child: _buildMetricTile(
            'TOTAL USERS', 
            metrics['totalUsers']?.toString() ?? '0', 
            LucideIcons.users, 
            const Color(0xFF6366F1), 
            colors,
            subtitle: 'Total registered profiles',
          )
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricTile(
            'ACTIVE NODES', 
            metrics['activeNodes']?.toString() ?? '0', 
            LucideIcons.server, 
            const Color(0xFF10B981), 
            colors,
            subtitle: 'Active production hubs',
          )
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricTile(
            'PENDING', 
            metrics['pending']?.toString() ?? '0', 
            LucideIcons.mail, 
            const Color(0xFFF59E0B), 
            colors,
            subtitle: 'Tasks & Leave requests',
          )
        ),
      ],
    );
  }

  Widget _buildMetricTile(String label, String value, IconData icon, Color color, ThemeColors colors, {String? subtitle}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20),
              if (subtitle != null)
                Tooltip(
                  message: subtitle,
                  triggerMode: TooltipTriggerMode.tap,
                  child: Icon(LucideIcons.info, size: 14, color: colors.textSecondary.withOpacity(0.5)),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.9, 0.9));
  }

  Widget _buildCriticalActions(BuildContext context, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.zap, color: colors.honey, size: 18),
            const SizedBox(width: 8),
            Text('CRITICAL ACTIONS', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 8),
        _buildActionCard(
          'MANAGE USERS', 
          'Adjust roles & access', 
          LucideIcons.userPlus, 
          colors,
          isFullWidth: true,
          onTap: () => context.push('/governance/users'),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                'TEAM LEAVES', 
                'Analytics & counts', 
                LucideIcons.calendarDays, 
                colors,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => LeaveManagementScreen()),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                'WORKSPACES', 
                'Configure units', 
                LucideIcons.layoutGrid, 
                colors,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const WorkspaceManagementScreen()),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(String title, String subtitle, IconData icon, ThemeColors colors, {VoidCallback? onTap, bool isFullWidth = false}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: isFullWidth ? double.infinity : null,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: colors.backgroundPrimary, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: colors.honey, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(color: colors.textPrimary, fontSize: 10, fontWeight: FontWeight.w900)),
                  Text(subtitle, style: TextStyle(color: colors.textSecondary, fontSize: 8)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentSystemActivity(BuildContext context, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(LucideIcons.activity, color: colors.honey, size: 18),
                const SizedBox(width: 8),
                Text('RECENT SYSTEM ACTIVITY', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
              ],
            ),
            GestureDetector(
              onTap: () => context.push('/governance/system-health'),
              child: MouseRegion(
                cursor: SystemMouseCursors.click,
                child: Text('VIEW ALL →', style: TextStyle(color: colors.honey, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildActivityItem(
          context,
          'Security policy updated', 
          'BY ADMIN • 2 HOURS AGO', 
          LucideIcons.shieldAlert, 
          'The global security and network RLS (Row Level Security) policies on the Supabase database clusters were audited, validated, and updated to enhance institutional encryption. All member access rights have been successfully synchronized without system disruption.',
          colors,
        ),
        _buildActivityItem(
          context,
          'New Institution Onboarded', 
          'THAIBA GARDEN • 5 HOURS AGO', 
          LucideIcons.building2, 
          'The \'Thaiba Garden\' organizational institution node was successfully provisioned, verified, and integrated into the global hub ecosystem. Initial workspace directories, storage buckets, and standard role permissions were automatically generated and activated.',
          colors,
        ),
        _buildActivityItem(
          context,
          'System Infrastructure Updated', 
          'SYSTEM • 1 DAY AGO', 
          LucideIcons.refreshCw, 
          'Automated server-side microservices, mobile APIs, and synchronization worker scripts were upgraded to stable Build v3.4.2. Database connection pools, file server locks, and telemetry caches have been cleared and restarted successfully.',
          colors,
        ),
      ],
    );
  }

  Widget _buildActivityItem(
    BuildContext context, 
    String title, 
    String meta, 
    IconData icon, 
    String description,
    ThemeColors colors,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: InkWell(
        onTap: () => _showActivityDetailSheet(context, title, meta, icon, description, colors),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: colors.textSecondary.withOpacity(0.5), size: 20),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(meta, style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900)),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, color: colors.textSecondary.withOpacity(0.3), size: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showActivityDetailSheet(
    BuildContext context, 
    String title, 
    String meta, 
    IconData icon, 
    String description, 
    ThemeColors colors,
  ) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Container(
          decoration: BoxDecoration(
            color: colors.isDark ? colors.surface : Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(30),
              topRight: Radius.circular(30),
            ),
            border: Border.all(color: colors.border),
          ),
          padding: const EdgeInsets.all(24),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Indicator line
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colors.textSecondary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colors.honey.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: colors.honey, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            meta.toUpperCase(),
                            style: TextStyle(
                              color: colors.textSecondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  'ACTIVITY DETAILS',
                  style: TextStyle(
                    color: colors.textSecondary,
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colors.isDark ? colors.backgroundPrimary.withOpacity(0.5) : colors.backgroundPrimary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.border.withOpacity(0.5)),
                  ),
                  child: Text(
                    description,
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          side: BorderSide(color: colors.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () => Navigator.pop(sheetContext),
                        child: Text(
                          'DISMISS',
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: colors.honey,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          context.push('/governance/system-health');
                        },
                        child: const Text(
                          'DIAGNOSTICS',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
  }
}
