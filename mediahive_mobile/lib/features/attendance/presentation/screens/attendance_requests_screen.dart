import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../shared/widgets/mh_loading.dart';
import '../../../../shared/widgets/mh_refresh_indicator.dart';
import '../../domain/models/attendance_request.dart';
import '../providers/attendance_provider.dart';

class AttendanceRequestsScreen extends ConsumerStatefulWidget {
  const AttendanceRequestsScreen({super.key});

  @override
  ConsumerState<AttendanceRequestsScreen> createState() => _AttendanceRequestsScreenState();
}

class _AttendanceRequestsScreenState extends ConsumerState<AttendanceRequestsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _notesController = TextEditingController();
  String? _actingOnRequestId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleResolution(String requestId, String status) async {
    final profileAsync = ref.read(currentUserProfileProvider);
    final profile = profileAsync.value;
    if (profile == null) return;
    final adminUserId = profile['id'] as String;
    final notes = _notesController.text.trim().isEmpty ? null : _notesController.text.trim();

    setState(() => _actingOnRequestId = requestId);

    try {
      await ref.read(resolveRequestNotifierProvider.notifier).resolve(
        requestId: requestId,
        status: status,
        adminUserId: adminUserId,
        adminNotes: notes,
      );

      _notesController.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Request ${status == 'approved' ? 'Approved' : 'Rejected'} successfully.'),
          backgroundColor: status == 'approved' ? AppColors.success : AppColors.error,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) {
        setState(() => _actingOnRequestId = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final requestsAsync = ref.watch(adminAttendanceRequestsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.backgroundSecondary, colors.backgroundPrimary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          children: [
            // Header Section
            Padding(
              padding: EdgeInsets.fromLTRB(20, 110 + MediaQuery.of(context).padding.top, 20, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: colors.border),
                      ),
                      child: Icon(LucideIcons.chevronLeft, color: colors.textPrimary, size: 18),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ATTENDANCE REQUESTS',
                        style: AppTypography.h2.copyWith(color: colors.textPrimary),
                      ),
                      Text(
                        'ADMIN CONTROL PANEL',
                        style: AppTypography.caption.copyWith(color: colors.textSecondary, letterSpacing: 0.5),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Tab bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Container(
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: colors.border),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicatorSize: TabBarIndicatorSize.tab,
                  indicator: BoxDecoration(
                    color: colors.honey.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: colors.honey.withValues(alpha: 0.3)),
                  ),
                  labelColor: colors.honey,
                  unselectedLabelColor: colors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                  unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                  tabs: const [
                    Tab(text: 'PENDING REQUESTS'),
                    Tab(text: 'RESOLVED HISTORY'),
                  ],
                ),
              ),
            ),

            // Tab contents
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Pending Requests View
                  MhRefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(adminAttendanceRequestsProvider);
                      await Future.delayed(const Duration(milliseconds: 600));
                    },
                    child: requestsAsync.when(
                      data: (list) {
                        final pending = list.where((r) => r.status == 'pending').toList();
                        if (pending.isEmpty) return _buildEmptyState(colors, 'No pending requests found.');
                        return ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          itemCount: pending.length,
                          itemBuilder: (_, i) => _buildRequestCard(colors, pending[i], isPending: true),
                        );
                      },
                      loading: () => const MhLoading(size: 80),
                      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
                    ),
                  ),

                  // Resolved Requests View
                  MhRefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(adminAttendanceRequestsProvider);
                      await Future.delayed(const Duration(milliseconds: 600));
                    },
                    child: FutureBuilder<List<AttendanceRequest>>(
                      future: ref.read(attendanceRepositoryProvider).getAttendanceRequests(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const MhLoading(size: 80);
                        }
                        final list = snapshot.data ?? [];
                        final resolved = list.where((r) => r.status != 'pending').toList();
                        if (resolved.isEmpty) return _buildEmptyState(colors, 'No request history found.');
                        return ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          itemCount: resolved.length,
                          itemBuilder: (_, i) => _buildRequestCard(colors, resolved[i], isPending: false),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestCard(ThemeColors colors, AttendanceRequest req, {required bool isPending}) {
    final isCheckout = req.requestType == 'remote_checkout';
    final requestedTime = DateTime.tryParse(req.requestedTime)?.toLocal();
    final isActing = _actingOnRequestId == req.id;

    Color requestTypeColor = isCheckout ? AppColors.info : colors.honey;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Username & Status Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                req.userName.toUpperCase(),
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900, fontSize: 13),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: requestTypeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  req.requestType.replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(color: requestTypeColor, fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const Divider(height: 20),

          // Details
          Row(
            children: [
              Icon(LucideIcons.clock, color: colors.textSecondary, size: 14),
              const SizedBox(width: 6),
              Text(
                requestedTime != null ? DateFormat('MMM dd, yyyy - hh:mm a').format(requestedTime) : '--',
                style: TextStyle(color: colors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(LucideIcons.alignLeft, color: colors.textSecondary, size: 14),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  req.reason,
                  style: TextStyle(color: colors.textSecondary, fontSize: 12),
                ),
              ),
            ],
          ),

          if (isCheckout && req.latitude != null && req.longitude != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(LucideIcons.mapPin, color: AppColors.success, size: 14),
                const SizedBox(width: 6),
                Text(
                  'GPS: ${req.latitude!.toStringAsFixed(5)}, ${req.longitude!.toStringAsFixed(5)}',
                  style: const TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],

          if (!isPending) ...[
            const Divider(height: 20),
            Row(
              children: [
                Icon(
                  req.status == 'approved' ? LucideIcons.checkCircle : (req.status == 'expired' ? LucideIcons.clock : LucideIcons.xCircle),
                  color: req.status == 'approved' ? AppColors.success : (req.status == 'expired' ? colors.textSecondary : AppColors.error),
                  size: 14,
                ),
                const SizedBox(width: 6),
                Text(
                  'STATUS: ${req.status.toUpperCase()}',
                  style: TextStyle(
                    color: req.status == 'approved' ? AppColors.success : (req.status == 'expired' ? colors.textSecondary : AppColors.error),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            if (req.adminNotes != null) ...[
              const SizedBox(height: 6),
              Text(
                'Notes: ${req.adminNotes!}',
                style: TextStyle(color: colors.textSecondary, fontSize: 11, fontStyle: FontStyle.italic),
              ),
            ],
          ],

          // Admin action buttons if pending
          if (isPending) ...[
            const Divider(height: 20),
            if (isActing)
              const Center(child: MhLoading(size: 40))
            else ...[
              // Notes field
              TextField(
                controller: _notesController,
                style: TextStyle(color: colors.textPrimary, fontSize: 12),
                decoration: InputDecoration(
                  labelText: 'Admin Review Notes (Optional)',
                  labelStyle: TextStyle(color: colors.textSecondary, fontSize: 11),
                  filled: true,
                  fillColor: colors.backgroundPrimary,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.border)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.honey)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => _handleResolution(req.id, 'rejected'),
                      icon: const Icon(LucideIcons.x, color: Colors.white, size: 14),
                      label: const Text('REJECT', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => _handleResolution(req.id, 'approved'),
                      icon: const Icon(LucideIcons.check, color: Colors.white, size: 14),
                      label: const Text('APPROVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeColors colors, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.inbox, color: colors.textSecondary, size: 48),
          const SizedBox(height: 12),
          Text(message, style: TextStyle(color: colors.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }
}
