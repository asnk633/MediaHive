import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../../core/theme_provider.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/mh_loading.dart';
import '../providers/attendance_provider.dart';
import '../../domain/models/nfc_tag.dart';
import '../../../../core/services/auth_service.dart';

class AttendanceScanScreen extends ConsumerStatefulWidget {
  final String? tagId;
  const AttendanceScanScreen({super.key, this.tagId});

  @override
  ConsumerState<AttendanceScanScreen> createState() => _AttendanceScanScreenState();
}

class _AttendanceScanScreenState extends ConsumerState<AttendanceScanScreen> {
  bool _isLoading = true;
  NfcTag? _tag;
  bool _isCheckedIn = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDetails();
    });
  }

  Future<void> _loadDetails() async {
    if (widget.tagId == null || widget.tagId!.isEmpty) {
      if (mounted) context.go('/attendance');
      return;
    }

    try {
      final repo = ref.read(attendanceRepositoryProvider);
      final userId = ref.read(authServiceProvider).currentUser?.id;
      
      final tag = await repo.getTagByPhysicalId(widget.tagId!);
      
      if (!mounted) return;
      
      bool isCheckedIn = false;
      if (userId != null) {
        final session = await repo.getActiveSession(userId);
        isCheckedIn = session != null;
      }

      if (mounted) {
        setState(() {
          _tag = tag;
          _isCheckedIn = isCheckedIn;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        // Fallback to direct scan if fetch fails
        _processScan();
      }
    }
  }

  Future<void> _processScan() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });
    
    if (widget.tagId != null && widget.tagId!.isNotEmpty) {
      await ref.read(globalNfcScanningProvider.notifier).processDirectTagScan(
        physicalTagId: widget.tagId!,
      );
    }
    if (mounted) {
      context.go('/attendance');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    if (_isLoading) {
      return Scaffold(
        backgroundColor: colors.backgroundPrimary,
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              MhLoading(size: 80),
              SizedBox(height: 20),
              Text('Analyzing Tag...', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      );
    }

    final tagName = _tag?.tagName ?? 'Unknown Location';
    final actionText = _isCheckedIn ? 'Check Out' : 'Check In';
    final currentStatusText = _isCheckedIn ? 'Checked In' : 'Checked Out';
    final actionColor = _isCheckedIn ? AppColors.warning : AppColors.success;

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      appBar: AppBar(
        title: const Text('Confirm Scan'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(LucideIcons.x),
          onPressed: () => context.go('/attendance'),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(LucideIcons.mapPin, size: 64, color: colors.honey),
              const SizedBox(height: 24),
              Text(
                tagName,
                textAlign: TextAlign.center,
                style: AppTypography.h2.copyWith(color: colors.textPrimary),
              ),
              const SizedBox(height: 32),
              
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Current Status:', style: TextStyle(color: colors.textSecondary, fontSize: 16)),
                        Text(currentStatusText, style: TextStyle(color: colors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Divider(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Action:', style: TextStyle(color: colors.textSecondary, fontSize: 16)),
                        Text(actionText, style: TextStyle(color: actionColor, fontSize: 18, fontWeight: FontWeight.w900)),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),
              
              ElevatedButton(
                onPressed: _processScan,
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.honey,
                  foregroundColor: colors.backgroundPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('CONFIRM', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => context.go('/attendance'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  side: BorderSide(color: colors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('CANCEL', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: colors.textPrimary)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
