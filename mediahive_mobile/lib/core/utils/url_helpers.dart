import '../config/env_config.dart';

class UrlHelpers {
  /// Converts a Google Drive sharing link to a direct thumbnail link.
  static String? getDirectImageUrl(String? url, {String? driveFileId, String? mimeType}) {
    if (url == null && driveFileId == null) return null;
    
    final id = driveFileId ?? (url != null ? _extractDriveId(url) : null);
    if (id != null) {
      // Use the Next.js proxy endpoint `/api/drive/image/[ID]?thumbnail=true`
      // exactly as the web application does to bypass direct Google Drive 403 Forbidden checks.
      String baseUrl = EnvConfig.current.apiBaseUrl;
      if (baseUrl.contains('localhost') || baseUrl.contains('127.0.0.1')) {
        baseUrl = 'https://thaiba-garden-media-manager.vercel.app'; // Fallback to live production proxy in development
      }
      
      return '$baseUrl/api/drive/image/$id?thumbnail=true';
    }
    
    return url;
  }

  static String? getDirectMediaUrl(String? url, {String? driveFileId}) {
    if (url == null && driveFileId == null) return null;
    
    final id = driveFileId ?? (url != null ? _extractDriveId(url) : null);
    if (id != null) {
      // Use the Next.js proxy endpoint `/api/drive/image/[ID]` (without thumbnail)
      // exactly as the web application does to bypass direct Google Drive 403 Forbidden checks.
      String baseUrl = EnvConfig.current.apiBaseUrl;
      if (baseUrl.contains('localhost') || baseUrl.contains('127.0.0.1')) {
        baseUrl = 'https://thaiba-garden-media-manager.vercel.app'; // Fallback to live production proxy in development
      }
      
      return '$baseUrl/api/drive/image/$id';
    }
    
    return url;
  }

  static String? _extractDriveId(String url) {
    if (!url.contains('drive.google.com') && !url.contains('docs.google.com')) return null;
    
    // Handles both /file/d/[ID]/view and ?id=[ID] formats
    final regExp = RegExp(r'id=([a-zA-Z0-9_-]+)|d/([a-zA-Z0-9_-]+)');
    final match = regExp.firstMatch(url);
    if (match != null) {
      return match.group(1) ?? match.group(2);
    }
    return null;
  }
}
