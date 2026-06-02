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

  Future<void> playVoiceStart() async {
    await _playEffect('sounds/voice_record_start.wav');
    await HapticFeedback.mediumImpact();
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
