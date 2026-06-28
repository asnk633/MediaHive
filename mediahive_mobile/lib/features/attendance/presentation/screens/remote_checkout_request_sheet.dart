import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';

class RemoteCheckoutRequestSheet extends ConsumerStatefulWidget {
  final String attendanceId;
  final String? assignmentId;

  const RemoteCheckoutRequestSheet({
    super.key,
    required this.attendanceId,
    this.assignmentId,
  });

  @override
  ConsumerState<RemoteCheckoutRequestSheet> createState() => _RemoteCheckoutRequestSheetState();
}

class _RemoteCheckoutRequestSheetState extends ConsumerState<RemoteCheckoutRequestSheet> {
  final _reasonController = TextEditingController();
  bool _fetchingLocation = true;
  bool _submitting = false;
  Position? _currentPosition;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _captureLocation();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _captureLocation() async {
    try {
      setState(() {
        _fetchingLocation = true;
        _errorMessage = null;
      });

      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        final request = await Geolocator.requestPermission();
        if (request == LocationPermission.denied || request == LocationPermission.deniedForever) {
          throw Exception('Location permission denied.');
        }
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 10),
      );

      setState(() {
        _currentPosition = pos;
        _fetchingLocation = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not acquire GPS coordinates: $e';
        _fetchingLocation = false;
      });
    }
  }

  Future<void> _submit() async {
    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      setState(() => _errorMessage = 'Please provide a reason for remote checkout.');
      return;
    }

    if (_currentPosition == null) {
      setState(() => _errorMessage = 'GPS coordinates are required to submit a remote checkout.');
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    try {
      final profileAsync = ref.read(currentUserProfileProvider);
      final profile = profileAsync.value;
      if (profile == null) {
        throw Exception('User profile not loaded.');
      }
      final userId = profile['id'] as String;
      final userName = profile['full_name'] as String;

      await ref.read(attendanceRepositoryProvider).submitAttendanceRequest(
        userId: userId,
        userName: userName,
        requestType: 'remote_checkout',
        requestedTime: DateTime.now(),
        reason: reason,
        latitude: _currentPosition?.latitude,
        longitude: _currentPosition?.longitude,
        assignmentId: widget.assignmentId,
        attendanceId: widget.attendanceId,
      );

      ref.invalidate(attendanceRequestsProvider);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Remote Checkout Request submitted successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() => _errorMessage = 'Submission failed: $e');
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'REQUEST REMOTE CHECKOUT',
            style: AppTypography.h3.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            'Request remote session closure directly from the field',
            style: TextStyle(color: colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),

          // GPS Location Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                Icon(
                  _fetchingLocation ? LucideIcons.loader : LucideIcons.mapPin,
                  color: _currentPosition != null ? AppColors.success : colors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CURRENT GPS LOCATION',
                        style: TextStyle(color: colors.textSecondary, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 4),
                      if (_fetchingLocation)
                        Text(
                          'Acquiring GPS coordinates...',
                          style: TextStyle(color: colors.textPrimary, fontSize: 12, fontStyle: FontStyle.italic),
                        )
                      else if (_currentPosition != null)
                        Text(
                          'Lat: ${_currentPosition!.latitude.toStringAsFixed(5)}, Lng: ${_currentPosition!.longitude.toStringAsFixed(5)}',
                          style: TextStyle(color: colors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                        )
                      else
                        const Text(
                          'Location not found',
                          style: TextStyle(color: AppColors.error, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                    ],
                  ),
                ),
                if (!_fetchingLocation)
                  IconButton(
                    icon: Icon(LucideIcons.refreshCw, color: colors.honey, size: 16),
                    onPressed: _captureLocation,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Reason text input
          TextField(
            controller: _reasonController,
            maxLines: 3,
            style: TextStyle(color: colors.textPrimary),
            decoration: InputDecoration(
              labelText: 'Field Report / Checkout Reason',
              labelStyle: TextStyle(color: colors.textSecondary, fontSize: 12),
              alignLabelWithHint: true,
              filled: true,
              fillColor: colors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: colors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: colors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: colors.honey),
              ),
            ),
          ),

          if (_errorMessage != null) ...[
            const SizedBox(height: 12),
            Text(_errorMessage!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
          ],

          const SizedBox(height: 24),

          // Submit Button
          GestureDetector(
            onTap: _submitting || _fetchingLocation ? null : _submit,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: _submitting
                    ? const MhLoading(size: 20)
                    : Text(
                        'SUBMIT REQUEST',
                        style: TextStyle(
                          color: colors.isDark ? Colors.black : Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                          letterSpacing: 0.5,
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
