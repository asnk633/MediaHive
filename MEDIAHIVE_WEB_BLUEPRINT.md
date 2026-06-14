# MediaHive Master Blueprint

> **⚠️ MANDATORY RULE FOR ALL AI AGENTS & DEVELOPERS**
> This document MUST be updated immediately after every task that involves:
> - Adding/changing environment variables
> - Adding/modifying API routes
> - Changing database schema or queries
> - Introducing new scripts or execution tools
> - Changing how credentials/services are configured
> - Any architectural or behavioral change to the system
>
> **Failure to update this document causes loss of critical system memory. Never skip this step.**

This document is the single source of truth for the full **MediaHive** platform. It covers the web application (Next.js on Vercel), the mobile app (Flutter), and all supporting infrastructure.

**Last Updated:** June 13, 2026

---

## 1. Project Overview

**MediaHive** is a secure, multi-tenant administrative and resource management portal designed for institutions (originally built for Thaiba Garden Media).

### Core Features
- **Inventory & Asset Management**: Tracking equipment, check-ins/check-outs, availability, and photos via Google Drive.
- **Media & Deliverables**: Uploading and previewing design media, files, and deliverables.
- **Task & Kanban Board**: Task assignments, state transitions, review cycles, and team queues.
- **HR & Attendance Tracking**: Geolocation-aware or NFC-assisted attendance tracking, leave requests, and accountability scoring.
- **Multi-tenant Organization Structure**: Hierarchy spanning Tenants → Institutions (Branches) → Departments → Units → Users.
- **Push Notifications**: Firebase Cloud Messaging (FCM) for mobile and web.

The platform compiles to a **Next.js web app** (hosted on Vercel) and a **Flutter mobile app** (Android & iOS).

---

## 2. Technology Stack

### Web App (`D:\MediaHive App\`)
| Technology | Layer / Package | Version / Notes |
| :--- | :--- | :--- |
| **Language** | Frontend/Backend | TypeScript / Node.js |
| **Framework** | Web Application | Next.js (App Router) |
| **Package Manager** | Dependency Resolution | `pnpm` |
| **Styling** | UI | Tailwind CSS v3 + framer-motion |
| **Remote Database** | Cloud Data Storage | Supabase (PostgreSQL) |
| **File Storage** | Assets & Media | Google Drive (via service account) |
| **Hosting** | Production Deployment | Vercel — `thaiba-garden-media-manager.vercel.app` |
| **Integrations** | Google APIs | `googleapis` npm package |

### Mobile App (`D:\MediaHive App\mediahive_mobile\`)
| Technology | Layer | Notes |
| :--- | :--- | :--- |
| **Language** | Dart | Flutter SDK |
| **Backend** | Supabase | Auth + Database + Realtime |
| **Push Notifications** | Firebase (FCM) | `flutter_local_notifications` |
| **Image Storage** | Google Drive | Proxied via Vercel backend |
| **State Management** | Riverpod | Feature-based architecture |

---

## 3. Backend & API Connections

### Supabase
- **Project URL:** `https://fcctcorycpvebupluzpe.supabase.co`
- **Project ID:** `fcctcorycpvebupluzpe`
- **Role:** Primary Database, Auth, Realtime Subscriptions
- **Access Pattern:** Direct PostgREST from both web and mobile (RLS enforced). Next.js API routes use `service_role` key for admin operations only.

### Firebase
- **Project ID:** `oceanic-base-407316`
- **Role:** Push Notifications (FCM), Crashlytics
- **Keys:** `google-services.json` (Android), `GoogleService-Info.plist` (iOS), env vars for web admin

### Vercel Deployment
- **Production URL:** `https://thaiba-garden-media-manager.vercel.app`
- **Vercel Project:** `mediahive` under scope `abdul-shukoors-projects`
- **Vercel Token:** (stored securely — see `.env` / `scratch/deploy-env.js`)

---

## 4. Environment Variables (Vercel Production)

