import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/startup_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/auth/presentation/screens/reset_confirmation_screen.dart';
import '../../presentation/screens/shell_screen.dart';
import '../../features/tasks/presentation/screens/tasks_screen.dart';
import '../../features/inventory/presentation/screens/inventory_screen.dart';
import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/governance/presentation/screens/governance_screen.dart';
import '../../features/auth/presentation/screens/profile_screen.dart';
import '../../features/attendance/presentation/screens/attendance_dashboard_screen.dart';
import '../../features/attendance/presentation/screens/attendance_scan_screen.dart';
import '../../features/attendance/presentation/screens/nfc_management_screen.dart';
import '../../features/attendance/presentation/screens/attendance_reports_screen.dart';
import '../../features/attendance/presentation/screens/attendance_policy_screen.dart';
import '../../features/attendance/presentation/screens/attendance_requests_screen.dart';
import '../../features/attendance/presentation/screens/holiday_management_screen.dart';
import '../../features/calendar/presentation/screens/create_event_screen.dart';
import '../../features/tasks/presentation/screens/create_task_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/tasks/domain/models/task.dart';
import '../../features/calendar/domain/models/event.dart';
import '../../features/inventory/domain/models/inventory_item.dart';
import '../../features/files/presentation/screens/downloads_screen.dart';
import '../../features/inventory/presentation/screens/add_inventory_item_screen.dart';
import '../../features/system/presentation/screens/notification_center_screen.dart';
import '../../features/system/presentation/screens/create_notification_screen.dart';
import '../../features/campaigns/presentation/screens/create_campaign_screen.dart';
import '../../features/governance/presentation/screens/command_center_screen.dart';
import '../../features/tasks/presentation/screens/task_details_screen.dart';
import '../../features/governance/presentation/screens/user_management_screen.dart';
import '../../features/system/presentation/screens/system_health_screen.dart';
import '../providers/user_provider.dart';
import '../../features/chat/presentation/screens/chat_rooms_screen.dart';
import '../../features/chat/presentation/screens/chat_room_screen.dart';
import '../../features/chat/domain/models/chat_room.dart';


final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final location = state.uri.toString();
      if (location.startsWith('mediahive://')) {
        try {
          final uri = Uri.parse(location);
          final host = uri.host;
          final path = uri.path;
          final query = uri.query.isNotEmpty ? '?${uri.query}' : '';
          return '/$host$path$query';
        } catch (_) {
          return null;
        }
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const StartupScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignUpScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-confirmation',
        builder: (context, state) => const ResetConfirmationScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/tasks',
            builder: (context, state) => const TasksScreen(),
          ),
          GoRoute(
            path: '/inventory',
            builder: (context, state) => const InventoryScreen(),
          ),
          GoRoute(
            path: '/calendar',
            builder: (context, state) => const CalendarScreen(),
          ),
          GoRoute(
            path: '/files',
            builder: (context, state) => const DownloadsScreen(),
          ),
          GoRoute(
            path: '/attendance',
            builder: (context, state) => const AttendanceDashboardScreen(),
          ),
          GoRoute(
            path: '/attendance/scan',
            builder: (context, state) {
              final tagId = state.uri.queryParameters['tagId'];
              return AttendanceScanScreen(tagId: tagId);
            },
          ),
          GoRoute(
            path: '/governance/nfc-tags',
            builder: (context, state) => const NfcManagementScreen(),
          ),
          GoRoute(
            path: '/governance/attendance-reports',
            builder: (context, state) => const AttendanceReportsScreen(),
          ),
          GoRoute(
            path: '/governance/attendance-policy',
            builder: (context, state) => const AttendancePolicyScreen(),
          ),
          GoRoute(
            path: '/attendance/requests',
            builder: (context, state) => const AttendanceRequestsScreen(),
          ),
          GoRoute(
            path: '/attendance/holidays',
            builder: (context, state) => const HolidayManagementScreen(),
          ),
          GoRoute(
            path: '/governance',
            builder: (context, state) {
              return const GovernanceScreen();
            },
          ),
          GoRoute(
            path: '/governance/command-center',
            builder: (context, state) {
              final profileAsync = ref.read(currentUserProfileProvider);
              return profileAsync.maybeWhen(
                data: (profile) {
                  final role = profile?['role'] as String? ?? 'member';
                  if (role == 'admin' || role == 'manager') {
                    return const CommandCenterScreen();
                  } else {
                    return const GovernanceScreen();
                  }
                },
                orElse: () => const CommandCenterScreen(),
              );
            },
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const ProfileScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                final curvedAnimation = CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeInOutQuart,
                  reverseCurve: Curves.easeInOutQuart.flipped,
                );
                return ScaleTransition(
                  scale: curvedAnimation,
                  alignment: const Alignment(0.85, -0.92), // Avatar position top-right
                  child: FadeTransition(
                    opacity: curvedAnimation,
                    child: child,
                  ),
                );
              },
            ),
          ),
          GoRoute(
            path: '/notifications',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const NotificationCenterScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: animation.drive(
                    Tween<Offset>(
                      begin: const Offset(0, -1),
                      end: Offset.zero,
                    ).chain(CurveTween(curve: Curves.easeInOutQuart)),
                  ),
                  child: child,
                );
              },
            ),
          ),
          GoRoute(
            path: '/chat',
            builder: (context, state) => const ChatRoomsScreen(),
          ),
          GoRoute(
            path: '/chat/:roomId',
            builder: (context, state) {
              final roomId = state.pathParameters['roomId']!;
              final roomExtra = state.extra as ChatRoom?;
              return ChatRoomScreen(roomId: roomId, roomExtra: roomExtra);
            },
          ),

          GoRoute(
            path: '/governance/users',
            builder: (context, state) => const UserManagementScreen(),
          ),
          GoRoute(
            path: '/governance/system-health',
            builder: (context, state) => const SystemHealthScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/notifications/create',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CreateNotificationScreen(),
      ),
      GoRoute(
        path: '/campaigns/create',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CreateCampaignScreen(),
      ),
      GoRoute(
        path: '/create-event',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final event = state.extra as Event?;
          return CreateEventScreen(eventToEdit: event);
        },
      ),
      GoRoute(
        path: '/create-task',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final task = state.extra as Task?;
          return CreateTaskScreen(taskToEdit: task);
        },
      ),
      GoRoute(
        path: '/task-details',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final task = state.extra as Task;
          return TaskDetailsScreen(task: task);
        },
      ),
      GoRoute(
        path: '/inventory/create',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final item = state.extra as InventoryItem?;
          return AddInventoryItemScreen(itemToEdit: item);
        },
      ),
      GoRoute(
        path: '/shell',
        redirect: (context, state) => '/dashboard',
      ),
    ],

  );
});
