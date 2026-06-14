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
      child: Material(
        color: AppColors.backgroundPrimary,
        borderRadius: BorderRadius.circular(AppRadius.l),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.l),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.alertTriangle, size: 48, color: AppColors.error),
              const SizedBox(height: AppSpacing.m),
              Text(
                'Something went wrong',
                style: AppTypography.h3,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'An unexpected error occurred.',
                style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.l),
              MhButton(
                label: 'Retry',
                onTap: onRetry,
                type: MhButtonType.primary,
              ),
            ],
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
    // Check if it's a network/offline error
    final errorString = details.exceptionAsString().toLowerCase();
    final isOfflineError = errorString.contains('socketexception') || 
                           errorString.contains('authretryablefetchexception') ||
                           errorString.contains('clientexception') ||
                           errorString.contains('failed host lookup') ||
                           errorString.contains('network') ||
                           errorString.contains('connection');

    if (isOfflineError) {
      return Directionality(
        textDirection: TextDirection.ltr,
        child: Material(
          color: Colors.transparent,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.l),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.wifiOff, size: 40, color: AppColors.textSecondary),
                  const SizedBox(height: AppSpacing.m),
                  Text(
                    'No Connection',
                    style: AppTypography.h3,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Please check your internet connection.',
                    style: AppTypography.bodyS.copyWith(color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: AppColors.backgroundPrimary,
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.bug, size: 40, color: AppColors.error),
                const SizedBox(height: AppSpacing.m),
                Text('Widget Error', style: AppTypography.h3),
                const SizedBox(height: AppSpacing.s),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.s),
                  decoration: BoxDecoration(
                    color: Colors.black12,
                    borderRadius: BorderRadius.circular(AppRadius.m),
                  ),
                  child: Text(
                    details.exceptionAsString(),
                    style: AppTypography.caption.copyWith(color: AppColors.error.withValues(alpha: 0.8), fontFamily: 'monospace'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
