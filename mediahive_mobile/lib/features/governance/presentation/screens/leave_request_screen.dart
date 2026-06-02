import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/theme/elastic_scroll_physics.dart';
import '../../../../core/theme/app_typography.dart';

class LeaveRequestScreen extends ConsumerStatefulWidget {
  const LeaveRequestScreen({super.key});

  @override
  ConsumerState<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveCategoryConfig {
  final String label;
  final IconData icon;
  final Color color;
  final double defaultTotal;
  final bool isUnlimited;

  const _LeaveCategoryConfig({
    required this.label,
    required this.icon,
    required this.color,
    required this.defaultTotal,
    this.isUnlimited = false,
  });
}

class _LeaveRequestScreenState extends ConsumerState<LeaveRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _startDate;
  DateTime? _endDate;
  String _selectedType = 'Paid Leave';
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;

  final List<String> _leaveTypes = ['Paid Leave', 'Unpaid', 'Sick', 'Casual', 'Emergency', 'Other'];

  static const Map<String, String> _typeToDbKey = {
    'Paid Leave': 'planned',
    'Unpaid': 'unpaid',
    'Sick': 'sick',
    'Casual': 'casual',
    'Emergency': 'emergency',
    'Other': 'other',
  };

  static const Map<String, String> _dbKeyToType = {
    'planned': 'Paid Leave',
    'unpaid': 'Unpaid',
    'sick': 'Sick',
    'casual': 'Casual',
    'emergency': 'Emergency',
    'other': 'Other',
  };

