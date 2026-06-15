import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class QrSignatureService {
  static String get _secretKey {
    return dotenv.env['QR_SECRET_KEY'] ?? 'mediahive_secure_attendance_key_2026';
  }

  /// Generates a structured JSON QR payload for a given Tag UUID
  static String generatePayload(String tagUuid) {
    final signature = _generateSignature(tagUuid);
    final payloadMap = {
      'tagId': tagUuid,
      'sig': signature,
    };
    return jsonEncode(payloadMap);
  }

  /// Verifies a structured QR payload and returns the Tag UUID if valid, or null if invalid
  static String? verifyPayload(String rawPayload) {
    try {
      final decoded = jsonDecode(rawPayload) as Map<String, dynamic>;
      final tagId = decoded['tagId'] as String?;
      final sig = decoded['sig'] as String?;

      if (tagId == null || sig == null) return null;

      final expectedSig = _generateSignature(tagId);
      if (sig == expectedSig) {
        return tagId;
      }
    } catch (_) {
      // Return null on parsing errors
    }
    return null;
  }

  static String _generateSignature(String data) {
    final keyBytes = utf8.encode(_secretKey);
    final dataBytes = utf8.encode(data);
    final hmac = Hmac(sha256, keyBytes);
    final digest = hmac.convert(dataBytes);
    return digest.toString();
  }
}
