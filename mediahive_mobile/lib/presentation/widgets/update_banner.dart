import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mediahive_mobile/core/design_tokens.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/providers/update_provider.dart';
import 'package:mediahive_mobile/core/services/update_service.dart';

class UpdateBanner extends ConsumerWidget {
  final UpdateInfo info;
  final UpdateDownloadState state;
  final double progress;
  final bool showReleaseNotes;
  final VoidCallback onToggleReleaseNotes;

  const UpdateBanner({
    super.key,
    required this.info,
    required this.state,
    required this.progress,
    required this.showReleaseNotes,
    required this.onToggleReleaseNotes,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);
    final isLight = !colors.isDark;
    final isDownloading = state == UpdateDownloadState.downloading;
    final isDownloaded = state == UpdateDownloadState.downloaded;
    final isInstalling = state == UpdateDownloadState.installing;

    final List<String> bulletPoints = info.releaseNotes
        .replaceAll(r'\n', '\n')
        .split('\n')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .map((s) => s.startsWith('•') ? s.substring(1).trim() : s)
        .toList();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isLight
              ? [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7)]
              : [const Color(0xFF78350F).withValues(alpha: 0.85), const Color(0xFF451A03).withValues(alpha: 0.9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(DesignTokens.radiusL),
        border: Border.all(
          color: isLight ? const Color(0xFFFDE68A) : const Color(0xFFD97706).withValues(alpha: 0.4),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD97706).withValues(alpha: isLight ? 0.08 : 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(DesignTokens.radiusL - 1),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: isLight ? 0.15 : 0.25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.rocket,
                      color: Color(0xFFD97706),
                      size: 18,
                    ),
                  ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                   .moveY(begin: -2, end: 2, duration: 1000.ms, curve: Curves.easeInOut),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Update Available — v${info.latestVersion}',
                          style: TextStyle(
                            color: isLight ? const Color(0xFF78350F) : Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                isDownloading
                                    ? 'Downloading system resources...'
                                    : isDownloaded
                                        ? 'Update downloaded successfully!'
                                        : isInstalling
                                            ? 'Installing update package...'
                                            : 'Tap "What\'s New" to see changes.',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: isLight ? const Color(0xFF92400E) : const Color(0xFFFCD34D).withValues(alpha: 0.8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (!isDownloading && !isInstalling && bulletPoints.isNotEmpty)
                    TextButton(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: onToggleReleaseNotes,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            showReleaseNotes ? 'COLLAPSE' : "WHAT'S NEW",
                            style: const TextStyle(
                              color: Color(0xFFD97706),
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(
                            showReleaseNotes ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                            color: const Color(0xFFD97706),
                            size: 10,
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(width: 8),
                  if (!isDownloading && !isInstalling)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD97706),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(DesignTokens.radiusM),
                        ),
                      ),
                      onPressed: () {
                        if (isDownloaded) {
                          ref.read(updateStateProvider.notifier).installUpdate();
                        } else {
                          ref.read(updateStateProvider.notifier).downloadUpdate(info.downloadUrl);
                        }
                      },
                      child: Text(
                        isDownloaded ? 'INSTALL' : 'UPDATE',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                  if (isDownloading)
                    IconButton(
                      icon: const Icon(LucideIcons.x, color: Color(0xFFD97706), size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        ref.read(updateStateProvider.notifier).cancelDownload();
                      },
                    ),
                ],
              ),
              if (isDownloading) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          backgroundColor: const Color(0xFFD97706).withValues(alpha: 0.15),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD97706)),
                          minHeight: 5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: TextStyle(
                        color: isLight ? const Color(0xFF78350F) : Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
              if (showReleaseNotes && bulletPoints.isNotEmpty && !isDownloading && !isInstalling) ...[
                const SizedBox(height: 8),
                const Divider(
                  color: Color(0xFFFDE68A),
                  thickness: 0.5,
                  height: 12,
                ),
                ...bulletPoints.map((point) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 2.0),
                        child: Icon(
                          LucideIcons.checkCircle2,
                          color: Color(0xFFD97706),
                          size: 12,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          point,
                          style: TextStyle(
                            color: isLight ? const Color(0xFF78350F) : Colors.white.withValues(alpha: 0.9),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0, curve: Curves.easeOutCubic);
  }
}
