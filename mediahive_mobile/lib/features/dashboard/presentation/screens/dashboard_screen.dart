import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/design_tokens.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/services/auth_service.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../providers/dashboard_providers.dart';
import '../../../../core/theme/app_typography.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../attendance/presentation/providers/attendance_provider.dart';
import '../../../attendance/presentation/screens/qr_scanner_overlay.dart';
import '../../../tasks/domain/models/task.dart';
import '../../../calendar/presentation/providers/events_provider.dart';
import '../../../../shared/widgets/mh_refresh_indicator.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final metrics = ref.watch(dashboardMetricsProvider);
    final isAdmin = metrics['isAdmin'] as bool? ?? false;

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: SafeArea(
        top: false,
        child: Container(
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
              ref.invalidate(dashboardMetricsProvider);
              ref.invalidate(eventListProvider);
              ref.invalidate(tasksListProvider);
              ref.invalidate(currentUserProfileProvider);
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(parent: ElasticScrollPhysics()),
              slivers: [
                _buildSliverHeader(colors),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 120, 20, 80),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildGreeting(colors, ref),
                        const SizedBox(height: 32),
                        if (!isAdmin) ...[
                          _buildAttendanceWidget(context, colors, ref),
                          const SizedBox(height: 32),
                        ],
                        _buildQuickActions(context, ref, colors),
                        const SizedBox(height: 32),

                        _buildPulseSection(colors),
                        const SizedBox(height: 32),

                        _buildSystemStatus(context, colors, ref),
                        const SizedBox(height: 32),

                         _buildCompletionProgress(colors, ref),
                        const SizedBox(height: 40),

                        _buildTasksSectionHeader(context, colors, ref),
                        const SizedBox(height: 16),
                        _buildTasksList(context, colors, ref),
                        const SizedBox(height: 32),

                        _buildEventsSectionHeader(colors, ref),
                        const SizedBox(height: 16),
                        _buildEventsList(colors, ref),
                        const SizedBox(height: 40),

                        _buildRequestsSection(colors, ref),
                        const SizedBox(height: 32),

                        _buildRequestProgress(colors, ref),
                        const SizedBox(height: 40),
                        
                        _buildSystemFooter(colors),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAdminDashboard(BuildContext context, ThemeColors colors, WidgetRef ref, Map<String, dynamic> metrics) {
    final admin = metrics['admin'] as Map<String, dynamic>?;
    if (admin == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(colors, 'INSTITUTIONAL OVERVIEW'),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildMetricCard(colors, '${admin['institutionalHealth']}%', 'HEALTH', LucideIcons.activity, AppColors.success)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard(colors, '${admin['overdueCount']}', 'OVERDUE', LucideIcons.alertCircle, AppColors.error)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard(colors, '${admin['pressurePoints']}', 'PRESSURE', LucideIcons.zap, AppColors.honey)),
          ],
        ),
        const SizedBox(height: 32),
        
        if (admin['alerts'].isNotEmpty) ...[
          _buildAlertsSection(colors, admin['alerts'] as List<dynamic>),
          const SizedBox(height: 32),
        ],

        _buildSystemStatus(context, colors, ref),
        const SizedBox(height: 32),

        _buildCompletionProgress(colors, ref),
        const SizedBox(height: 32),

        _buildWorkloadSection(colors, admin['workload'] as Map<String, int>, admin['bottlenecks'] as List<dynamic>),
        const SizedBox(height: 32),

        _buildEventsSectionHeader(colors, ref),
        const SizedBox(height: 16),
        _buildEventsList(colors, ref),
      ],
    ).animate().fadeIn(duration: 600.ms);
  }

  Widget _buildTeamDashboard(BuildContext context, ThemeColors colors, WidgetRef ref, Map<String, dynamic> metrics) {
    final team = metrics['team'] as Map<String, dynamic>?;
    if (team == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(colors, 'MY OPERATIONS'),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildMetricCard(colors, '${team['myPendingCount']}', 'PENDING', LucideIcons.checkSquare, AppColors.info)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard(colors, '${team['myPrioritiesCount']}', 'PRIORITY', LucideIcons.alertCircle, AppColors.error)),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard(colors, '${team['productivity']}%', 'PRODUCTIVITY', LucideIcons.trendingUp, AppColors.success)),
          ],
        ),
        const SizedBox(height: 32),

        _buildTasksSectionHeader(context, colors, ref),
        const SizedBox(height: 16),
        _buildTasksList(context, colors, ref),
        const SizedBox(height: 32),

        _buildEventsSectionHeader(colors, ref),
        const SizedBox(height: 16),
        _buildEventsList(colors, ref),
      ],
    ).animate().fadeIn(duration: 600.ms);
  }

  Widget _buildMetricCard(ThemeColors colors, String value, String label, IconData icon, Color accentColor) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: colors.isDark ? Colors.black.withValues(alpha: 0.2) : colors.border.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: accentColor.withValues(alpha: 0.8)),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTypography.h2.copyWith(
              fontSize: 24,
              color: colors.isDark ? Colors.white : colors.textPrimary,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              fontSize: 8,
              fontWeight: FontWeight.w900,
              color: colors.textSecondary.withValues(alpha: 0.4),
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertsSection(ThemeColors colors, List<dynamic> alerts) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: alerts.map((alert) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              const Icon(LucideIcons.alertCircle, size: 14, color: AppColors.error),
              const SizedBox(width: 12),
              Text(
                alert.toString(),
                style: AppTypography.caption.copyWith(color: AppColors.error.withValues(alpha: 0.8), fontWeight: FontWeight.bold),
              ),
            ],
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildWorkloadSection(ThemeColors colors, Map<String, int> workload, List<dynamic> bottlenecks) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(colors, 'TEAM WORKLOAD'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: Column(
            children: workload.entries.map((e) {
              final isBottleneck = bottlenecks.contains(e.key);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        e.key, 
                        style: AppTypography.bodyS.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isBottleneck ? AppColors.error : colors.textPrimary,
                        )
                      ),
                    ),
                    Expanded(
                      flex: 7,
                      child: Stack(
                        children: [
                          Container(
                            height: 8,
                            decoration: BoxDecoration(color: colors.backgroundPrimary, borderRadius: BorderRadius.circular(4)),
                          ),
                          FractionallySizedBox(
                            widthFactor: (e.value / 10).clamp(0, 1).toDouble(),
                            child: Container(
                              height: 8,
                              decoration: BoxDecoration(
                                gradient: isBottleneck ? AppColors.errorGradient : AppColors.primaryGradient,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${e.value}', 
                      style: AppTypography.caption.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isBottleneck ? AppColors.error : colors.textSecondary,
                      )
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildSystemFooter(ThemeColors colors) {
    return Center(
      child: Column(
        children: [
          Icon(LucideIcons.shieldCheck, size: 16, color: colors.textSecondary.withValues(alpha: 0.2)),
          const SizedBox(height: 8),
          Text(
            'MEDIAHIVE SECURE OPS CORE',
            style: AppTypography.caption.copyWith(
              fontSize: 8,
              letterSpacing: 2.0,
              color: colors.textSecondary.withValues(alpha: 0.2),
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverHeader(ThemeColors colors) {
    return const SliverAppBar(
      expandedHeight: 0,
      collapsedHeight: 0,
      toolbarHeight: 0,
      pinned: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }

  Widget _buildPrioritiesList(BuildContext context, ThemeColors colors, WidgetRef ref, List<Task> priorities) {
    if (priorities.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.border),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(LucideIcons.checkCircle2, color: AppColors.success.withValues(alpha: 0.2), size: 32),
              const SizedBox(height: 12),
              Text(
                'ALL CLEAR',
                style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1.5),
              ),
              const SizedBox(height: 4),
              Text(
                'No immediate priorities found',
                style: AppTypography.caption.copyWith(color: colors.textSecondary.withValues(alpha: 0.5)),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: priorities.take(3).map((task) => _buildTaskItem(context, ref, task, colors)).toList(),
    );
  }

  Widget _buildTaskItem(BuildContext context, WidgetRef ref, Task task, ThemeColors colors) {
    final isDone = task.status.toLowerCase() == 'done';
    
    // Urgency Logic
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    DateTime? dueDate;
    try {
      dueDate = DateTime.parse(task.dueDate);
    } catch (_) {}
    final isOverdue = !isDone && dueDate != null && dueDate.isBefore(today);

    return GestureDetector(
      onTap: () => context.push('/task-details', extra: task),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isOverdue ? AppColors.error.withValues(alpha: 0.5) : colors.border.withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: (isOverdue ? AppColors.error : AppColors.info).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isOverdue ? LucideIcons.alertTriangle : LucideIcons.clock,
                size: 14,
                color: isOverdue ? AppColors.error : AppColors.info,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    task.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodyS.copyWith(
                      fontWeight: FontWeight.w900,
                      color: isDone ? colors.textSecondary.withValues(alpha: 0.5) : (isOverdue ? AppColors.error : colors.textPrimary),
                      decoration: isDone ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  Text(
                    'DUE ${task.dueDate}',
                    style: AppTypography.caption.copyWith(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: colors.textSecondary.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 14, color: colors.textSecondary.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceWidget(BuildContext context, ThemeColors colors, WidgetRef ref) {
    final profileAsync = ref.watch(currentUserProfileProvider);
    final isLight = !colors.isDark;
    
    return profileAsync.maybeWhen(
      data: (profile) {
        final role = (profile?['role']?.toString() ?? 'member').toLowerCase().trim();
        
        // Check role permissions: if role == 'member', show "Guest Account - Attendance Disabled"
        if (role == 'member') {
          return Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            decoration: BoxDecoration(
              color: colors.surface.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.shieldAlert, color: colors.textSecondary.withValues(alpha: 0.5), size: 20),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'GUEST ACCOUNT • ATTENDANCE DISABLED',
                    style: TextStyle(
                      color: colors.textSecondary.withValues(alpha: 0.6),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          );
        }
        
        // Show interactive Attendance status & action card
        final activeSessionAsync = ref.watch(activeAttendanceSessionProvider);
        
        return activeSessionAsync.maybeWhen(
          data: (activeSession) {
            final isCheckedIn = activeSession != null;
            final statusColor = isCheckedIn ? Colors.green : Colors.red;
            final statusText = isCheckedIn ? '🟢 Checked In' : '🔴 Checked Out';
            final workModeText = isCheckedIn ? ' (${activeSession.workMode.toUpperCase()})' : '';
            
            return GestureDetector(
              onTap: () => context.push('/attendance'),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isCheckedIn ? Colors.green.withValues(alpha: 0.3) : colors.border.withValues(alpha: 0.5),
                  ),
                  boxShadow: isLight ? DesignTokens.spatialCardShadow : [
                    BoxShadow(
                      color: (isCheckedIn ? Colors.green : colors.honey).withValues(alpha: 0.05),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                statusText,
                                style: TextStyle(
                                  color: isCheckedIn ? Colors.green : colors.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                workModeText,
                                style: TextStyle(
                                  color: colors.textSecondary.withValues(alpha: 0.8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          if (isCheckedIn) ...[
                            Text(
                              'Since ${DateFormat('hh:mm a').format(DateTime.parse(activeSession.checkInTime).toLocal())}',
                              style: TextStyle(
                                color: colors.textSecondary.withValues(alpha: 0.6),
                                fontSize: 11,
                              ),
                            ),
                            if (activeSession.lastKnownWorkLocation != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                'Location: ${activeSession.lastKnownWorkLocation}',
                                style: TextStyle(
                                  color: colors.honey.withValues(alpha: 0.8),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ] else ...[
                            Text(
                              'Ready to log check-in',
                              style: TextStyle(
                                color: colors.textSecondary.withValues(alpha: 0.5),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          onTap: () {
                            ref.read(globalNfcScanningProvider.notifier).startScan(
                              workMode: isCheckedIn ? activeSession.workMode : 'office',
                              source: 'nfc',
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              gradient: isCheckedIn
                                  ? const LinearGradient(colors: [Colors.green, Color(0xFF059669)])
                                  : AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: isCheckedIn
                                  ? [BoxShadow(color: Colors.green.withValues(alpha: 0.2), blurRadius: 6)]
                                  : DesignTokens.fintechGlowGold,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.nfc,
                                  color: isCheckedIn ? Colors.white : colors.backgroundPrimary,
                                  size: 14,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  isCheckedIn ? 'CHECK OUT' : 'TAP NFC',
                                  style: TextStyle(
                                    color: isCheckedIn ? Colors.white : colors.backgroundPrimary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (context) => QrScannerOverlay(
                                onScan: (payload) {
                                  Navigator.pop(context);
                                  ref.read(globalNfcScanningProvider.notifier).startScan(
                                    workMode: isCheckedIn ? activeSession.workMode : 'office',
                                    source: 'qr',
                                    qrPayload: payload,
                                  );
                                },
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              gradient: isCheckedIn
                                  ? const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)])
                                  : const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)]),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: (isCheckedIn ? Colors.blue : Colors.purple).withValues(alpha: 0.2),
                                  blurRadius: 6,
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  LucideIcons.qrCode,
                                  color: Colors.white,
                                  size: 14,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  isCheckedIn ? 'QR OUT' : 'SCAN QR',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
          orElse: () => const SizedBox.shrink(),
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }

  Widget _buildGreeting(ThemeColors colors, WidgetRef ref) {
    final profileAsync = ref.watch(currentUserProfileProvider);
    
    return profileAsync.when(
      loading: () => _buildGreetingPlaceholder(colors),
      error: (_, __) => _buildGreetingContent(colors, 'Unknown User', 'Member', 'Welcome back!'),
      data: (profile) {
        final auth = ref.read(authServiceProvider);
        final user = auth.currentUser;
        final metadata = user?.userMetadata ?? {};

        final fullName = profile?['full_name'] as String? ?? metadata['full_name'] as String? ?? 'Unknown';
        final roleRaw = (profile?['role']?.toString() ?? 'member').toLowerCase();
        // Robust check: handles 'manager', 'UserRole.manager', 'global_manager' etc.
        final isAdminOrManager = roleRaw.contains('admin') || roleRaw.contains('manager');
        
        // Dynamic Greeting & Motivation
        final hour = DateTime.now().hour;
        String greeting;
        String motivation;

        if (hour < 12) {
          greeting = 'Good Morning';
          motivation = 'Start your day with purpose.';
        } else if (hour < 17) {
          greeting = 'Good Afternoon';
          motivation = 'Your oversight ensures the team stays on track.';
        } else {
          greeting = 'Good Evening';
          motivation = 'Reviewing today\'s wins.';
        }

        return _buildGreetingContent(colors, fullName, roleRaw, motivation, greeting: greeting);
      },
    );
  }

  Widget _buildGreetingContent(
    ThemeColors colors, 
    String name, 
    String role, 
    String motivation, {
    String greeting = 'Hello', 
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildRoleBadge(colors, role),
        const SizedBox(height: 12),
        Text(
          greeting.toUpperCase(),
          style: AppTypography.caption.copyWith(
            color: AppColors.info,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          name,
          style: AppTypography.h1.copyWith(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: colors.isDark ? Colors.white : colors.textPrimary,
            height: 1.1,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 8),
        Text(
          motivation,
          style: TextStyle(
            fontSize: 14,
            color: colors.textSecondary.withValues(alpha: 0.5),
            fontWeight: FontWeight.w500,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildRoleBadge(ThemeColors colors, String role) {
    final cleanRole = role.replaceAll('userrole.', '').trim().toUpperCase();
    final isDark = colors.isDark;
    
    Gradient badgeGradient;
    Color borderColor;
    Color textColor;
    
    if (cleanRole.contains('ADMIN')) {
      badgeGradient = const LinearGradient(
        colors: [Color(0xFFFFD700), Color(0xFFC9A84C)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      borderColor = isDark ? const Color(0x26FFD700) : const Color(0xFFC9A84C).withValues(alpha: 0.4);
      textColor = isDark ? const Color(0xFF000000) : Colors.white;
    } else if (cleanRole.contains('MANAGER')) {
      badgeGradient = const LinearGradient(
        colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
      borderColor = isDark ? const Color(0x333B82F6) : const Color(0xFF1D4ED8).withValues(alpha: 0.4);
      textColor = Colors.white;
    } else {
      // MEMBER / USER
      badgeGradient = isDark
          ? const LinearGradient(
              colors: [Color(0xFF333333), Color(0xFF1A1A1A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            )
          : const LinearGradient(
              colors: [Color(0xFFE5E7EB), Color(0xFFD1D5DB)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            );
      borderColor = isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.08);
      textColor = isDark ? const Color(0xFFCCCCCC) : const Color(0xFF1F2937);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: badgeGradient,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor, width: 0.75),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        cleanRole,
        style: TextStyle(
          fontSize: 8,
          fontWeight: FontWeight.w900,
          color: textColor,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildGreetingPlaceholder(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(width: 60, height: 20, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(8))),
        const SizedBox(height: 12),
        Container(width: 100, height: 16, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(4))),
        const SizedBox(height: 8),
        Container(width: 200, height: 32, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(8))),
      ],
    ).animate(onPlay: (controller) => controller.repeat()).shimmer(duration: 1.5.seconds);
  }

  Widget _buildSectionHeader(ThemeColors colors, String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 14,
          decoration: BoxDecoration(
            color: DesignTokens.honey,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary,
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, WidgetRef ref, ThemeColors colors) {
    final profileAsync = ref.watch(currentUserProfileProvider);
    
    // Only show administrative actions if we are certain of the role.
    // Defaulting to false while loading is safer and prevents unauthorized UI flickers.
    final isAdminOrManager = profileAsync.maybeWhen(
      data: (profile) {
        final roleRaw = (profile?['role']?.toString() ?? 'member').toLowerCase().trim();
        return roleRaw.contains('admin') || roleRaw.contains('manager');
      },
      orElse: () => false,
    );

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                colors,
                'New Task',
                LucideIcons.clipboardCheck,
                onTap: () => context.push('/create-task'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                colors,
                'New Event',
                LucideIcons.calendar,
                onTap: () => context.push('/create-event'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                colors,
                'New Campaign',
                LucideIcons.layers,
                onTap: () => context.push('/campaigns/create'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                colors,
                'Notify Team',
                LucideIcons.bell,
                onTap: () {
                  if (isAdminOrManager) {
                    context.push('/notifications/create');
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: colors.surface,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        content: Row(
                          children: [
                            const Icon(LucideIcons.shieldAlert, color: Colors.orangeAccent, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'ACCESS RESTRICTED: ADMINS & MANAGERS ONLY',
                                style: TextStyle(
                                  color: colors.textPrimary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                        duration: const Duration(seconds: 3),
                      ),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 200.ms, duration: 600.ms);
  }

  Widget _buildActionCard(
    ThemeColors colors,
    String label,
    IconData icon, {
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          gradient: colors.isDark
              ? const LinearGradient(
                  colors: [
                    Color(0xFF1E293B),
                    Color(0xFF0F172A),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : const LinearGradient(
                  colors: [
                    Colors.white,
                    Color(0xFFFBFBEE),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark 
                ? Colors.white.withValues(alpha: 0.08) 
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
                color: colors.isDark ? Colors.white : colors.textPrimary,
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

  Widget _buildPulseSection(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.zap, size: 16, color: Colors.orangeAccent),
            const SizedBox(width: 8),
            Text(
              'Production Pulse'.toUpperCase(),
              style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.textSecondary),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: colors.textSecondary.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'STANDBY MODE',
                style: TextStyle(
                  color: colors.textSecondary.withValues(alpha: 0.6),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSystemStatus(BuildContext context, ThemeColors colors, WidgetRef ref) {
    final metrics = ref.watch(dashboardMetricsProvider);
    final status = metrics['systemStatus'] as Map<String, dynamic>;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('System Status', style: AppTypography.h3),
            Text('TEAM TODAY', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.textSecondary)),
          ],
        ),
        const SizedBox(height: 4),
        Text('${status['totalTodayCount']} Total Tasks Today', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _buildStatusCard(colors, status['dueToday'], 'DUE TODAY', LucideIcons.clock, Colors.orange, onTap: () => context.go('/tasks'))),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, status['inProgress'], 'IN PROGRESS', LucideIcons.activity, Colors.blue)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, status['onHold'], 'ON HOLD', LucideIcons.pauseCircle, Colors.red)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, status['completed'], 'COMPLETED', LucideIcons.checkCircle, Colors.green)),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusCard(ThemeColors colors, String value, String label, IconData icon, Color color, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: colors.isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark 
                ? colors.border.withValues(alpha: 0.5) 
                : colors.border.withValues(alpha: 0.12),
          ),
          boxShadow: colors.isDark
              ? []
              : [
                  BoxShadow(
                    color: colors.border.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: colors.isDark ? 0.1 : 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: colors.isDark ? Colors.white : colors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w800,
                color: colors.textSecondary.withValues(alpha: 0.5),
                letterSpacing: 1.0,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionProgress(ThemeColors colors, WidgetRef ref) {
    final metrics = ref.watch(dashboardMetricsProvider);
    final completion = metrics['completion'] as Map<String, dynamic>;
    final double percentage = (completion['percentage'] as int).toDouble() / 100.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Today\'s Completion', style: AppTypography.h3),
            Text('${completion['percentage']}%', style: const TextStyle(color: Color(0xFF10B981), fontSize: 24, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text(completion['label'], style: TextStyle(color: colors.textSecondary, fontSize: 12)),
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
                  gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF34D399)]),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withValues(alpha: 0.3),
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

  Widget _buildRequestsSection(ThemeColors colors, WidgetRef ref) {
    final metrics = ref.watch(dashboardMetricsProvider);
    final requests = metrics['myRequests'] as Map<String, dynamic>;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('My Requests', style: AppTypography.h3),
            Text('PERSONAL SUMMARY', style: AppTypography.caption.copyWith(fontWeight: FontWeight.bold, color: colors.textSecondary)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(LucideIcons.fileText, size: 14, color: Colors.blueAccent),
            const SizedBox(width: 8),
            Text('${requests['total']} Total Requests', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _buildStatusCard(colors, requests['pending'].toString(), 'PENDING', LucideIcons.clock, Colors.orange)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, requests['inProgress'].toString(), 'IN PROGRESS', LucideIcons.activity, Colors.blue)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, requests['inReview'].toString(), 'IN REVIEW', LucideIcons.search, Colors.purple)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, requests['completed'].toString(), 'COMPLETED', LucideIcons.checkCircle, Colors.green)),
          ],
        ),
      ],
    );
  }

  Widget _buildRequestProgress(ThemeColors colors, WidgetRef ref) {
    final metrics = ref.watch(dashboardMetricsProvider);
    final requests = metrics['myRequests'] as Map<String, dynamic>;
    final int progress = (requests['progress'] as num?)?.toInt() ?? 0;
    final double percentage = progress.toDouble() / 100.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Request Progress', style: AppTypography.h3),
            Text('$progress%', style: const TextStyle(color: Color(0xFF6366F1), fontSize: 24, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text('${requests['fulfilled']} of ${requests['total']} requests fulfilled', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
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

  bool _isRelevantEvent(dynamic e, String roleRaw, String? currentUserId, String? currentDepartment, String today) {
    if (roleRaw.contains('admin')) {
      return e.date == today;
    } else if (roleRaw.contains('member')) {
      return e.date == today && (e.departmentId?.toString() == currentDepartment || e.createdBy == currentUserId);
    } else {
      return e.date == today;
    }
  }

  bool _isRelevantTask(Task t, String roleRaw, String? currentUserId, String? currentDepartment, String today, String? currentUserFullName) {
    if (t.status.toLowerCase() == 'done') return false; // Remove completed tasks from the widget
    
    if (roleRaw.contains('admin')) {
      return t.dueDate == today || (t.dueDate.compareTo(today) < 0);
    } else {
      bool isAssignedToMe = false;
      if (t.onBehalfOf != null && currentUserId != null) {
        try {
          final metadata = jsonDecode(t.onBehalfOf!);
          if (metadata['assignee_ids'] != null) {
            isAssignedToMe = List<String>.from(metadata['assignee_ids']).contains(currentUserId);
          } else if (metadata['assignee_id'] != null) {
            isAssignedToMe = metadata['assignee_id'] == currentUserId;
          }
        } catch (_) {}
      }
      if (!isAssignedToMe && currentUserFullName != null && t.assignee.isNotEmpty) {
        isAssignedToMe = t.assignee.toLowerCase().contains(currentUserFullName.toLowerCase());
      }
      return (t.dueDate == today || t.dueDate.compareTo(today) < 0) && isAssignedToMe;
    }
  }

  String _getEventsTitle(String roleRaw) {
    if (roleRaw.contains('admin')) return 'All Events Today';
    return 'Today\'s Events For You';
  }

  String _getTasksTitle(String roleRaw) {
    if (roleRaw.contains('admin')) return 'Today\'s Tasks';
    return 'Today\'s Tasks For You';
  }

  Widget _buildEventsSectionHeader(ThemeColors colors, WidgetRef ref) {
    final eventsAsync = ref.watch(eventListProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    final roleRaw = profileAsync.maybeWhen(data: (p) => (p?['role']?.toString() ?? 'member').toLowerCase().trim(), orElse: () => 'member');
    final currentUserId = profileAsync.maybeWhen(data: (p) => p?['id']?.toString(), orElse: () => null);
    final currentDepartment = profileAsync.maybeWhen(data: (p) => p?['department']?.toString(), orElse: () => null);

    final count = eventsAsync.maybeWhen(
      data: (events) => events.where((e) => _isRelevantEvent(e, roleRaw, currentUserId, currentDepartment, today)).length,
      orElse: () => 0,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: colors.indigo.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: colors.indigo.withValues(alpha: 0.2)),
                ),
                child: Icon(LucideIcons.calendar, size: 16, color: colors.indigo),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _getEventsTitle(roleRaw), 
                  style: AppTypography.h3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: colors.border),
          ),
          child: Text(
            '$count EVENTS',
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEventsList(ThemeColors colors, WidgetRef ref) {
    final eventsAsync = ref.watch(eventListProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    final roleRaw = profileAsync.maybeWhen(data: (p) => (p?['role']?.toString() ?? 'member').toLowerCase().trim(), orElse: () => 'member');
    final currentUserId = profileAsync.maybeWhen(data: (p) => p?['id']?.toString(), orElse: () => null);
    final currentDepartment = profileAsync.maybeWhen(data: (p) => p?['department']?.toString(), orElse: () => null);

    return eventsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error loading events', style: TextStyle(color: colors.textSecondary))),
      data: (events) {
        final relevantEvents = events.where((e) => _isRelevantEvent(e, roleRaw, currentUserId, currentDepartment, today)).toList();
        
        if (relevantEvents.isEmpty) {
          return Center(child: Text('NO EVENTS SCHEDULED', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)));
        }

        return Column(
          children: relevantEvents.map((event) => _buildEventCard(colors, event)).toList(),
        );
      },
    );
  }

  Widget _buildEventCard(ThemeColors colors, dynamic event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Color(event.colorValue).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  event.time.split(':')[0],
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(event.colorValue),
                  ),
                ),
                Text(
                  event.time.split(':').length > 1 ? event.time.split(':')[1].substring(0, 2) : '00',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(event.colorValue).withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(LucideIcons.mapPin, size: 10, color: colors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      event.location ?? 'No location',
                      style: TextStyle(
                        fontSize: 10,
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: colors.backgroundSecondary,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              event.type.toUpperCase(),
              style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: colors.textSecondary.withValues(alpha: 0.6)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksSectionHeader(BuildContext context, ThemeColors colors, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksListProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    final roleRaw = profileAsync.maybeWhen(data: (p) => (p?['role']?.toString() ?? 'member').toLowerCase().trim(), orElse: () => 'member');
    final currentUserId = profileAsync.maybeWhen(data: (p) => p?['id']?.toString(), orElse: () => null);
    final currentDepartment = profileAsync.maybeWhen(data: (p) => p?['department']?.toString(), orElse: () => null);
    final currentUserFullName = profileAsync.maybeWhen(data: (p) => p?['full_name']?.toString(), orElse: () => null);

    final count = tasksAsync.maybeWhen(
      data: (tasks) => tasks.where((t) => _isRelevantTask(t, roleRaw, currentUserId, currentDepartment, today, currentUserFullName)).length,
      orElse: () => 0,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                ),
                child: const Icon(LucideIcons.checkSquare, size: 16, color: Color(0xFF10B981)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _getTasksTitle(roleRaw), 
                  style: AppTypography.h3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: () => context.go('/tasks'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: colors.border),
            ),
            child: Text(
              '$count TASKS',
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTasksList(BuildContext context, ThemeColors colors, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksListProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    final roleRaw = profileAsync.maybeWhen(data: (p) => (p?['role']?.toString() ?? 'member').toLowerCase().trim(), orElse: () => 'member');
    final currentUserId = profileAsync.maybeWhen(data: (p) => p?['id']?.toString(), orElse: () => null);
    final currentDepartment = profileAsync.maybeWhen(data: (p) => p?['department']?.toString(), orElse: () => null);
    final currentUserFullName = profileAsync.maybeWhen(data: (p) => p?['full_name']?.toString(), orElse: () => null);

    return tasksAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error loading tasks', style: TextStyle(color: colors.textSecondary))),
      data: (tasks) {
        final relevantTasks = tasks.where((t) => _isRelevantTask(t, roleRaw, currentUserId, currentDepartment, today, currentUserFullName)).toList();
        
        if (relevantTasks.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(LucideIcons.checkCircle2, color: AppColors.success.withValues(alpha: 0.2), size: 32),
                  const SizedBox(height: 12),
                  Text(
                    'ALL CLEAR',
                    style: AppTypography.caption.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'No immediate priorities found',
                    style: AppTypography.caption.copyWith(color: colors.textSecondary.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ),
          );
        }

        return Column(
          children: relevantTasks.map((task) => _buildTaskItem(context, ref, task, colors)).toList(),
        );
      },
    );
  }

  Widget _buildTaskCard(BuildContext context, WidgetRef ref, ThemeColors colors, Task task) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _getStatusColor(task.status).withValues(alpha: 0.8),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        task.title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: colors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _buildStatusBadge(context, ref, colors, task),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.user, size: 10, color: colors.textSecondary.withValues(alpha: 0.6)),
                    const SizedBox(width: 4),
                    Text(
                      task.assignee.toUpperCase(),
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.textSecondary.withValues(alpha: 0.6)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _buildPriorityBadge(task.priority),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    final s = status.toLowerCase();
    if (s == 'done') return AppColors.success;
    if (s == 'in_progress') return AppColors.info;
    if (s == 'review') return AppColors.warning;
    return AppColors.textSecondary;
  }

  Widget _buildStatusBadge(BuildContext context, WidgetRef ref, ThemeColors colors, Task task) {
    final color = _getStatusColor(task.status);
    
    return GestureDetector(
      onTap: () => _showStatusPicker(context, ref, colors, task),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Text(
          task.status.toUpperCase(),
          style: TextStyle(
            fontSize: 9, 
            fontWeight: FontWeight.w900, 
            color: color,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  void _showStatusPicker(BuildContext context, WidgetRef ref, ThemeColors colors, Task task) {
    // Values use canonical lowercase form matching DB schema
    final statuses = [
      {'label': 'TO DO', 'value': 'todo', 'color': colors.textSecondary, 'icon': LucideIcons.circle},
      {'label': 'IN PROGRESS', 'value': 'in_progress', 'color': colors.indigo, 'icon': LucideIcons.playCircle},
      {'label': 'REVIEW', 'value': 'review', 'color': colors.honey, 'icon': LucideIcons.helpCircle},
      {'label': 'DONE', 'value': 'done', 'color': colors.emerald, 'icon': LucideIcons.checkCircle2},
    ];

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: colors.backgroundPrimary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: colors.textSecondary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 20),
            Text(
              'UPDATE STATUS',
              style: AppTypography.caption.copyWith(
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
                color: colors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            ...statuses.map((s) {
              // Normalise comparison to handle any legacy mixed-case values from DB
              final isSelected = task.status.toLowerCase().replaceAll(' ', '_') == s['value'];
              final color = s['color'] as Color;
              
              return ListTile(
                onTap: () {
                  final updatedTask = task.copyWith(status: s['value'] as String);
                  ref.read(tasksListProvider.notifier).updateTask(updatedTask);
                  Navigator.pop(context);
                },
                leading: Icon(s['icon'] as IconData, color: isSelected ? color : color.withValues(alpha: 0.3)),
                title: Text(
                  s['label'] as String,
                  style: TextStyle(
                    color: isSelected ? colors.textPrimary : colors.textSecondary, 
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, 
                    fontSize: 14,
                  ),
                ),
                trailing: isSelected ? Icon(LucideIcons.check, color: color, size: 18) : null,
              );
            }),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }


  Widget _buildPriorityBadge(String priority) {
    final p = priority.toLowerCase();
    final String displayPriority = priority.toUpperCase();

    Color color;
    switch (p) {
      case 'urgent':
        color = Colors.red;
        break;
      case 'high':
        color = Colors.orange;
        break;
      case 'medium':
        color = Colors.amber;
        break;
      default:
        color = Colors.blue;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        displayPriority,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildSystemHealth(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.isDark ? const Color(0xFF0F172A) : colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.activity, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 12),
                  Text(
                    'All Systems Nominal',
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              Icon(LucideIcons.chevronRight, size: 16, color: colors.textSecondary.withValues(alpha: 0.3)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildMiniIndicator(colors, 'DB', true)),
              Expanded(child: _buildMiniIndicator(colors, 'AUTH', true)),
              Expanded(child: _buildMiniIndicator(colors, 'SYNC', true)),
              Expanded(child: _buildMiniIndicator(colors, 'STORAGE', true)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniIndicator(ThemeColors colors, String label, bool active) {
    return Column(
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: active ? const Color(0xFF10B981) : Colors.red,
            shape: BoxShape.circle,
            boxShadow: [
              if (active)
                BoxShadow(
                  color: const Color(0xFF10B981).withValues(alpha: 0.5),
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: colors.textSecondary.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }
}
