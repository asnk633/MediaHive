import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme_provider.dart';

class StartupScreen extends ConsumerStatefulWidget {
  const StartupScreen({super.key});

  @override
  ConsumerState<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends ConsumerState<StartupScreen> with SingleTickerProviderStateMixin {
  late AnimationController _rotationController;
  bool _showOnboarding = false;
  bool _checkingAuth = true;

  @override
  void initState() {
    super.initState();
    // Ultra-slow, premium rotation animation for the logo
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 30),
    )..repeat();
    
    _checkAuth();
  }

  @override
  void dispose() {
    _rotationController.dispose();
    super.dispose();
  }

  Future<void> _checkAuth() async {
    // Show splash state for 1.5 seconds to establish connection and play logo animation
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        context.go('/dashboard');
      } else {
        setState(() {
          _checkingAuth = false;
          _showOnboarding = true;
        });
      }
    } catch (e) {
      setState(() {
        _checkingAuth = false;
        _showOnboarding = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isDark = colors.isDark;
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      body: Stack(
        children: [
          // Dynamic responsive gradient background based on theme (Aligned perfectly with dashboard in dark mode)
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [
                        const Color(0xFF000000), // Pure Black
                        const Color(0xFF0A0A0A), // Extremely Deep Grey
                        const Color(0xFF141414), // Charcoal Grey
                      ]
                    : [
                        const Color(0xFFEFF3FC), // Sky White
                        const Color(0xFFE2EAFD), // Light Sky Blue
                        const Color(0xFFC7D8F9), // Soft Sky Blue
                      ],
                stops: const [0.0, 0.6, 1.0],
              ),
            ),
          ),

          // Subtle Pattern Overlay
          Positioned.fill(
            child: Opacity(
              opacity: isDark ? 0.04 : 0.08,
              child: Image.asset(
                'assets/images/pattern.png',
                repeat: ImageRepeat.repeat,
                errorBuilder: (context, error, stackTrace) => Container(),
              ),
            ),
          ),

          // Main Layout Area
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return Stack(
                  children: [
                    // Top Half: Rotating Logo and Tagline (Shifted top to center above the Welcome card)
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 700),
                      curve: Curves.easeOutQuart,
                      top: _showOnboarding ? 140 : (constraints.maxHeight / 2) - 200,
                      left: 0,
                      right: 0,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Rotating Logo (Direct clean rotate per requests)
                          RotationTransition(
                            turns: _rotationController,
                            child: Container(
                              width: _showOnboarding ? 220 : 300,
                              height: _showOnboarding ? 220 : 300,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFFFD700).withValues(alpha: isDark ? 0.12 : 0.2), // Much softer opacity in dark theme
                                    blurRadius: isDark ? 80 : 50, // Wider, softer blur in dark theme
                                    spreadRadius: isDark ? 0 : 6, // Zero hard spread in dark theme
                                  ),
                                ],
                              ),
                              child: Image.asset(
                                'assets/images/logo.png',
                                fit: BoxFit.contain,
                              ),
                            ),
                          ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
                          
                          const SizedBox(height: 12),
                          
                          // Brand Name (Typography Image) with heightFactor to natively collapse transparent padding
                          Align(
                            alignment: Alignment.center,
                            heightFactor: 0.25, // Aggressively trims the empty top/bottom space
                            child: Image.asset(
                              isDark ? 'assets/images/app_name_light.png' : 'assets/images/app_name_dark.png',
                              key: ValueKey('brand_name_$isDark'), // Prevents ghosting during theme transition
                              width: _showOnboarding ? 280 : 340,
                              fit: BoxFit.contain,
                            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Tagline
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Text(
                              'The Central Hub to Thaiba Garden Media Department',
                              key: ValueKey('tagline_$isDark'), // Prevents ghosting during theme transition
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                height: 1.5,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF1D1D1F).withValues(alpha: 0.85),
                              ),
                            ),
                          ).animate().fadeIn(delay: 400.ms),
                          
                          if (_checkingAuth) ...[
                            const SizedBox(height: 48),
                            // Mini loading indicator when checking auth
                            SizedBox(
                              width: 140,
                              height: 2,
                              child: LinearProgressIndicator(
                                backgroundColor: Colors.white.withValues(alpha: 0.1),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6),
                                ),
                              ),
                            ).animate().fadeIn(delay: 300.ms),
                          ],
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Bottom Half: Beautiful Curved Drawer Card (Onboarding Card - Placed outside SafeArea to merge completely with the screen edge)
          if (_showOnboarding)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(40),
                  topRight: Radius.circular(40),
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                  child: Container(
                    padding: EdgeInsets.only(
                      top: 40, 
                      left: 32, 
                      right: 32, 
                      bottom: 40 + MediaQuery.of(context).padding.bottom, // Extends background to device bottom bezel safely
                    ),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.65),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(40),
                        topRight: Radius.circular(40),
                      ),
                      border: Border.all(color: Colors.white.withValues(alpha: isDark ? 0.08 : 0.2)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                          blurRadius: 40,
                          offset: const Offset(0, -10),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: colors.textPrimary,
                          ),
                        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
                        
                        const SizedBox(height: 12),
                        
                        Text(
                          'A unified control center to Request tasks, access assets, schedule events, and collaborate with our teams at Thaiba Garden Media and IT department.',
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.5,
                            color: colors.textSecondary.withValues(alpha: 0.85),
                          ),
                        ).animate().fadeIn(delay: 150.ms, duration: 400.ms),
                        
                        const SizedBox(height: 36),
                        
                        // Button Row (Sign In + Sign Up)
                        Row(
                          children: [
                            // Sign In Button
                            Expanded(
                              child: SizedBox(
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: () => context.push('/login'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6),
                                    foregroundColor: isDark ? Colors.black : Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: const Text(
                                    'SIGN IN',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.5,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            
                            const SizedBox(width: 16),
                            
                            // Sign Up Button
                            Expanded(
                              child: SizedBox(
                                height: 56,
                                child: OutlinedButton(
                                  onPressed: () => context.push('/signup'),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(
                                      color: isDark ? const Color(0xFFFFD700).withValues(alpha: 0.4) : const Color(0xFF006EE6).withValues(alpha: 0.4),
                                      width: 1.5,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    foregroundColor: colors.textPrimary,
                                  ),
                                  child: const Text(
                                    'SIGN UP',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.5,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ).animate().fadeIn(delay: 300.ms, duration: 500.ms).slideY(begin: 0.1, end: 0),
                      ],
                    ),
                  ),
                ),
              ),
            ).animate().slideY(
                  begin: 1.0,
                  end: 0,
                  duration: 600.ms,
                  curve: Curves.easeOutQuart,
                ),

          // Floating Glassmorphic Theme Toggle Button (On top layer for touch detection, only shown during onboarding path)
          if (_showOnboarding)
            Positioned(
              top: 16,
              right: 16,
              child: SafeArea(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: isDark ? 0.08 : 0.4),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: isDark ? 0.1 : 0.3)),
                      ),
                      child: IconButton(
                        icon: Icon(
                          themeMode == ThemeMode.dark ? LucideIcons.sun : LucideIcons.moon,
                          color: isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6),
                        ),
                        onPressed: () => ref.read(themeModeProvider.notifier).toggleTheme(),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
