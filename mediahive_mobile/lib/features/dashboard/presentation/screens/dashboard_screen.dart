import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/design_tokens.dart';
import '../../../../core/theme_provider.dart';
import '../../../../presentation/providers/navigation_provider.dart';
import '../../../../core/providers/user_provider.dart';
import '../../../../core/services/auth_service.dart';
import '../../../tasks/presentation/screens/create_task_screen.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../providers/dashboard_providers.dart';
import '../../../../core/theme/app_typography.dart';
import 'package:intl/intl.dart';
import '../../../calendar/presentation/providers/events_provider.dart';
import '../../../calendar/presentation/screens/create_event_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: SafeArea(
        top: false, // Keep gradient under status bar
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
          child: RefreshIndicator(
            onRefresh: () async {
              // Refresh all relevant providers
              ref.invalidate(dashboardMetricsProvider);
              ref.invalidate(eventListProvider);
              ref.invalidate(tasksListProvider);
              ref.invalidate(currentUserProfileProvider);
              
              // Wait for them to complete (optional, invalidate is usually enough)
              await Future.delayed(const Duration(milliseconds: 500));
            },
            backgroundColor: colors.surface,
            color: const Color(0xFF6366F1),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              slivers: [
                // Premium App Bar (Floating effect)
                _buildSliverHeader(colors),
      
                SliverToBoxAdapter(
                  child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 120, 20, 120),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildGreeting(colors, ref),
                        const SizedBox(height: 32),
                        
                        _buildQuickActions(context, ref, colors),
                        const SizedBox(height: 32),
  
                        _buildPulseSection(colors),
                        const SizedBox(height: 32),
                        
                        _buildSystemStatus(colors, ref),
                        const SizedBox(height: 32),
  
                        _buildCompletionProgress(colors, ref),
                        const SizedBox(height: 32),
  
                        _buildEventsSectionHeader(colors, ref),
                        const SizedBox(height: 16),
                        _buildEventsList(colors, ref),
                        const SizedBox(height: 32),
  
                        _buildTasksSectionHeader(colors, ref),
                        const SizedBox(height: 16),
                        _buildTasksList(colors, ref),
                        const SizedBox(height: 32),
  
                        _buildRequestsSection(colors, ref),
                        const SizedBox(height: 32),
                        _buildRequestProgress(colors, ref),
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

  Widget _buildSliverHeader(ThemeColors colors) {
    return SliverAppBar(
      expandedHeight: 0,
      collapsedHeight: 0,
      toolbarHeight: 0,
      pinned: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
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

        final fullName = profile?['full_name'] as String? ?? metadata['full_name'] as String? ?? 'Unknown User';
        final rawRole = profile?['role'] as String? ?? metadata['role'] as String? ?? 'Member';
        
        // Dynamic Greeting & Motivation
        final hour = DateTime.now().hour;
        String greeting;
        IconData timeIcon;
        Color iconColor;
        String motivation;

        if (hour < 12) {
          greeting = 'Good Morning';
          timeIcon = LucideIcons.sun;
          iconColor = Colors.orangeAccent;
          motivation = 'Start your day with purpose.';
        } else if (hour < 17) {
          greeting = 'Good Afternoon';
          timeIcon = LucideIcons.sun;
          iconColor = Colors.orange;
          motivation = 'Your oversight ensures the team stays on track.';
        } else {
          greeting = 'Good Evening';
          timeIcon = LucideIcons.moon;
          iconColor = Colors.indigoAccent;
          motivation = 'Reviewing today\'s wins.';
        }

        return _buildGreetingContent(colors, fullName, rawRole, motivation, greeting: greeting, timeIcon: timeIcon, iconColor: iconColor);
      },
    );
  }

  Widget _buildGreetingContent(
    ThemeColors colors, 
    String name, 
    String role, 
    String motivation, {
    String greeting = 'Hello', 
    IconData timeIcon = LucideIcons.sun,
    Color iconColor = Colors.orange,
  }) {
    // Dynamic Emoji based on greeting
    String emoji = '☀️';
    if (greeting.contains('Morning')) emoji = '🌅';
    if (greeting.contains('Evening') || greeting.contains('Night')) emoji = '🌙';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    greeting,
                    style: AppTypography.h1.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    name,
                    style: AppTypography.h1.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.0,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              emoji,
              style: const TextStyle(fontSize: 36),
            ).animate(onPlay: (controller) => controller.repeat(reverse: true))
              .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 3.seconds),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          motivation,
          style: TextStyle(
            fontSize: 14,
            color: colors.textSecondary.withOpacity(0.7),
            fontWeight: FontWeight.w400,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    ).animate().fadeIn(duration: 800.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildGreetingPlaceholder(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(width: 100, height: 16, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(4))),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(width: 200, height: 32, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(8))),
            Container(width: 60, height: 20, decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(8))),
          ],
        ),
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
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                colors,
                'New Task',
                LucideIcons.clipboardCheck,
                const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)]),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateTaskScreen())),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                colors,
                'New Event',
                LucideIcons.calendar,
                const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF2563EB)]),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateEventScreen())),
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
                null,
                onTap: () {},
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                colors,
                'Notify Team',
                LucideIcons.bell,
                null,
                onTap: () {},
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
    IconData icon,
    Gradient? gradient, {
    required VoidCallback onTap,
  }) {
    final bool isDark = gradient == null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          gradient: gradient,
          color: isDark ? colors.surface : null,
          borderRadius: BorderRadius.circular(16),
          border: isDark ? Border.all(color: colors.border) : null,
          boxShadow: gradient != null ? [
            BoxShadow(
              color: (gradient as LinearGradient).colors.first.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ] : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
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
                  color: colors.textSecondary.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'STANDBY MODE',
                style: TextStyle(
                  color: colors.textSecondary.withOpacity(0.6),
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

  Widget _buildSystemStatus(ThemeColors colors, WidgetRef ref) {
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
            Expanded(child: _buildStatusCard(colors, status['dueToday'], 'DUE TODAY', LucideIcons.clock, Colors.orange)),
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

  Widget _buildStatusCard(ThemeColors colors, String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white38),
            textAlign: TextAlign.center,
          ),
        ],
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
                      color: const Color(0xFF10B981).withOpacity(0.3),
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
            Expanded(child: _buildStatusCard(colors, requests['pending'], 'PENDING', LucideIcons.clock, Colors.orange)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, requests['inProgress'], 'IN PROGRESS', LucideIcons.activity, Colors.blue)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, requests['inReview'], 'IN REVIEW', LucideIcons.search, Colors.purple)),
            const SizedBox(width: 8),
            Expanded(child: _buildStatusCard(colors, requests['completed'], 'COMPLETED', LucideIcons.checkCircle, Colors.green)),
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
                      color: const Color(0xFF6366F1).withOpacity(0.3),
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

  Widget _buildEventsSectionHeader(ThemeColors colors, WidgetRef ref) {
    final eventsAsync = ref.watch(eventListProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    final count = eventsAsync.maybeWhen(
      data: (events) => events.where((e) => e.date == today).length,
      orElse: () => 0,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.2)),
              ),
              child: const Icon(LucideIcons.calendar, size: 16, color: Color(0xFF3B82F6)),
            ),
            const SizedBox(width: 12),
            Text('Today\'s Events', style: AppTypography.h3),
          ],
        ),
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
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    return eventsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error loading events', style: TextStyle(color: colors.textSecondary))),
      data: (events) {
        final todayEvents = events.where((e) => e.date == today).toList();
        
        if (todayEvents.isEmpty) {
          return Center(child: Text('NO EVENTS SCHEDULED', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)));
        }

        return Column(
          children: todayEvents.map((event) => _buildEventCard(colors, event)).toList(),
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
              color: Color(event.colorValue).withOpacity(0.1),
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
                    color: Color(event.colorValue).withOpacity(0.6),
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
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
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
              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white38),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksSectionHeader(ThemeColors colors, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksListProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    
    final count = tasksAsync.maybeWhen(
      data: (tasks) => tasks.where((t) => t.dueDate == today).length,
      orElse: () => 0,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
              ),
              child: const Icon(LucideIcons.checkSquare, size: 16, color: Color(0xFF10B981)),
            ),
            const SizedBox(width: 12),
            Text('Today\'s Tasks', style: AppTypography.h3),
          ],
        ),
        Container(
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
      ],
    );
  }

  Widget _buildTasksList(ThemeColors colors, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksListProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    return tasksAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error loading tasks', style: TextStyle(color: colors.textSecondary))),
      data: (tasks) {
        final todayTasks = tasks.where((t) => t.dueDate == today).toList();
        
        if (todayTasks.isEmpty) {
          return Center(child: Text('NO TASKS FOR TODAY', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)));
        }

        return Column(
          children: todayTasks.map((task) => _buildTaskCard(colors, task)).toList(),
        );
      },
    );
  }

  Widget _buildTaskCard(ThemeColors colors, dynamic task) {
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
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: colors.textSecondary.withOpacity(0.3),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    task.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: colors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'TODO',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white38),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.user, size: 10, color: Colors.white38),
                    const SizedBox(width: 4),
                    Text(
                      'UNASSIGNED',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white38),
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

  Widget _buildPriorityBadge(String priority) {
    Color color = Colors.blue;
    if (priority.toUpperCase() == 'URGENT') color = Colors.red;
    if (priority.toUpperCase() == 'HIGH') color = Colors.orange;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        priority.toUpperCase(),
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildSystemHealth(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
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
              const Icon(LucideIcons.chevronRight, size: 16, color: Colors.white24),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildMiniIndicator('DB', true)),
              Expanded(child: _buildMiniIndicator('AUTH', true)),
              Expanded(child: _buildMiniIndicator('SYNC', true)),
              Expanded(child: _buildMiniIndicator('STORAGE', true)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniIndicator(String label, bool active) {
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
                  color: const Color(0xFF10B981).withOpacity(0.5),
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: Colors.white38,
          ),
        ),
      ],
    );
  }
}
