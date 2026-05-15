import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/upload_mutation.dart';
import 'network_service.dart';
import 'logger_service.dart';

class UploadService {
  final SupabaseClient _client;
  final NetworkService _network;
  final LoggerService _logger;
  static const String _boxName = 'upload_queue_v1';
  bool _isProcessing = false;

  UploadService(this._client, this._network, this._logger) {
    _network.statusStream.listen((status) {
      if (status == NetworkStatus.online) {
        _logger.info('Network online: Resuming upload queue');
        processQueue();
      }
    });
  }

  Future<void> queueUpload(UploadMutation mutation) async {
    final box = await Hive.openBox<Map>(_boxName);
    await box.put(mutation.id, mutation.toJson());
    _logger.info('📤 Media queued for upload: ${mutation.destinationPath}');
    
    if (await _network.isConnected) {
      processQueue();
    }
  }

  Future<void> processQueue() async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final box = await Hive.openBox<Map>(_boxName);
      final mutations = box.values
          .map((json) => UploadMutation.fromJson(Map<String, dynamic>.from(json)))
          .toList()
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

      if (mutations.isEmpty) return;

      _logger.info('🔄 Processing upload queue: ${mutations.length} items');

      for (var mutation in mutations) {
        if (!await _network.isConnected) break;

        try {
          final file = File(mutation.filePath);
          if (!await file.exists()) {
            _logger.error('❌ File not found for upload: ${mutation.filePath}');
            await box.delete(mutation.id);
            continue;
          }

          _logger.info('🚀 Uploading: ${mutation.destinationPath}');
          
          // Mark as processing
          await box.put(mutation.id, mutation.copyWith(status: 'processing').toJson());

          await _client.storage
              .from(mutation.bucketName)
              .upload(mutation.destinationPath, file);

          await box.delete(mutation.id);
          _logger.info('✅ Upload complete: ${mutation.destinationPath}');
        } catch (e) {
          _logger.error('❌ Upload failed for ${mutation.id}', e);
          if (mutation.retryCount < 3) {
            final updated = mutation.copyWith(
              retryCount: mutation.retryCount + 1,
              status: 'failed',
            );
            await box.put(updated.id, updated.toJson());
          } else {
            _logger.error('🚨 Max upload retries reached. Discarded: ${mutation.id}');
            await box.delete(mutation.id);
          }
          break; // Stop queue processing on failure
        }
      }
    } finally {
      _isProcessing = false;
    }
  }

  Future<int> getPendingCount() async {
    final box = await Hive.openBox<Map>(_boxName);
    return box.length;
  }
}

final uploadServiceProvider = Provider<UploadService>((ref) {
  final client = Supabase.instance.client;
  final network = ref.watch(networkServiceProvider);
  final logger = ref.watch(loggerProvider.notifier);
  return UploadService(client, network, logger);
});
