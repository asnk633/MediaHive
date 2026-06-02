import 'dart:io';
import 'dart:convert';

void main() async {
  final url = 'https://thaiba-garden-media-manager.vercel.app/api/drive/image/1RkgskoyKLzvoKNhianY9GPhGU6qfAk0V';
  
  final client = HttpClient();
  
  try {
    final parsedUri = Uri.parse(url);
    final request = await client.getUrl(parsedUri);
    
    request.headers.add('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');
    request.headers.add('Accept', '*/*');
    
    final response = await request.close();
    print('Status code: ${response.statusCode}');
    
    if (response.statusCode >= 400) {
      final body = await response.transform(utf8.decoder).join();
      print('Body: $body');
    } else {
      print('Headers: ${response.headers}');
    }
  } catch (e) {
    print('Error: $e');
  }
}
