import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';

class AudioService {
  final LoggerService _logger;
  final AudioPlayer _effectsPlayer = AudioPlayer();

  AudioService(this._logger);

  Future<void> playMessageSent() async {
    await _playEffect('sounds/message_sent.wav');
    await HapticFeedback.lightImpact();
  }

  Future<void> playMessageReceived() async {
    await _playEffect('sounds/message_received.wav');
    await HapticFeedback.vibrate();
  }

  /// Plays the voice-start beep and waits for it to finish completely,
  /// so the microphone won't pick up the tail end of the sound.
  Future<void> playVoiceStartAndWait() async {
    final completer = Completer<void>();
    late StreamSubscription sub;
    sub = _effectsPlayer.onPlayerComplete.listen((_) {
      if (!completer.isCompleted) completer.complete();
      sub.cancel();
    });
    try {
      await _effectsPlayer.stop();
      await _effectsPlayer.play(AssetSource('sounds/voice_record_start.wav'));
      _logger.debug('Playing audio effect: sounds/voice_record_start.wav');
      await HapticFeedback.mediumImpact();
      // Wait for playback to finish OR timeout after 1.5s as a safety net
      await completer.future.timeout(
        const Duration(milliseconds: 1500),
        onTimeout: () {},
      );
      // Extra 100ms silence gap to ensure speaker fully stops before mic opens
      await Future.delayed(const Duration(milliseconds: 100));
    } catch (e, stack) {
      _logger.error('Failed to play voice start effect', e, stack);
      if (!completer.isCompleted) completer.complete();
      sub.cancel();
    }
  }

  Future<void> playVoiceStop() async {
    await _playEffect('sounds/voice_record_stop.wav');
    await HapticFeedback.lightImpact();
  }

  Future<void> playGroupAlert() async {
    await _playEffect('sounds/group_alert.wav');
    await HapticFeedback.mediumImpact();
  }

  Future<void> _playEffect(String assetPath) async {
    try {
      await _effectsPlayer.stop();
      await _effectsPlayer.play(AssetSource(assetPath));
      _logger.debug('Playing audio effect: $assetPath');
    } catch (e, stack) {
      _logger.error('Failed to play audio effect: $assetPath', e, stack);
    }
  }
}

final audioServiceProvider = Provider<AudioService>((ref) {
  final logger = ref.watch(loggerServiceProvider);
  return AudioService(logger);
});
