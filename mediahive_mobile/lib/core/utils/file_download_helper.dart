import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class FileDownloadHelper {
  static Future<void> downloadAndShare(BuildContext context, String url, String filename) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading file...')),
      );
      
      // Strip thumbnail parameter to ensure we download the original full-res file
      String cleanUrl = url.replaceAll('?thumbnail=true', '').replaceAll('&thumbnail=true', '');
      
      final tempDir = await getTemporaryDirectory();
      final tempPath = '${tempDir.path}/$filename';
      
      final client = HttpClient();
      
      // Parse the URL carefully to avoid double-encoding (which breaks already-encoded Supabase URLs)
      Uri parsedUri;
      if (cleanUrl.contains('%')) {
        // Likely already encoded
        parsedUri = Uri.parse(cleanUrl);
      } else {
        // Might need encoding (e.g. contains raw spaces)
        parsedUri = Uri.parse(Uri.encodeFull(cleanUrl));
      }
      
      final request = await client.getUrl(parsedUri);
      
      // Add standard browser headers to prevent CDN/WAF bot-blocking (e.g. Cloudflare returning 404/403)
      request.headers.add('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');
      request.headers.add('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
      
      final response = await request.close();
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final file = File(tempPath);
        final List<int> bytes = [];
        await for (var data in response) {
          bytes.addAll(data);
        }
        await file.writeAsBytes(bytes);

        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Downloaded ${file.path.split('/').last}')),
          );
        }

        // Open share dialog
        await Share.shareXFiles([XFile(file.path)], text: 'Shared from MediaHive');
      } else {
        throw Exception('Server returned status code ${response.statusCode} for URL: ${parsedUri.toString()}');
      }
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
      }
    } catch (e) {
      debugPrint('[DOWNLOAD_ERROR] Failed to download file: $e\nURL: $url');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download file: $e\nURL: $url')),
        );
      }
    }
  }
}
