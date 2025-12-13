# Firebase Auth Setup & Debugging

## Environment Variables
Ensure your `.env.local` (for dev) or CI secrets contain the following. **Note**: These must start with `NEXT_PUBLIC_` to be visible to the Firebase Client SDK.

```ini
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:....:web:...
```

## Android Emulator Setup
The most common cause of `auth/invalid-credential` in the Emulator is a mismatch between the **Allowed Referrers** in Google Cloud Console and the Emulator's internal IP (`10.0.2.2`).

### Solution: Use Localhost Port Forwarding
Instead of pointing Capacitor to `10.0.2.2`, we point it to `localhost` and map the ports.

1. **Update Capacitor Config**: Ensure `server.url` is `http://localhost:3000`.
2. **Run ADB Reverse**:
   Run this command **every time** you start the emulator:
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```
   This makes `localhost:3000` on the Android device route to `localhost:3000` on your computer.

### API Key Restrictions
Go to [Google Cloud Console > credentials](https://console.cloud.google.com/apis/credentials).
Select your **Browser key** (used in `NEXT_PUBLIC_FIREBASE_API_KEY`).
Under **Website restrictions**, ensure the following are added:
- `localhost`
- `localhost:3000`
- `your-project.firebaseapp.com`
- `your-project.web.app`

## Troubleshooting
If you still see errors:
1. Open Chrome on your desktop and go to `chrome://inspect/#devices`.
2. Click **Inspect** on the WebView target.
3. Look at the Console. The app will now log the loaded Firebase Config (partial) to verify keys are present.
