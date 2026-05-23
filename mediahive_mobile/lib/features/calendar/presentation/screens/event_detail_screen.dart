import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme_provider.dart';
import '../../../../core/design_tokens.dart';
import '../providers/events_provider.dart';
import '../../domain/models/event.dart';
import 'package:flutter/services.dart';
import 'create_event_screen.dart';

class EventDetailScreen extends ConsumerWidget {
  final String title;
  final String time;
  final String type;
  final Color color;
  final String date;
  final String? location;
  final String? description;
  final String? office;
  final String? requestedBy;

  const EventDetailScreen({
    super.key,
    required this.title,
    required this.time,
    required this.type,
    required this.color,
    required this.date,
    this.location = 'Main Campus Masjid',
    this.description,
    this.office = 'Join Director Office',
    this.requestedBy = 'J',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
        height: MediaQuery.of(context).size.height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.backgroundSecondary, colors.backgroundPrimary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 120, 24, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            color: colors.textPrimary,
                            height: 1.1,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      GestureDetector(
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => CreateEventScreen(
                          eventToEdit: Event(
                            id: title, // Using title as ID for temporary reference
                            title: title,
                            time: time,
                            type: type,
                            colorValue: color.value,
                            date: date,
                            location: location,
                            description: description,
                          ),
                        ))),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: colors.indigo,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(color: colors.indigo.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: const Row(
                            children: [
                              Icon(LucideIcons.edit2, size: 14, color: Colors.white),
                              SizedBox(width: 8),
                              Text('Edit', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),

                  _buildSectionHeader(colors, LucideIcons.info, 'DESCRIPTION'),
                  const SizedBox(height: 12),
                  Text(
                    description ?? 'No description provided.',
                    style: TextStyle(fontSize: 14, color: colors.textPrimary.withOpacity(0.7), height: 1.5),
                  ),

                  const SizedBox(height: 32),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: colors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(LucideIcons.video, size: 18, color: colors.indigo),
                            const SizedBox(width: 12),
                            Text(
                              'Media Coverage Requested',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.indigo),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildCoverageItem(colors, 'Reel Videography', true),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  _buildDetailItem(colors, LucideIcons.calendar, 'DATE', date),
                  _buildDetailItem(colors, LucideIcons.clock, 'TIME', '$time - 01:30 PM'),
                  _buildDetailItem(colors, LucideIcons.mapPin, 'LOCATION', location!),
                  _buildDetailItem(colors, LucideIcons.briefcase, 'DEPARTMENT / INSTITUTION', office!),

                  const SizedBox(height: 32),

                  _buildSectionHeader(colors, LucideIcons.list, 'RELATED TASKS'),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: colors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title, 
                                maxLines: 1, 
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: colors.textPrimary)),
                              const SizedBox(height: 4),
                              _buildStatusTag(colors, 'DONE', colors.emerald),
                            ],
                          ),
                        ),
                        Text('View Task →', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.textSecondary)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  _buildSectionHeader(colors, LucideIcons.image, 'MEDIA GALLERY'),
                  const SizedBox(height: 16),
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: colors.border, style: BorderStyle.solid),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.camera, size: 40, color: colors.textSecondary.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text('No media files found', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary)),
                        const SizedBox(height: 4),
                        Text('Upload media to start review and collaboration', 
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, color: colors.textSecondary)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  _buildSectionHeader(colors, LucideIcons.user, 'REQUESTED ON BEHALF OF'),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(color: colors.indigo, shape: BoxShape.circle),
                        child: Center(child: Text(requestedBy!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(office!, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: colors.textPrimary)),
                            Text('Institutional Request', style: TextStyle(fontSize: 10, color: colors.textSecondary)),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),

            Positioned(
              bottom: 40,
              left: 24,
              right: 24,
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      final shareText = '''
📢 MediaHive Event: $title
📅 Date: $date
⏰ Time: $time
📍 Location: ${location ?? "Main Campus"}

View details in MediaHive:
https://mediahive.app/events/detail?title=${Uri.encodeComponent(title)}
''';
                      Clipboard.setData(ClipboardData(text: shareText)).then((_) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Event link copied to clipboard!', 
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            backgroundColor: colors.indigo,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      });
                    },
                    child: Icon(LucideIcons.share2, color: colors.textSecondary, size: 20),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => _showDeleteConfirmation(context, ref, colors),
                    child: Icon(LucideIcons.trash2, color: colors.error, size: 20),
                  ),
                ],
              ),
            ),

            Positioned(
              top: 60,
              right: 24,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: colors.border),
                  ),
                  child: Icon(LucideIcons.x, color: colors.textPrimary, size: 20),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref, ThemeColors colors) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Delete Event?', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w900)),
        content: Text('Are you sure you want to permanently delete this institutional event?', 
          style: TextStyle(color: colors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary, fontWeight: FontWeight.bold)),
          ),
          Container(
            margin: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(
              color: colors.error,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextButton(
              onPressed: () {
                ref.read(eventListProvider.notifier).deleteEvent(title);
                Navigator.pop(context); 
                Navigator.pop(context); 
              },
              child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(ThemeColors colors, IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 12, color: colors.textSecondary),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.textSecondary, letterSpacing: 1.2)),
      ],
    );
  }

  Widget _buildCoverageItem(ThemeColors colors, String label, bool checked) {
    return Row(
      children: [
        Icon(checked ? LucideIcons.checkCircle2 : LucideIcons.circle, size: 16, color: colors.emerald),
        const SizedBox(width: 12),
        Text(label, style: TextStyle(fontSize: 13, color: colors.textPrimary)),
      ],
    );
  }

  Widget _buildDetailItem(ThemeColors colors, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, size: 18, color: colors.indigo),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: colors.textSecondary, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusTag(ThemeColors colors, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
      child: Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: color)),
    );
  }
}
