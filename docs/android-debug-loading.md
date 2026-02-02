# Android Loading Freeze: Reproduction & Debugging

If the app freezes on a loading spinner (e.g. "Loading Media"), follow these steps to diagnose and resolve.

## 1. Monitor Logcat
The most important tool is the Android Logcat. Filter by `System.out` or just look for `[BOOT]` markers.

**Success Sequence:**
```
[BOOT][STEP] Auth Initialization Started
[BOOT][STEP] Firebase Auth Instance Ready in 45ms
[BOOT][STEP] Auth State Changed: Authenticated
[BOOT][STEP] Session Sync Attempt 1
[BOOT][DONE] Session Sync Successful in 120ms
[BOOT][STEP] Fetching /api/users/me
[BOOT][DONE] /api/users/me Fetched in 150ms
[BOOT][DONE] Auth Context Ready in 320ms
[WATCHDOG] App signaled ready, clearing timer.
```

**Failure Indicators:**
- `[TIMEOUT] ...`: Indicates a specific promise hung for > 15s.
- `[WATCHDOG] Boot sequence stalled after 20s`: The whole boot failed to complete.
- Missing `[BOOT][DONE]` after a `[BOOT][STEP]`: That step is where the hang is occurring.

## 2. Reproduction Scenario: Network Throttling
1. Open Android Emulator.
2. Go to **Extended Controls** -> **Network**.
3. Set **Network Type** to `GPRS` or `Edge`.
4. Perform a cold boot (Close and reopen app).
5. Verify that after 10s, the spinner shows "Taking longer than usual...".
6. Verify that after 20s, the **Watchdog UI** appears.

## 3. Reproduction Scenario: Offline Boot
1. Disable WiFi/Data on the device.
2. Open the app.
3. Verify that the app handles the `[BOOT][SKIP] Offline` state and proceeds to the "Offline Fallback" (Home with cached data) or shows the Watchdog if it truly hangs.

## 4. Fixes Applied
- **Instrumentation**: Every major boot step is now timed and logged.
- **Watchdog**: A 20s timer in `RootProviders.tsx` ensures the user is never stuck forever.
- **Hard Timeouts**: Promises like `getIdToken()` are wrapped in a 10s race.
- **Cleartext Traffic**: Whitelisted via `network_security_config.xml` for `localhost` and `10.0.2.2`. Global cleartext is **disabled** for production domains.
- **Boot Deferral**: Auth session sync is deferred by 50ms to allow smooth initial React tree mount.
- **Code Splitting**: Heavy routes (e.g., `/tasks`) use `next/dynamic` to keep the hydration bundle small.

## 6. How to Export Logs

If the 20s watchdog triggers:
1.  Verify the "Login Taking Too Long" screen is visible.
2.  Click **Export Diagnostics**.
3.  A JSON file named `diagnostics_[timestamp].json` will be generated.
4.  Send this file to the engineering team. It contains the last 50 system logs, auth status, and platform info.

## 7. How to Read Telemetry

The app emits boot telemetry events once per launch (Android only):
-   `boot_success`: Initialized within the 20s window.
-   `boot_timeout`: Exceeded the 20s window (Watchdog triggered).
-   `boot_retry`: User clicked "Retry" on the recovery screen.

**Example Payload:**
```json
{
  "event": "boot_success",
  "duration_ms": 3450,
  "platform": "android",
  "timestamp": "2026-01-25T15:50:00Z"
}
```

## 8. Release Checklist

Before releasing to the Play Store, ensure:
- [ ] `android:networkSecurityConfig="@xml/network_security_config"` is present in `AndroidManifest.xml`.
- [ ] `network_security_config.xml` does NOT have global cleartext enabled.
- [ ] `minifyEnabled true` and `shrinkResources true` are set in `build.gradle`.
- [ ] Watchdog timer is set to a reasonable production value (default 20s).
- [ ] Baseline Boot performance is ≤ 4s on real hardware.
- [ ] Bundle footprint is < 3MB JS total.

## 9. Performance Pass Baseline (2026)

| Metric | Threshold | Target Device |
|--------|-----------|---------------|
| Cold Boot TTI | 4.1s | Pixel 4a |
| APK Size | 24.8MB | Release AAB |
| JS Heap Peak | 134MB | WebView |
| Battery Idle | 2.7% / 10m | Energy Profiler |

## 10. 24-Hour Soak Test

Before release, the build must pass a 24-hour idle/active soak test:
- **Idle Overnight**: App left idle; verified zero crashes in Logcat.
- **Periodic Push**: Test notifications must trigger correctly.
- **Background Sync**: Verify `SyncWorker` fires every 30-60 min.
- **Foreground Resume**: Zero hydration errors upon app reopening.
- **Memory after 24h**: JS heap must not show progressive growth.
- **Battery Delta**: Total 24h idle drain should be `< 8%`.

## 11. Android Vitals Mapping

Metric → Play Console Section:
- `boot_timeout_rate` → **Startup time**
- `anr_warning` → **ANR rate**
- `slow_render` → **Slow rendering**
- `oom_crashes` → **Stability**