The following are currently configured in Vercel dashboard for **Production, Preview, and Development**:

| Variable Name | Description | Environments |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (admin) | All |
| `NEXT_PUBLIC_API_URL` | Absolute API base URL (used by mobile/Capacitor) | All |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Drive service account email | All ✅ Added Jun 2026 |
| `GOOGLE_PRIVATE_KEY` | Google Drive service account private key (with `\n` newlines) | All ✅ Added Jun 2026 |
| `GOOGLE_DRIVE_FOLDER_ID` | Root Google Drive folder ID for inventory photos | All ✅ Added Jun 2026 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin SDK private key | All |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin service account email | All |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID | All |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase public config keys | All |
| `DATABASE_URL` | PostgreSQL direct connection URL | All |

> **⚠️ IMPORTANT:** The old variables `GOOGLE_DRIVE_PRIVATE_KEY` and `GOOGLE_DRIVE_CLIENT_EMAIL` (added 156 days prior) are **deprecated/legacy** and NOT the ones used by the current Drive proxy. The active ones are `GOOGLE_PRIVATE_KEY` and `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

### Local `.env` (Web App Root)
Located at `D:\MediaHive App\.env`. Contains the same variables as above for local `npm run dev`.

### Local `.env` (Mobile App)
Located at `D:\MediaHive App\mediahive_mobile\.env`. Contains:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 5. Google Drive Integration (Inventory Photos)

This is a critical system — understand it fully before making changes.

### Service Account
- **Email:** `firebase-adminsdk-fbsvc@thaiba-media-staging.iam.gserviceaccount.com`
- **Key File (local only, gitignored):** `D:\MediaHive App\serviceAccountKey.json`
- **Drive Root Folder ID:** `1nPv67BFL0XdPw7vZ4tPBfShByCOMBfHb`

### How Photos Get Uploaded
1. User taps **"Add Photo"** on the Asset Edit/Create page in the mobile app.
2. Photo is uploaded to the Vercel API route which streams it to Google Drive using the service account.
3. The `drive_file_id` is saved in the `inventory_items` table in Supabase.

### How Photos Are Displayed
1. The app reads `drive_file_id` from the `inventory_items` row.
2. It calls `UrlHelpers.buildDriveProxyUrl(fileId)` to construct a proxy URL.
3. On Android emulator (dev): URL replaces `localhost` → `10.0.2.2` (loopback fix).
4. On production mobile: URL points to `https://thaiba-garden-media-manager.vercel.app`.
5. The Vercel API route `/api/drive/image/[id]` fetches from Google Drive using the service account and streams back the image.

### Drive Proxy API Route
- **File:** `D:\MediaHive App\src\app\api\drive\image\[id]\route.ts`
- **Thumbnail URL:** `/api/drive/image/{fileId}?thumbnail=true`
- **Full Image URL:** `/api/drive/image/{fileId}`
- **Auth:** `src\lib\drive-config.ts` — reads `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` env vars
- **Client:** `src\lib\drive.ts` — singleton Google Drive client (cached between requests)

