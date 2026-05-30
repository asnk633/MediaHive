import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'logger_service.dart';
import 'sound_service.dart';

enum RealtimeEvent { updated }

class RealtimeService extends WidgetsBindingObserver {
  final SupabaseClient _supabase;
  final Map<String, RealtimeChannel> _channels = {};
  final Map<String, StreamController<RealtimeEvent>> _controllers = {};
  final LoggerService _logger;
  final Ref _ref;

  RealtimeService(this._supabase, this._logger, this._ref) {
    WidgetsBinding.instance.addObserver(this);
  }

  Stream<RealtimeEvent> getTableStream(String table) {
    if (!_controllers.containsKey(table)) {
      _controllers[table] = StreamController<RealtimeEvent>.broadcast();
      _subscribeToTable(table);
    }
    return _controllers[table]!.stream;
  }

  void _subscribeToTable(String table) {
    if (_channels.containsKey(table)) return;

    _logger.info('Subscribing to realtime table: $table');
    
    final channel = _supabase
        .channel('public:$table')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: table,
          callback: (payload) {
            _logger.debug('Realtime event received for $table: ${payload.eventType}');
            
            // Execute real-time sound sync triggers
            try {
              final currentUserId = _supabase.auth.currentUser?.id;
              final soundService = _ref.read(soundServiceProvider);

              if (table == 'tasks') {
                if (payload.eventType == PostgresChangeEvent.insert) {
                  final createdBy = payload.newRecord['created_by']?.toString();
                  if (currentUserId == null || createdBy != currentUserId) {
                    soundService.playTaskAdded();
                  }
                } else if (payload.eventType == PostgresChangeEvent.update) {
                  final newStatus = payload.newRecord['status']?.toString().toLowerCase();
                  final oldStatus = payload.oldRecord['status']?.toString().toLowerCase();
                  if (newStatus == 'done' && oldStatus != 'done') {
                    soundService.playSuccess();
                  }
                }
              } else if (table == 'events') {
                if (payload.eventType == PostgresChangeEvent.insert) {
                  final createdBy = payload.newRecord['created_by']?.toString();
                  if (currentUserId == null || createdBy != currentUserId) {
                    soundService.playTaskAdded();
                  }
                }
              } else if (table == 'inventory_requests') {
                if (payload.eventType == PostgresChangeEvent.update) {
                  final newStatus = payload.newRecord['status']?.toString().toLowerCase();
                  final oldStatus = payload.oldRecord['status']?.toString().toLowerCase();
                  
                  if (newStatus != oldStatus) {
                    if (newStatus == 'approved' || newStatus == 'fulfilled') {
                      soundService.playSuccess();
                    } else if (newStatus == 'rejected') {
                      soundService.playSuccess();
                    }
                  }
                }
              }
            } catch (e) {
              _logger.error('Error handling realtime sound trigger: $e');
            }

            _controllers[table]?.add(RealtimeEvent.updated);
          },
        )
        .subscribe((status, [error]) {
          if (error != null) {
            final errStr = error.toString();
            if (errStr.contains('SocketException') || 
                errStr.contains('Connection refused') ||
                errStr.contains('RealtimeCloseEvent') ||
                errStr.contains('1002') ||
                errStr.contains('1006') ||
                errStr.contains('WebSocketChannelException')) {
              _logger.warning('Realtime subscription offline/interrupted for $table: $error');
            } else {
              _logger.error('Realtime subscription error for $table: $error');
            }
          } else {
            _logger.info('Realtime subscription status for $table: $status');
          }
        });

    _channels[table] = channel;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _logger.info('App lifecycle state changed: $state');
    if (state == AppLifecycleState.resumed) {
      _logger.info('App resumed, forcing realtime client to reconnect...');
      try {
        _supabase.realtime.connect();
        _logger.info('Realtime client connected successfully on resume');
      } catch (e) {
        _logger.warning('Failed to reconnect Realtime client on resume: $e');
      }
    } else if (state == AppLifecycleState.paused) {
      _logger.info('App paused, disconnecting Realtime client to prevent background battery/network drain...');
      try {
        _supabase.realtime.disconnect();
        _logger.info('Realtime client disconnected successfully on pause');
      } catch (e) {
        _logger.warning('Failed to disconnect Realtime client on pause: $e');
      }
    }
  }

  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    for (final channel in _channels.values) {
      _supabase.removeChannel(channel);
    }
    for (final controller in _controllers.values) {
      controller.close();
    }
    _channels.clear();
    _controllers.clear();
  }
}

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final service = RealtimeService(
    Supabase.instance.client,
    ref.read(loggerServiceProvider),
    ref,
  );
  ref.onDispose(() => service.dispose());
  return service;
});

// Generic provider for table updates
final tableUpdateProvider = StreamProvider.family<RealtimeEvent, String>((ref, table) {
  final service = ref.watch(realtimeServiceProvider);
  return service.getTableStream(table);
});
