import 'package:flutter/material.dart';
import 'package:flutter/widget_previews.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/tasks/presentation/screens/tasks_screen.dart';
import 'features/tasks/presentation/screens/create_task_screen.dart';

/// Standard mobile device dimensions for previewing.
const Size mobileSize = Size(390, 844);

/// Wrapper to provide the necessary ProviderScope for Riverpod-dependent widgets.
Widget previewWrapper(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      home: Scaffold(body: child),
    ),
  );
}

@Preview(
  name: 'Tasks Dashboard (Mobile)', 
  wrapper: previewWrapper,
  size: mobileSize,
)
Widget previewTasksScreen() => const TasksScreen();

@Preview(
  name: 'Create Task Screen (Mobile)', 
  wrapper: previewWrapper,
  size: mobileSize,
)
Widget previewCreateTaskScreen() => const CreateTaskScreen();

@Preview(name: 'Simple Text')
Widget simplePreview() => const Text('Hello World');
