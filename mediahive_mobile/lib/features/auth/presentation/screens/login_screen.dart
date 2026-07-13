import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../core/services/auth_service.dart';
import 'package:mediahive_mobile/shared/widgets/mh_input.dart';
import 'package:mediahive_mobile/shared/widgets/mh_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _getFriendlyErrorMessage(Object e) {
    final str = e.toString().toLowerCase();
    if (str.contains('invalid login credentials') || str.contains('invalid_credentials') || str.contains('invalid_grant')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (str.contains('email not confirmed') || str.contains('email_not_confirmed')) {
      return 'Your email address has not been confirmed yet. Please verify your email.';
    }
    if (str.contains('user not found') || str.contains('user_not_found')) {
      return 'No account exists with this email address.';
    }
    if (str.contains('network') || str.contains('socketexception') || str.contains('failed host lookup') || str.contains('connection failed')) {
      return 'Network offline. Please check your internet connection and try again.';
    }
    if (str.contains('rate limit') || str.contains('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return 'Authentication Failed. Please verify your login details.';
  }

  String _getFriendlyGoogleSignInErrorMessage(Object e) {
    final str = e.toString().toLowerCase();
    if (str.contains('network') || str.contains('socketexception') || str.contains('failed host lookup')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (str.contains('cancelled') || str.contains('user canceled') || str.contains('sign_in_canceled')) {
      return 'Google Sign-In was cancelled.';
    }
    if (str.contains('developer_error') || str.contains('api_exception 10')) {
      return 'Google configuration error. Please contact support.';
    }
    return 'Google Sign-In Failed. Please try again.';
  }

  void _handleSignIn() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your credentials')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final authService = ref.read(authServiceProvider);
      await authService.signInWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      
      if (mounted) {
        setState(() => _isLoading = false);
        context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_getFriendlyErrorMessage(e))),
        );
      }
    }
  }

  void _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    try {
      final authService = ref.read(authServiceProvider);
      final response = await authService.signInWithGoogle();
      if (response != null && mounted) {
        context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_getFriendlyGoogleSignInErrorMessage(e))),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isDark = colors.isDark;

    return Scaffold(
      body: Stack(
        children: [
          // Premium Background Gradient (Aligned perfectly with dashboard in dark mode)
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

          // Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 8),
                    // Brand Header
                    _buildBrandHeader(colors),
                    const SizedBox(height: 24),
                    
                    // Glassmorphic Login Card
                    _buildLoginCard(colors),
                    
                    const SizedBox(height: 16),
                    
                    // Footer Links
                    _buildFooter(colors),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBrandHeader(ThemeColors colors) {
    final isDark = colors.isDark;
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            // Glow emitter — invisible circle that casts layered shadows
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.transparent,
                boxShadow: isDark
                    ? [
                        // Inner tight backlight
                        BoxShadow(
                          color: const Color(0xFFFFB800)
                              .withValues(alpha: 0.4),
                          blurRadius: 30,
                          spreadRadius: 2,
                        ),
                        // Mid ambient ring
                        BoxShadow(
                          color: const Color(0xFFFFD700)
                              .withValues(alpha: 0.15),
                          blurRadius: 60,
                          spreadRadius: 10,
                        ),
                        // Wide outer haze
                        BoxShadow(
                          color: const Color(0xFFFFD700)
                              .withValues(alpha: 0.05),
                          blurRadius: 100,
                          spreadRadius: 25,
                        ),
                      ]
                    : [
                        // Light mode: clean elevation shadow, no yellow
                        BoxShadow(
                          color: const Color(0xFF000000)
                              .withValues(alpha: 0.06),
                          blurRadius: 30,
                          spreadRadius: 5,
                          offset: const Offset(0, 4),
                        ),
                      ],
              ),
            ),
            // Logo
            Image.asset(
              isDark
                  ? 'assets/images/logo_honey.png'
                  : 'assets/images/logo_luminous.png',
              height: 160,
              width: 160,
            ),
          ],
        ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.center,
          heightFactor: 0.25,
          child: Image.asset(
            isDark ? 'assets/images/app_name_light.png' : 'assets/images/app_name_dark.png',
            width: 280,
            fit: BoxFit.contain,
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
        ),
        const SizedBox(height: 16),
        Text(
          'SECURE COMMAND CENTER',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary.withValues(alpha: 0.5),
            letterSpacing: 4,
          ),
        ).animate().fadeIn(delay: 400.ms),
      ],
    );
  }

  Widget _buildLoginCard(ThemeColors colors) {
    final isDark = colors.isDark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.65),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withValues(alpha: isDark ? 0.08 : 0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
                blurRadius: 40,
                offset: const Offset(0, 20),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sign In',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: colors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your credentials to continue',
                style: TextStyle(
                  fontSize: 13,
                  color: colors.textSecondary.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 24),
              
              MhInput(
                label: 'EMAIL ADDRESS',
                controller: _emailController,
                prefixIcon: LucideIcons.mail,
                hint: 'user@email.com',
              ),
              const SizedBox(height: 16),
              MhInput(
                label: 'PASSWORD',
                controller: _passwordController,
                prefixIcon: LucideIcons.lock,
                hint: '••••••••',
                isPassword: true,
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/reset-password'),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(0, 0),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    foregroundColor: isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6),
                  ),
                  child: Text(
                    'Forgot Password?',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: (isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6)).withValues(alpha: 0.85),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              MhButton(
                label: 'SIGN IN',
                onTap: _handleSignIn,
                isLoading: _isLoading,
                type: MhButtonType.primary,
                width: double.infinity,
                height: 52.0,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Divider(
                      color: colors.textSecondary.withValues(alpha: 0.15),
                      thickness: 1,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'OR',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: colors.textSecondary.withValues(alpha: 0.4),
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Divider(
                      color: colors.textSecondary.withValues(alpha: 0.15),
                      thickness: 1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              MhButton(
                label: 'CONTINUE WITH GOOGLE',
                onTap: _handleGoogleSignIn,
                isLoading: _isLoading,
                type: MhButtonType.outline,
                width: double.infinity,
                height: 52.0,
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 500.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1));
  }

  Widget _buildFooter(ThemeColors colors) {
    final isDark = colors.isDark;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "New User? ",
              style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.6), fontSize: 13),
            ),
            GestureDetector(
              onTap: () => context.push('/signup'),
              child: Text(
                'Register Now',
                style: TextStyle(
                  color: isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'POWERED BY THAIBA GARDEN\nMEDIA & IT DEPARTMENT',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: colors.textSecondary.withValues(alpha: 0.2),
            letterSpacing: 2,
            height: 1.5,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 700.ms);
  }
}
