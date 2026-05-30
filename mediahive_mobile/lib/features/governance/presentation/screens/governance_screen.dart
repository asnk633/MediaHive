import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/services/analytics_service.dart';
import '../providers/governance_provider.dart';
import '../../../../../shared/widgets/mh_skeleton.dart';
import '../../domain/models/governance_models.dart';

class GovernanceScreen extends ConsumerWidget {
  const GovernanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Analytics
    ref.read(analyticsServiceProvider).logScreenView('GovernanceScreen');
    
    final policiesAsync = ref.watch(governancePoliciesProvider);
    final logsAsync = ref.watch(governanceLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundPrimary,
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.darkGradient,
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            left: AppSpacing.l, 
            right: AppSpacing.l, 
            top: 120 + MediaQuery.of(context).padding.top, 
            bottom: 120,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPageHeader(),
              const SizedBox(height: 32),
              _buildStatsGrid(),
              const SizedBox(height: 40),
              _buildAuthorityMap(),
              const SizedBox(height: 40),
              policiesAsync.when(
                data: (policies) => _buildActivePolicies(policies),
                loading: () => const MhSkeleton(height: 200),
                error: (e, _) => Text('Error loading policies', style: AppTypography.caption.copyWith(color: AppColors.error)),
              ),
              const SizedBox(height: 40),
              logsAsync.when(
                data: (logs) => _buildGovernanceLog(logs),
                loading: () => const MhSkeleton(height: 200),
                error: (e, _) => Text('Error loading logs', style: AppTypography.caption.copyWith(color: AppColors.error)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPageHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('GOVERNANCE', style: AppTypography.h1),
              const SizedBox(height: 8),
              Text(
                'INSTITUTIONAL OVERSIGHT & POLICY.',
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.info,
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(LucideIcons.box, color: Colors.white, size: 20),
        ),
      ],
    );
  }

  Widget _buildStatsGrid() {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Active Rules', '24', LucideIcons.shieldCheck, AppColors.success)),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Audit Events', '142', LucideIcons.activity, AppColors.info)),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 16),
          Text(value, style: AppTypography.h2),
          const SizedBox(height: 4),
          Text(label.toUpperCase(), style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildAuthorityMap() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ROLE AUTHORITY MAP', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        _buildRoleRow('ADMIN', 'OMNISCIENT', 1.0, AppColors.error),
        const SizedBox(height: 12),
        _buildRoleRow('MANAGER', 'INSTITUTIONAL', 0.8, AppColors.warning),
        const SizedBox(height: 12),
        _buildRoleRow('TEAM', 'DEPARTMENTAL', 0.5, AppColors.info),
      ],
    );
  }

  Widget _buildRoleRow(String role, String level, double power, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(role, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
              Text(level, style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: power,
              backgroundColor: AppColors.backgroundSecondary,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivePolicies(List<Policy> policies) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ACTIVE SYSTEM POLICIES', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...policies.map((p) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildPolicyCard(p),
        )),
      ],
    );
  }

  Widget _buildPolicyCard(Policy policy) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.info.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.info.withOpacity(0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.shield, size: 18, color: AppColors.info),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(policy.title, style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
                const SizedBox(height: 6),
                Text(policy.description, style: AppTypography.caption.copyWith(height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGovernanceLog(List<GovernanceLog> logs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('GOVERNANCE ACTIVITY LOG', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...logs.map((l) => _buildLogItem(l)),
      ],
    );
  }

  Widget _buildLogItem(GovernanceLog log) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.info, shape: BoxShape.circle)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(log.action, style: AppTypography.bodyM.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(log.details, style: AppTypography.caption),
              ],
            ),
          ),
          Text(log.timestamp, style: AppTypography.caption.copyWith(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.textSecondary.withOpacity(0.4))),
        ],
      ),
    );
  }
}
