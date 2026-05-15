import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/startup_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../presentation/screens/shell_screen.dart';
import '../../features/tasks/presentation/screens/tasks_screen.dart';
import '../../features/inventory/presentation/screens/inventory_screen.dart';
import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/governance/presentation/screens/governance_screen.dart';
import '../../features/auth/presentation/screens/profile_screen.dart';
import '../../features/calendar/presentation/screens/create_event_screen.dart';
import '../../features/tasks/presentation/screens/create_task_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/files/presentation/screens/downloads_screen.dart';
import '../../features/inventory/presentation/screens/add_inventory_item_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
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
            path: '/governance',
            builder: (context, state) => const GovernanceScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/create-event',
        builder: (context, state) => const CreateEventScreen(),
      ),
      GoRoute(
        path: '/create-task',
        builder: (context, state) => const CreateTaskScreen(),
      ),
      GoRoute(
        path: '/inventory/create',
        builder: (context, state) => const AddInventoryItemScreen(),
      ),
      GoRoute(
        path: '/shell',
        redirect: (context, state) => '/dashboard',
      ),
    ],

  );
});
