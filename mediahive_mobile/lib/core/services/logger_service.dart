import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum LogLevel { info, warning, error, sync }

class LogEntry {
  final DateTime timestamp;
  final LogLevel level;
  final String message;
  final String? error;
  final String? stackTrace;

  LogEntry({
    required this.level,
    required this.message,
    this.error,
    this.stackTrace,
  }) : timestamp = DateTime.now();

  @override
  String toString() {
    return '[${timestamp.toIso8601String()}] [${level.name.toUpperCase()}] $message${error != null ? ' | Error: $error' : ''}';
  }
}

class LoggerService extends StateNotifier<List<LogEntry>> {
  static const int _maxLogs = 500;

  LoggerService() : super([]);

  void debug(String message) => _log(LogLevel.info, '[DEBUG] $message');
  void info(String message) => _log(LogLevel.info, message);
  void warning(String message) => _log(LogLevel.warning, message);
  void warn(String message) => warning(message);
  void error(String message, [Object? error, StackTrace? stackTrace]) => 
      _log(LogLevel.error, message, error?.toString(), stackTrace?.toString());
  void sync(String message) => _log(LogLevel.sync, message);

  void _log(LogLevel level, String message, [String? error, String? stackTrace]) {
    final entry = LogEntry(
      level: level,
      message: message,
      error: error,
      stackTrace: stackTrace,
    );
    
    // Always print to console in debug mode
    debugPrint(entry.toString());
    
    // Use Future.microtask to avoid "Provider modification violation" 
    // if this is called during a widget's build phase.
    Future.microtask(() {
      if (mounted) {
        state = [entry, ...state].take(_maxLogs).toList();
      }
    });
  }

  void clear() => state = [];
}

final loggerProvider = StateNotifierProvider<LoggerService, List<LogEntry>>((ref) {
  return LoggerService();
});

final loggerServiceProvider = Provider<LoggerService>((ref) {
  return ref.watch(loggerProvider.notifier);
});
