# MediaHive Mobile App — Master Blueprint

> **⚠️ MANDATORY RULE FOR ALL AI AGENTS & DEVELOPERS**
> This document MUST be updated immediately after every task that involves any change to the mobile app.
> Topics that require an update: new screens, new API calls, schema changes, dependency additions,
> build config changes, env variable changes, or any architectural decisions.
> **Missing an update = losing system memory. Never skip this step.**

This document is the single source of truth for the **MediaHive Flutter Mobile Application**.

**Last Updated:** June 13, 2026

---

## 1. Project Overview

| Property | Value |
| :--- | :--- |
| **Name** | MediaHive Mobile |
| **Type** | Cross-Platform Flutter App (Android + iOS) |
| **Location** | `D:\MediaHive App\mediahive_mobile\` |
| **Primary Goal** | Manage inventory, track events, handle media assets for Thaiba Garden Media |
| **Backend** | Supabase (PostgreSQL) + Firebase (FCM) + Google Drive (via Vercel proxy) |

---

## 2. Tech Stack

| Technology | Package / Version | Notes |
| :--- | :--- | :--- |
| **Framework** | Flutter (Dart) | — |
| **Database** | Supabase (`supabase_flutter`) | Direct PostgREST access |
| **Auth** | Supabase Auth | Email/Password, session persisted locally |
| **Push Notifications** | Firebase FCM + `flutter_local_notifications` | Background isolate for FCM |
| **Image Proxy** | Google Drive via Vercel backend | See Section 6 |
| **State Management** | Riverpod / Provider | Feature-based architecture |
| **NFC** | `nfc_manager` v4.2.1 | Attendance check-in feature |

---

## 3. Environment Configuration

### `.env` file — `mediahive_mobile/.env`
```
SUPABASE_URL=https://fcctcorycpvebupluzpe.supabase.co
SUPABASE_ANON_KEY=<anon key>
```

### Firebase Config Files
| Platform | File | Location |
| :--- | :--- | :--- |
| Android | `google-services.json` | `android/app/` |
| iOS | `GoogleService-Info.plist` | `ios/Runner/` |

---

## 4. Backend Connections

### Supabase
- **URL:** `https://fcctcorycpvebupluzpe.supabase.co`
- **Project ID:** `fcctcorycpvebupluzpe`
- **Auth User:** Logged-in user ID confirmed in logs as `a83c7cac-0c05-4334-908c-eb9e3300b870`
- **Access:** Direct from Flutter via `supabase_flutter` package. All queries are Row-Level-Security (RLS) enforced.

### Vercel Backend (Media Proxy)
- **Production URL:** `https://thaiba-garden-media-manager.vercel.app`
- **Dev URL (Android Emulator):** `http://10.0.2.2:3000` ← **Android loopback for host machine**
- **Used for:** Google Drive image proxy (`/api/drive/image/[fileId]`)

### Firebase (FCM)
- **Project:** `oceanic-base-407316`
- **Role:** Push Notifications + Background message handling
- **FCM Init:** In `FlutterFirebaseMessagingBackgroundService`

---

## 5. Directory Structure

```
mediahive_mobile/
├── android/                        # Android native config
│   └── app/
│   │   └── google-services.json    # Firebase Android config
├── ios/                            # iOS native config
│   └── Runner/
│   │   └── GoogleService-Info.plist
├── assets/
│   └── brand/                      # 🎨 Canonical brand assets (icon, padded, wordmarks)
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── env_config.dart     # Reads .env file for Supabase keys
│   │   └── utils/
│   │       └── url_helpers.dart    # 🔑 Builds Drive proxy URLs; Android emulator fix
│   ├── features/
│   │   ├── auth/                   # Login/Logout screens & logic
│   │   ├── inventory/
│   │   │   ├── data/
│   │   │   │   └── repositories/
│   │   │   │       └── supabase_inventory_repository.dart  # 🔑 Maps drive_file_id from DB
│   │   │   ├── domain/
│   │   │   │   └── models/inventory_item.dart              # InventoryItem model
│   │   │   └── presentation/
│   │   │       ├── screens/inventory_screen.dart
│   │   │       └── widgets/                                 # Asset cards, photo viewers
│   │   ├── events/                 # Events feature (Realtime)
│   │   ├── tasks/                  # Tasks feature (Realtime)
│   │   ├── dashboard/              # Dashboard with stats widgets
│   │   ├── files/                  # File management / Drive uploads
│   │   │   └── presentation/widgets/file_detail_modal.dart
│   │   └── notifications/          # NotificationService + FCM handlers
│   └── main.dart                   # App entry point
├── pubspec.yaml                    # Flutter dependencies
├── .env                            # Supabase credentials (gitignored)
└── MASTER_BLUEPRINT.md             # ← This file
```

