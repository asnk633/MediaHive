import 'package:flutter/material.dart';

class UrlHelpers {
  /// Converts a Google Drive sharing link to a direct thumbnail link.
  static String? getDirectImageUrl(String? url, {String? driveFileId, String? mimeType}) {
    if (url == null && driveFileId == null) return null;
    
    final id = driveFileId ?? (url != null ? _extractDriveId(url) : null);
    if (id != null) {
      // For PDFs, the direct thumbnail service is more reliable
      if (mimeType?.contains('pdf') == true) {
        return 'https://drive.google.com/thumbnail?id=$id&sz=w1000';
      }
      // Use the high-quality, direct lh3 proxy with 1000px scaling for images/videos
      return 'https://lh3.googleusercontent.com/d/$id=s1000';
    }
    
    return url;
  }

  static String? _extractDriveId(String url) {
    if (!url.contains('drive.google.com')) return null;
    
    // Handles both /file/d/[ID]/view and ?id=[ID] formats
    final regExp = RegExp(r'id=([a-zA-Z0-9_-]+)|d/([a-zA-Z0-9_-]+)');
    final match = regExp.firstMatch(url);
    if (match != null) {
      return match.group(1) ?? match.group(2);
    }
    return null;
  }
}
