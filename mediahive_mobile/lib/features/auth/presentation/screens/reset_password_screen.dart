import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../core/services/auth_service.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  int _currentStep = 0; // 0 = Request OTP, 1 = Verify OTP & Reset
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRequestOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email address')),
      );
      return;
    }

    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid email address')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      await authService.sendPasswordResetEmail(email);
      
      if (mounted) {
        setState(() {
          _isLoading = false;
          _currentStep = 1;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification code sent to your email')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send code: ${e.toString()}')),
        );
      }
    }
  }

  void _handleResetPassword() async {
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (otp.isEmpty || password.isEmpty || confirmPassword.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters long')),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      
      // Step A: Verify recovery OTP to establish a temporary authenticated session
      await authService.verifyRecoveryOtp(email: email, token: otp);
      
      // Step B: Update user password using the active session
      await authService.updatePassword(password);
      
      // Step C: Securely sign out the session to enforce logging in with the new password
      await authService.signOut();
      
      if (mounted) {
        setState(() => _isLoading = false);
        context.go('/reset-confirmation');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Password reset failed: ${e.toString()}')),
        );
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
          // Premium Background Gradient
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
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
              opacity: isDark ? 0.05 : 0.08,
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
                    _buildBrandHeader(colors),
                    const SizedBox(height: 40),
                    _buildResetCard(colors),
                    const SizedBox(height: 32),
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
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(isDark ? 0.05 : 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(isDark ? 0.1 : 0.3)),
            boxShadow: [
              BoxShadow(
                color: (isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6))
                    .withOpacity(isDark ? 0.2 : 0.1),
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Image.asset(
            'assets/images/logo.png',
            height: 60,
            width: 60,
          ),
        ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
        const SizedBox(height: 24),
        Text(
          'MediaHive',
          style: TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF1D1D1F),
            fontFamily: 'BavistaSoulvare',
            letterSpacing: 2.0,
          ),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
        Text(
          'SECURE COMMAND CENTER',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary.withOpacity(0.5),
            letterSpacing: 4,
          ),
        ).animate().fadeIn(delay: 400.ms),
      ],
    );
  }

  Widget _buildResetCard(ThemeColors colors) {
    final isDark = colors.isDark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.08) : Colors.white.withOpacity(0.65),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.white.withOpacity(isDark ? 0.1 : 0.2)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
                blurRadius: 40,
                offset: const Offset(0, 20),
              ),
            ],
          ),
          child: AnimatedSwitcher(
            duration: 400.ms,
            child: _currentStep == 0 ? _buildRequestStep(colors) : _buildResetStep(colors),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 500.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1));
  }

  Widget _buildRequestStep(ThemeColors colors) {
    final isDark = colors.isDark;
    return Column(
      key: const ValueKey('request_step'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () => context.pop(),
              child: Icon(LucideIcons.arrowLeft, color: colors.textPrimary, size: 24),
            ),
            const SizedBox(width: 12),
            Text(
              'Reset Password',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: colors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Enter your registered email address below, and we will send you a verification code to reset your password.',
          style: TextStyle(
            fontSize: 13,
            color: colors.textSecondary.withOpacity(0.7),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 32),
        _buildCustomInput(
          colors: colors,
          label: 'EMAIL ADDRESS',
          controller: _emailController,
          icon: LucideIcons.mail,
          hint: 'user@email.com',
        ),
        const SizedBox(height: 36),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleRequestOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6),
              foregroundColor: isDark ? Colors.black : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: _isLoading
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2, 
                      color: isDark ? Colors.black : Colors.white,
                    ),
                  )
                : const Text(
                    'SEND RESET CODE',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      fontSize: 14,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildResetStep(ThemeColors colors) {
    final isDark = colors.isDark;
    return Column(
      key: const ValueKey('reset_step'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () => setState(() => _currentStep = 0),
              child: Icon(LucideIcons.arrowLeft, color: colors.textPrimary, size: 24),
            ),
            const SizedBox(width: 12),
            Text(
              'Enter Credentials',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: colors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Input the code sent to ${_emailController.text} and define your new login password.',
          style: TextStyle(
            fontSize: 13,
            color: colors.textSecondary.withOpacity(0.7),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 24),
        _buildCustomInput(
          colors: colors,
          label: 'VERIFICATION CODE (OTP)',
          controller: _otpController,
          icon: LucideIcons.key,
          hint: '123456',
        ),
        const SizedBox(height: 20),
        _buildCustomInput(
          colors: colors,
          label: 'NEW PASSWORD',
          controller: _passwordController,
          icon: LucideIcons.lock,
          hint: '••••••••',
          isPassword: true,
          obscureText: _obscurePassword,
          onToggleVisibility: () {
            setState(() => _obscurePassword = !_obscurePassword);
          },
        ),
        const SizedBox(height: 20),
        _buildCustomInput(
          colors: colors,
          label: 'CONFIRM NEW PASSWORD',
          controller: _confirmPasswordController,
          icon: LucideIcons.shieldCheck,
          hint: '••••••••',
          isPassword: true,
          obscureText: _obscureConfirmPassword,
          onToggleVisibility: () {
            setState(() => _obscureConfirmPassword = !_obscureConfirmPassword);
          },
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleResetPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6),
              foregroundColor: isDark ? Colors.black : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: _isLoading
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2, 
                      color: isDark ? Colors.black : Colors.white,
                    ),
                  )
                : const Text(
                    'CONFIRM RESET',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      fontSize: 14,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomInput({
    required ThemeColors colors,
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required String hint,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
  }) {
    final isDark = colors.isDark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary.withOpacity(0.5),
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: isDark ? Colors.black.withOpacity(0.2) : Colors.white.withOpacity(0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
          ),
          child: TextField(
            controller: controller,
            obscureText: isPassword ? obscureText : false,
            style: TextStyle(color: colors.textPrimary, fontSize: 15),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.3)),
              prefixIcon: Icon(
                icon, 
                size: 20, 
                color: isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6),
              ),
              suffixIcon: isPassword
                  ? IconButton(
                      icon: Icon(
                        obscureText ? LucideIcons.eyeOff : LucideIcons.eye,
                        color: colors.textSecondary.withOpacity(0.5),
                        size: 20,
                      ),
                      onPressed: onToggleVisibility,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: isPassword 
                  ? const EdgeInsets.only(left: 20, right: 10, top: 16, bottom: 16)
                  : const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooter(ThemeColors colors) {
    final isDark = colors.isDark;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Remember your operative key? ",
              style: TextStyle(color: colors.textSecondary.withOpacity(0.6), fontSize: 13),
            ),
            GestureDetector(
              onTap: () => context.go('/login'),
              child: Text(
                'Sign In',
                style: TextStyle(
                  color: isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 40),
        Text(
          'POWERED BY THAIBA GARDEN\nMEDIA & IT DEPARTMENT',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: colors.textSecondary.withOpacity(0.2),
            letterSpacing: 2,
            height: 1.5,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 700.ms);
  }
}
