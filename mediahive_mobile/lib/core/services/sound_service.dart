import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logger_service.dart';

class SoundService {
  final LoggerService _logger;
  late final AudioPlayer _player;
  bool _muted = false;

  SoundService(this._logger) {
    _player = AudioPlayer();
    _player.setReleaseMode(ReleaseMode.release);
    
    // Set AudioContext to ensure sounds route to the main speaker and play even in silent mode
    _player.setAudioContext(AudioContext(
      android: const AudioContextAndroid(
        isSpeakerphoneOn: true,
        stayAwake: false,
        contentType: AndroidContentType.music,
        usageType: AndroidUsageType.media,
        audioFocus: AndroidAudioFocus.gainTransientMayDuck,
      ),
      iOS: AudioContextIOS(
        category: AVAudioSessionCategory.playback,
        options: const {
          AVAudioSessionOptions.mixWithOthers,
        },
      ),
    ));
  }

  bool get isMuted => _muted;

  void setMuted(bool muted) {
    _muted = muted;
    _logger.info('Sound service muted state: $muted');
  }

  Future<void> playTaskAdded() => _playSound('sounds/task_added.wav');
  Future<void> playEventAlert() => _playSound('sounds/event_alert.wav');
  Future<void> playSuccess() => _playSound('sounds/success.wav');
  Future<void> playWarning() => _playSound('sounds/warning.wav');
  Future<void> playUploadComplete() => _playSound('sounds/upload_complete.wav');

  Future<void> _playSound(String assetPath) async {
    if (_muted) {
      _logger.debug('Sound service is muted. Skipping playing sound: $assetPath');
      return;
    }
    
    try {
      _logger.info('Playing in-app sound: $assetPath');
      // audioplayers 6.x uses AssetSource for assets (assets folder is root for AssetSource, so sounds/success.wav points to assets/sounds/success.wav)
      await _player.stop();
      await _player.setVolume(1.0);
      await _player.play(AssetSource(assetPath));
    } catch (e, stack) {
      _logger.error('Error playing sound $assetPath', e, stack);
    }
  }

  void dispose() {
    _player.dispose();
  }
}

final soundServiceProvider = Provider<SoundService>((ref) {
  final logger = ref.watch(loggerServiceProvider);
  final service = SoundService(logger);
  ref.onDispose(() => service.dispose());
  return service;
});
