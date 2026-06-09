import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import 'mh_button.dart';

class MhErrorBoundary extends StatefulWidget {
  final Widget child;

  const MhErrorBoundary({super.key, required this.child});

  @override
  State<MhErrorBoundary> createState() => _MhErrorBoundaryState();
}

class _MhErrorBoundaryState extends State<MhErrorBoundary> {
  Object? _error;

  @override
  void initState() {
    super.initState();
  }

  static Widget _getErrorWidget(BuildContext context, Object error, VoidCallback onRetry) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.backgroundPrimary,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.alertTriangle, size: 64, color: AppColors.error),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'Something went wrong',
                  style: AppTypography.h2,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.s),
                Text(
                  'An unexpected error occurred. Our team has been notified.',
                  style: AppTypography.bodyM.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.huge),
                MhButton(
                  label: 'Retry',
                  onTap: onRetry,
                  type: MhButtonType.primary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return _getErrorWidget(context, _error!, () {
        setState(() {
          _error = null;
        });
      });
    }

    return widget.child;
  }
}

// Custom error screen for Flutter's ErrorWidget.builder
class MhGlobalErrorScreen extends StatelessWidget {
  final FlutterErrorDetails details;

  const MhGlobalErrorScreen({super.key, required this.details});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        backgroundColor: AppColors.backgroundPrimary,
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.bug, size: 64, color: AppColors.error),
                const SizedBox(height: AppSpacing.xl),
                Text('System Error', style: AppTypography.h2),
                const SizedBox(height: AppSpacing.m),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.m),
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(AppRadius.m),
                  ),
                  child: Text(
                    details.exceptionAsString(),
                    style: AppTypography.caption.copyWith(color: AppColors.error.withValues(alpha: 0.8), fontFamily: 'monospace'),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                MhButton(
                  label: 'Restart App',
                  onTap: () {
                    // In a real app, you might trigger a hot restart or navigate to the splash screen
                  },
                  type: MhButtonType.primary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