### Linking Existing Photos (Bulk Script)
If photos already exist in Google Drive and need to be linked to inventory items:
- **Script:** `D:\MediaHive App\scratch\link-drive-photos.js`
- **How it works:** Lists files in the Drive folder, matches filename (e.g., `TGMD227.jpg`) to `asset_id` in Supabase, updates `drive_file_id` column.
- **Usage:** `node scratch/link-drive-photos.js` from `D:\MediaHive App\`

### Currently Linked Items (as of Jun 2026)
| Asset ID | Item Name | Drive File ID |
| :--- | :--- | :--- |
| `TGMD227` | 128GB SanDisk Memory Card 200MB/s SDHC V30 | `1T1Y2NFCitjsQRnM0-fkmjuIK596qNiSP` |
| `TGMD193` | ATEM Mini Pro | *(linked via script)* |

---

## 6. Key Directory Structure

```
D:\MediaHive App\
├── src/
│   ├── app/
│   │   ├── (shell)/           # Authenticated dashboard views
│   │   └── api/
│   │       └── drive/
│   │           └── image/[id]/route.ts   # 🔑 Google Drive image proxy
│   ├── lib/
│   │   ├── drive.ts           # Google Drive singleton client
│   │   ├── drive-config.ts    # Env var validation + key formatting
│   │   └── driveUtils.ts      # getDriveImageUrl() helper for UI
│   ├── components/            # Reusable UI components
│   ├── features/              # Domain feature modules
│   ├── services/              # Canonical data mapping layer
│   └── types/                 # TypeScript + Zod schemas
├── public/
│   └── brand/                 # 🎨 Canonical brand assets (icon, wordmarks)
├── mediahive_mobile/          # Flutter mobile app
├── website/                   # 🌐 Cinematic 3D scroll marketing landing page (Vite)
├── scratch/                   # Utility/one-off scripts (not committed)
│   ├── link-drive-photos.js   # Links Drive photos to Supabase inventory
│   ├── deploy-env.js          # CLI-based Vercel env var deployment
│   └── vercel-api-deploy.js   # REST API-based Vercel deployment (preferred)
├── serviceAccountKey.json     # 🔒 Google service account key (GITIGNORED)
├── MASTER_BLUEPRINT.md        # ← This file (web app + platform overview)
└── package.json
```

---

## 7. Mobile App Architecture

See `mediahive_mobile/MASTER_BLUEPRINT.md` for the full Flutter-specific blueprint.

### Key Mobile Files
| File | Purpose |
| :--- | :--- |
| `lib/core/utils/url_helpers.dart` | Builds Drive proxy URLs; replaces `localhost` → `10.0.2.2` on Android emulator |
| `lib/features/inventory/data/repositories/supabase_inventory_repository.dart` | Maps `drive_file_id` from Supabase; saves it on updates |
| `lib/main.dart` | App entry point — Supabase + Firebase init |
| `.env` | Local env config (Supabase URL + key) |

### Android Emulator Loopback Fix
When running on Android emulator during development, the API host `localhost` must be replaced with `10.0.2.2` (Android's loopback alias to the host machine). This is handled automatically in `url_helpers.dart` via a `kIsAndroidEmulator` check.

---

## 8. Common Workflows

### Deploying Vercel Environment Variables
**Preferred method (avoids 10MB CLI upload limit):**
```bash
node scratch/vercel-api-deploy.js
```
This script:
1. Sets all 3 Drive credentials in Production, Preview, and Development via Vercel REST API.
2. Triggers a production redeployment of the latest deployment (not a fresh build upload).

**Why not `vercel deploy --prod`?** The project exceeds Vercel CLI's 10MB body limit for uploads. Use the API approach above instead.

### Updating Vercel Env Vars (Single Variable)
```bash
vercel env add VARIABLE_NAME production --value "value" --yes --force --token=<TOKEN> --scope=abdul-shukoors-projects
```
Run from `D:\MediaHive App\` (NOT from any subdirectory).

### Running Local Dev Server (Next.js administrative app)
```bash
pnpm dev
```
Runs on `http://localhost:3000`. The mobile emulator reaches this via `http://10.0.2.2:3000`.

### Running Local Dev Server (Marketing Landing Page)
```bash
cd website
npm run dev
```
Runs on `http://localhost:3000` (make sure port 3000 is free or check Vite terminal).


---

## 9. Architecture Rules

> [!IMPORTANT]
> ### API Origin Invariant (Web vs. Mobile)
> - **Web (Development & Vercel):** Uses relative paths (`/api/*`). Do NOT set `NEXT_PUBLIC_API_URL` for web builds.
> - **Mobile (Capacitor/Flutter):** Must use absolute URL (`https://thaiba-garden-media-manager.vercel.app`) because mobile assets run from a local file origin and cannot do relative routing.

