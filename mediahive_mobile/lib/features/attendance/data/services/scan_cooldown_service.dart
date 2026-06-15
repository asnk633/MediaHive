import 'dart:collection';

class ScanCooldownService {
  // Key format: "$userId:$tagId"
  final Map<String, DateTime> _lastScanTime = HashMap();

  /// Check if the current scan is in cooldown.
  bool isInCooldown(String userId, String tagId, {int cooldownSeconds = 30}) {
    final key = '$userId:$tagId';
    final lastScan = _lastScanTime[key];
    if (lastScan == null) {
      return false;
    }
    final now = DateTime.now();
    final difference = now.difference(lastScan).inSeconds;
    return difference < cooldownSeconds;
  }

  /// Record a scan to start/reset the cooldown timer.
  void recordScan(String userId, String tagId) {
    final key = '$userId:$tagId';
    _lastScanTime[key] = DateTime.now();
  }

  /// Clear cooldown state (e.g. for testing)
  void clear() {
    _lastScanTime.clear();
  }
}
