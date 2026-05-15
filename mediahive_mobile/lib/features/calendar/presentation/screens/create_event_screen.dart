import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../core/design_tokens.dart';
import '../providers/events_provider.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../../../../../providers/institutional_provider.dart';
import '../../../../../models/institutional_data.dart';
import '../../domain/models/event.dart';
import '../../../tasks/domain/models/task.dart';

final _institutionalTabProvider = StateProvider<int>((ref) => 0); // 0: Institutions, 1: Departments

class CreateEventScreen extends ConsumerStatefulWidget {
  final Event? eventToEdit;
  const CreateEventScreen({super.key, this.eventToEdit});

  @override
  ConsumerState<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends ConsumerState<CreateEventScreen> {
  late TextEditingController _titleController;
  late TextEditingController _locationController;
  bool _isSystemEvent = false;
  bool _isAllDay = false;
  bool _isRecurring = false;
  bool _isTestData = false;
  bool _createOnBehalfOf = false;
  bool _autoTasks = true;

  DateTime? _startDate;
  TimeOfDay? _startTime;
  DateTime? _endDate;
  TimeOfDay? _endTime;

  Department? _selectedDepartment;
  Institution? _selectedInstitution;
  final List<UserProfile> _assignedCrew = [];

  final List<String> _mediaRequests = [
    'Complete Videography',
    'Reel Videography',
    'Photography',
    'Live Broadcasting',
    'Drone Video',
    'Drone Photography',
  ];
  final Set<String> _selectedMedia = {};

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.eventToEdit?.title ?? '');
    _locationController = TextEditingController(text: 'Main Campus Masjid');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final isEdit = widget.eventToEdit != null;

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Container(
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
              padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Icon(LucideIcons.chevronLeft, color: colors.textPrimary),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEdit ? 'Edit Event' : 'Create New Event',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: colors.textPrimary),
                      ),
                      Text(
                        'Schedule a new event or leave request',
                        style: TextStyle(fontSize: 13, color: colors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // System Event Switch
                    _buildSwitchCard(
                      colors,
                      'System Event',
                      'Recurring event for everyone',
                      _isSystemEvent,
                      (val) => setState(() => _isSystemEvent = val),
                    ),
                    const SizedBox(height: 24),

                    // Title Input
                    _buildSectionLabel(colors, 'Event Title'),
                    const SizedBox(height: 12),
                    _buildTextField(colors, _titleController, 'Event Title (e.g., Q4 Planning)', LucideIcons.alignLeft),
                    const SizedBox(height: 24),

                    // Toggle Group
                    _buildSwitchCard(
                      colors,
                      'All Day Event',
                      'Event spans the entire calendar day',
                      _isAllDay,
                      (val) => setState(() => _isAllDay = val),
                      icon: LucideIcons.clock,
                    ),
                    const SizedBox(height: 16),
                    _buildSwitchCard(
                      colors,
                      'Recurring Event',
                      'Repeat this event on a schedule',
                      _isRecurring,
                      (val) => setState(() => _isRecurring = val),
                      icon: LucideIcons.refreshCcw,
                    ),
                    const SizedBox(height: 16),
                    _buildSwitchCard(
                      colors,
                      'Test / Demo Data',
                      'EXCLUDE FROM OFFICIAL REPORTS',
                      _isTestData,
                      (val) => setState(() => _isTestData = val),
                      icon: LucideIcons.edit3,
                      highlightColor: Colors.orange,
                    ),
                    const SizedBox(height: 24),

                    // Admin Action Box
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colors.surface.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.blue.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(LucideIcons.shield, size: 14, color: Colors.blue[400]),
                              const SizedBox(width: 8),
                              Text('ADMINISTRATIVE ACTION', 
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue[400], letterSpacing: 1.2)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildSwitchItem(
                            colors,
                            'Create On Behalf Of',
                            'Event owned by you (the user)',
                            _createOnBehalfOf,
                            (val) => setState(() => _createOnBehalfOf = val),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Created By
                    _buildSectionLabel(colors, 'Created By'),
                    const SizedBox(height: 12),
                    _buildTextField(colors, TextEditingController(text: 'Super Admin'), '', LucideIcons.lock, enabled: false),
                    const SizedBox(height: 24),

                    // Date & Time Grid
                    Row(
                      children: [
                        Expanded(child: _buildDateTimePicker(
                          colors, 
                          'Start Date', 
                          _startDate == null ? 'Pick start date' : '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}', 
                          LucideIcons.calendar,
                          onTap: () => _selectDate(context, true),
                        )),
                        const SizedBox(width: 16),
                        Expanded(child: _buildDateTimePicker(
                          colors, 
                          'Start Time', 
                          _startTime == null ? 'Pick start time' : _startTime!.format(context), 
                          LucideIcons.clock,
                          onTap: () => _selectTime(context, true),
                        )),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: _buildDateTimePicker(
                          colors, 
                          'End Date', 
                          _endDate == null ? 'Pick end date' : '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}', 
                          LucideIcons.calendar,
                          onTap: () => _selectDate(context, false),
                        )),
                        const SizedBox(width: 16),
                        Expanded(child: _buildDateTimePicker(
                          colors, 
                          'End Time', 
                          _endTime == null ? 'Pick end time' : _endTime!.format(context), 
                          LucideIcons.clock,
                          onTap: () => _selectTime(context, false),
                        )),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Location
                    _buildSectionLabel(colors, 'Location (Optional)'),
                    const SizedBox(height: 12),
                    _buildTextField(colors, _locationController, 'Location (Optional)', LucideIcons.mapPin),
                    const SizedBox(height: 24),

                    // Department / Institution
                    _buildSectionLabel(colors, 'Department / Institution'),
                    const SizedBox(height: 12),
                    () {
                      final deptsAsync = ref.watch(departmentsProvider);
                      final instsAsync = ref.watch(institutionsProvider);
                      
                      if (deptsAsync.hasError || instsAsync.hasError) {
                        return _buildDropdown(colors, 'Error loading contexts', LucideIcons.alertCircle);
                      }

                      return (deptsAsync.hasValue && instsAsync.hasValue)
                        ? _buildDropdown(
                            colors, 
                            _selectedDepartment?.name ?? _selectedInstitution?.name ?? 'Select Context', 
                            LucideIcons.briefcase,
                            onTap: () => _showInstitutionalPicker(
                              context, 
                              instsAsync.value!,
                              deptsAsync.value!,
                            ),
                          )
                        : _buildDropdown(colors, 'Loading contexts...', LucideIcons.briefcase);
                    }(),
                    const SizedBox(height: 32),

                    // Request Media Team
                    Row(
                      children: [
                        Icon(LucideIcons.camera, size: 16, color: Colors.blue[400]),
                        const SizedBox(width: 12),
                        Text('Request Media Team', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    GridView.builder(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 2.2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: _mediaRequests.length,
                      itemBuilder: (context, index) {
                        final label = _mediaRequests[index];
                        final isSelected = _selectedMedia.contains(label);
                        return _buildSelectableCard(colors, label, isSelected, () {
                          setState(() {
                            if (isSelected) _selectedMedia.remove(label);
                            else _selectedMedia.add(label);
                          });
                        });
                      },
                    ),
                    const SizedBox(height: 24),

                    // Auto Tasks
                    _buildSwitchCard(
                      colors,
                      'Auto-generate Actionable Tasks',
                      'Creates Preparation, Execution, and Post Production tasks automatically.',
                      _autoTasks,
                      (val) => setState(() => _autoTasks = val),
                      activeColor: Colors.green[400],
                    ),
                    const SizedBox(height: 32),

                    // Assignments
                    _buildActionLabel(colors, LucideIcons.users, 'Crew Assignment'),
                    const SizedBox(height: 12),
                    if (_assignedCrew.isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _assignedCrew.map((user) => _buildCrewChip(colors, user)).toList(),
                      ),
                    if (_assignedCrew.isNotEmpty) const SizedBox(height: 12),
                    ref.watch(mediaTeamProvider).when(
                      data: (team) => _buildActionPlaceholder(
                        colors, 
                        '+ Add Team Member',
                        onTap: () => _showCrewPicker(context, team),
                      ),
                      loading: () => _buildActionPlaceholder(colors, 'Loading team...'),
                      error: (e, _) => _buildActionPlaceholder(colors, 'Error loading team'),
                    ),
                    const SizedBox(height: 24),

                    _buildActionLabel(colors, LucideIcons.camera, 'Equipment Reservation'),
                    const SizedBox(height: 12),
                    _buildActionPlaceholder(colors, '+ Reserve Equipment'),

                    const SizedBox(height: 48),

                    // Submit Button
                    Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6)),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: () {
                          if (_titleController.text.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter an event title'))
                            );
                            return;
                          }

                          final eventDateStr = _startDate != null 
                              ? '${_startDate!.year}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.day.toString().padLeft(2, '0')}' 
                              : DateTime.now().toIso8601String().split('T')[0];
                          
                          final eventTimeStr = _startTime != null 
                              ? _startTime!.format(context) 
                              : '10:00 AM';

                          final newEvent = Event(
                            id: DateTime.now().millisecondsSinceEpoch.toString(),
                            title: _titleController.text,
                            time: eventTimeStr,
                            type: 'EVENT',
                            colorValue: 0xFF2563EB,
                            date: eventDateStr,
                            description: 'Created from Mobile',
                            location: _locationController.text,
                          );

                          // 1. Add Event
                          ref.read(eventListProvider.notifier).addEvent(newEvent);

                          // 2. Auto-generate Tasks if enabled
                          if (_autoTasks) {
                            final baseId = DateTime.now().millisecondsSinceEpoch;
                            final eventTitle = _titleController.text;
                            final dueDateStr = eventDateStr;

                            // Preparation Task
                            ref.read(tasksListProvider.notifier).addTask(Task(
                              id: '${baseId}_1',
                              title: 'Preparation: $eventTitle',
                              status: 'To Do',
                              priority: 'High',
                              requester: 'System',
                              assignee: 'Media Team',
                              dueDate: dueDateStr,
                              description: 'Equipment prep, script review, and logistical setup for $eventTitle.',
                            ));

                            // Execution Task
                            ref.read(tasksListProvider.notifier).addTask(Task(
                              id: '${baseId}_2',
                              title: 'Execution: $eventTitle',
                              status: 'To Do',
                              priority: 'High',
                              requester: 'System',
                              assignee: 'Media Team',
                              dueDate: dueDateStr,
                              description: 'Live coverage, videography, and photography during the event.',
                            ));

                            // Post Production Task
                            ref.read(tasksListProvider.notifier).addTask(Task(
                              id: '${baseId}_3',
                              title: 'Post Production: $eventTitle',
                              status: 'Pending',
                              priority: 'Medium',
                              requester: 'System',
                              assignee: 'Editing Team',
                              dueDate: dueDateStr,
                              description: 'Editing, color grading, and final delivery of $eventTitle assets.',
                            ));
                          }

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(isEdit ? 'Event updated successfully' : 'Event created with auto-tasks'),
                              backgroundColor: const Color(0xFF10B981),
                              behavior: SnackBarBehavior.floating,
                            )
                          );

                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text(
                          isEdit ? 'Save Changes' : 'Create Event',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(ThemeColors colors, String label) {
    return Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary));
  }

  Widget _buildTextField(ThemeColors colors, TextEditingController controller, String hint, IconData icon, {bool enabled = true}) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface.withOpacity(enabled ? 1 : 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: TextField(
        controller: controller,
        enabled: enabled,
        style: TextStyle(color: colors.textPrimary),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5)),
          prefixIcon: Icon(icon, size: 18, color: colors.textSecondary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildSwitchCard(ThemeColors colors, String title, String subtitle, bool value, Function(bool) onChanged, {IconData? icon, Color? highlightColor, Color? activeColor}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: highlightColor?.withOpacity(0.3) ?? colors.border),
      ),
      child: _buildSwitchItem(colors, title, subtitle, value, onChanged, icon: icon, highlightColor: highlightColor, activeColor: activeColor),
    );
  }

  Widget _buildSwitchItem(ThemeColors colors, String title, String subtitle, bool value, Function(bool) onChanged, {IconData? icon, Color? highlightColor, Color? activeColor}) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, size: 20, color: highlightColor ?? colors.textSecondary),
          const SizedBox(width: 16),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: highlightColor ?? colors.textPrimary)),
              Text(subtitle, style: TextStyle(fontSize: 11, color: colors.textSecondary)),
            ],
          ),
        ),
        Switch.adaptive(
          value: value,
          onChanged: onChanged,
          activeColor: activeColor ?? const Color(0xFF2563EB),
        ),
      ],
    );
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? (_startDate ?? DateTime.now()) : (_endDate ?? _startDate ?? DateTime.now()),
      firstDate: isStart ? DateTime(2000) : (_startDate ?? DateTime(2000)),
      lastDate: DateTime(2101),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(_startDate!)) {
            _endDate = _startDate;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: isStart ? (_startTime ?? TimeOfDay.now()) : (_endTime ?? _startTime ?? TimeOfDay.now()),
    );
    if (picked != null) {
      setState(() {
        if (isStart) _startTime = picked;
        else _endTime = picked;
      });
    }
  }

  Widget _buildDateTimePicker(ThemeColors colors, String label, String hint, IconData icon, {VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: colors.textSecondary),
                const SizedBox(width: 12),
                Expanded(child: Text(hint, style: TextStyle(fontSize: 13, color: colors.textPrimary))),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown(ThemeColors colors, String value, IconData icon, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: colors.textSecondary),
            const SizedBox(width: 12),
            Expanded(child: Text(value, style: TextStyle(fontSize: 13, color: colors.textPrimary))),
            Icon(LucideIcons.chevronDown, size: 18, color: colors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectableCard(ThemeColors colors, String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.withOpacity(0.1) : colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? Colors.blue : colors.border),
        ),
        child: Row(
          children: [
            Icon(isSelected ? LucideIcons.checkCircle2 : LucideIcons.circle, 
              size: 16, color: isSelected ? Colors.blue : colors.textSecondary.withOpacity(0.3)),
            const SizedBox(width: 10),
            Expanded(child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: colors.textPrimary))),
          ],
        ),
      ),
    );
  }

  Widget _buildActionLabel(ThemeColors colors, IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: colors.textSecondary),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: colors.textPrimary)),
      ],
    );
  }

  Widget _buildActionPlaceholder(ThemeColors colors, String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: colors.surface.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border, style: BorderStyle.solid),
        ),
        child: Text(label, style: TextStyle(fontSize: 14, color: colors.textSecondary.withOpacity(0.5))),
      ),
    );
  }

  void _showInstitutionalPicker(BuildContext context, List<Institution> institutions, List<Department> departments) {
    final colors = ref.read(themeColorsProvider);
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final isShowingInstitutions = ref.watch(_institutionalTabProvider) == 0;
          
          return Container(
            padding: const EdgeInsets.all(24),
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Select Context', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: colors.textPrimary)),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Icon(LucideIcons.x, size: 20, color: colors.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(child: _buildModalTab(colors, 'Institutions', isShowingInstitutions, () {
                        ref.read(_institutionalTabProvider.notifier).state = 0;
                        setModalState(() {});
                      })),
                      Expanded(child: _buildModalTab(colors, 'Departments', !isShowingInstitutions, () {
                        ref.read(_institutionalTabProvider.notifier).state = 1;
                        setModalState(() {});
                      })),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                Expanded(
                  child: ListView.builder(
                    itemCount: isShowingInstitutions ? institutions.length : departments.length,
                    itemBuilder: (context, index) {
                      if (isShowingInstitutions) {
                        final inst = institutions[index];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                          title: Text(inst.name, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
                          leading: Icon(LucideIcons.landmark, size: 18, color: colors.textSecondary),
                          onTap: () {
                            setState(() {
                              _selectedInstitution = inst;
                              _selectedDepartment = null;
                            });
                            Navigator.pop(context);
                          },
                        );
                      } else {
                        final dept = departments[index];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                          title: Text(dept.name, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
                          leading: Icon(LucideIcons.briefcase, size: 18, color: colors.textSecondary),
                          onTap: () {
                            setState(() {
                              _selectedDepartment = dept;
                              _selectedInstitution = null;
                            });
                            Navigator.pop(context);
                          },
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildModalTab(ThemeColors colors, String label, bool isActive, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? Colors.blue : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isActive ? Colors.white : colors.textSecondary)),
        ),
      ),
    );
  }

  Widget _buildCrewChip(ThemeColors colors, UserProfile user) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(user.fullName, style: TextStyle(fontSize: 12, color: colors.textPrimary)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => setState(() => _assignedCrew.remove(user)),
            child: Icon(LucideIcons.x, size: 14, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }

  void _showCrewPicker(BuildContext context, List<UserProfile> team) {
    final colors = ref.read(themeColorsProvider);
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Select Crew', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.textPrimary)),
            const SizedBox(height: 16),
            ...team.map((user) => ListTile(
              title: Text(user.fullName, style: TextStyle(color: colors.textPrimary)),
              onTap: () {
                if (!_assignedCrew.contains(user)) {
                  setState(() => _assignedCrew.add(user));
                }
                Navigator.pop(context);
              },
            )).toList(),
          ],
        ),
      ),
    );
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }
}