> [!WARNING]
> ### Tailwind Dialog Width Overrides
> To override default dialog widths (capped at `max-w-lg` via `sm:max-w-lg` in `dialog.tsx`):
> - **Incorrect:** `className="max-w-[1100px]"`
> - **Correct:** `className="sm:max-w-[1100px]"`
> The `sm:` prefix ensures `tailwind-merge` correctly replaces the default value.

> [!NOTE]
> ### Offline Architecture
> Offline sync has been formally disabled. `queueManager.ts` is stubbed out. Do not attempt to re-enable without a complete rewrite. The UI shows `OfflinePlaceholder` components when disconnected.

---

## 10. Database Tables (Key)

| Table | Purpose | Notable Columns |
| :--- | :--- | :--- |
| `profiles` | Users and auth roles | `id`, `role`, `institution_id`, `tenant_id` |
| `tenants` | Top-level organizations | `id`, `name` |
| `institutions` | Branches/campuses | `id`, `tenant_id`, `name` |
| `inventory_items` | Asset catalog | `id`, `asset_id`, `name`, `drive_file_id` ← Drive photo link |
| `files` | Uploaded file metadata | `id`, `drive_file_id`, `upload_context`, `thumbnail_link` |
| `tasks` | Task tracking | `id`, `status`, `assignee_id`, `due_date` |
| `equipment_bookings` | Reservation queue | `id`, `item_id`, `user_id`, `start_date`, `end_date` |
| `leave_requests` | HR leave | `id`, `user_id`, `status`, `dates` |

---

## 11. Credentials & Security

| Secret | Location | Notes |
| :--- | :--- | :--- |
| Supabase service role key | `.env` (local) + Vercel dashboard | Never expose in client code |
| Google service account key | `serviceAccountKey.json` (gitignored) | Used by `drive.ts` singleton |
| Firebase admin key | `.env` (local) + Vercel dashboard | Used for FCM server-side |
| Vercel access token | `scratch/deploy-env.js` (local only) | `vcp_3g1s...` — rotate if exposed |

> [!CAUTION]
> `serviceAccountKey.json` must NEVER be committed to git. It is in `.gitignore`. If accidentally committed, rotate the key immediately in Google Cloud Console.

---

## 12. Changelog

