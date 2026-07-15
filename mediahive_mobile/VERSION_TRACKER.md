# MediaHive Mobile Version History & Build Tracker

This file tracks the versions and build numbers released to users to ensure smooth OTA (Over-The-Air) updates.

**CRITICAL DEPLOYMENT RULE:** 
When deploying a new version, the `version:` in `pubspec.yaml` MUST have a higher build number than the current highest version in use by the users.

## Version History

| Date | Version | Build Number | Notes |
| :--- | :--- | :--- | :--- |
| 2026-07-15 | 1.2.6-beta+100005 | 100005 | **Presence Tracker Leaf Icon Override.** Replaced background service leaf icon by overriding `ic_bg_service_small.png` across all drawable folders. Resolved client update key permission check by adding UPDATE/INSERT RLS policies to `system_config`. Bushed build to 100005 to bypass user's `100003` build. |
| 2026-07-15 | 1.2.6-beta+98003 | 98003 | **OTA Permanent Fix.** Release script now auto-queries Supabase `app_max_client_build` + `app_latest_version` and sets `new_build = max(all) + 1`, then auto-patches pubspec.yaml. Also writes new build to `app_max_client_build` after publishing. App reports its build to Supabase (MAX-only) on every launch via `main.dart`. Fixes the recurring OTA mismatch permanently. |
| 2026-07-15 | 1.2.6-beta+97003 | 97003 | **Intermediate release** — first run of auto-correct script; corrected 97002 → 97003. Could not beat device at 98002 yet; required manual seed of app_max_client_build in Supabase to produce 98003. |
| 2026-07-15 | 1.2.6-beta+97002 | 97002 | **Presence Tracker Service Fix.** `initializeService()` had been commented out in `main.dart` during Android 15 crash debugging — service never started. Re-enabled as safe post-`runApp()` async block. Added session-resume: auto-restarts tracker on app launch if user is already checked in (covers OTA updates/reboots). |
| 2026-07-15 | 1.2.6-beta+96002 | 96002 | **Presence Tracker Icon Fix.** Fixed foreground service notification showing leaf silhouette instead of MediaHive logo. Added `android:icon="@drawable/ic_stat_notification"` to `BackgroundService` entry in `AndroidManifest.xml`. |
| 2026-07-14 | 1.2.6-beta+93002 | 93002 | **Gravatar Image Load & Crash Reporting.** Added error handling for avatar network image loads to prevent crash, integrated crash log recording to record flutter/async/zone errors, pre-creates bg presence notification channel. |
| 2026-07-13 | 1.2.6-beta+67001 | 67001 | **UI/UX Refinement, Role Gating & Dashboard Bug Fixes.** Fixed bottom sheet placement on dashboard; gated check-in panel for team/managers; clamped text scaling factor; localized date formats; added Undo button for task deletion; friendly auth errors. |
| 2026-07-07 | 1.2.5-beta+66003 | 66003 | **Geofenced Background Presence Alerts & NFC UI Redesign.** Persistent location monitoring for office boundaries with geofencing, redesigned NFC scan overlay hierarchy, today attendance dashboard panel styling updates. |
| 2026-06-15 | 1.2.0+51000 | 51000 | **Stable internal release (No Beta label).** Clean version indicator in profile screen (removed Beta suffix). Supersedes build 50000. |
| 2026-06-15 | 1.2.0+50000 | 50000 | **Stable internal release.** Real-time notifications (FCM), push foundation, Kanban DnD, full calendar, advanced reports (Recharts), role-based dashboard, 138 unit tests, CI/CD self-healing pipeline. Build number supersedes last deployed 46080. |
| 2026-06-13 | 1.1.6-beta+46080 | 46080 | Released to supersede user's 45080 build; triggers update banner for new assets and logo design fix. |
| 2026-06-13 | 1.1.6-beta+45080 | 45080 | Internal/User build (previous local run). |
| 2026-06-13 | 1.1.6-beta+43080 | 43080 | Replaced all 2D logo assets (corrected logo design mistake), rebuilt launcher icons and native splash screens. |
| 2026-06-13 | 1.1.6-beta+41080 | 41080 | Previous build with logo fixes. |
| 2026-06-13 | 1.1.6-beta+40080 | 40080 | Released to supersede user's 39080 local build; includes Google Drive Inventory Photos support and proxy configuration. |
| 2026-06-13 | 1.1.6-beta+38080 | 38080 | Google Drive Inventory Photos support added. Integrated secure image proxy to view uploaded asset photos directly from Google Drive. |
| 2026-06-11 | 1.1.6-beta+37080 | 37080 | Real camera QR scanner added; demo/emulator stubs removed; NFC uses real hardware. Bumped build to 37080 to supersede user local builds (36080). |
| 2026-06-11 | 1.1.6-beta+34080 | 34080 | Attempted release, but users were already on 36080, causing update checker to fail. |

## How to Release a New Version

1. **Check Current User Build:** Check the latest log or `system_config` table in Supabase.
2. **Update pubspec.yaml:** Increment the version and ensure the build number (after the `+`) is strictly greater than the highest known build number in the wild.
3. **Run Release Script:** Execute `python release_app.py`.
4. **Verify Supabase:** Ensure `system_config` has the correct `app_download_url` and `app_latest_version`.
