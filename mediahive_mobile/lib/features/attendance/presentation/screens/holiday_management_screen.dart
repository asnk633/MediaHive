import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/shared/widgets/mh_refresh_indicator.dart';
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';

class HolidayManagementScreen extends ConsumerStatefulWidget {
  const HolidayManagementScreen({super.key});

  @override
  ConsumerState<HolidayManagementScreen> createState() => _HolidayManagementScreenState();
}

class _HolidayManagementScreenState extends ConsumerState<HolidayManagementScreen> {
  final _holidayNameController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  bool _loading = false;
  List<Map<String, dynamic>> _holidays = [];

  @override
  void initState() {
    super.initState();
    _fetchHolidays();
  }

  @override
  void dispose() {
    _holidayNameController.dispose();
    super.dispose();
  }

  Future<void> _fetchHolidays() async {
    setState(() => _loading = true);
    try {
      final list = await ref.read(attendanceRepositoryProvider).getHolidayList();
      setState(() => _holidays = list);
    } catch (e) {
      debugPrint('Failed to load holidays: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addHoliday() async {
    final name = _holidayNameController.text.trim();
    if (name.isEmpty) return;

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    try {
      await ref.read(attendanceRepositoryProvider).addHoliday(dateStr, name);
      _holidayNameController.clear();
      _selectedDate = DateTime.now();
      _fetchHolidays();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Holiday added successfully!'), backgroundColor: AppColors.success),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add holiday: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _deleteHoliday(String id) async {
    try {
      await ref.read(attendanceRepositoryProvider).deleteHoliday(id);
      _fetchHolidays();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Holiday deleted successfully.'), backgroundColor: AppColors.success),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete holiday: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _showAddDialog() async {
    final colors = ref.read(themeColorsProvider);
    _holidayNameController.clear();
    _selectedDate = DateTime.now();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: colors.backgroundSecondary,
          title: Text(
            'ADD PUBLIC HOLIDAY',
            style: AppTypography.h3.copyWith(color: colors.textPrimary),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _holidayNameController,
                style: TextStyle(color: colors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Holiday Name',
                  labelStyle: TextStyle(color: colors.textSecondary),
                  filled: true,
                  fillColor: colors.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(DateTime.now().year - 1),
                    lastDate: DateTime(DateTime.now().year + 5),
                  );
                  if (date != null) {
                    setDialogState(() => _selectedDate = date);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: colors.border),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.calendar, color: colors.honey, size: 18),
                      const SizedBox(width: 10),
                      Text(
                        DateFormat('yyyy-MM-dd').format(_selectedDate),
                        style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('CANCEL', style: TextStyle(color: colors.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: colors.honey),
              onPressed: () {
                Navigator.pop(ctx);
                _addHoliday();
              },
              child: const Text('SAVE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [colors.backgroundSecondary, colors.backgroundPrimary],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: Column(
              children: [
                // Header
                Padding(
                  padding: EdgeInsets.fromLTRB(20, 110 + MediaQuery.of(context).padding.top, 20, 10),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.pop(),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: colors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: colors.border),
                          ),
                          child: Icon(LucideIcons.chevronLeft, color: colors.textPrimary, size: 18),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'HOLIDAY LIST',
                            style: AppTypography.h2.copyWith(color: colors.textPrimary),
                          ),
                          Text(
                            'MANAGE INSTITUTION HOLIDAYS',
                            style: AppTypography.caption.copyWith(color: colors.textSecondary, letterSpacing: 0.5),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Holidays list
                Expanded(
                  child: MhRefreshIndicator(
                    onRefresh: _fetchHolidays,
                    child: _loading
                        ? const MhLoading(size: 80)
                        : _holidays.isEmpty
                            ? _buildEmptyState(colors)
                            : ListView.builder(
                                padding: const EdgeInsets.fromLTRB(20, 10, 20, 140),
                                itemCount: _holidays.length,
                                itemBuilder: (_, i) {
                                  final item = _holidays[i];
                                  final dateStr = item['date'] as String;
                                  final name = item['name'] as String;
                                  final id = item['id'] as String;

                                  return Card(
                                    color: colors.surface,
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    child: ListTile(
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      leading: Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: colors.honey.withValues(alpha: 0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(LucideIcons.palmtree, color: colors.honey, size: 18),
                                      ),
                                      title: Text(
                                        name,
                                        style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      subtitle: Text(
                                        dateStr,
                                        style: TextStyle(color: colors.textSecondary, fontSize: 11),
                                      ),
                                      trailing: IconButton(
                                        icon: const Icon(LucideIcons.trash2, color: AppColors.error, size: 18),
                                        onPressed: () => _deleteHoliday(id),
                                      ),
                                    ),
                                  ).animate(delay: (i * 40).ms).fadeIn(duration: 200.ms).slideY(begin: 0.1);
                                },
                              ),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 140,
            right: 20,
            child: FloatingActionButton(
              backgroundColor: colors.honey,
              onPressed: _showAddDialog,
              child: const Icon(LucideIcons.plus, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeColors colors) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.calendarOff, color: colors.textSecondary, size: 48),
          const SizedBox(height: 12),
          Text(
            'No holidays configured.',
            style: TextStyle(color: colors.textSecondary, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
