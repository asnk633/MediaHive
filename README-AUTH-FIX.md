# Firebase Auth Fix & Robust Setup

This guide details the fix for `auth/invalid-credential` on Android and ensures robust configuration for Capacitor builds.

## 1. The Fix (Root Causes)
- **Origin Mismatch**: Android Emulator uses `http://10.0.2.2`, but Google API keys often block this. We now use `localhost` with port forwarding.
- **Config Injection**: We added a safety net where `NEXT_PUBLIC_` variables are injected into `public/firebase-config.json` at build time. This ensures the Android app always has access to the config, even if the static bundle was built in an environment with partial env vars.

## 2. Setup (Required)

### A. Environment Variables
Ensure `.env.local` contains all `NEXT_PUBLIC_FIREBASE_*` keys.

### B. Android Emulator Port Mapping
**Every time** you start the emulator, run:
```bash
adb reverse tcp:3000 tcp:3000
```
This maps the device's `localhost:3000` to your computer's `localhost:3000`.

### C. Capacitor Config
Ensure `capacitor.config.ts` points to `http://localhost:3000`.

## 3. Building for Production/Android
Use the new script to build the web assets. This script runs the environment injector:
```bash
npm run build:web-for-capacitor
npx cap copy android
npx cap sync android
```

## 4. Verification

### Automated Smoke Test
Run the Playwright smoke test to verify Auth initialization:
```bash
npx playwright test tests/auth-smoke.spec.ts
```

### Manual Check
1. Open the app on Android Emulator.
2. If the config is missing, you will see a console warning `[FIREBASE INIT] Missing env vars`.
3. If properly configured, you should see logs: `[FIREBASE INIT] API Key: AIzaSy...` in Logcat.

## 5. CI / GitHub Actions
Ensure your CI pipeline exports `NEXT_PUBLIC_FIREBASE_*` secrets before running `npm run build` or the new `build:web-for-capacitor` script.