  static final Map<String, _LeaveCategoryConfig> _categoryConfigs = {
    'planned': const _LeaveCategoryConfig(
      label: 'Paid Leave',
      icon: LucideIcons.plane,
      color: Color(0xFF6366F1),
      defaultTotal: 40,
    ),
    'unpaid': const _LeaveCategoryConfig(
      label: 'Unpaid',
      icon: LucideIcons.clock,
      color: Color(0xFF38BDF8),
      defaultTotal: 60,
    ),
    'sick': const _LeaveCategoryConfig(
      label: 'Sick',
      icon: LucideIcons.activity,
      color: Color(0xFFF59E0B),
      defaultTotal: 5,
    ),
    'casual': const _LeaveCategoryConfig(
      label: 'Casual',
      icon: LucideIcons.umbrella,
      color: Color(0xFF10B981),
      defaultTotal: 5,
    ),
    'emergency': const _LeaveCategoryConfig(
      label: 'Emergency',
      icon: LucideIcons.alertTriangle,
      color: Color(0xFFF43F5E),
      defaultTotal: 0,
      isUnlimited: true,
    ),
    'other': const _LeaveCategoryConfig(
      label: 'Other',
      icon: LucideIcons.helpCircle,
      color: Color(0xFF8B5CF6),
      defaultTotal: 0,
      isUnlimited: true,
    ),
  };

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF6366F1),
              onPrimary: Colors.white,
              surface: Color(0xFF1E293B),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  Future<void> _submit() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select date range')),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final totalDays = _endDate!.difference(_startDate!).inDays + 1.0;
      
      final dbType = _typeToDbKey[_selectedType] ?? 'other';
      await ref.read(leaveRepositoryProvider).submitLeaveRequest(
        type: dbType,
        startDate: _startDate!,
        endDate: _endDate!,
        totalDays: totalDays,
        reason: _reasonController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Leave request submitted successfully!')),
        );
        ref.invalidate(myLeaveRequestsProvider);
        _resetForm();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _resetForm() {
    setState(() {
      _startDate = null;
      _endDate = null;
      _reasonController.clear();
      _selectedType = 'Paid Leave';
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final requestsAsync = ref.watch(myLeaveRequestsProvider);
    final balanceAsync = ref.watch(myLeaveBalanceProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
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
        child: CustomScrollView(
          physics: const ElasticScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 140, 20, 20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _buildTitleSection(colors),
                  const SizedBox(height: 8),
                  _buildBalanceCards(balanceAsync, colors),
                  const SizedBox(height: 32),
                  _buildRequestForm(colors),
                  const SizedBox(height: 32),
                  _buildPreviousRequestsHeader(colors),
                  const SizedBox(height: 16),
                  _buildRequestsList(requestsAsync, colors),
                  const SizedBox(height: 100), // Space for nav bar
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTitleSection(ThemeColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'LEAVE REQUESTS',
          style: AppTypography.h1.copyWith(
            color: colors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'MANAGE YOUR TIME OFF & BALANCES',
          style: AppTypography.caption.copyWith(
            color: colors.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          height: 1,
          width: 60,
          color: colors.honey.withValues(alpha: 0.5),
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1);
  }

  Widget _buildBalanceCards(AsyncValue<Map<String, dynamic>?> balanceAsync, ThemeColors colors) {
    return balanceAsync.when(
      data: (balance) {
        final balances = balance?['balances'] as Map<String, dynamic>? ?? {};
        return GridView.builder(
          padding: EdgeInsets.zero,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.15,
          ),
          itemCount: _categoryConfigs.length,
          itemBuilder: (context, index) {
            final key = _categoryConfigs.keys.elementAt(index);
            final config = _categoryConfigs[key]!;
            
            double taken = 0.0;
            double total = config.defaultTotal;
            
            if (balances.containsKey(key)) {
              final item = balances[key];
              if (item is Map) {
                taken = double.tryParse(item['taken']?.toString() ?? '0') ?? 0.0;
              } else if (item is num) {
                taken = item.toDouble();
              }
            }
            
            return _buildCategoryBalanceCard(config, taken, total, colors);
          },
        );
      },
      loading: () => const Center(child: LinearProgressIndicator()),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildCategoryBalanceCard(_LeaveCategoryConfig config, double taken, double total, ThemeColors colors) {
    final isUnlimited = config.isUnlimited;
    final double remaining = total - taken;
    final double progress = isUnlimited ? 0.0 : (taken / total).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: config.color.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: config.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(config.icon, color: config.color, size: 18),
              ),
              if (!isUnlimited)
                Text(
                  '${remaining.toInt()} LEFT',
                  style: TextStyle(
                    color: remaining <= 2 ? const Color(0xFFEF4444) : config.color,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                )
              else
                Text(
                  'ACTIVE',
                  style: TextStyle(
                    color: config.color,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isUnlimited ? config.label : '${remaining.toInt()} Days',
                style: TextStyle(
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                isUnlimited ? 'AS NEEDED' : config.label.toUpperCase(),
                style: TextStyle(
                  color: colors.textSecondary,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (!isUnlimited) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: colors.border,
                valueColor: AlwaysStoppedAnimation<Color>(config.color),
                minHeight: 4,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${taken.toInt()} of ${total.toInt()} used',
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 8,
                fontWeight: FontWeight.bold,
              ),
            ),
          ] else ...[
            const SizedBox(height: 4),
            Text(
              '${taken.toInt()} days used',
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 8,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRequestForm(ThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('NEW REQUEST', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 24),
            
            // Type Selector
            DropdownButtonFormField<String>(
              initialValue: _selectedType,
              dropdownColor: colors.surface,
              decoration: _inputDecoration('Leave Type', colors),
              items: _leaveTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (v) => setState(() => _selectedType = v!),
            ),
            const SizedBox(height: 20),

            // Date Picker
            InkWell(
              onTap: _selectDateRange,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: colors.border),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.calendar, size: 20, color: colors.honey),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('DURATION', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(
                          _startDate == null 
                            ? 'Select dates' 
                            : '${DateFormat('dd-MM-yyyy').format(_startDate!)} - ${DateFormat('dd-MM-yyyy').format(_endDate!)}',
                          style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Reason
            TextFormField(
              controller: _reasonController,
              maxLines: 3,
              style: TextStyle(color: colors.textPrimary),
              decoration: _inputDecoration('Reason (Optional)', colors),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isSubmitting 
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('SUBMIT REQUEST', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, ThemeColors colors) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: colors.textSecondary),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1))),
    );
  }

  Widget _buildPreviousRequestsHeader(ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text('PREVIOUS REQUESTS', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
        Icon(LucideIcons.history, size: 18, color: colors.textSecondary),
      ],
    );
  }

  Widget _buildRequestsList(AsyncValue<List<Map<String, dynamic>>> requestsAsync, ThemeColors colors) {
    return requestsAsync.when(
      data: (requests) {
        if (requests.isEmpty) {
          return Center(child: Text('No previous requests', style: TextStyle(color: colors.textSecondary)));
        }
        return Column(
          children: requests.map((r) => _buildRequestTile(r, colors)).toList(),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildRequestTile(Map<String, dynamic> request, ThemeColors colors) {
    final status = request['status'] as String? ?? 'pending';
    final dbType = request['type'] as String? ?? 'other';
    final type = _dbKeyToType[dbType] ?? dbType;
    final start = DateTime.tryParse(request['start_date'] ?? '') ?? DateTime.now();
    final end = DateTime.tryParse(request['end_date'] ?? '') ?? DateTime.now();

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
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: _getStatusColor(status).withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(_getStatusIcon(status), color: _getStatusColor(status), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(type, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(
                  '${DateFormat('dd-MM-yyyy').format(start)} - ${DateFormat('dd-MM-yyyy').format(end)}',
                  style: TextStyle(color: colors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _getStatusColor(status).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status.toUpperCase(),
              style: TextStyle(color: _getStatusColor(status), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved': return const Color(0xFF10B981);
      case 'rejected': return const Color(0xFFEF4444);
      default: return const Color(0xFFF59E0B);
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'approved': return LucideIcons.check;
      case 'rejected': return LucideIcons.x;
      default: return LucideIcons.clock;
    }
  }
}