---

## 6. Google Drive Photo Integration

### How It Works (End-to-End)

```
[User taps "Add Photo" in app]
        ↓
[Flutter picks image → sends to Vercel API]
        ↓
[Vercel /api/drive/upload → uploads to Google Drive using service account]
        ↓
[Returns drive_file_id → saved to inventory_items.drive_file_id in Supabase]
        ↓
[App reads drive_file_id from Supabase → calls UrlHelpers.buildDriveProxyUrl()]
        ↓
[GET https://thaiba-garden-media-manager.vercel.app/api/drive/image/{fileId}]
        ↓
[Vercel fetches from Google Drive → streams image back → app displays it]
```

### Key File: `url_helpers.dart`
- **Location:** `lib/core/utils/url_helpers.dart`
- **Critical Logic:** When running on Android emulator in debug mode, replaces `localhost` with `10.0.2.2` so the app can reach the host machine's local dev server.
- **Production:** Points directly to `https://thaiba-garden-media-manager.vercel.app`

### Key File: `supabase_inventory_repository.dart`
- **Location:** `lib/features/inventory/data/repositories/supabase_inventory_repository.dart`
- **Critical Fix (Jun 2026):** The repository was previously overriding `drive_file_id` to `null` on every fetch. Fixed to correctly map the value from the Supabase response payload.
- **Also Fixed:** `drive_file_id` is now persisted back to Supabase on `updateItem()` calls.

### Google Drive Folder
- **Root Folder ID:** `1nPv67BFL0XdPw7vZ4tPBfShByCOMBfHb`
- **Service Account:** `firebase-adminsdk-fbsvc@thaiba-media-staging.iam.gserviceaccount.com`
- **Credentials (server-side only):** Stored in Vercel as `GOOGLE_PRIVATE_KEY` + `GOOGLE_SERVICE_ACCOUNT_EMAIL`

---

## 7. Database Schema (Supabase — Key Tables)

### `inventory_items`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary key |
| `asset_id` | TEXT | Human-readable ID (e.g., `TGMD227`) |
| `name` | TEXT | Item name |
| `drive_file_id` | TEXT | 🔑 Google Drive file ID for the photo — **null if no photo** |
| `image_url` | TEXT | Legacy field (Google Drive web view link — not used for display) |
| `purchase_amount` | NUMERIC | — |
| `purchase_date` | DATE | — |
| `status` | TEXT | e.g., `available`, `checked_out` |

### `files`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary key |
| `name` | TEXT | File name |
| `drive_file_id` | TEXT | Google Drive file ID |
| `upload_context` | TEXT | e.g., `inventory_asset`, `task_attachment` |
| `thumbnail_link` | TEXT | Google Drive thumbnail URL (not proxied — may 403) |

### `events`, `tasks`
- Both are subscribed to via **Supabase Realtime**. Ensure Replication is enabled for these tables in the Supabase dashboard if schema changes are made.

---

## 8. Known Quirks & Important Rules

### Android Emulator Networking
- `localhost` inside an Android emulator refers to the emulator itself, not the host machine.
- The host machine is reachable at `10.0.2.2` from inside the emulator.
- `url_helpers.dart` automatically handles this substitution in debug mode.

