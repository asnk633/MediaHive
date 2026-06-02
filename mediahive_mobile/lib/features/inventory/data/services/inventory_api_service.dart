import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:mediahive_mobile/core/config/env_config.dart';
import 'package:mediahive_mobile/core/services/logger_service.dart';

class InventoryApiService {
  final LoggerService _logger;
  final String _baseUrl;

  InventoryApiService(this._logger) : _baseUrl = EnvConfig.current.apiBaseUrl;

  Future<Map<String, dynamic>?> uploadImage(File file, String userId, String userName, {String? token}) async {
    try {
      String baseUrl = _baseUrl;
      // Handle Android emulator localhost
      if (Platform.isAndroid && baseUrl.contains('localhost')) {
        baseUrl = baseUrl.replaceAll('localhost', '10.0.2.2');
      }
      
      final url = Uri.parse('$baseUrl/api/files/upload');
      final request = http.MultipartRequest('POST', url);
      
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      final metadata = {
        'name': 'INV_${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}',
        'type': 'image',
        'uploaded_by': userId,
        'uploadedByName': userName,
        'folder': 'Photos',
        'subfolder': 'Inventory Photos',
        'module': 'inventory',
        'uploadContext': 'inventory_asset',
        'visibility': {'mode': 'internal'}
      };

      request.fields['metadata'] = jsonEncode(metadata);
      request.headers['X-Upload-Metadata'] = jsonEncode(metadata);
      
      final multipartFile = await http.MultipartFile.fromPath(
        'file',
        file.path,
      );
      request.files.add(multipartFile);

      _logger.info('🚀 Uploading inventory image to $_baseUrl');
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          _logger.info('✅ Image uploaded successfully: ${data['file_id']}');
          return data;
        }
      }
      
      _logger.error('❌ Upload failed: ${response.statusCode} - ${response.body}');
      return null;
    } catch (e) {
      _logger.error('❌ Error uploading image: $e');
      return null;
    }
  }
}
