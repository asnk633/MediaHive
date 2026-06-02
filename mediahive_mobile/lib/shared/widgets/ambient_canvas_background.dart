import 'dart:math' as math;
import 'package:flutter/material.dart';

/// A full-screen ambient gradient canvas that renders barely perceptible,
/// slowly shifting color blobs behind all content.
///
/// - **Light / Spatial theme**: Soft pastel sky-blue gradient shifts.
/// - **Dark / FinTech theme**: Nearly invisible warm gold tints on pure black.
///
/// Uses a single [AnimationController] cycling at ~0.5 Hz to drive a
/// time-based sine wave through the [CustomPainter]. The painter composites
/// three additive radial-gradient circles whose centres drift slowly over time,
/// producing an organic, living-canvas effect without any device-sensor input.
class AmbientCanvasBackground extends StatefulWidget {
  /// When `true`, renders the dark/FinTech palette; otherwise the light/Spatial
  /// palette.
  final bool isDark;

  const AmbientCanvasBackground({super.key, required this.isDark});

  @override
  State<AmbientCanvasBackground> createState() =>
      _AmbientCanvasBackgroundState();
}

class _AmbientCanvasBackgroundState extends State<AmbientCanvasBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    // ~0.5 cycles/sec → full sine period = 2 seconds for smooth, barely
    // perceptible motion. The repeat keeps the animation alive indefinitely.
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _AmbientGradientPainter(
              phase: _controller.value,
              isDark: widget.isDark,
            ),
            size: Size.infinite,
          );
        },
      ),
    );
  }
}

/// Paints three soft radial-gradient blobs whose centres orbit slowly based
/// on a normalised [phase] (0 → 1). Each blob uses a different sine/cosine
/// frequency multiplier so they never fully overlap, creating a living,
/// breathing canvas.
class _AmbientGradientPainter extends CustomPainter {
  final double phase;
  final bool isDark;

  const _AmbientGradientPainter({
    required this.phase,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Convert normalised phase to radians for sine-wave driving.
    final double t = phase * 2 * math.pi;

    if (isDark) {
      _paintDark(canvas, size, t);
    } else {
      _paintLight(canvas, size, t);
    }
  }

  // ── Dark / FinTech palette ────────────────────────────────────────────────
  // Pure black base with barely visible warm gold tints drifting across the
  // canvas.  The extremely low opacity keeps the effect subliminal.
  void _paintDark(Canvas canvas, Size size, double t) {
    // Solid black base fill.
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFF000000),
    );

    final cx = size.width * 0.5;
    final cy = size.height * 0.5;
    final radius = size.longestSide * 0.55;

    // Blob A – warm tint drifting upper-left ↔ centre.
    _drawBlob(
      canvas,
      center: Offset(
        cx + math.sin(t) * size.width * 0.18,
        cy + math.cos(t * 0.7) * size.height * 0.12,
      ),
      radius: radius,
      color: const Color(0xFF0A0A05).withValues(alpha: 0.45),
    );

    // Blob B – slightly cooler warm, drifting lower-right ↔ centre.
    _drawBlob(
      canvas,
      center: Offset(
        cx + math.cos(t * 0.8) * size.width * 0.20,
        cy + math.sin(t * 1.1) * size.height * 0.14,
      ),
      radius: radius * 0.9,
      color: const Color(0xFF050503).withValues(alpha: 0.35),
    );

    // Blob C – faintest accent, wandering slowly.
    _drawBlob(
      canvas,
      center: Offset(
        cx + math.sin(t * 0.5 + 1.2) * size.width * 0.15,
        cy + math.cos(t * 0.6 + 0.8) * size.height * 0.18,
      ),
      radius: radius * 0.75,
      color: const Color(0xFF080805).withValues(alpha: 0.30),
    );
  }

  // ── Light / Spatial palette ───────────────────────────────────────────────
  // Soft pastel sky-blue canvas with three overlapping gradient blobs that
  // slowly shift, producing a gentle, almost cloud-like ambient effect.
  void _paintLight(Canvas canvas, Size size, double t) {
    // Sky-blue base.
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFF0F4FC),
    );

    final cx = size.width * 0.5;
    final cy = size.height * 0.5;
    final radius = size.longestSide * 0.55;

    // Blob A – slightly cooler blue, upper region.
    _drawBlob(
      canvas,
      center: Offset(
        cx + math.sin(t) * size.width * 0.15,
        cy + math.cos(t * 0.7) * size.height * 0.10,
      ),
      radius: radius,
      color: const Color(0xFFE7EDF8).withValues(alpha: 0.70),
    );

    // Blob B – deeper blue tint, lower-right area.
    _drawBlob(
      canvas,
      center: Offset(
        cx + math.cos(t * 0.8) * size.width * 0.18,
        cy + math.sin(t * 1.1) * size.height * 0.12,
      ),
      radius: radius * 0.85,
      color: const Color(0xFFDDE5F7).withValues(alpha: 0.55),
    );

    // Blob C – very soft lavender accent, slow drift.
    _drawBlob(
      canvas,
      center: Offset(
        cx + math.sin(t * 0.5 + 1.0) * size.width * 0.12,
        cy + math.cos(t * 0.6 + 0.7) * size.height * 0.15,
      ),
      radius: radius * 0.70,
      color: const Color(0xFFE2E9F6).withValues(alpha: 0.50),
    );
  }

  // ── Shared helper ─────────────────────────────────────────────────────────
  void _drawBlob(
    Canvas canvas, {
    required Offset center,
    required double radius,
    required Color color,
  }) {
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, color.withValues(alpha: 0.0)],
        stops: const [0.0, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius));

    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(_AmbientGradientPainter oldDelegate) {
    // Repaint only when the driving phase changes or the theme switches.
    return oldDelegate.phase != phase || oldDelegate.isDark != isDark;
  }
}