| Date | Change | Author |
| :--- | :--- | :--- |
| Jun 13, 2026 | Added `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` to all Vercel environments | AI Agent |
| Jun 13, 2026 | Patched `url_helpers.dart` — Android emulator loopback fix (`localhost` → `10.0.2.2`) | AI Agent |
| Jun 13, 2026 | Patched `supabase_inventory_repository.dart` — correctly maps `drive_file_id` from DB payload | AI Agent |
| Jun 13, 2026 | Created `scratch/link-drive-photos.js` — bulk Drive photo linker script | AI Agent |
| Jun 13, 2026 | Created `scratch/vercel-api-deploy.js` — Vercel REST API deployment script (replaces broken `vercel deploy --prod`) | AI Agent |
| Jun 13, 2026 | Linked `TGMD227` (SanDisk Memory Card) photo in Supabase | AI Agent |
| Jun 13, 2026 | Created this Master Blueprint | AI Agent |
| Jun 13, 2026 | Replaced all web logo and brand text assets with the finalized fixed designs | AI Agent |
| Jun 13, 2026 | Created canonical `public/brand/` folder, updated all React/Next.js components to use new single-source logo and wordmark assets | AI Agent |
| Jun 13, 2026 | Fixed background frame PNG images path mapping to correctly load numeric files 1.png to 30.png from the public directory | AI Agent |
| Jun 13, 2026 | Implemented staggered letter-by-letter Aceternity Flip Words text animation effect using GSAP on landing page | AI Agent |
| Jun 13, 2026 | Replaced 3D tilt text layout with custom SVG-based Aceternity UI Text Hover Effect featuring linear/radial gradients, dynamic cursor spotlight mask, and automatic breathing shine | AI Agent |
| Jun 13, 2026 | Extended scroll trigger timeline limits to make 'Meet MediaHive' text visible from 1800px and stay till 2800px | AI Agent |
| Jun 13, 2026 | Updated 'Meet MediaHive' SVG text to a 2-line layout ('Meet' / 'MediaHive.') with 1:2 font size ratio (60px/120px) and adjusted viewBox height to 300 | AI Agent |
| Jun 13, 2026 | Shifted Platform Overview block to the left (left: 8vw) and visually doubled the size of the 'Meet MediaHive' SVG text spotlight (scaled font-size to 120/240 and shifted to left: 68% for balance) | AI Agent |
| Jun 13, 2026 | Centered 'Meet MediaHive' SVG text by default and expanded position editor tool (lil-gui) to control both spotlight text and platform overview card properties | AI Agent |
| Jun 13, 2026 | Applied finalized layout parameters from GUI editor tuning: shifted spotlight text container to left: 45% (top: 30%) and repositioned platform overview card to top: 44%, left: 8%, and width: 28vw | AI Agent |
| Jun 13, 2026 | Adjusted spotlight text height position to top: 25% (left: 45%) based on fine-tuning layout settings | AI Agent |
| Jun 13, 2026 | Replaced logo PNG frame sequence with `Media Hive final logo.webm` video file scrubbed via ScrollTrigger, and added comprehensive logo controls (scroll limits, position, scale, rotation, fade timing) to the lil-gui tuning panel | AI Agent |
| Jun 13, 2026 | Completely removed the WebM logo overlay and the lil-gui tuning editor/positioning tool from the codebase, deleting the logo-sequence directory and package dependencies | AI Agent |
| Jun 13, 2026 | Extended scroll value box (#frame-debugger) to be a direct child of body so it remains fixed and visible until the end of the website page | AI Agent |
| Jun 13, 2026 | Extended ScrollTrigger pinning duration to 3100px (timeline end: +=3100) and updated final spotlight text opacity animations to keep it visible from 1800px to 3100px | AI Agent |
| Jun 13, 2026 | Extended ScrollTrigger pinning duration to 3500px (timeline end: +=3500) and updated spotlight text animations to stay active from 1800px to 3500px (fade out starts at 3400px / 0.971 progress) | AI Agent |
| Jun 13, 2026 | Unified the landing page background to a single continuous scrolling screen flow using GSAP-animated ambient glows, a parallax digital grid, and a procedural film grain overlay, and upgraded all page cards to use frosted glassmorphism | AI Agent |
| Jun 13, 2026 | Integrated #hero-dark-glow and #hero-bottom-fade overlays into the main GSAP ScrollTrigger timeline to fade them to 0 alongside the desk sequence, scaled the laptop model to 2.8, and positioned it at y = 0.3 to completely eliminate any rendering cuts and visual breaks | AI Agent |
| Jun 13, 2026 | Adjusted the spotlight text fade-out animation to end at 2800px (timeline progress 0.8) and start at 2700px (timeline progress 0.771) on the 3500px timeline | AI Agent |
| Jun 13, 2026 | Repositioned the Platform Overview Card (#desktop-overlay) fade-in trigger to start at 2700px (timeline progress 0.771) on the 3500px timeline | AI Agent |
| Jun 13, 2026 | Integrated the ReactBits-inspired animated "Silk" WebGL shader background using vanilla Three.js on a full-screen canvas (#global-silk-canvas) inside the fixed background container, rendering a deep indigo-purple flowing fabric texture that blends with scrolling glows and film grain | AI Agent |
| Jun 14, 2026 | Fixed 5 failing unit test suites (policyEvaluator context cloning, enforcementEngine rule matching logic, missing const variables in governanceEngine, TasksPage breadcrumb duplicate h1 queries, and normalization toDate invalid date parsing + normalizeEvents precedence rules) | AI Agent |
