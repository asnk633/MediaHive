import 'dart:async';

class Semaphore {
  final int maxCount;
  int _currentCount = 0;

  Semaphore(this.maxCount);

  Future<bool> acquire() async {
    if (_currentCount < maxCount) {
      _currentCount++;
      return true;
    }
    return false;
  }

  void release() {
    if (_currentCount > 0) {
      _currentCount--;
    }
  }
}