### Photo Upload Flow
- Photos are uploaded **through the app's "Add Photo" button** on the asset edit/create page — **not directly to Google Drive**.
- Never manually upload photos to Google Drive and expect them to appear automatically. They must be linked via the `drive_file_id` column in Supabase.
- To bulk-link existing Drive photos, use: `node scratch/link-drive-photos.js` from `D:\MediaHive App\`.

### FCM Background Isolate
- The app initializes a background FCM isolate (`FlutterFirebaseMessagingBackgroundService`).
- Duplicate background isolate warnings in logs are expected and benign.

### RLS (Row Level Security)
- All Supabase tables use RLS. Queries are scoped to the logged-in user's `tenant_id` and `institution_id` via JWT claims.
- Do not attempt to query tables without being logged in or queries will return empty results silently.

### Realtime Subscriptions
- `events`, `tasks`, and `inventory_items` listen to Supabase Realtime changes.
- If Supabase Replication is not enabled for a table, Realtime will not fire. Check the Supabase dashboard under **Database → Replication** if live updates stop working.

---

## 9. Build & Run

### Run on Android Emulator
```bash
flutter run
```
Ensure an Android emulator is running first (`sdk gphone16k x86 64` confirmed working).

### Build Release APK
```bash
flutter build apk --release
```
APKs are output to `build/app/outputs/flutter-apk/app-release.apk`.

### APK Version History (at root `D:\MediaHive App\`)
- Latest confirmed: `MediaHive_V1.1.6-beta_46080.apk`

---

## 10. Changelog

| Date | Change | Author |
| :--- | :--- | :--- |
| Jun 15, 2026 | Added verify_cross_platform_builds.js script. Fixed missing mobile_scanner and http_parser dependencies and removed unused model_viewer_plus import in shell_screen.dart to resolve flutter analyze errors. | AI Agent |
| Jun 13, 2026 | Resolved Flutter SDK compile error (`DisplayCornerRadii`) by updating SDK in `D:\src\flutter` and downloading engine binaries | AI Agent |
| Jun 13, 2026 | Updated and synchronized all 2D logo assets, rebuilt launcher icons and native splash screens | AI Agent |
| Jun 13, 2026 | Released mobile version `1.1.6-beta+40080` (build 40080) to supersede user's 39080 local build | AI Agent |
| Jun 13, 2026 | Released mobile version `1.1.6-beta+38080` (build 38080) with Google Drive Inventory Photos support | AI Agent |
| Jun 13, 2026 | Fixed `supabase_inventory_repository.dart` — `drive_file_id` was being overridden to null on every fetch | AI Agent |
| Jun 13, 2026 | Fixed `url_helpers.dart` — Android emulator loopback substitution (`localhost` → `10.0.2.2`) | AI Agent |
| Jun 13, 2026 | Verified Drive proxy works end-to-end (200 OK on production Vercel) for `TGMD227` photo | AI Agent |
| Jun 13, 2026 | Created this Master Blueprint | AI Agent |
| Jun 13, 2026 | Added GitHub Actions release workflow (`mediahive_build_and_publish.yml`) and refined `release_app.py` for CI environment compatibility | AI Agent |
| Jun 13, 2026 | Released mobile version `1.1.6-beta+43080` (build 43080) to fix logo design mistake across all platforms (superseding build 42080 running on real phones) | AI Agent |
| Jun 13, 2026 | Replaced all mobile logo, app name, and launcher/splash assets with the finalized fixed designs | AI Agent |
| Jun 13, 2026 | Created canonical `assets/brand/` folder, updated all Flutter presentation screens to use new single-source logo and wordmark assets, and registered brand assets in `pubspec.yaml` | AI Agent |
| Jun 13, 2026 | Released mobile version `1.1.6-beta+46080` (build 46080) to fix `flutter_native_splash` dependency release compilation error and successfully trigger OTA update banner (superseding build 45080 running on real phones) | AI Agent |


