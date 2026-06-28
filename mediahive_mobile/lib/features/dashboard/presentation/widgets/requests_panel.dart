import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/features/dashboard/presentation/widgets/kpi_grid.dart';

class RequestsPanel extends StatelessWidget {
  final bool isAdminOrManager;
  final VoidCallback onTapNewTask;
  final VoidCallback onTapNewEvent;
  final VoidCallback onTapNewCampaign;
  final VoidCallback onTapNotifyTeam;

  final int totalRequests;
  final int pendingRequests;
  final int inProgressRequests;
  final int inReviewRequests;
  final int completedRequests;
  final int requestProgressPercent;
  final int fulfilledRequests;

  const RequestsPanel({
    super.key,
    required this.isAdminOrManager,
    required this.onTapNewTask,
    required this.onTapNewEvent,
    required this.onTapNewCampaign,
    required this.onTapNotifyTeam,
    required this.totalRequests,
    required this.pendingRequests,
    required this.inProgressRequests,
    required this.inReviewRequests,
    required this.completedRequests,
    required this.requestProgressPercent,
    required this.fulfilledRequests,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      return Column(
        children: [
          _buildQuickActions(context, colors),
          const SizedBox(height: 32),
          _buildRequestsSection(colors),
          const SizedBox(height: 32),
          _buildRequestsProgress(colors),
        ],
      );
    });
  }

  Widget _buildQuickActions(BuildContext context, ThemeColors colors) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildActionCard(colors, 'New Task', LucideIcons.clipboardCheck, onTap: onTapNewTask)),
            const SizedBox(width: 12),
            Expanded(child: _buildActionCard(colors, 'New Event', LucideIcons.calendar, onTap: onTapNewEvent)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildActionCard(colors, 'New Campaign', LucideIcons.layers, onTap: onTapNewCampaign)),
            const SizedBox(width: 12),
            Expanded(child: _buildActionCard(colors, 'Notify Team', LucideIcons.bell, onTap: onTapNotifyTeam)),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 200.ms, duration: 600.ms);
  }

  Widget _buildActionCard(ThemeColors colors, String label, IconData icon, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          gradient: colors.isDark
              ? const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : const LinearGradient(
                  colors: [Colors.white, Color(0xFFFBFBEE)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark
                ? colors.border.withValues(alpha: 0.2)
                : colors.border.withValues(alpha: 0.12),
          ),
          boxShadow: colors.isDark
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: colors.border.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: colors.honey.withValues(alpha: colors.isDark ? 0.1 : 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: colors.honey, size: 16),
            ),
            const SizedBox(width: 12),
            Text(
              label.toUpperCase(),
              style: AppTypography.caption.copyWith(
                color: colors.isDark ? colors.textPrimary : colors.textPrimary,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    ).animate().scale(
      begin: const Offset(0.98, 0.98),
      end: const Offset(1, 1),
      duration: 400.ms,
      curve: Curves.easeOutBack,
    );
  }

  Widget _buildRequestsSection(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('My Requests', style: AppTypography.h3),
            Text('PERSONAL SUMMARY', style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.bold, color: colors.textSecondary,
            )),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(LucideIcons.fileText, size: 14, color: Colors.blueAccent),
            const SizedBox(width: 8),
            Text('$totalRequests Total Requests', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 20),
        StatusCardGrid(
          title: '',
          items: [
            StatusCardData(value: '$pendingRequests', label: 'PENDING', icon: LucideIcons.clock, color: Colors.orange),
            StatusCardData(value: '$inProgressRequests', label: 'IN PROGRESS', icon: LucideIcons.activity, color: Colors.blue),
            StatusCardData(value: '$inReviewRequests', label: 'IN REVIEW', icon: LucideIcons.search, color: Colors.purple),
            StatusCardData(value: '$completedRequests', label: 'COMPLETED', icon: LucideIcons.checkCircle, color: Colors.green),
          ],
        ),
      ],
    );
  }

  Widget _buildRequestsProgress(ThemeColors colors) {
    final double percentage = requestProgressPercent.toDouble() / 100.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Request Progress', style: AppTypography.h3),
            Text('$requestProgressPercent%', style: const TextStyle(color: Color(0xFF6366F1), fontSize: 24, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text('$fulfilledRequests of $totalRequests requests fulfilled', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
        const SizedBox(height: 20),
        Stack(
          children: [
            Container(
              height: 12,
              width: double.infinity,
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            FractionallySizedBox(
              widthFactor: percentage > 0 ? percentage : 0.01,
              child: Container(
                height: 12,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF818CF8)]),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
