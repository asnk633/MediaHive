import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class MediaCacheManager {
  static final Dio _dio = Dio();
  static final Set<String> _activeDownloads = {};

  static String getCacheKey(String url) {
    try {
      final uri = Uri.parse(url);
      final id = uri.queryParameters['id'];
      if (id != null && id.isNotEmpty) {
        return id;
      }
      final cleanPath = url.split('/').last.split('?').first;
      return cleanPath;
    } catch (_) {
      return url.split('/').last.split('?').first;
    }
  }

  static Future<String?> getCachedFilePath(String url, {String? extension}) async {
    if (url.isEmpty) return null;
    final cacheKey = getCacheKey(url);
    final tempDir = await getTemporaryDirectory();
    
    // Auto-resolve extension if not specified
    String ext = extension ?? '';
    if (ext.isEmpty) {
      final base = url.split('?').first;
      if (base.contains('.')) {
        ext = base.split('.').last.toLowerCase();
      }
    }
    if (ext.isEmpty) ext = 'bin';

    final cachedFile = File(p.join(tempDir.path, 'media_cache_$cacheKey.$ext'));

    // Check if concurrently downloading
    if (_activeDownloads.contains(cacheKey)) {
      while (_activeDownloads.contains(cacheKey)) {
        await Future.delayed(const Duration(milliseconds: 100));
      }
      if (cachedFile.existsSync() && cachedFile.lengthSync() > 0) {
        return cachedFile.path;
      }
    }

    if (cachedFile.existsSync() && cachedFile.lengthSync() > 0) {
      return cachedFile.path;
    }

    // Try downloading
    _activeDownloads.add(cacheKey);
    try {
      await _dio.download(
        url,
        cachedFile.path,
        options: Options(
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 10),
        ),
      );
      return cachedFile.path;
    } catch (e) {
      debugPrint('[MediaCacheManager] Download error: $e');
      if (cachedFile.existsSync()) {
        try {
          await cachedFile.delete();
        } catch (_) {}
      }
      return null;
    } finally {
      _activeDownloads.remove(cacheKey);
    }
  }

  /// Cleans up files older than maxAge
  static Future<void> cleanOldCache({Duration maxAge = const Duration(days: 7)}) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final dir = Directory(tempDir.path);
      if (await dir.exists()) {
        final now = DateTime.now();
        await for (final entity in dir.list(recursive: false, followLinks: false)) {
          if (entity is File && p.basename(entity.path).startsWith('media_cache_')) {
            final stat = await entity.stat();
            if (now.difference(stat.modified) > maxAge) {
              await entity.delete();
            }
          }
        }
      }
    } catch (e) {
      debugPrint('[MediaCacheManager] Cache cleanup error: $e');
    }
  }
}
