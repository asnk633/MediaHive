# MediaHive — Master Platform Blueprint

> **⚠️ MANDATORY RULE FOR ALL AI AGENTS & DEVELOPERS**
> This document MUST be updated immediately after **every** task that involves any change to any platform.
> Topics that require an update: new screens/routes, API changes, schema changes, dependency additions,
> env variable changes, credential changes, build config, deployment changes, or any architectural decision.
>
> **Missing an update = losing system memory. The next agent session starts blind. Never skip this step.**
>
> - **All platform changes** → `D:\MediaHive App\MEDIAHIVE_MASTER_BLUEPRINT.md` (this file)
> - **Web-only deep-dive** → `D:\MediaHive App\MEDIAHIVE_WEB_BLUEPRINT.md`
> - **Mobile-only deep-dive** → `D:\MediaHive App\mediahive_mobile\MEDIAHIVE_MOBILE_BLUEPRINT.md`

**Last Updated:** June 13, 2026

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Platform Index](#2-platform-index)
3. [Shared Infrastructure](#3-shared-infrastructure)
4. [Environment Variables (All Platforms)](#4-environment-variables-all-platforms)
5. [Google Drive Integration](#5-google-drive-integration)
6. [Web App — Next.js (Vercel)](#6-web-app--nextjs-vercel)
7. [Mobile App — Flutter (Android & iOS)](#7-mobile-app--flutter-android--ios)
8. [Desktop App — Windows](#8-desktop-app--windows)
9. [Database Schema](#9-database-schema)
10. [Key Scripts & Utilities](#10-key-scripts--utilities)
11. [Architecture Rules & Known Quirks](#11-architecture-rules--known-quirks)
12. [Credentials & Security](#12-credentials--security)
13. [Changelog](#13-changelog)

---

## 1. Project Overview

**MediaHive** is a secure, multi-tenant administrative and resource management platform for media institutions (originally built for Thaiba Garden Media).

### Core Features (Across All Platforms)
| Feature | Web | Mobile | Desktop |
|---|---|---|---|
| Inventory & Asset Management | ✅ | ✅ | — |
| Task & Kanban Board | ✅ | ✅ | — |
| HR & Attendance Tracking | ✅ | ✅ (NFC) | — |
| Media & File Management | ✅ | ✅ | — |
| Push Notifications | ✅ | ✅ (FCM) | — |
| Google Drive Photo Proxy | ✅ (server) | ✅ (client) | — |
| Events Management | ✅ | ✅ | — |

### Organizational Hierarchy
```
Tenant (Organization)
  └── Institution (Branch/Campus)
        └── Department
              └── Unit
                    └── User
```

---

## 2. Platform Index

| Platform | Framework | Location | Hosting |
|---|---|---|---|
| **Web App** | Next.js (App Router) | `D:\MediaHive App\` | Vercel — `thaiba-garden-media-manager.vercel.app` |
| **Marketing Landing Page** | Vite + Three.js + GSAP | `D:\MediaHive App\website\` | Vercel — `thaiba-garden-media-manager.vercel.app/` (subproject) |
| **Mobile App** | Flutter (Dart) | `D:\MediaHive App\mediahive_mobile\` | Android APK + iOS IPA |
| **Desktop App** | Windows | `D:\MediaHive App\MediaHive Windows app\` | Local install |

---

## 3. Shared Infrastructure

### Supabase (Primary Database & Auth)
| Property | Value |
|---|---|
| **Project URL** | `https://fcctcorycpvebupluzpe.supabase.co` |
| **Project ID** | `fcctcorycpvebupluzpe` |
| **Role** | Auth, PostgreSQL DB, Realtime Subscriptions |
| **Access Pattern** | Direct PostgREST from all clients (RLS enforced). API routes use `service_role` for admin ops only. |

### Firebase
| Property | Value |
|---|---|
| **Project ID** | `oceanic-base-407316` |
| **Role** | Push Notifications (FCM), Crashlytics |
| **Android Config** | `mediahive_mobile/android/app/google-services.json` |
| **iOS Config** | `mediahive_mobile/ios/Runner/GoogleService-Info.plist` |

### Google Drive
| Property | Value |
|---|---|
| **Service Account** | `firebase-adminsdk-fbsvc@thaiba-media-staging.iam.gserviceaccount.com` |
| **Root Folder ID** | `1nPv67BFL0XdPw7vZ4tPBfShByCOMBfHb` |
| **Key File (local)** | `D:\MediaHive App\serviceAccountKey.json` *(gitignored — never commit)* |
| **Access** | Server-side only via Vercel `/api/drive/*` routes |

### Vercel (Web Hosting + API Backend for all clients)
| Property | Value |
|---|---|
| **Production URL** | `https://thaiba-garden-media-manager.vercel.app` |
| **Vercel Project** | `mediahive` under scope `abdul-shukoors-projects` |
| **Deploy Script** | `scratch/vercel-api-deploy.js` (use this — not `vercel deploy --prod`) |

---

## 4. Environment Variables (All Platforms)

### Vercel Dashboard (Production + Preview + Development)
| Variable | Description | Added |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Day 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Day 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (admin bypass RLS) | Day 1 |
| `NEXT_PUBLIC_API_URL` | Absolute API base URL (used by mobile clients) | Day 1 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Drive service account email | Jun 2026 |
| `GOOGLE_PRIVATE_KEY` | Drive service account private key (with `\n`) | Jun 2026 |
| `GOOGLE_DRIVE_FOLDER_ID` | Root Google Drive folder for inventory photos | Jun 2026 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK key | Day 1 |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin email | Day 1 |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID | Day 1 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase public SDK config (6 vars) | Day 1 |
| `DATABASE_URL` | PostgreSQL direct connection | Day 1 |

> **⚠️ Deprecated:** `GOOGLE_DRIVE_PRIVATE_KEY` and `GOOGLE_DRIVE_CLIENT_EMAIL` (added 156 days ago) are **NOT** used by the current Drive proxy. Active ones are `GOOGLE_PRIVATE_KEY` and `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

### Mobile App — `mediahive_mobile/.env`
```
SUPABASE_URL=https://fcctcorycpvebupluzpe.supabase.co
SUPABASE_ANON_KEY=<anon_key>
```

### Local Web Dev — `D:\MediaHive App\.env`
Same variables as Vercel dashboard, for `npm run dev` / `pnpm dev`.

---

## 5. Google Drive Integration

This is the most complex shared system. Read before making any changes.

### Upload Flow (Mobile → Drive)
```
User taps "Add Photo" in mobile app
  → Flutter sends image to Vercel API
  → Vercel /api/drive/upload streams to Google Drive (service account)
  → Returns drive_file_id
  → Saved to inventory_items.drive_file_id in Supabase
```

### Display Flow (Any Client → Drive)
```
App reads drive_file_id from Supabase
  → Constructs proxy URL: /api/drive/image/{fileId}?thumbnail=true
  → Vercel fetches from Google Drive (service account)
  → Streams image/jpeg back to client
```

### Proxy API Route
- **File:** `src/app/api/drive/image/[id]/route.ts`
- **Auth:** `src/lib/drive-config.ts` reads `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`
- **Client:** `src/lib/drive.ts` — singleton GoogleAuth client (cached per serverless instance)

### Currently Linked Inventory Photos (Jun 2026)
| Asset ID | Item | Drive File ID |
|---|---|---|
| `TGMD227` | 128GB SanDisk Memory Card 200MB/s V30 | `1T1Y2NFCitjsQRnM0-fkmjuIK596qNiSP` |
| `TGMD193` | ATEM Mini Pro | *(linked via script)* |

### Bulk Linking Script
```bash
# From D:\MediaHive App\
node scratch/link-drive-photos.js
```
Matches Drive filenames (e.g., `TGMD227.jpg`) to `asset_id` in Supabase and updates `drive_file_id`.

---

## 6. Web App — Next.js (Vercel)

### Location
`D:\MediaHive App\`

### Tech Stack
| Tech | Package | Notes |
|---|---|---|
| Framework | Next.js (App Router) | TypeScript |
| Package Manager | pnpm | v9+ |
| Styling | Tailwind CSS v3 + framer-motion | — |
| DB Client | `@supabase/supabase-js` | Direct PostgREST |
| Google Drive | `googleapis` | Server-side only |

### Key Directory Structure
```
src/
├── app/
│   ├── (shell)/              # Authenticated dashboard pages
│   └── api/
│       └── drive/
│           └── image/[id]/route.ts   # Drive image proxy
├── lib/
│   ├── drive.ts              # Drive singleton client
│   ├── drive-config.ts       # Env validation + key formatting
│   └── driveUtils.ts         # getDriveImageUrl() for UI
├── features/                 # Domain modules (tasks, events, etc.)
├── services/                 # Canonical data mapping layer
└── types/                    # Zod schemas + TypeScript types
```

### Running Locally
```bash
pnpm dev     # → http://localhost:3000 (Next.js administrative app)
```

### Marketing Landing Page (Vite)
- **Location:** `D:\MediaHive App\website\`
- **Tech Stack:** HTML5, Vanilla JS, CSS3, GSAP (ScrollTrigger), Lenis, Three.js (WebGL rendering)
- **Goal:** Cinematic 3D scroll-driven journey detailing the desktop, mobile, and web versions of MediaHive.
- **Running Locally:**
  ```bash
  cd website
  npm run dev   # → http://localhost:3000
  ```
- **Building:**
  ```bash
  npm run build # Compiles assets to website/dist/
  ```

### Deploying to Vercel
```bash
# DO NOT use: vercel deploy --prod  (exceeds 10MB CLI limit)
# USE instead:
node scratch/vercel-api-deploy.js
```

---

## 7. Mobile App — Flutter (Android & iOS)

### Location
`D:\MediaHive App\mediahive_mobile\`

### Tech Stack
| Tech | Package | Notes |
|---|---|---|
| Framework | Flutter (Dart) | — |
| Auth + DB | `supabase_flutter` | Direct PostgREST, RLS enforced |
| Push | Firebase FCM + `flutter_local_notifications` | Background isolate |
| State | Riverpod / Provider | Feature-based |
| NFC | `nfc_manager` v4.2.1 | Attendance check-in |

### Key Files
| File | Purpose |
|---|---|
| `lib/core/utils/url_helpers.dart` | Builds Drive proxy URLs; Android emulator loopback fix |
| `lib/features/inventory/data/repositories/supabase_inventory_repository.dart` | Maps `drive_file_id` from DB; saves on update |
| `lib/main.dart` | App entry point (Supabase + Firebase init) |
| `android/app/google-services.json` | Firebase Android config |
| `ios/Runner/GoogleService-Info.plist` | Firebase iOS config |

### Android Emulator Networking
- `localhost` inside emulator = the emulator itself.
- Host machine = `10.0.2.2` from inside the emulator.
- `url_helpers.dart` automatically substitutes this in debug mode.
- Local dev server runs on `http://10.0.2.2:3000` from emulator perspective.

### Build Commands
```bash
flutter run                         # Run on connected device/emulator
flutter build apk --release         # Build release APK
```

### APK Versioning
APKs stored at `D:\MediaHive App\MediaHive_V*.apk`. Latest: `MediaHive_V1.1.6-beta_37080.apk`

---

## 8. Desktop App — Windows

### Location
`D:\MediaHive App\MediaHive Windows app\`

> **Status:** Early stage / not yet production-ready. Update this section as development progresses.

---

## 9. Database Schema

### Core Tables (Supabase PostgreSQL)

#### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | = Supabase Auth `user.id` |
| `role` | TEXT | `admin`, `staff`, `viewer` |
| `institution_id` | UUID | FK → `institutions` |
| `tenant_id` | UUID | FK → `tenants` |

#### `inventory_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `asset_id` | TEXT | Human ID e.g. `TGMD227` |
| `name` | TEXT | Item name |
| `drive_file_id` | TEXT | **🔑 Google Drive file ID for photo** — null if no photo |
| `image_url` | TEXT | Legacy Drive web view link (not used for display) |
| `status` | TEXT | `available`, `checked_out`, `maintenance` |
| `purchase_amount` | NUMERIC | — |
| `purchase_date` | DATE | — |

#### `files`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | File name |
| `drive_file_id` | TEXT | Google Drive file ID |
| `upload_context` | TEXT | e.g. `inventory_asset`, `task_attachment` |
| `thumbnail_link` | TEXT | Google Drive thumbnail URL (may 403 — use proxy instead) |

#### `tasks` / `task_assignments`
Task tracking with status transitions, assignees, and due dates. Subscribed to Supabase Realtime.

#### `events`
Event tracking (Realtime subscription). Ensure Supabase Replication is enabled.

#### `equipment_bookings`
Reservation queue for inventory items.

#### `leave_requests` / `user_leave_balances`
HR leave management.

### RLS Pattern
All tables use Row-Level-Security scoped to JWT claims:
```sql
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
```

---

## 10. Key Scripts & Utilities

| Script | Location | Purpose |
|---|---|---|
| `link-drive-photos.js` | `scratch/` | Bulk-links Drive photos to inventory items by filename match |
| `deploy-env.js` | `scratch/` | Sets Vercel env vars via CLI (may fail for preview due to non-interactive mode) |
| `vercel-api-deploy.js` | `scratch/` | **Preferred** — Sets Vercel env vars + triggers redeploy via REST API |
| `db_update.js` | `scratch/` | One-off Supabase data updates |
| `release_app.py` | `mediahive_mobile/` | Compiles release APK, publishes GitHub Release, uploads APK, deletes old releases, and syncs Supabase config |
| `mediahive_build_and_publish.yml` | `.github/workflows/` | GitHub Actions workflow to build and publish the mobile app release automatically |

> **Note:** Scripts in `scratch/` are local-only utilities and not committed to production. They may contain embedded credentials for convenience — rotate keys if any are exposed.

---

## 11. Architecture Rules & Known Quirks

> [!IMPORTANT]
> ### API Origin Rule (Web vs. Mobile)
> - **Web (dev + Vercel):** Uses relative paths (`/api/*`). Do NOT set `NEXT_PUBLIC_API_URL` for web.
> - **Mobile:** Must use absolute URL `https://thaiba-garden-media-manager.vercel.app` (or `http://10.0.2.2:3000` in emulator).

> [!WARNING]
> ### Vercel Deploy via CLI is Broken
> `vercel deploy --prod` tries to upload the entire project (~10MB+) and hits Vercel's body size limit.
> **Always use:** `node scratch/vercel-api-deploy.js` which triggers a redeploy of the existing build via REST API.

> [!WARNING]
> ### Tailwind Dialog Width Overrides
> To override default dialog width (`sm:max-w-lg` in `dialog.tsx`):
> - ❌ `className="max-w-[1100px]"`
> - ✅ `className="sm:max-w-[1100px]"`

> [!NOTE]
> ### Offline Architecture is Disabled
> Offline sync is formally turned off. `queueManager.ts` is stubbed. Do not re-enable without a full rewrite.

> [!NOTE]
> ### Photo Upload Flow (Mobile)
> Photos are uploaded **only through the app's "Add Photo" button**. Manual uploads directly to Google Drive will NOT appear in the app unless the Drive file is linked via `link-drive-photos.js` or through the app's upload flow.

> [!NOTE]
> ### Supabase Realtime Tables
> `events`, `tasks`, and `inventory_items` rely on Supabase Realtime. If live updates stop working, check that Replication is enabled for these tables in the Supabase dashboard under **Database → Replication**.

> [!NOTE]
> ### FCM Background Isolate Warning
> The log warning `"Attempted to start a duplicate background isolate"` is expected and benign.

> [!NOTE]
> ### Brand Assets & Single Source of Truth
> - **Web:** All brand assets (logo icon, small icon, dark/light wordmarks) are stored in `/public/brand/` as `icon.png`, `icon-sm.png`, `wordmark-dark.png`, and `wordmark-light.png`.
> - **Mobile:** All brand assets are stored in `assets/brand/` with the same naming convention (plus `icon-padded.png`).
> - **Aliasing:** Older files in `public/` and `assets/images/` are maintained as synced aliases for backward compatibility but must not be used in new code.

---

## 12. Credentials & Security

| Secret | Where Stored | Notes |
|---|---|---|
| Supabase service role key | `.env` (local) + Vercel dashboard | Never expose in client-side code |
| Google service account key | `serviceAccountKey.json` (gitignored) | Used by `drive.ts` singleton |
| Firebase admin key | `.env` (local) + Vercel dashboard | Used for FCM server-side |
| Vercel access token | `scratch/deploy-env.js` (local only) | Rotate if accidentally exposed |

> [!CAUTION]
> `serviceAccountKey.json` is in `.gitignore` and must NEVER be committed. If accidentally committed, immediately rotate the key in Google Cloud Console under **IAM & Admin → Service Accounts**.

---

## 13. Changelog

| Date | Platform | Change | Author |
|---|---|---|---|
| Jun 13, 2026 | Web + Mobile | Created `MEDIAHIVE_MASTER_BLUEPRINT.md` — unified platform blueprint | AI Agent |
| Jun 13, 2026 | Web | Added `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` to all Vercel environments | AI Agent |
| Jun 13, 2026 | Web | Created `scratch/vercel-api-deploy.js` — REST API deployment script (replaces broken `vercel deploy --prod`) | AI Agent |
| Jun 13, 2026 | Mobile | Fixed `url_helpers.dart` — Android emulator loopback (`localhost` → `10.0.2.2`) | AI Agent |
| Jun 13, 2026 | Mobile | Fixed `supabase_inventory_repository.dart` — `drive_file_id` was being overridden to null on every fetch | AI Agent |
| Jun 13, 2026 | Web + Mobile | Created `scratch/link-drive-photos.js` — bulk Drive photo linker | AI Agent |
| Jun 13, 2026 | Web + Mobile | Verified Drive proxy end-to-end: production URL returns `200 OK image/jpeg` | AI Agent |
| Jun 13, 2026 | Web + Mobile | Renamed blueprints to include platform names (`MEDIAHIVE_WEB_BLUEPRINT.md`, `MEDIAHIVE_MOBILE_BLUEPRINT.md`) | AI Agent |
| Jun 13, 2026 | Web + Mobile | Added mandatory Blueprint Update Rule to `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` | AI Agent |
| Jun 13, 2026 | All | Updated `AGENTS.md`, `GEMINI.md`, `CLAUDE.md` to reference unified `MEDIAHIVE_MASTER_BLUEPRINT.md` as primary source | AI Agent |
| Jun 13, 2026 | Mobile | Released mobile version `1.1.6-beta+38080` (build 38080) with Google Drive Inventory Photos support | AI Agent |
| Jun 13, 2026 | Mobile | Released mobile version `1.1.6-beta+40080` (build 40080) to supersede user's 39080 local build | AI Agent |
| Jun 13, 2026 | Mobile | Updated and synchronized all 2D logo assets, rebuilt launcher icons and native splash screens | AI Agent |
| Jun 13, 2026 | Mobile | Resolved Flutter SDK compile error (`DisplayCornerRadii`) by updating SDK in `D:\src\flutter` and downloading engine binaries | AI Agent |
| Jun 13, 2026 | Mobile | Added GitHub Actions release workflow (`mediahive_build_and_publish.yml`) and refined `release_app.py` for CI environment compatibility | AI Agent |
| Jun 13, 2026 | Mobile | Released mobile version `1.1.6-beta+43080` (build 43080) to fix logo design mistake across all platforms (superseding build 42080 running on real phones) | AI Agent |
| Jun 13, 2026 | All | Replaced all logo and brand assets across Web, Mobile, and Windows platforms with the finalized fixed designs, and regenerated mobile launcher/splash assets | AI Agent |
| Jun 13, 2026 | Web + Mobile | Created canonical `brand/` folders for Web and Mobile, updated all Web components and Mobile Dart screens to use new single-source logo and wordmark assets, and updated `pubspec.yaml` assets configuration | AI Agent |
| Jun 13, 2026 | Mobile | Released mobile version `1.1.6-beta+46080` (build 46080) to fix `flutter_native_splash` dependency release compilation error and successfully trigger OTA update banner (superseding build 45080 running on real phones) | AI Agent |
| Jun 13, 2026 | Web | Fixed background frame PNG images path mapping to correctly load numeric files 1.png to 30.png from the public directory | AI Agent |
| Jun 13, 2026 | Web | Implemented staggered letter-by-letter Aceternity Flip Words text animation effect using GSAP on landing page | AI Agent |
| Jun 13, 2026 | Web | Replaced 3D tilt text layout with custom SVG-based Aceternity UI Text Hover Effect featuring linear/radial gradients, dynamic cursor spotlight mask, and automatic breathing shine | AI Agent |
| Jun 13, 2026 | Web | Extended scroll trigger timeline limits to make 'Meet MediaHive' text visible from 1800px and stay till 2800px | AI Agent |
| Jun 13, 2026 | Web | Updated 'Meet MediaHive' SVG text to a 2-line layout ('Meet' / 'MediaHive.') with 1:2 font size ratio (60px/120px) and adjusted viewBox height to 300 | AI Agent |
| Jun 13, 2026 | Web | Shifted Platform Overview block to the left (left: 8vw) and visually doubled the size of the 'Meet MediaHive' SVG text spotlight (scaled font-size to 120/240 and shifted to left: 68% for balance) | AI Agent |
| Jun 13, 2026 | Web | Centered 'Meet MediaHive' SVG text by default and expanded position editor tool (lil-gui) to control both spotlight text and platform overview card properties | AI Agent |
| Jun 13, 2026 | Web | Applied finalized layout parameters from GUI editor tuning: shifted spotlight text container to left: 45% (top: 30%) and repositioned platform overview card to top: 44%, left: 8%, and width: 28vw | AI Agent |
| Jun 13, 2026 | Web | Adjusted spotlight text height position to top: 25% (left: 45%) based on fine-tuning layout settings | AI Agent |
| Jun 13, 2026 | Web | Replaced logo PNG frame sequence with `Media Hive final logo.webm` video file scrubbed via ScrollTrigger, and added comprehensive logo controls (scroll limits, position, scale, rotation, fade timing) to the lil-gui tuning panel | AI Agent |
| Jun 13, 2026 | Web | Completely removed the WebM logo overlay and the lil-gui tuning editor/positioning tool from the codebase, deleting the logo-sequence directory and package dependencies | AI Agent |
| Jun 13, 2026 | Web | Extended scroll value box (#frame-debugger) to be a direct child of body so it remains fixed and visible until the end of the website page | AI Agent |
| Jun 13, 2026 | Web | Extended ScrollTrigger pinning duration to 3100px (timeline end: +=3100) and updated final spotlight text opacity animations to keep it visible from 1800px to 3100px | AI Agent |
| Jun 13, 2026 | Web | Extended ScrollTrigger pinning duration to 3500px (timeline end: +=3500) and updated spotlight text animations to stay active from 1800px to 3500px (fade out starts at 3400px / 0.971 progress) | AI Agent |
| Jun 13, 2026 | Web | Unified the landing page background to a single continuous scrolling screen flow using GSAP-animated ambient glows, a parallax digital grid, and a procedural film grain overlay, and upgraded all page cards to use frosted glassmorphism | AI Agent |
| Jun 13, 2026 | Web | Integrated #hero-dark-glow and #hero-bottom-fade overlays into the main GSAP ScrollTrigger timeline to fade them to 0 alongside the desk sequence, scaled the laptop model to 2.8, and positioned it at y = 0.3 to completely eliminate any rendering cuts and visual breaks | AI Agent |
| Jun 13, 2026 | Web | Adjusted the spotlight text fade-out animation to end at 2800px (timeline progress 0.8) and start at 2700px (timeline progress 0.771) on the 3500px timeline | AI Agent |
| Jun 13, 2026 | Web | Repositioned the Platform Overview Card (#desktop-overlay) fade-in trigger to start at 2700px (timeline progress 0.771) on the 3500px timeline | AI Agent |
| Jun 13, 2026 | Web | Integrated the ReactBits-inspired animated "Silk" WebGL shader background using vanilla Three.js on a full-screen canvas (#global-silk-canvas) inside the fixed background container, rendering a deep indigo-purple flowing fabric texture that blends with scrolling glows and film grain | AI Agent |
| Jun 14, 2026 | Web | Fixed 5 failing unit test suites (policyEvaluator context cloning, enforcementEngine rule matching logic, missing const variables in governanceEngine, TasksPage breadcrumb duplicate h1 queries, and normalization toDate invalid date parsing + normalizeEvents precedence rules) | AI Agent |
| Jun 14, 2026 | All | Installed and integrated Google Jules AI CLI tool globally, successfully authenticating CLI session with user credentials | AI Agent |
| Jun 14, 2026 | All | Fixed GitHub Actions CI pipelines (swapped setup-node/action-setup sequence in ci.yml, updated pnpm to latest in e2e-mocked-ui.yml) and pushed changes to resolve PR #84 checks | AI Agent |
| Jun 14, 2026 | All | Modified .gitignore to ignore the entire graphify-out/ directory, optimizing git and Jules scan performance | AI Agent |
| Jun 14, 2026 | All | Created remote Google Jules AI session (ID: 8386157609187695369) to run a full bug test on the repository | AI Agent |



