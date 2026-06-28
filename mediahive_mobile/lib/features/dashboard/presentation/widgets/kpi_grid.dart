import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';

class KpiCardData {
  final String value;
  final String label;
  final IconData icon;
  final Color accentColor;
  final VoidCallback? onTap;

  const KpiCardData({
    required this.value,
    required this.label,
    required this.icon,
    required this.accentColor,
    this.onTap,
  });
}

class KpiGrid extends StatelessWidget {
  final String? title;
  final List<KpiCardData> items;
  final int crossAxisCount;

  const KpiGrid({
    super.key,
    this.title,
    required this.items,
    this.crossAxisCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            _buildSectionHeader(colors, title!),
            const SizedBox(height: 16),
          ],
          Row(
            children: items.map((item) {
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    left: items.indexOf(item) > 0 ? 12 : 0,
                  ),
                  child: _buildCard(colors, item),
                ),
              );
            }).toList(),
          ),
        ],
      );
    });
  }

  Widget _buildSectionHeader(ThemeColors colors, String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 14,
          decoration: BoxDecoration(
            color: colors.honey,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: colors.textSecondary,
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildCard(ThemeColors colors, KpiCardData item) {
    return GestureDetector(
      onTap: item.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.border.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: colors.isDark ? Colors.black.withValues(alpha: 0.2) : colors.border.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(item.icon, size: 20, color: item.accentColor.withValues(alpha: 0.8)),
            const SizedBox(height: 12),
            Text(
              item.value,
              style: AppTypography.h2.copyWith(
                fontSize: 24,
                color: colors.textPrimary,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item.label,
              style: AppTypography.caption.copyWith(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: colors.textSecondary.withValues(alpha: 0.4),
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StatusCardData {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const StatusCardData({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
    this.onTap,
  });
}

class StatusCardGrid extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? trailingLabel;
  final List<StatusCardData> items;

  const StatusCardGrid({
    super.key,
    required this.title,
    this.subtitle,
    this.trailingLabel,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, ref, _) {
      final colors = ref.watch(themeColorsProvider);
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: AppTypography.h3),
              if (trailingLabel != null)
                Text(trailingLabel!, style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.bold, color: colors.textSecondary,
                )),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: TextStyle(color: colors.textSecondary, fontSize: 12)),
          ],
          const SizedBox(height: 20),
          Row(
            children: items.map((item) {
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(left: items.indexOf(item) > 0 ? 8 : 0),
                  child: _buildStatusCard(colors, item),
                ),
              );
            }).toList(),
          ),
        ],
      );
    });
  }

  Widget _buildStatusCard(ThemeColors colors, StatusCardData item) {
    return GestureDetector(
      onTap: item.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: colors.isDark ? colors.surface.withValues(alpha: 0.5) : colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colors.isDark
                ? colors.border.withValues(alpha: 0.5)
                : colors.border.withValues(alpha: 0.12),
          ),
          boxShadow: colors.isDark
              ? []
              : [
                  BoxShadow(
                    color: colors.border.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: item.color.withValues(alpha: colors.isDark ? 0.1 : 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(item.icon, size: 18, color: item.color),
            ),
            const SizedBox(height: 12),
            Text(
              item.value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: colors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item.label,
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w800,
                color: colors.textSecondary.withValues(alpha: 0.5),
                letterSpacing: 1.0,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
