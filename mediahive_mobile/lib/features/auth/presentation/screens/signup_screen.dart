import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_spacing.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../shared/widgets/mh_button.dart';
import '../../../../../shared/widgets/mh_input.dart';
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

    setState(() => _isLoading = true);
    
    try {
      final authService = ref.read(authServiceProvider);
      await authService.signUpWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        name: _nameController.text.trim(),
        institutionId: _selectedInstitution?.id,
        departmentId: _selectedDepartment?.id?.toString(),
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
    final deptsAsync = ref.watch(departmentsProvider);
    final instsAsync = ref.watch(institutionsProvider);

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF00A9CC),
                  Color(0xFF005577),
                ],
              ),
            ),
          ),
          
          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.xs),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
                      ),
                      Text(
                        'Create Account',
                        style: AppTypography.h3.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
                    child: Column(
                      children: [
                        const SizedBox(height: AppSpacing.m),
                        
                        // Form Card
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.xxl),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.xxl),
                            border: Border.all(color: Colors.white.withOpacity(0.2)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              MhInput(
                                label: 'Full Name',
                                controller: _nameController,
                                hint: 'e.g. Shukoor Rahman',
                                prefixIcon: LucideIcons.user,
                              ),
                              const SizedBox(height: AppSpacing.xl),
                              
                              MhInput(
                                label: 'Email Address',
                                controller: _emailController,
                                hint: 'name@example.com',
                                prefixIcon: LucideIcons.mail,
                                keyboardType: TextInputType.emailAddress,
                              ),
                              const SizedBox(height: AppSpacing.xl),
                              
                              MhInput(
                                label: 'Password',
                                controller: _passwordController,
                                hint: 'Min 8 characters',
                                prefixIcon: LucideIcons.lock,
                                isPassword: true,
                              ),
                              const SizedBox(height: AppSpacing.xxl),
                              
                              const Divider(color: Colors.white24),
                              const SizedBox(height: AppSpacing.m),
                              Text(
                                'Select either an Institution or a Department (not both)',
                                style: AppTypography.caption.copyWith(
                                  color: Colors.white.withOpacity(0.5),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                              const SizedBox(height: AppSpacing.l),
                              
                              _buildLabel('Institution'),
                              const SizedBox(height: AppSpacing.s),
                              instsAsync.when(
                                data: (insts) => _buildDropdown<Institution>(
                                  value: _selectedInstitution,
                                  items: insts,
                                  hint: 'Select Institution',
                                  onChanged: (val) => setState(() {
                                    _selectedInstitution = val;
                                    if (val != null) {
                                      _selectedDepartment = null;
                                    }
                                  }),
                                ),
                                loading: () => _buildLoadingField(),
                                error: (e, _) => _buildErrorField(),
                              ),
                              const SizedBox(height: AppSpacing.xl),
                              
                              _buildLabel('Department'),
                              const SizedBox(height: AppSpacing.s),
                              deptsAsync.when(
                                data: (depts) => _buildDropdown<Department>(
                                  value: _selectedDepartment,
                                  items: depts,
                                  hint: 'Select Department',
                                  onChanged: (val) => setState(() {
                                    _selectedDepartment = val;
                                    if (val != null) {
                                      _selectedInstitution = null;
                                    }
                                  }),
                                ),
                                loading: () => _buildLoadingField(),
                                error: (e, _) => _buildErrorField(),
                              ),
                              
                              const SizedBox(height: AppSpacing.huge),
                              
                              // Sign Up Button
                              MhButton(
                                label: 'Create Account',
                                onTap: _handleSignUp,
                                isLoading: _isLoading,
                                width: double.infinity,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xxxl),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Text(
      label,
      style: AppTypography.bodyS.copyWith(
        color: Colors.white,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildDropdown<T>({
    required T? value,
    required List<T> items,
    required String hint,
    required Function(T?) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.l),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          hint: Text(hint, style: AppTypography.bodyM.copyWith(color: Colors.white.withOpacity(0.3))),
          dropdownColor: const Color(0xFF005577),
          style: AppTypography.bodyM.copyWith(color: Colors.white),
          icon: Icon(LucideIcons.chevronDown, color: Colors.white.withOpacity(0.5)),
          isExpanded: true,
          items: items.map((item) {
            String label = '';
            if (item is Institution) label = item.name;
            else if (item is Department) label = item.name;
            
            return DropdownMenuItem<T>(
              value: item,
              child: Text(label),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildLoadingField() {
    return Container(
      height: 56,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(AppRadius.l),
      ),
      child: const Center(child: SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))),
    );
  }

  Widget _buildErrorField() {
    return Container(
      height: 56,
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.l),
      ),
      child: Center(child: Text('Failed to load', style: AppTypography.caption.copyWith(color: Colors.white70))),
    );
  }
}
