import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Generated as a high-fidelity standard development configuration.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDrw4sJc55jr_7k5Xl_a5WkAKYUxWuG8N8',
    appId: '1:716263625910:android:9b1a5610763dec50cec217',
    messagingSenderId: '716263625910',
    projectId: 'thaiba-media-prod',
    storageBucket: 'thaiba-media-prod.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCQLqigxN8r0oFTs1Fe38b90NqoKWE4SF0',
    appId: '1:716263625910:ios:a2a77e5081725187cec217',
    messagingSenderId: '716263625910',
    projectId: 'thaiba-media-prod',
    storageBucket: 'thaiba-media-prod.firebasestorage.app',
    iosBundleId: 'com.mediahive.app',
  );
}
