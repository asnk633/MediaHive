import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../core/providers/user_provider.dart' hide departmentsProvider, institutionsProvider;
import '../../../../../core/design_tokens.dart';
import '../providers/events_provider.dart';
import '../../../tasks/presentation/providers/tasks_provider.dart';
import '../../../../../providers/institutional_provider.dart';
import '../../../../../core/providers/ui_providers.dart';
import '../../../../../models/institutional_data.dart';
import '../../domain/models/event.dart';
import '../../../tasks/domain/models/task.dart';
import '../../../../../core/services/sound_service.dart';

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

  String? _pendingInstitutionId;
  String? _pendingDepartmentId;
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
    final edit = widget.eventToEdit;

    _titleController = TextEditingController(text: edit?.title ?? '');

    if (edit != null) {
      // Restore date from stored "yyyy-MM-dd" string
      try {
        final parts = edit.date.split('-');
        _startDate = DateTime(
          int.parse(parts[0]),
          int.parse(parts[1]),
          int.parse(parts[2]),
        );
      } catch (_) {
        _startDate = DateTime.now();
      }

      // Restore time from stored "HH:mm" string
      try {
        final timeParts = edit.time.split(':');
        _startTime = TimeOfDay(
          hour: int.parse(timeParts[0]),
          minute: int.parse(timeParts[1]),
        );
      } catch (_) {
        _startTime = TimeOfDay.now();
      }

      // Default end = start + 2h
      _endDate = _startDate;
      _endTime = TimeOfDay(
        hour: (_startTime!.hour + 2) % 24,
        minute: _startTime!.minute,
      );

      // Location
      _locationController = TextEditingController(text: edit.location ?? '');

      // On-behalf-of
      if (edit.onBehalfOf != null && edit.onBehalfOf!.isNotEmpty) {
        _createOnBehalfOf = true;
        _pendingInstitutionId = edit.onBehalfOf!['institution_id']?.toString();
        _pendingDepartmentId = edit.onBehalfOf!['department_id']?.toString();
      }

      // Restore media coverage and assigned crew
      if (edit.mediaCoverage.isNotEmpty) {
        _selectedMedia.addAll(edit.mediaCoverage);
      }
      if (edit.assignedCrew.isNotEmpty) {
        _assignedCrew.clear();
        _assignedCrew.addAll(
          edit.assignedCrew.map((c) => UserProfile.fromJson(c)).toList(),
        );
      }
    } else {
      // Create mode
      final now = DateTime.now();
      _startDate = now;
      _startTime = TimeOfDay(hour: now.hour, minute: now.minute);
      _endDate = now.add(const Duration(hours: 2));
      _endTime = TimeOfDay(hour: (now.hour + 2) % 24, minute: now.minute);
      _locationController = TextEditingController(text: '');
    }
  }

  bool get _canAssignOthers {
    final profile = ref.read(currentUserProfileProvider).value;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    return role == 'admin' || role == 'manager';
  }

  bool get _canAssignSelf {
    final profile = ref.read(currentUserProfileProvider).value;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    
    if (role == 'admin' || role == 'manager') return true;
    if (role == 'team') {
      final currentUserId = Supabase.instance.client.auth.currentUser?.id;
      if (widget.eventToEdit == null) return true;
      return widget.eventToEdit?.createdBy == currentUserId;
    }
    return false;
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

    if (_pendingInstitutionId != null) {
      final instsAsync = ref.watch(institutionsProvider);
      if (instsAsync.hasValue) {
        final list = instsAsync.value ?? [];
        final found = list.firstWhere(
          (i) => i.id.toString() == _pendingInstitutionId,
          orElse: () => null as dynamic,
        );
        if (found != null) {
          _selectedInstitution = found;
          _pendingInstitutionId = null;
        }
      }
    }

    if (_pendingDepartmentId != null) {
      final deptsAsync = ref.watch(departmentsProvider);
      if (deptsAsync.hasValue) {
        final list = deptsAsync.value ?? [];
        final found = list.firstWhere(
          (d) => d.id.toString() == _pendingDepartmentId,
          orElse: () => null as dynamic,
        );
        if (found != null) {
          _selectedDepartment = found;
          _pendingDepartmentId = null;
        }
      }
    }

    if (_selectedDepartment != null && _selectedInstitution != null) {
      _selectedInstitution = null;
    }

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: colors.backgroundPrimary.withOpacity(0.8),
        elevation: 0,
        flexibleSpace: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.transparent),
          ),
        ),
        leading: IconButton(
          icon: Icon(LucideIcons.chevronLeft, color: colors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEdit ? 'Edit Event' : 'Create New Event',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: colors.textPrimary),
            ),
            Text(
              'Schedule a new event or leave request',
              style: TextStyle(fontSize: 12, color: colors.textSecondary),
            ),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.backgroundSecondary, colors.backgroundPrimary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 120, left: 24, right: 24, bottom: 40),
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
                highlightColor: colors.honey,
              ),
              const SizedBox(height: 24),

              // Admin Action Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colors.surface.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.indigo.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(LucideIcons.shield, size: 14, color: colors.indigo),
                        const SizedBox(width: 8),
                        Text('ADMINISTRATIVE ACTION', 
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: colors.indigo, letterSpacing: 1.2)),
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
                    
                    if (_createOnBehalfOf) ...[
                      const SizedBox(height: 16),
                      Divider(color: colors.border),
                      const SizedBox(height: 16),
                      _buildActionLabel(colors, LucideIcons.building2, 'Target Context'),
                      const SizedBox(height: 12),
                      Consumer(builder: (context, ref, _) {
                        final instsAsync = ref.watch(institutionsProvider);
                        final deptsAsync = ref.watch(departmentsProvider);

                        final isLoading = instsAsync.isLoading || deptsAsync.isLoading;

                        return _buildActionPlaceholder(
                          colors,
                          isLoading 
                              ? 'Loading contexts...'
                              : (_selectedDepartment != null 
                                  ? _selectedDepartment!.name
                                  : (_selectedInstitution != null ? _selectedInstitution!.name : '+ Select Institution or Department')),
                          onTap: isLoading ? null : () {
                            final insts = instsAsync.value ?? [];
                            final depts = deptsAsync.value ?? [];
                            _showInstitutionalPicker(context, insts, depts);
                          },
                        );
                      }),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Created By
              _buildSectionLabel(colors, 'Created By'),
              const SizedBox(height: 12),
              Consumer(builder: (context, ref, _) {
                final profileAsync = ref.watch(currentUserProfileProvider);
                final creatorName = profileAsync.maybeWhen(
                  data: (p) => p?['full_name'] as String? ?? 'Super Admin',
                  orElse: () => 'Super Admin',
                );
                return _buildTextField(colors, TextEditingController(text: creatorName), '', LucideIcons.user, enabled: false);
              }),
              const SizedBox(height: 24),

              // Date & Time Grid
              Row(
                children: [
                  Expanded(child: _buildDateTimePicker(
                    colors, 
                    'Start Date', 
                    _startDate == null ? 'Pick start date' : '${_startDate!.day.toString().padLeft(2, '0')}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.year}', 
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
                    _endDate == null ? 'Pick end date' : '${_endDate!.day.toString().padLeft(2, '0')}-${_endDate!.month.toString().padLeft(2, '0')}-${_endDate!.year}', 
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
              const SizedBox(height: 32),

              // Request Media Team
              Row(
                children: [
                  Icon(LucideIcons.camera, size: 16, color: colors.indigo),
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
                activeColor: colors.emerald,
              ),
              const SizedBox(height: 32),

              Consumer(builder: (context, ref, _) {
                final profile = ref.read(currentUserProfileProvider).value;
                final role = profile?['role']?.toString().toLowerCase() ?? 'member';
                return _buildActionLabel(
                  colors,
                  LucideIcons.users,
                  role == 'member' || role == 'guest'
                      ? 'Propose Crew (Pending Admin Approval)'
                      : 'Crew Assignment',
                );
              }),
              const SizedBox(height: 12),
              if (_assignedCrew.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _assignedCrew.map((user) => _buildCrewChip(colors, user)).toList(),
                ),
              if (_assignedCrew.isNotEmpty) const SizedBox(height: 12),
              Consumer(builder: (context, ref, _) {
                final usersAsync = ref.watch(allUsersProvider);
                final deptsAsync = ref.watch(departmentsProvider);

                return usersAsync.when(
                  data: (users) {
                    final departments = deptsAsync.value ?? [];
                    dynamic mediaItDeptId;
                    
                    for (final d in departments) {
                      final name = d.name.toLowerCase();
                      if (name.contains('media') || name.contains('it')) {
                        mediaItDeptId = d.id;
                        break;
                      }
                    }

                    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
                    final filteredUsers = users.where((u) {
                      final userId = u['id'];
                      final userDeptId = u['department_id'];
                      final role = u['role']?.toString().toLowerCase() ?? '';
                       
                      if (role == 'admin' || role == 'super_admin' || role == 'superadmin') return false;

                      if (mediaItDeptId != null && userDeptId.toString() != mediaItDeptId.toString()) {
                        return false;
                      }

                      final isTargetRole = role == 'manager' || role == 'team';
                      if (!isTargetRole) return false;

                      if (_canAssignOthers) return true;
                      if (_canAssignSelf) return userId == currentUserId;
                      
                      // Allow members to propose any target team user
                      final currentUserProfile = ref.read(currentUserProfileProvider).value;
                      final currentUserRole = currentUserProfile?['role']?.toString().toLowerCase() ?? 'member';
                      if (currentUserRole == 'member' || currentUserRole == 'guest') return true;
                      
                      return false;
                    }).toList();

                    if (filteredUsers.isEmpty) {
                      final profile = ref.read(currentUserProfileProvider).value;
                      final role = profile?['role']?.toString().toLowerCase() ?? 'member';
                      String message = 'No team members found';
                      if (role == 'team' && !_canAssignSelf) message = 'Self-assign only on your events';
                      
                      return _buildActionPlaceholder(colors, message, onTap: null);
                    }

                    return _buildActionPlaceholder(
                      colors,
                      '+ Add Team Member',
                      onTap: () => _showCrewPicker(context, filteredUsers),
                    );
                  },
                  loading: () => _buildActionPlaceholder(colors, 'Loading team...'),
                  error: (e, _) => _buildActionPlaceholder(colors, 'Error loading team'),
                );
              }),
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
                  gradient: LinearGradient(colors: [colors.indigo, colors.indigo.withOpacity(0.8)]),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: colors.indigo.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6)),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: () async {
                    if (_titleController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter an event title'))
                      );
                      return;
                    }

                    if (_startDate != null && _startTime != null && _endDate != null && _endTime != null) {
                      final start = DateTime(_startDate!.year, _startDate!.month, _startDate!.day, _startTime!.hour, _startTime!.minute);
                      final end = DateTime(_endDate!.year, _endDate!.month, _endDate!.day, _endTime!.hour, _endTime!.minute);
                      
                      if (end.isBefore(start)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('End date/time cannot be before start date/time'),
                            backgroundColor: colors.error,
                          )
                        );
                        return;
                      }
                    }

                    ref.read(loadingMessageProvider.notifier).state = isEdit ? "Updating Event..." : "Saving Event Details...";
                    ref.read(globalLoadingProvider.notifier).state = true;

                    try {
                      final eventDateStr = _startDate != null 
                          ? '${_startDate!.year}-${_startDate!.month.toString().padLeft(2, '0')}-${_startDate!.day.toString().padLeft(2, '0')}' 
                          : DateTime.now().toIso8601String().split('T')[0];
                      
                      final eventTimeStr = _startTime != null 
                          ? '${_startTime!.hour.toString().padLeft(2, '0')}:${_startTime!.minute.toString().padLeft(2, '0')}' 
                          : '10:00';
                    
                    final newEvent = Event(
                      id: isEdit ? widget.eventToEdit!.id : const Uuid().v4(),
                      title: _titleController.text,
                      time: eventTimeStr,
                      type: 'EVENT',
                      colorValue: colors.indigo.value,
                      date: eventDateStr,
                      location: _locationController.text,
                      description: _createOnBehalfOf ? 'Created on behalf of user' : 'Standard Event',
                      institutionId: _createOnBehalfOf ? _selectedInstitution?.id : null,
                      departmentId: _createOnBehalfOf ? _selectedDepartment?.id : null,
                      onBehalfOf: _createOnBehalfOf ? {
                        'institution_id': _selectedInstitution?.id,
                        'institution_name': _selectedInstitution?.name,
                        'department_id': _selectedDepartment?.id,
                        'department_name': _selectedDepartment?.name,
                      } : null,
                      mediaCoverage: _selectedMedia.toList(),
                      assignedCrew: _assignedCrew.map((u) => {
                        'id': u.id,
                        'full_name': u.fullName,
                        'role': u.role,
                        'avatar_url': u.avatarUrl,
                      }).toList(),
                    );

                      // 1. Add/Update Event
                      if (isEdit) {
                        await ref.read(eventListProvider.notifier).updateEvent(newEvent);
                        ref.read(soundServiceProvider).playSuccess();
                      } else {
                        await ref.read(eventListProvider.notifier).addEvent(newEvent);
                        ref.read(soundServiceProvider).playTaskAdded();
                      }

                      // 2. Auto-generate Tasks if enabled
                      if (_autoTasks) {
                        final eventTitle = _titleController.text;
                        final dueDateStr = eventDateStr;
                        final contextName = _selectedDepartment != null 
                            ? _selectedDepartment!.name 
                            : _selectedInstitution?.name;
                        final contextMeta = jsonEncode({
                          'institution_id': _selectedInstitution?.id,
                          'department_id': _selectedDepartment?.id,
                        });

                        // Preparation Task
                        await ref.read(tasksListProvider.notifier).addTask(Task(
                          id: const Uuid().v4(),
                          title: 'Preparation: $eventTitle',
                          status: 'To Do',
                          priority: 'High',
                          requester: 'System',
                          assignee: 'Media Team',
                          dueDate: dueDateStr,
                          description: 'Equipment prep, script review, and logistical setup for $eventTitle.' + (contextName != null ? '\nContext: $contextName' : ''),
                          attachments: [],
                          eventId: newEvent.id,
                          department: contextName,
                          onBehalfOf: contextMeta,
                        ));

                        // Execution Task
                        await ref.read(tasksListProvider.notifier).addTask(Task(
                          id: const Uuid().v4(),
                          title: 'Execution: $eventTitle',
                          status: 'To Do',
                          priority: 'High',
                          requester: 'System',
                          assignee: 'Media Team',
                          dueDate: dueDateStr,
                          description: 'Live coverage, videography, and photography during the event.' + (contextName != null ? '\nContext: $contextName' : ''),
                          attachments: [],
                          eventId: newEvent.id,
                          department: contextName,
                          onBehalfOf: contextMeta,
                        ));

                        // Post Production Task
                        await ref.read(tasksListProvider.notifier).addTask(Task(
                          id: const Uuid().v4(),
                          title: 'Post Production: $eventTitle',
                          status: 'To Do',
                          priority: 'Medium',
                          requester: 'System',
                          assignee: 'Editing Team',
                          dueDate: dueDateStr,
                          description: 'Editing, color grading, and final delivery of $eventTitle assets.' + (contextName != null ? '\nContext: $contextName' : ''),
                          attachments: [],
                          eventId: newEvent.id,
                          department: contextName,
                          onBehalfOf: contextMeta,
                        ));
                      }

                      await Future.delayed(const Duration(milliseconds: 1500));

                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(isEdit 
                                ? 'Event updated successfully' 
                                : (_autoTasks ? 'Event created with auto-tasks' : 'Event created successfully')),
                            backgroundColor: colors.emerald,
                            behavior: SnackBarBehavior.floating,
                          )
                        );
                        Navigator.pop(context);
                      }
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Error: $e'), backgroundColor: colors.error)
                      );
                    } finally {
                      ref.read(globalLoadingProvider.notifier).state = false;
                    }
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
        spellCheckConfiguration: const SpellCheckConfiguration(),
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
          activeColor: activeColor ?? colors.indigo,
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
          color: isSelected ? colors.indigo.withOpacity(0.1) : colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? colors.indigo : colors.border),
        ),
        child: Row(
          children: [
            Icon(isSelected ? LucideIcons.checkCircle2 : LucideIcons.circle, 
              size: 16, color: isSelected ? colors.indigo : colors.textSecondary.withOpacity(0.3)),
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

  Widget _buildActionPlaceholder(ThemeColors colors, String label, {VoidCallback? onTap, IconData? icon}) {
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
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 18, color: colors.textSecondary.withOpacity(0.5)),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Text(label, style: TextStyle(fontSize: 14, color: colors.textSecondary.withOpacity(0.5))),
            ),
          ],
        ),
      ),
    );
  }

  void _showInstitutionalPicker(BuildContext context, List<Institution> institutions, List<Department> departments) {
    final colors = ref.read(themeColorsProvider);
    String searchQuery = '';
    int localActiveTab = 0; // 0: Institutions, 1: Departments
    
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final isShowingInstitutions = localActiveTab == 0;
          
          final filteredInstitutions = institutions.where((inst) => 
            inst.name.toLowerCase().contains(searchQuery.toLowerCase())).toList();
          final filteredDepartments = departments.where((dept) => 
            dept.name.toLowerCase().contains(searchQuery.toLowerCase())).toList();

          return Container(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
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

                // Search Bar
                Container(
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.border.withOpacity(0.5)),
                  ),
                  child: TextField(
                    onChanged: (value) {
                      setModalState(() => searchQuery = value);
                    },
                    style: TextStyle(color: colors.textPrimary, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Search ${isShowingInstitutions ? 'institutions' : 'departments'}...',
                      hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5)),
                      prefixIcon: Icon(LucideIcons.search, size: 18, color: colors.textSecondary.withOpacity(0.5)),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(16),
                    ),
                  ),
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
                        setModalState(() {
                          localActiveTab = 0;
                        });
                      })),
                      Expanded(child: _buildModalTab(colors, 'Departments', !isShowingInstitutions, () {
                        setModalState(() {
                          localActiveTab = 1;
                        });
                      })),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 40),
                    itemCount: isShowingInstitutions ? filteredInstitutions.length : filteredDepartments.length,
                    itemBuilder: (context, index) {
                      if (isShowingInstitutions) {
                        final inst = filteredInstitutions[index];
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
                        final dept = filteredDepartments[index];
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
          color: isActive ? colors.indigo : Colors.transparent,
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

  void _showCrewPicker(BuildContext context, List<Map<String, dynamic>> rawUsers) {
    final team = rawUsers.map((u) => UserProfile.fromJson(u)).toList();
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
                if (!_assignedCrew.any((u) => u.id == user.id)) {
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
