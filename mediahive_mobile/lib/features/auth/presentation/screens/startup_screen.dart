import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme_provider.dart';

class StartupScreen extends ConsumerStatefulWidget {
  const StartupScreen({super.key});

  @override
  ConsumerState<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends ConsumerState<StartupScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();
    _checkAuth();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _checkAuth() async {
    // Keep it for 2 seconds to show the premium animation
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        context.go('/dashboard');
      } else {
        context.go('/login');
      }
    } catch (e) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    
    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F172A), // Slate 900
              Color(0xFF005577), // Deep Navy
              Color(0xFF00A9CC), // Cyan
            ],
            stops: [0.0, 0.6, 1.0],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo with Rotation Animation
              RotationTransition(
                turns: _controller,
                child: Container(
                  width: 220,
                  height: 220,
                  padding: const EdgeInsets.all(20),
                  child: Image.asset(
                    'assets/images/app_icon.png',
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(height: 40),
              
              // App Name
              Text(
                'MediaHive',
                style: TextStyle(
                  color: colors.honey,
                  fontFamily: 'BavistaSoulvare',
                  fontSize: 48,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 12),
              
              // Status Indicator
              Text(
                'SYNCHRONIZING...',
                style: TextStyle(
                  color: colors.textSecondary.withOpacity(0.6),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 30),
              
              // Progress Bar
              Container(
                width: 200,
                height: 2,
                decoration: BoxDecoration(
                  color: colors.border.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(1),
                ),
                child: const LinearProgressIndicator(
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFE59312)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
