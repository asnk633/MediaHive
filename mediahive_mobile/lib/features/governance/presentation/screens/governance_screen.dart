import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/analytics_service.dart';
import '../providers/governance_provider.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../../../core/theme_provider.dart';
import '../../domain/models/governance_models.dart';
import 'package:go_router/go_router.dart';

class GovernanceScreen extends ConsumerWidget {
  const GovernanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('GovernanceScreen');
    final colors = ref.watch(themeColorsProvider);
    final policiesAsync = ref.watch(governancePoliciesProvider);
    final logsAsync = ref.watch(governanceLogsProvider);
    final statsAsync = ref.watch(governanceStatsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary.withValues(alpha: 0.95), // Slight transparency for the "pane" feel
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
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            left: AppSpacing.l, 
            right: AppSpacing.l, 
            top: 100 + MediaQuery.of(context).padding.top, 
            bottom: 120,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPageHeader(context, colors),
              const SizedBox(height: 32),
              statsAsync.when(
                data: (stats) => Column(
                  children: [
                    _buildStatsGrid(stats, colors),
                    const SizedBox(height: 40),
                    _buildAuthorityMap(stats, colors),
                  ],
                ),
                loading: () => const MhSkeleton(height: 300),
                error: (e, _) => Text('Error loading stats', style: AppTypography.caption.copyWith(color: AppColors.error)),
              ),
              const SizedBox(height: 40),
              policiesAsync.when(
                data: (policies) => _buildActivePolicies(policies, colors),
                loading: () => const MhSkeleton(height: 200),
                error: (e, _) => Text('Error loading policies', style: AppTypography.caption.copyWith(color: AppColors.error)),
              ),
              const SizedBox(height: 40),
              logsAsync.when(
                data: (logs) => _buildGovernanceLog(logs, colors),
                loading: () => const MhSkeleton(height: 200),
                error: (e, _) => Text('Error loading logs', style: AppTypography.caption.copyWith(color: AppColors.error)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPageHeader(BuildContext context, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'GOVERNANCE', 
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'INSTITUTIONAL OVERSIGHT & POLICY.',
                style: TextStyle(
                  color: colors.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                height: 1,
                width: 60,
                color: colors.honey.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
        GestureDetector(
          onTap: () {
            context.push('/governance/command-center');
          },
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.border),
            ),
            child: Icon(LucideIcons.layoutGrid, color: colors.honey, size: 20), // Matched visual button styling exactly
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(GovernanceStats stats, ThemeColors colors) {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Active Rules', stats.activeRulesCount.toString(), LucideIcons.shieldCheck, const Color(0xFF10B981), colors, subtitle: 'Total enforced compliance rules')),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('Audit Events', stats.auditEventsCount.toString(), LucideIcons.activity, const Color(0xFF6366F1), colors, subtitle: 'Total monitored system audit alerts')),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, ThemeColors colors, {String? subtitle}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(color: color.withValues(alpha: 0.05), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 20, color: color),
              if (subtitle != null)
                Tooltip(
                  message: subtitle,
                  triggerMode: TooltipTriggerMode.tap,
                  child: Icon(LucideIcons.info, size: 14, color: colors.textSecondary.withValues(alpha: 0.5)),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(label.toUpperCase(), style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildAuthorityMap(GovernanceStats stats, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.users, color: colors.honey, size: 18),
            const SizedBox(width: 8),
            Text('ROLE POPULATION MAP', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 12),
        _buildRoleRow('ADMIN', '${(stats.adminPercentage * 100).toStringAsFixed(0)}%', stats.adminPercentage, const Color(0xFFEF4444), colors),
        const SizedBox(height: 12),
        _buildRoleRow('MANAGER', '${(stats.managerPercentage * 100).toStringAsFixed(0)}%', stats.managerPercentage, const Color(0xFFF59E0B), colors),
        const SizedBox(height: 12),
        _buildRoleRow('TEAM', '${(stats.teamPercentage * 100).toStringAsFixed(0)}%', stats.teamPercentage, const Color(0xFF3B82F6), colors),
      ],
    );
  }

  Widget _buildRoleRow(String role, String level, double power, Color color, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(role, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(level, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: power,
              backgroundColor: colors.backgroundSecondary,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivePolicies(List<Policy> policies, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.shieldAlert, color: colors.honey, size: 18),
            const SizedBox(width: 8),
            Text('ACTIVE SYSTEM POLICIES', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 12),
        ...policies.map((p) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildPolicyCard(p, colors),
        )),
      ],
    );
  }

  Widget _buildPolicyCard(Policy policy, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.shield, size: 18, color: colors.honey),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(policy.title, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12)),
                const SizedBox(height: 6),
                Text(policy.description, style: TextStyle(color: colors.textSecondary, fontSize: 11, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGovernanceLog(List<GovernanceLog> logs, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.activity, color: colors.honey, size: 18),
            const SizedBox(width: 8),
            Text('GOVERNANCE ACTIVITY LOG', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 12),
        ...logs.map((l) => _buildLogItem(l, colors)),
      ],
    );
  }

  Widget _buildLogItem(GovernanceLog log, ThemeColors colors) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: colors.honey, shape: BoxShape.circle)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(log.action, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                Text(log.details, style: TextStyle(color: colors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          Text(log.timestamp, style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.4), fontSize: 8, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
