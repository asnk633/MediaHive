import 'dart:io';
import 'dart:convert';

void main() async {
  final url = 'https://fcctcorycpvebupluzpe.supabase.co/storage/v1/object/public/chat_files/chat_123/DJI_20260515140114_0095_D.jpg';
  
  final client = HttpClient();
  
  try {
    final parsedUri = Uri.parse(url);
    final request = await client.getUrl(parsedUri);
    
    request.headers.add('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');
    request.headers.add('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
    
    final response = await request.close();
    print('Status code: ${response.statusCode}');
    
    final body = await response.transform(utf8.decoder).join();
    print('Body: $body');
    print('Headers: ${response.headers}');
  } catch (e) {
    print('Error: $e');
  }
}
