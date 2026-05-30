import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/mh_loading.dart';

class LeaveManagementScreen extends ConsumerWidget {
  const LeaveManagementScreen({super.key});

  static const Map<String, String> _dbKeyToType = {
    'planned': 'Paid Leave',
    'unpaid': 'Unpaid',
    'sick': 'Sick',
    'casual': 'Casual',
    'emergency': 'Emergency',
    'other': 'Other',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final requestsAsync = ref.watch(teamLeaveRequestsProvider);
    final searchQuery = ref.watch(leaveSearchQueryProvider);
    final activeTab = ref.watch(leaveTabProvider);

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
        child: CustomScrollView(
          physics: const ElasticScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 140, 20, 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _buildTitleSection(colors),
                  const SizedBox(height: 24),
                  _buildStatsRow(requestsAsync, colors),
                  const SizedBox(height: 32),
                  _buildSearchAndFilters(ref, colors, searchQuery, activeTab),
                  const SizedBox(height: 24),
                  _buildRequestsList(ref, requestsAsync, searchQuery, activeTab, colors),
                  const SizedBox(height: 100), // Space for nav bar
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitleSection(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'TEAM LEAVES',
          style: AppTypography.h1.copyWith(
            color: colors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'ANALYTICS & APPROVALS',
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

  Widget _buildStatsRow(AsyncValue<List<Map<String, dynamic>>> requestsAsync, ThemeColors colors) {
    return requestsAsync.when(
      data: (requests) {
        final pending = requests.where((r) => r['status'].toString().toLowerCase() == 'pending').length;
        final onLeaveToday = requests.where((r) {
          final start = DateTime.tryParse(r['start_date'] ?? '') ?? DateTime.now();
          final end = DateTime.tryParse(r['end_date'] ?? '') ?? DateTime.now();
          final now = DateTime.now();
          return r['status'].toString().toLowerCase() == 'approved' && now.isAfter(start) && now.isBefore(end);
        }).length;

        return Row(
          children: [
            Expanded(child: _buildStatItem('ON LEAVE', onLeaveToday.toString(), colors.honey, colors)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatItem('PENDING', pending.toString(), colors.indigo, colors)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatItem('HISTORY', requests.length.toString(), colors.textSecondary, colors)),
          ],
        );
      },
      loading: () => SizedBox(height: 80, child: MhLoading()),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildStatItem(String label, String value, Color accent, ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withOpacity(0.5)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(color: accent, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters(WidgetRef ref, ThemeColors colors, String query, int activeTab) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: TextField(
            onChanged: (v) => ref.read(leaveSearchQueryProvider.notifier).state = v,
            style: TextStyle(color: colors.textPrimary),
            decoration: InputDecoration(
              icon: Icon(LucideIcons.search, size: 18, color: colors.honey),
              hintText: 'Search team members...',
              hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5), fontSize: 14),
              border: InputBorder.none,
            ),
          ),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            _buildTabButton(ref, 'ALL', 0, activeTab, colors),
            const SizedBox(width: 8),
            _buildTabButton(ref, 'PENDING', 1, activeTab, colors),
            const SizedBox(width: 8),
            _buildTabButton(ref, 'APPROVED', 2, activeTab, colors),
          ],
        ),
      ],
    );
  }

  Widget _buildTabButton(WidgetRef ref, String label, int index, int activeTab, ThemeColors colors) {
    final isActive = activeTab == index;
    return InkWell(
      onTap: () => ref.read(leaveTabProvider.notifier).state = index,
      child: AnimatedContainer(
        duration: 300.ms,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? colors.honey.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isActive ? colors.honey : colors.border.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? colors.honey : colors.textSecondary,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  Widget _buildRequestsList(WidgetRef ref, AsyncValue<List<Map<String, dynamic>>> requestsAsync, String query, int tab, ThemeColors colors) {
    return requestsAsync.when(
      data: (requests) {
        var filtered = requests.where((r) {
          final profile = r['requested_by'] as Map<String, dynamic>? ?? {};
          final name = (profile['full_name'] ?? '').toString().toLowerCase();
          final matchesSearch = name.contains(query.toLowerCase());
          
          if (tab == 1) return matchesSearch && r['status'].toString().toLowerCase() == 'pending';
          if (tab == 2) return matchesSearch && r['status'].toString().toLowerCase() == 'approved';
          return matchesSearch;
        }).toList();

        if (filtered.isEmpty) {
          return Center(
            child: Column(
              children: [
                const SizedBox(height: 40),
                Icon(LucideIcons.calendarX, size: 48, color: colors.textSecondary.withOpacity(0.2)),
                const SizedBox(height: 16),
                Text('No leave requests found', style: TextStyle(color: colors.textSecondary)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: EdgeInsets.zero,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: filtered.length,
          itemBuilder: (context, index) => _buildLeaveCard(context, ref, filtered[index], colors),
        );
      },
      loading: () => MhLoading(),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.red))),
    );
  }

  Widget _buildLeaveCard(BuildContext context, WidgetRef ref, Map<String, dynamic> request, ThemeColors colors) {
    final profile = request['requested_by'] as Map<String, dynamic>? ?? {};
    final status = request['status'] as String? ?? 'pending';
    final dbType = request['type'] as String? ?? 'other';
    final type = _dbKeyToType[dbType.toLowerCase()] ?? dbType;
    final start = DateTime.tryParse(request['start_date'] ?? '') ?? DateTime.now();
    final end = DateTime.tryParse(request['end_date'] ?? '') ?? DateTime.now();
    final totalDays = request['total_days']?.toString() ?? '0';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: colors.honey.withOpacity(0.1),
                child: profile['avatar_url'] != null 
                  ? ClipOval(child: Image.network(profile['avatar_url'], width: 36, height: 36, fit: BoxFit.cover))
                  : Text((profile['full_name'] ?? '?')[0], style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(profile['full_name'] ?? 'Unknown User', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold)),
                    Text(profile['email'] ?? '', style: TextStyle(color: colors.textSecondary, fontSize: 10)),
                  ],
                ),
              ),
              _buildStatusBadge(status, colors),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildDetailItem('TYPE', type, LucideIcons.tag, colors),
              _buildDetailItem('DURATION', '${DateFormat('MMM dd').format(start)} - ${DateFormat('MMM dd').format(end)}', LucideIcons.calendar, colors),
              _buildDetailItem('DAYS', totalDays, LucideIcons.clock, colors),
            ],
          ),
          if (request['reason'] != null && request['reason'].toString().isNotEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              width: double.infinity,
              decoration: BoxDecoration(
                color: colors.backgroundPrimary.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                request['reason'],
                style: TextStyle(color: colors.textSecondary, fontSize: 11, fontStyle: FontStyle.italic),
              ),
            ),
          ],
          if (status == 'pending') ...[
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleAction(context, ref, request['id'], 'rejected'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.redAccent,
                      side: const BorderSide(color: Colors.redAccent),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('REJECT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleAction(context, ref, request['id'], 'approved'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('APPROVE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon, ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 10, color: colors.honey),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildStatusBadge(String status, ThemeColors colors) {
    Color color;
    switch (status.toLowerCase()) {
      case 'approved': color = const Color(0xFF10B981); break;
      case 'rejected': color = const Color(0xFFEF4444); break;
      default: color = const Color(0xFFF59E0B);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w900),
      ),
    );
  }

  Future<void> _handleAction(BuildContext context, WidgetRef ref, String id, String status) async {
    try {
      await ref.read(leaveRepositoryProvider).updateLeaveStatus(id, status);
      ref.invalidate(teamLeaveRequestsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Leave request $status successfully')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }
}
