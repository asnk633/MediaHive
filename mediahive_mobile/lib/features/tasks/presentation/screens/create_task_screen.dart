import 'dart:io';
import 'dart:ui';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:uuid/uuid.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/theme_provider.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/providers/user_provider.dart' hide institutionsProvider, departmentsProvider;
import '../../../../core/services/media_service.dart';
import '../../../../core/services/upload_service.dart';
import '../../../../core/models/upload_mutation.dart';
import '../providers/tasks_provider.dart';
import '../../../../core/providers/ui_providers.dart';
import '../../../../models/institutional_data.dart';
import '../../../../providers/institutional_provider.dart';
import '../../domain/models/task.dart';
import '../../../calendar/presentation/providers/events_provider.dart';
import '../../../calendar/domain/models/event.dart';
import '../../../../core/providers/labs_provider.dart';
import '../../../../core/services/sound_service.dart';


class CreateTaskScreen extends ConsumerStatefulWidget {
  final Task? taskToEdit;
  const CreateTaskScreen({super.key, this.taskToEdit});

  @override
  ConsumerState<CreateTaskScreen> createState() => _CreateTaskScreenState();
}

class _CreateTaskScreenState extends ConsumerState<CreateTaskScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  DateTime? _dueDate;
  String _priority = 'Medium';
  
  Department? _selectedDepartment;
  Institution? _selectedInstitution;
  
  List<String> _assignedUserIds = [];
  String? _selectedEventId;
  bool _isDemoData = false;

  File? _selectedFile;
  bool _isCompressing = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.taskToEdit?.title);
    _descriptionController = TextEditingController(text: widget.taskToEdit?.description);
    _dueDate = widget.taskToEdit?.dueDate != null ? DateTime.tryParse(widget.taskToEdit!.dueDate) : null;
    final String p = widget.taskToEdit?.priority.toLowerCase() ?? '';
    _priority = p == 'low' ? 'Low' : p == 'high' ? 'High' : 'Medium';
    _selectedEventId = widget.taskToEdit?.eventId;
    
    _isDemoData = widget.taskToEdit?.onBehalfOf?.contains('"is_demo":true') ?? false;
    
    // Resolve assignee and context in background
    Future.microtask(() async {
      if (!mounted) return;
      
      // 1. Resolve Assignee IDs from names or metadata
      if (widget.taskToEdit != null && widget.taskToEdit!.assignee != 'Unassigned') {
        List<String> loadedIds = [];
        
        // 1. Try to parse exact IDs from the injected metadata (this is now the most accurate source of truth)
        if (widget.taskToEdit!.onBehalfOf != null && widget.taskToEdit!.onBehalfOf!.startsWith('{')) {
          try {
            final metadata = jsonDecode(widget.taskToEdit!.onBehalfOf!);
            if (metadata['assignee_ids'] != null) {
              loadedIds = List<String>.from(metadata['assignee_ids']);
            } else if (metadata['assignee_id'] != null) {
              // Legacy single assignment fallback
              // Don't just use this if there are multiple comma separated names!
              if (!widget.taskToEdit!.assignee.contains(',')) {
                loadedIds = [metadata['assignee_id']];
              }
            }
          } catch (_) {}
        }

        // 2. Fallback to name parsing if metadata was empty or legacy metadata was ignored
        if (loadedIds.isEmpty) {
          try {
            final allUsers = await ref.read(allUsersProvider.future);
            final names = widget.taskToEdit!.assignee
                .replaceAll('Proposed: ', '')
                .split(',')
                .map((e) => e.trim())
                .toList();
            for (var name in names) {
              final matchingUsers = allUsers.cast<Map<String, dynamic>?>().where(
                (u) => u?['full_name'] == name
              );
              for (var user in matchingUsers) {
                if (user != null) {
                  loadedIds.add(user['id'] as String);
                }
              }
            }
          } catch (e) {
            print('[CREATE_TASK] Error loading users for assignee fallback: $e');
          }
        }
        
        if (loadedIds.isNotEmpty) {
          if (mounted) setState(() => _assignedUserIds = loadedIds);
        }
      }

      // 2. Resolve Institutional Context
      final allInsts = await ref.read(institutionsProvider.future);
      final allDepts = await ref.read(departmentsProvider.future);
      
      // If editing, try to extract from metadata first
      if (widget.taskToEdit != null && widget.taskToEdit!.onBehalfOf != null && widget.taskToEdit!.onBehalfOf!.startsWith('{')) {
        try {
          final metadata = jsonDecode(widget.taskToEdit!.onBehalfOf!);
          final instId = metadata['institution_id'];
          final deptId = metadata['department_id'];
          
          if (instId != null) {
            try {
              final inst = allInsts.firstWhere((i) => i.id.toString() == instId.toString());
              setState(() => _selectedInstitution = inst);
            } catch (_) {}
          }
          if (deptId != null) {
            try {
              final dept = allDepts.firstWhere((d) => d.id.toString() == deptId.toString());
              setState(() => _selectedDepartment = dept);
            } catch (_) {}
          }
        } catch (e) {
          print('[CREATE_TASK] Error parsing task metadata: $e');
        }
      }

      // Enforce mutual exclusivity for loaded context (prefer department if both exist)
      if (_selectedDepartment != null && _selectedInstitution != null) {
        setState(() => _selectedInstitution = null);
      }

      // If still null, default to current user's profile context (mutually exclusive)
      if (_selectedDepartment == null && _selectedInstitution == null) {
        final profile = await ref.read(currentUserProfileProvider.future);
        if (profile != null) {
          if (profile['department_id'] != null) {
            final deptId = profile['department_id'].toString();
            try {
              final dept = allDepts.firstWhere((d) => d.id.toString() == deptId);
              setState(() {
                _selectedDepartment = dept;
                _selectedInstitution = null;
              });
            } catch (_) {}
          } else if (profile['institution_id'] != null) {
            final instId = profile['institution_id'].toString();
            try {
              final inst = allInsts.firstWhere((i) => i.id.toString() == instId);
              setState(() {
                _selectedInstitution = inst;
                _selectedDepartment = null;
              });
            } catch (_) {}
          }
        }
      }
    });
  }

  bool get _isEditingAllowed {
    if (widget.taskToEdit == null) return true;
    
    final profile = ref.read(currentUserProfileProvider).value;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    
    if (role == 'admin' || role == 'manager') return true;
    
    // For others, only if they created it
    return widget.taskToEdit?.createdBy == currentUserId;
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
      // Team user can assign themselves to tasks they created
      final currentUserId = Supabase.instance.client.auth.currentUser?.id;
      if (widget.taskToEdit == null) return true;
      return widget.taskToEdit?.createdBy == currentUserId;
    }
    return false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final mediaService = ref.read(mediaServiceProvider);
    
    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: ref.read(themeColorsProvider).backgroundSecondary,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(LucideIcons.camera, color: Color(0xFF3B82F6)),
              title: const Text('Capture Photo (Camera)', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final image = await mediaService.capturePhoto();
                if (image != null) {
                  final cropped = await mediaService.cropImage(image);
                  if (cropped == null) return;
                  
                  setState(() => _isCompressing = true);
                  final compressed = await mediaService.compressImage(cropped);
                  setState(() {
                    _selectedFile = compressed;
                    _isCompressing = false;
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image, color: Color(0xFF3B82F6)),
              title: const Text('Add Image (Compressed)', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final image = await mediaService.pickImage();
                if (image != null) {
                  final cropped = await mediaService.cropImage(image);
                  if (cropped == null) return;
                  
                  setState(() => _isCompressing = true);
                  final compressed = await mediaService.compressImage(cropped);
                  setState(() {
                    _selectedFile = compressed;
                    _isCompressing = false;
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.video, color: Color(0xFF3B82F6)),
              title: const Text('Add a Video', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final video = await mediaService.pickVideo();
                if (video != null) {
                  setState(() {
                    _selectedFile = video;
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.fileText, color: Color(0xFF3B82F6)),
              title: const Text('Add Document / Raw File', style: TextStyle(color: Colors.white)),
              onTap: () async {
                Navigator.pop(context);
                final file = await mediaService.pickDocument();
                if (file != null) {
                  setState(() {
                    _selectedFile = file;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Task Title is required')));
      return;
    }

    final taskId = const Uuid().v4();
    final profileAsync = ref.read(currentUserProfileProvider);
    final currentUserFullName = profileAsync.maybeWhen(
      data: (p) => p?['full_name'] as String? ?? 'Super Admin',
      orElse: () => 'Super Admin',
    );

    String assigneeName = 'Unassigned';
    if (_assignedUserIds.isNotEmpty) {
      final allUsers = ref.read(allUsersProvider).value ?? [];
      final assignedUsers = allUsers.where((u) => _assignedUserIds.contains(u['id'])).toList();
      assigneeName = assignedUsers.map((u) => u['full_name'] ?? 'Assigned User').join(', ');
    }

    // Encode extra metadata for the sync engine to handle relational IDs
    final Map<String, dynamic> metadata = {
      'assignee_ids': _assignedUserIds,
      'institution_id': _selectedInstitution?.id,
      'department_id': _selectedDepartment?.id,
    };
    final String metadataJson = jsonEncode(metadata);

    final taskToSave = widget.taskToEdit != null
        ? widget.taskToEdit!.copyWith(
            title: _titleController.text + (_isDemoData ? ' (DEMO)' : ''),
            priority: _priority,
            assignee: assigneeName,
            description: _descriptionController.text,
            dueDate: _dueDate?.toIso8601String().split('T')[0] ?? widget.taskToEdit!.dueDate,
            onBehalfOf: metadataJson,
            eventId: _selectedEventId,
            department: _selectedDepartment != null ? _selectedDepartment!.name : _selectedInstitution?.name,
          )
        : Task(
            id: taskId,
            title: _titleController.text + (_isDemoData ? ' (DEMO)' : ''),
            status: 'To Do',
            priority: _priority,
            requester: currentUserFullName,
            assignee: assigneeName,
            description: _descriptionController.text,
            dueDate: _dueDate?.toIso8601String().split('T')[0] ?? DateTime.now().toIso8601String().split('T')[0],
            onBehalfOf: metadataJson,
            eventId: _selectedEventId,
            attachments: [],
            department: _selectedDepartment != null ? _selectedDepartment!.name : _selectedInstitution?.name,
          );

    setState(() => _isLoading = true);
    ref.read(loadingMessageProvider.notifier).state = "Finalizing Task Details...";
    ref.read(globalLoadingProvider.notifier).state = true;

    try {
      if (!_isEditingAllowed) {
        throw Exception('You do not have permission to edit this task.');
      }

      if (widget.taskToEdit != null) {
        await ref.read(tasksListProvider.notifier).updateTask(taskToSave);
        ref.read(soundServiceProvider).playSuccess();
      } else {
        await ref.read(tasksListProvider.notifier).addTask(taskToSave);
        ref.read(soundServiceProvider).playTaskAdded();
      }

      if (_selectedFile != null) {
        final ext = _selectedFile!.path.split('.').last.toLowerCase();
        final uploadMutation = UploadMutation(
          id: const Uuid().v4(),
          filePath: _selectedFile!.path,
          bucketName: 'task-attachments',
          destinationPath: 'tasks/$taskId/attachment.$ext',
          metadata: {'taskId': taskId},
          timestamp: DateTime.now(),
        );
        ref.read(uploadServiceProvider).queueUpload(uploadMutation);
      }
      
      // Artificial delay to let the beautiful sync animation be seen
      await Future.delayed(const Duration(milliseconds: 1500));
      
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
      ref.read(globalLoadingProvider.notifier).state = false;
    }
  }

  Future<void> _confirmDelete(BuildContext context, ThemeColors colors) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.backgroundSecondary,
        title: Text('Delete Task', style: AppTypography.h3.copyWith(color: colors.error, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to permanently delete this task? This action cannot be undone.', style: AppTypography.bodyM.copyWith(color: colors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: colors.error),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);
      ref.read(loadingMessageProvider.notifier).state = "Deleting Task...";
      ref.read(globalLoadingProvider.notifier).state = true;

      try {
        await ref.read(tasksListProvider.notifier).deleteTask(widget.taskToEdit!.id);
        if (mounted) {
          Navigator.pop(context); // Pop create/edit screen
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
        ref.read(globalLoadingProvider.notifier).state = false;
      }
    }
  }

  void _selectDate(BuildContext context, ThemeColors colors) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2101),
      builder: (context, child) {
        return Theme(
          data: colors.isDark
              ? ThemeData.dark().copyWith(
                  colorScheme: ColorScheme.dark(
                    primary: colors.indigo,
                    onPrimary: Colors.white,
                    surface: colors.surface,
                    onSurface: colors.textPrimary,
                  ),
                )
              : ThemeData.light().copyWith(
                  colorScheme: ColorScheme.light(
                    primary: colors.indigo,
                    onPrimary: Colors.white,
                    surface: Colors.white,
                    onSurface: colors.textPrimary,
                  ),
                ),
          child: child!,
        );
      },
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  void _showInstitutionalPicker(BuildContext context, List<Institution> institutions, List<Department> departments, ThemeColors colors) {
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
                    Text('Select Context', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
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
                    color: colors.isDark ? colors.surface : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.border),
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
                    color: colors.isDark ? colors.surface : colors.border.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(child: _buildModalTab('Institutions', isShowingInstitutions, colors, () {
                        setModalState(() {
                          localActiveTab = 0;
                        });
                      })),
                      Expanded(child: _buildModalTab('Departments', !isShowingInstitutions, colors, () {
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

  Widget _buildModalTab(String label, bool isActive, ThemeColors colors, VoidCallback onTap) {
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

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final labsState = ref.watch(labsProvider);
    final testDemoDataEnabled = labsState['testDemoData'] ?? false;
    final profile = ref.watch(currentUserProfileProvider).valueOrNull;
    final currentUserId = profile?['id'] as String?;
    final currentUserFullName = profile?['full_name'] as String?;
    final role = profile?['role']?.toString().toLowerCase() ?? 'member';

    final isAdminOrManager = role == 'admin' || role == 'manager' || role == 'super_admin' || role == 'super admin';
    final isCreator = widget.taskToEdit != null && (
      (currentUserId != null && widget.taskToEdit!.createdBy == currentUserId) ||
      (currentUserFullName != null && widget.taskToEdit!.requester == currentUserFullName)
    );

    final canDelete = isAdminOrManager || isCreator;

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
              widget.taskToEdit != null ? 'Edit Task' : 'Create New Task', 
              style: AppTypography.h3.copyWith(color: colors.textPrimary, fontWeight: FontWeight.w900),
            ),
            Text(
              widget.taskToEdit != null ? 'Update task details and assignments' : 'Assign accountability and track progress', 
              style: AppTypography.caption.copyWith(color: colors.textSecondary, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          if (widget.taskToEdit != null && canDelete)
            IconButton(
              icon: Icon(LucideIcons.trash2, color: colors.error),
              tooltip: 'Delete Task',
              onPressed: () => _confirmDelete(context, colors),
            ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colors.backgroundSecondary,
              colors.backgroundPrimary,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(top: 120, left: 24, right: 24, bottom: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionLabel('Task Title', colors),
              const SizedBox(height: 8),
              _buildTextField(_titleController, 'What needs to be done?', LucideIcons.checkCircle, colors, enabled: _isEditingAllowed),
              const SizedBox(height: 24),

              _buildSectionLabel('Description', colors),
              const SizedBox(height: 8),
              _buildTextField(_descriptionController, 'Add details...', null, colors, maxLines: 5, enabled: _isEditingAllowed),
              const SizedBox(height: 24),

              Row(
                children: [
                  Expanded(
                    child: _buildDateTimePicker(
                      'DUE DATE', 
                      _dueDate == null ? 'Select date' : '${_dueDate!.day.toString().padLeft(2, '0')}-${_dueDate!.month.toString().padLeft(2, '0')}-${_dueDate!.year}', 
                      LucideIcons.calendar,
                      colors,
                      onTap: _isEditingAllowed ? () => _selectDate(context, colors) : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              _buildSectionLabel('Context (Institution & Department)', colors),
              const SizedBox(height: 8),
              _buildInstitutionalContextSelector(colors),
              const SizedBox(height: 24),

              _buildSectionLabel('Linked Event (Institutional Roadmap)', colors),
              const SizedBox(height: 8),
              _buildEventSelector(colors),
              const SizedBox(height: 24),

              _buildSectionLabel('Priority', colors),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _buildPrioritySegment('Low', colors)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildPrioritySegment('Medium', colors)),
                  const SizedBox(width: 8),
                  Expanded(child: _buildPrioritySegment('High', colors)),
                ],
              ),
              const SizedBox(height: 32),

              _buildSectionLabel(
                role == 'member' || role == 'guest'
                    ? 'Propose Assignee (Pending Admin Approval)'
                    : 'Assign To Team Members',
                colors,
              ),
              const SizedBox(height: 12),
              _buildAssigneesList(colors),
              const SizedBox(height: 32),

              _buildSectionLabel('Attachments (Optional)', colors),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: (_isCompressing || !_isEditingAllowed) ? null : _pickFile,
                child: Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: colors.isDark ? colors.surface.withOpacity(0.3) : Colors.white.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: colors.isDark 
                          ? colors.border.withOpacity(0.5) 
                          : colors.border.withOpacity(0.15), 
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: _selectedFile != null
                      ? () {
                          final ext = _selectedFile!.path.split('.').last.toLowerCase();
                          final isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(ext);
                          final isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].contains(ext);
                          final isPdf = ext == 'pdf';
                          final fileName = _selectedFile!.path.split(Platform.pathSeparator).last;

                          if (isImage) {
                            return Stack(
                              fit: StackFit.expand,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Image.file(_selectedFile!, fit: BoxFit.cover),
                                ),
                                if (_isEditingAllowed)
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _selectedFile = null;
                                        });
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: const BoxDecoration(
                                          color: Colors.black54,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(LucideIcons.x, size: 14, color: Colors.white),
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          }

                          return Container(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: colors.border.withOpacity(0.3),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    isPdf
                                        ? LucideIcons.fileText
                                        : isVideo
                                            ? LucideIcons.video
                                            : LucideIcons.file,
                                    color: colors.indigo,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        fileName,
                                        style: TextStyle(
                                          color: colors.textPrimary,
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        ext.toUpperCase(),
                                        style: TextStyle(
                                          color: colors.textSecondary,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (_isEditingAllowed)
                                  IconButton(
                                    icon: Icon(LucideIcons.trash2, color: Colors.redAccent.withOpacity(0.8), size: 18),
                                    onPressed: () {
                                      setState(() {
                                        _selectedFile = null;
                                      });
                                    },
                                  ),
                              ],
                            ),
                          );
                        }()
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: colors.isDark ? colors.border.withOpacity(0.3) : colors.border.withOpacity(0.08), 
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _isCompressing ? LucideIcons.loader2 : LucideIcons.paperclip,
                                color: colors.indigo,
                                size: 20,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _isCompressing ? 'Compressing...' : 'Click or tap to upload files',
                              style: TextStyle(color: colors.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 32),

              Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: colors.isDark ? colors.surface : Colors.white, 
                      shape: BoxShape.circle, 
                      border: Border.all(color: colors.border),
                    ),
                    child: Center(
                      child: Text(
                        'S', 
                        style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Consumer(
                    builder: (context, ref, _) {
                      final profileAsync = ref.watch(currentUserProfileProvider);
                      final role = profileAsync.maybeWhen(data: (p) => p?['role'] as String? ?? 'Admin', orElse: () => 'Admin');
                      return Text('Creating as $role', style: TextStyle(color: colors.textSecondary, fontSize: 12));
                    }
                  ),
                ],
              ),
               if (testDemoDataEnabled) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colors.isDark ? colors.surface : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: colors.honey.withOpacity(0.1), shape: BoxShape.circle),
                            child: Icon(LucideIcons.penTool, color: colors.honey, size: 16),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Test / Demo Data', style: AppTypography.bodyM.copyWith(color: colors.textPrimary, fontWeight: FontWeight.bold)),
                              Text('EXCLUDE FROM OFFICIAL REPORTS', style: AppTypography.caption.copyWith(color: colors.honey, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 0.5)),
                            ],
                          ),
                        ],
                      ),
                      Switch(
                        value: _isDemoData,
                        onChanged: _isEditingAllowed ? (val) => setState(() => _isDemoData = val) : null,
                        activeColor: Colors.white,
                        activeTrackColor: colors.honey,
                        inactiveThumbColor: colors.textSecondary,
                        inactiveTrackColor: colors.isDark ? colors.border : colors.border.withOpacity(0.2),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],

              Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [colors.indigo, colors.indigo.withOpacity(0.8)]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ElevatedButton(
                  onPressed: (_isEditingAllowed && !_isLoading) ? _handleSubmit : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    disabledBackgroundColor: Colors.white12,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    !_isEditingAllowed ? 'READ ONLY' : (widget.taskToEdit != null ? 'Update Task' : 'Create Task'),
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

  Widget _buildPrioritySegment(String level, ThemeColors colors) {
    final isSelected = _priority == level;
    final color = level == 'Low' ? colors.textSecondary : level == 'Medium' ? colors.honey : colors.error;
    
    return GestureDetector(
      onTap: _isEditingAllowed ? () => setState(() => _priority = level) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.15) : (colors.isDark ? colors.surface : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? color.withOpacity(0.5) : colors.border),
        ),
        alignment: Alignment.center,
        child: Text(
          level,
          style: TextStyle(
            color: isSelected ? color : colors.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildAssigneesList(ThemeColors colors) {
    final usersAsync = ref.watch(allUsersProvider);
    final deptsAsync = ref.watch(departmentsProvider);
    
    return usersAsync.when(
      data: (users) {
        // Filter users for IT & Media department
        Department? mediaItDept;
        for (final d in (deptsAsync.value ?? [])) {
          final name = d.name.toLowerCase();
          if (name.contains('media') || name.contains('it')) {
            mediaItDept = d;
            break;
          }
        }
        
        var filteredUsers = users;
        if (mediaItDept != null) {
          final deptId = mediaItDept.id;
          final currentUserId = Supabase.instance.client.auth.currentUser?.id;

          filteredUsers = users.where((u) {
            final userId = u['id'];
            final userDeptId = u['department_id'];
            final role = u['role']?.toString().toLowerCase() ?? '';
            
            // Core filter: Media/IT department and operational roles (excluding Admin)
            final isTargetRole = role == 'manager' || role == 'team';
            if (userDeptId != deptId || !isTargetRole) return false;

            // Apply specific assignment rules
            if (_canAssignOthers) return true;
            if (_canAssignSelf) return userId == currentUserId;
            
            // Allow members to propose any target team user
            final currentUserProfile = ref.read(currentUserProfileProvider).value;
            final currentUserRole = currentUserProfile?['role']?.toString().toLowerCase() ?? 'member';
            if (currentUserRole == 'member' || currentUserRole == 'guest') return true;
            
            return false;
          }).toList();
        }

        if (filteredUsers.isEmpty) {
          final profile = ref.read(currentUserProfileProvider).value;
          final role = profile?['role']?.toString().toLowerCase() ?? 'member';
          String message = 'No team members found';
          if (role == 'team' && !_canAssignSelf) message = 'You can only assign yourself to tasks they created';
          
          return Text(message, style: TextStyle(color: colors.textSecondary, fontSize: 13));
        }
        
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: filteredUsers.map((user) {
            final isSelected = _assignedUserIds.contains(user['id']);
            return GestureDetector(
              onTap: () => setState(() {
                if (isSelected) {
                  _assignedUserIds.remove(user['id']);
                } else {
                  _assignedUserIds.add(user['id']);
                }
              }),
              child: Container(
                width: MediaQuery.of(context).size.width / 2 - 32,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? (colors.isDark ? colors.surface : Colors.white) : (colors.isDark ? colors.surface.withOpacity(0.4) : colors.border.withOpacity(0.06)),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? colors.indigo.withOpacity(0.5) : colors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        shape: BoxShape.rectangle,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: isSelected ? colors.indigo : colors.textSecondary, width: 1.5),
                        color: isSelected ? colors.indigo : Colors.transparent,
                      ),
                      child: isSelected ? const Icon(LucideIcons.check, size: 12, color: Colors.white) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        user['full_name'] ?? 'Unknown',
                        style: TextStyle(
                          color: isSelected ? colors.textPrimary : colors.textSecondary,
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Text('Error: $e', style: TextStyle(color: colors.error)),
    );
  }

  Widget _buildSectionLabel(String label, ThemeColors colors) {
    return Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: colors.textSecondary));
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData? icon, ThemeColors colors, {int maxLines = 1, bool enabled = true}) {
    return Container(
      decoration: BoxDecoration(
        color: colors.isDark ? colors.surface : Colors.white, 
        borderRadius: BorderRadius.circular(16), 
        border: Border.all(color: colors.border),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        enabled: enabled,
        spellCheckConfiguration: const SpellCheckConfiguration(),
        style: TextStyle(color: enabled ? colors.textPrimary : colors.textSecondary),
        decoration: InputDecoration(
          hintText: hint, 
          hintStyle: TextStyle(color: colors.textSecondary.withOpacity(0.5)),
          prefixIcon: icon != null ? Icon(icon, size: 18, color: colors.textSecondary.withOpacity(0.5)) : null, 
          border: InputBorder.none, 
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildDateTimePicker(String label, String hint, IconData icon, ThemeColors colors, {VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(label, colors),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap, 
          child: Container(
            padding: const EdgeInsets.all(16), 
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface : Colors.white, 
              borderRadius: BorderRadius.circular(12), 
              border: Border.all(color: colors.border),
            ), 
            child: Row(
              children: [
                Icon(icon, size: 16, color: colors.indigo), 
                const SizedBox(width: 12), 
                Text(hint, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInstitutionalContextSelector(ThemeColors colors) {
    return Consumer(builder: (context, ref, _) {
      final instsAsync = ref.watch(institutionsProvider);
      final deptsAsync = ref.watch(departmentsProvider);
      final isLoading = instsAsync.isLoading || deptsAsync.isLoading;

      return GestureDetector(
        onTap: (isLoading || !_isEditingAllowed) ? null : () {
          final insts = instsAsync.value ?? [];
          final depts = deptsAsync.value ?? [];
          _showInstitutionalPicker(context, insts, depts, colors);
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.isDark ? colors.surface : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border),
          ),
          child: Row(
            children: [
              Icon(LucideIcons.building2, size: 18, color: colors.textSecondary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isLoading 
                      ? 'Loading contexts...' 
                      : (_selectedDepartment != null 
                          ? _selectedDepartment!.name
                          : (_selectedInstitution != null ? _selectedInstitution!.name : '+ Select Institution or Department')),
                  style: TextStyle(color: colors.textPrimary, fontSize: 14),
                ),
              ),
              Icon(LucideIcons.chevronDown, size: 16, color: colors.textSecondary),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildEventSelector(ThemeColors colors) {
    final eventsAsync = ref.watch(eventListProvider);
    
    return eventsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Text('Error: $e'),
      data: (events) {
        final selectedEvent = _selectedEventId != null 
            ? events.firstWhere((e) => e.id == _selectedEventId, orElse: () => events.first) 
            : null;

        return GestureDetector(
          onTap: !_isEditingAllowed ? null : () => _showEventPicker(context, events, colors),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.isDark ? colors.surface : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.calendar, size: 18, color: colors.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    selectedEvent?.title ?? '+ Link to Institutional Event',
                    style: TextStyle(
                      color: selectedEvent != null ? colors.textPrimary : colors.textSecondary.withOpacity(0.5),
                      fontSize: 14,
                    ),
                  ),
                ),
                if (_selectedEventId != null)
                  GestureDetector(
                    onTap: () => setState(() => _selectedEventId = null),
                    child: Icon(LucideIcons.xCircle, size: 16, color: colors.error),
                  )
                else
                  Icon(LucideIcons.chevronDown, size: 16, color: colors.textSecondary),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showEventPicker(BuildContext context, List<Event> events, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('SELECT EVENT', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                itemCount: events.length,
                itemBuilder: (context, index) {
                  final event = events[index];
                  return ListTile(
                    title: Text(event.title, style: AppTypography.bodyS.copyWith(color: colors.textPrimary)),
                    subtitle: Text(event.date, style: AppTypography.caption.copyWith(color: colors.textSecondary)),
                    onTap: () {
                      setState(() => _selectedEventId = event.id);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
