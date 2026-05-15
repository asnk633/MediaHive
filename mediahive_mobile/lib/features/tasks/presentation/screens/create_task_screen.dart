import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../../core/theme_provider.dart';
import '../../../../../core/design_tokens.dart';
import '../providers/tasks_provider.dart';
import '../../../../../providers/institutional_provider.dart';
import '../../../../../models/institutional_data.dart';
import '../../domain/models/task.dart';

final _institutionalTabProvider = StateProvider<int>((ref) => 0); // 0: Institutions, 1: Departments

class CreateTaskScreen extends ConsumerStatefulWidget {
  const CreateTaskScreen({super.key});

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
  final List<UserProfile> _assignedCrew = [];

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);

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
                        'Create New Task',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: colors.textPrimary),
                      ),
                      Text(
                        'Assign accountability and track progress',
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
                    _buildSectionLabel(colors, 'Task Title'),
                    const SizedBox(height: 12),
                    _buildTextField(colors, _titleController, 'What needs to be done?', LucideIcons.checkCircle),
                    const SizedBox(height: 24),

                    _buildSectionLabel(colors, 'Description'),
                    const SizedBox(height: 12),
                    _buildTextField(colors, _descriptionController, 'Add specific details...', LucideIcons.alignLeft, maxLines: 4),
                    const SizedBox(height: 24),

                    Row(
                      children: [
                        Expanded(child: _buildDateTimePicker(
                          colors, 
                          'Due Date', 
                          _dueDate == null ? 'Pick date' : '${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}', 
                          LucideIcons.calendar,
                          onTap: () => _selectDate(context),
                        )),
                        const SizedBox(width: 16),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildSectionLabel(colors, 'Priority'),
                            const SizedBox(height: 12),
                            _buildDropdown(
                              colors, 
                              _priority, 
                              LucideIcons.flag,
                              onTap: () => _showPriorityPicker(context),
                            ),
                          ],
                        )),
                      ],
                    ),
                    const SizedBox(height: 24),

                    _buildSectionLabel(colors, 'Context'),
                    const SizedBox(height: 12),
                    () {
                      final deptsAsync = ref.watch(departmentsProvider);
                      final instsAsync = ref.watch(institutionsProvider);
                      
                      return _buildDropdown(
                        colors, 
                        _selectedDepartment?.name ?? _selectedInstitution?.name ?? 'Select Context', 
                        LucideIcons.briefcase,
                        onTap: () => _showInstitutionalPicker(
                          context, 
                          instsAsync.value ?? [],
                          deptsAsync.value ?? [],
                        ),
                      );
                    }(),
                    const SizedBox(height: 32),

                    Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF6366F1)]),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: ElevatedButton(
                        onPressed: _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text(
                          'Create Task',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleSubmit() {
    if (_titleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title required')));
      return;
    }

    final newTask = Task(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: _titleController.text,
      status: 'To Do',
      priority: _priority,
      requester: 'Super Admin',
      assignee: 'Unassigned',
      dueDate: _dueDate?.toIso8601String().split('T')[0] ?? DateTime.now().toIso8601String().split('T')[0],
      description: _descriptionController.text,
    );

    ref.read(tasksListProvider.notifier).addTask(newTask);
    Navigator.pop(context);
  }

  void _selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2101),
    );
    if (picked != null) setState(() => _dueDate = picked);
  }

  void _showPriorityPicker(BuildContext context) {
    final priorities = ['Low', 'Medium', 'High', 'Urgent'];
    final colors = ref.read(themeColorsProvider);
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
      builder: (context) => ListView(
        shrinkWrap: true,
        children: priorities.map((p) => ListTile(
          title: Text(p, style: TextStyle(color: colors.textPrimary)),
          onTap: () {
            setState(() => _priority = p);
            Navigator.pop(context);
          },
        )).toList(),
      ),
    );
  }

  void _showInstitutionalPicker(BuildContext context, List<Institution> institutions, List<Department> departments) {
    final colors = ref.read(themeColorsProvider);
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.backgroundPrimary,
      builder: (context) => ListView(
        children: [
          ...institutions.map((i) => ListTile(
            title: Text(i.name, style: TextStyle(color: colors.textPrimary)),
            onTap: () {
              setState(() { _selectedInstitution = i; _selectedDepartment = null; });
              Navigator.pop(context);
            },
          )),
          ...departments.map((d) => ListTile(
            title: Text(d.name, style: TextStyle(color: colors.textPrimary)),
            onTap: () {
              setState(() { _selectedDepartment = d; _selectedInstitution = null; });
              Navigator.pop(context);
            },
          )),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(ThemeColors colors, String label) {
    return Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: colors.textPrimary));
  }

  Widget _buildTextField(ThemeColors colors, TextEditingController controller, String hint, IconData icon, {int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: colors.border)),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: TextStyle(color: colors.textPrimary),
        decoration: InputDecoration(hintText: hint, prefixIcon: Icon(icon, size: 18), border: InputBorder.none, contentPadding: const EdgeInsets.all(16)),
      ),
    );
  }

  Widget _buildDateTimePicker(ThemeColors colors, String label, String hint, IconData icon, {VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(colors, label),
        const SizedBox(height: 12),
        GestureDetector(onTap: onTap, child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: colors.border)), child: Row(children: [Icon(icon, size: 18), const SizedBox(width: 12), Text(hint, style: TextStyle(color: colors.textPrimary))]))),
      ],
    );
  }

  Widget _buildDropdown(ThemeColors colors, String text, IconData icon, {VoidCallback? onTap}) {
    return GestureDetector(onTap: onTap, child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: colors.border)), child: Row(children: [Icon(icon, size: 18), const SizedBox(width: 12), Expanded(child: Text(text, style: TextStyle(color: colors.textPrimary))), const Icon(LucideIcons.chevronDown, size: 16)])));
  }
}
