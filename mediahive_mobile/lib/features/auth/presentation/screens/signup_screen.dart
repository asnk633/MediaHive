import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../providers/institutional_provider.dart';
import '../../../../../models/institutional_data.dart';
import '../../../../../core/services/auth_service.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  Institution? _selectedInstitution;
  Department? _selectedDepartment;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleSignUp() async {
    if (_nameController.text.isEmpty || _emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    if (_passwordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters long')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final authService = ref.read(authServiceProvider);
      await authService.signUpWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        name: _nameController.text.trim(),
        institutionId: _selectedInstitution?.id,
        departmentId: _selectedDepartment?.id.toString(),
      );
      
      if (mounted) {
        setState(() => _isLoading = false);
        context.go('/dashboard');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration Failed: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isDark = colors.isDark;
    
    final deptsAsync = ref.watch(departmentsProvider);
    final instsAsync = ref.watch(institutionsProvider);

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
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Brand Header
                    _buildBrandHeader(colors),
                    const SizedBox(height: 36),
                    
                    // Glassmorphic Login Card
                    _buildSignUpCard(colors, deptsAsync, instsAsync),
                    
                    const SizedBox(height: 32),
                    
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
            height: 50,
            width: 50,
          ),
        ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
        const SizedBox(height: 16),
        Text(
          'MediaHive',
          style: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF1D1D1F),
            fontFamily: 'BavistaSoulvare',
            letterSpacing: 2.0,
          ),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
        Text(
          'SECURE COMMAND CENTER',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary.withOpacity(0.5),
            letterSpacing: 4,
          ),
        ).animate().fadeIn(delay: 400.ms),
      ],
    );
  }

  Widget _buildSignUpCard(
    ThemeColors colors, 
    AsyncValue<List<Department>> deptsAsync, 
    AsyncValue<List<Institution>> instsAsync
  ) {
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create Account',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: colors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your details to create an operative key',
                style: TextStyle(
                  fontSize: 13,
                  color: colors.textSecondary.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 24),
              
              _buildCustomInput(
                colors: colors,
                label: 'FULL NAME',
                controller: _nameController,
                icon: LucideIcons.user,
                hint: 'e.g. Shukoor Rahman',
              ),
              const SizedBox(height: 20),
              
              _buildCustomInput(
                colors: colors,
                label: 'EMAIL ADDRESS',
                controller: _emailController,
                icon: LucideIcons.mail,
                hint: 'name@example.com',
              ),
              const SizedBox(height: 20),
              
              _buildCustomInput(
                colors: colors,
                label: 'PASSWORD',
                controller: _passwordController,
                icon: LucideIcons.lock,
                hint: 'Min 8 characters',
                isPassword: true,
                obscureText: _obscurePassword,
                onToggleVisibility: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
              const SizedBox(height: 20),
              
              const Divider(color: Colors.white24),
              const SizedBox(height: 12),
              
              Text(
                'Select either an Institution or a Department (not both)',
                style: TextStyle(
                  fontSize: 11,
                  color: colors.textSecondary.withOpacity(0.5),
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 16),
              
              _buildDropdownLabel(colors, 'INSTITUTION'),
              const SizedBox(height: 8),
              instsAsync.when(
                data: (insts) => _buildCustomSelector<Institution>(
                  colors: colors,
                  value: _selectedInstitution,
                  items: insts,
                  hint: 'Select Institution',
                  bottomSheetTitle: 'Select Institution',
                  onSelected: (val) => setState(() {
                    _selectedInstitution = val;
                    if (val != null) {
                      _selectedDepartment = null;
                    }
                  }),
                ),
                loading: () => _buildLoadingField(colors),
                error: (e, _) => _buildErrorField(colors),
              ),
              const SizedBox(height: 20),
              
              _buildDropdownLabel(colors, 'DEPARTMENT'),
              const SizedBox(height: 8),
              deptsAsync.when(
                data: (depts) => _buildCustomSelector<Department>(
                  colors: colors,
                  value: _selectedDepartment,
                  items: depts,
                  hint: 'Select Department',
                  bottomSheetTitle: 'Select Department',
                  onSelected: (val) => setState(() {
                    _selectedDepartment = val;
                    if (val != null) {
                      _selectedInstitution = null;
                    }
                  }),
                ),
                loading: () => _buildLoadingField(colors),
                error: (e, _) => _buildErrorField(colors),
              ),
              
              const SizedBox(height: 36),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSignUp,
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
                        'CREATE ACCOUNT',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                          fontSize: 14,
                        ),
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 500.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1));
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
        const SizedBox(height: 10),
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
              border: InputBorder.none, filled: false,
              contentPadding: isPassword 
                  ? const EdgeInsets.only(left: 20, right: 10, top: 16, bottom: 16)
                  : const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownLabel(ThemeColors colors, String label) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w900,
        color: colors.textSecondary.withOpacity(0.5),
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildCustomSelector<T>({
    required ThemeColors colors,
    required T? value,
    required String hint,
    required String bottomSheetTitle,
    required List<T> items,
    required Function(T?) onSelected,
  }) {
    final isDark = colors.isDark;
    String displayText = hint;
    if (value != null) {
      if (value is Institution) {
        displayText = value.name;
      } else if (value is Department) displayText = value.name;
    }

    return GestureDetector(
      onTap: () => _showSelectionBottomSheet<T>(
        title: bottomSheetTitle,
        items: items,
        selectedItem: value,
        onSelected: onSelected,
      ),
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: isDark ? Colors.black.withOpacity(0.2) : Colors.white.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              displayText,
              style: TextStyle(
                color: value == null 
                    ? colors.textSecondary.withOpacity(0.3) 
                    : colors.textPrimary, 
                fontSize: 15,
              ),
            ),
            Icon(
              LucideIcons.chevronDown, 
              color: colors.textSecondary.withOpacity(0.5), 
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  void _showSelectionBottomSheet<T>({
    required String title,
    required List<T> items,
    required T? selectedItem,
    required Function(T?) onSelected,
  }) {
    final colors = ref.read(themeColorsProvider);
    final isDark = colors.isDark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withOpacity(0.4),
      isScrollControlled: true,
      builder: (context) {
        return ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(32),
            topRight: Radius.circular(32),
          ),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.6,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              decoration: BoxDecoration(
                color: isDark ? Colors.black.withOpacity(0.85) : Colors.white.withOpacity(0.85),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
                border: Border.all(color: Colors.white.withOpacity(isDark ? 0.08 : 0.2)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colors.textSecondary.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        String name = '';
                        bool isSelected = false;
                        
                        if (item is Institution) {
                          name = item.name;
                          isSelected = selectedItem != null && (selectedItem as Institution).id == item.id;
                        } else if (item is Department) {
                          name = item.name;
                          isSelected = selectedItem != null && (selectedItem as Department).id == item.id;
                        }
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? (isDark ? const Color(0xFFFFB300).withOpacity(0.15) : const Color(0xFF006EE6).withOpacity(0.1))
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected
                                  ? (isDark ? const Color(0xFFFFB300).withOpacity(0.3) : const Color(0xFF006EE6).withOpacity(0.3))
                                  : Colors.transparent,
                            ),
                          ),
                          child: ListTile(
                            onTap: () {
                              onSelected(item);
                              Navigator.pop(context);
                            },
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            title: Text(
                              name,
                              style: TextStyle(
                                color: isSelected 
                                    ? (isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6))
                                    : colors.textPrimary,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                fontSize: 15,
                              ),
                            ),
                            trailing: isSelected 
                                ? Icon(
                                    LucideIcons.check, 
                                    color: isDark ? const Color(0xFFFFB300) : const Color(0xFF006EE6),
                                    size: 20,
                                  )
                                : null,
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildLoadingField(ThemeColors colors) {
    final isDark = colors.isDark;
    return Container(
      height: 56,
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? Colors.black.withOpacity(0.1) : Colors.white.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: SizedBox(
          height: 20, 
          width: 20, 
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: isDark ? const Color(0xFFFFD700) : const Color(0xFF006EE6),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorField(ThemeColors colors) {
    final isDark = colors.isDark;
    return Container(
      height: 56,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFFEF4444).withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
      ),
      child: Center(
        child: Text(
          'Failed to load data', 
          style: TextStyle(color: const Color(0xFFEF4444).withOpacity(0.8), fontSize: 13),
        ),
      ),
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
              "Already have an operative key? ",
              style: TextStyle(color: colors.textSecondary.withOpacity(0.6), fontSize: 13),
            ),
            GestureDetector(
              onTap: () => context.pop(),
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
