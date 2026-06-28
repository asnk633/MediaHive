import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/features/attendance/data/services/qr_signature_service.dart';

class QrScannerOverlay extends ConsumerStatefulWidget {
  final Function(String payload) onScan;

  const QrScannerOverlay({
    super.key,
    required this.onScan,
  });

  @override
  ConsumerState<QrScannerOverlay> createState() => _QrScannerOverlayState();
}

class _QrScannerOverlayState extends ConsumerState<QrScannerOverlay> {
  final _manualController = TextEditingController();
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  String? _errorMessage;
  bool _hasScanned = false;

  @override
  void dispose() {
    _manualController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;
    final barcode = capture.barcodes.firstWhere(
      (b) => b.rawValue != null,
      orElse: () => const Barcode(),
    );
    final raw = barcode.rawValue;
    if (raw == null) return;

    // Verify the QR payload signature before accepting it
    final tagId = QrSignatureService.verifyPayload(raw);
    if (tagId == null) {
      setState(() {
        _errorMessage = 'Invalid QR code. Not a MediaHive attendance QR.';
      });
      return;
    }

    _hasScanned = true;
    _scannerController.stop();
    widget.onScan(raw);
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Container(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
      decoration: BoxDecoration(
        color: colors.backgroundSecondary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
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
          Row(
            children: [
              Icon(LucideIcons.qrCode, color: colors.honey, size: 22),
              const SizedBox(width: 10),
              Text(
                'SCAN ATTENDANCE QR',
                style: AppTypography.h3.copyWith(color: colors.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Align the generated location QR code inside the viewfinder frame.',
            style: TextStyle(color: colors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 24),

          // ── Real Camera Viewfinder ──
          Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Camera preview container
                Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: colors.border, width: 2),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: MobileScanner(
                      controller: _scannerController,
                      onDetect: _onDetect,
                    ),
                  ),
                ),
                // Laser Scanner animation on top of real camera
                Container(
                  width: 260,
                  height: 2,
                  color: colors.honey.withValues(alpha: 0.85),
                )
                    .animate(onPlay: (c) => c.repeat())
                    .moveY(begin: -110, end: 110, duration: 2.seconds, curve: Curves.easeInOut),
                // Corner borders
                ..._buildCorners(colors.honey),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Scanner status text
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: colors.honey,
                  ),
                )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .fadeIn(duration: 600.ms),
                const SizedBox(width: 6),
                Text(
                  'SCANNER ACTIVE',
                  style: TextStyle(
                    color: colors.honey,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (_errorMessage != null) ...[
            Center(
              child: Text(
                _errorMessage!,
                style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Manual fallback (collapsed by default)
          ExpansionTile(
            title: Text(
              'SCANNER TROUBLE? ENTER QR CODE MANUALLY',
              style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
            childrenPadding: EdgeInsets.zero,
            collapsedIconColor: colors.textSecondary,
            iconColor: colors.honey,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _manualController,
                        style: TextStyle(color: colors.textPrimary, fontSize: 12),
                        decoration: InputDecoration(
                          hintText: 'Paste QR payload or raw JSON',
                          hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.5)),
                          filled: true,
                          fillColor: colors.surface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.border)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.border)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.honey)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: () {
                        final text = _manualController.text.trim();
                        if (text.isEmpty) return;

                        final verifiedId = QrSignatureService.verifyPayload(text);
                        if (verifiedId == null) {
                          setState(() {
                            _errorMessage = 'Invalid QR signature or malformed payload.';
                          });
                        } else {
                          widget.onScan(text);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: colors.honey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: colors.honey.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          'SUBMIT',
                          style: TextStyle(color: colors.honey, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildCorners(Color color) {
    const double size = 24;
    const double thickness = 4;
    return [
      // Top Left
      Positioned(
        top: 0, left: 0,
        child: Container(
          width: size, height: size,
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: color, width: thickness),
              left: BorderSide(color: color, width: thickness),
            ),
          ),
        ),
      ),
      // Top Right
      Positioned(
        top: 0, right: 0,
        child: Container(
          width: size, height: size,
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: color, width: thickness),
              right: BorderSide(color: color, width: thickness),
            ),
          ),
        ),
      ),
      // Bottom Left
      Positioned(
        bottom: 0, left: 0,
        child: Container(
          width: size, height: size,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: color, width: thickness),
              left: BorderSide(color: color, width: thickness),
            ),
          ),
        ),
      ),
      // Bottom Right
      Positioned(
        bottom: 0, right: 0,
        child: Container(
          width: size, height: size,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: color, width: thickness),
              right: BorderSide(color: color, width: thickness),
            ),
          ),
        ),
      ),
    ];
  }
}
