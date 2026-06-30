# MediaHive Master Blueprint

This document serves as the single source of truth for the **MediaHive Windows app** codebase. It provides all architectural context, technology stacks, API connections, directory layouts, and design choices for developers building, maintaining, or scaling this application.

---

## 1. Project Overview

**MediaHive Desktop** is a Tauri-wrapped Next.js application designed as a premium, high-performance **cyber-luxury media and production workspace** for creative agencies and studio teams.

### Primary Goals
*   **Media & Asset Organization**: A unified library to view, search, upload, and delete high-resolution media (photos, videos, audio, documents).
*   **Production & Campaign Planning**: Collaborative spaces to manage schedules, shoots, and productions.
*   **Realtime Team Collaboration**: Multi-participant direct/group messaging, live system notifications, and request approvals (leave, equipment, event changes).
*   **Cyber-Luxury UI/UX**: An immersive, dark glassmorphism dashboard styled with fluid motion, dynamic animations, and interactive elements.
*   **Desktop App Wrapper**: Provides a native desktop environment (minimized window sizes, native log plugins, local dev-server checks) decoupling key services from standard web limitations.

---

## 2. Tech Stack & Libraries

MediaHive is built on a hybrid architecture combining a high-performance **Rust desktop wrapper** and a **Next.js Single Page App (SPA)**.

### Core Desktop Shell
*   **Host Wrapper**: [Tauri v2.11.2](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src-tauri/tauri.conf.json) (Rust-based WebView shell)
*   **Rust Version**: `1.77.2` (configured in [Cargo.toml](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src-tauri/Cargo.toml))
*   **Tauri Plugins**:
    *   `tauri-plugin-log v2`: For shipping app events directly to native debugger logs.
    *   `urlencoding v2.1.3`: Handles URL escaping for offline error view routing.

### Frontend Web Framework
*   **Core UI**: Next.js App Router `v16.2.7` ([package.json](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/package.json))
    *   *Configuration*: Configured for static builds via `output: "export"` in [next.config.ts](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/next.config.ts), allowing the compiled frontend to load directly from local directories.
*   **State & Runtime**: React `v19.2.4` & TypeScript `v5`
*   **Animations**: `framer-motion v12.40.0`

### Design System & Styling
*   **Aesthetic Theme**: *MediaHive Cyber-Luxury v2.1* (Dark Glassmorphism).
*   **Variables & Tokens**: Defined in [globals.css](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/app/globals.css) (Frosted obsidian layers, custom spacing system, status indicators, and aurora backgrounds).
*   **Styling Engine**: Tailwind CSS `v4.3.0` via `@tailwindcss/postcss` and PostCSS `v8.5.15`.
*   **Key Utilities**: `class-variance-authority`, `clsx`, `tailwind-merge` for conditional class joining, and `tw-animate-css` for micro-interactions.
*   **Iconography**: `lucide-react v1.17.0`.
*   **Fonts**: Outfit font family (`--font-outfit`) imported from Google Fonts inside [layout.tsx](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/app/layout.tsx).

### UI Components & Primitives
*   **Primitives**: Radix UI (Dialog, Label, Slider), Base UI `v1.5.0`.
*   **Components**: Built utilizing `shadcn v4.10.0` design patterns.
*   **Specialty Modules**: `react-easy-crop v5.5.7` for image manipulation and crop utilities.

### Backend-as-a-Service (BaaS)
*   **Client Core**: `@supabase/supabase-js v2.45.0`
*   **Server Utilities**: `@supabase/ssr v0.9.0` (provides auth persistence in desktop environments).

---

## 3. Backend & API Connections

### Supabase Connection
*   **Supabase Project Endpoint**: `https://fcctcorycpvebupluzpe.supabase.co`
*   **Credentials**: Configured dynamically using client-side environment keys in [.env.local](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/.env.local):
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   **Database Client**: Initialized globally in [supabaseClient.ts](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/lib/supabaseClient.ts) with active session persistence.

### Supabase Database Tables
1.  **`profiles`**: User details (full_name, email, role, tenant_id, avatar_url, avatar_drive_id) mapping directly to Supabase Auth (`auth.users.id`).
2.  **`files`**: Primary directory for media metadata (name, file_url, storage_path, file_type, file_size, drive_file_id, uploaded_by_id, tenant_id).
3.  **`chat_rooms`**: Messaging channels (fields tracking name, type, icon_url, last_message_time).
4.  **`chat_participants`**: Many-to-many mapping connecting profiles to rooms they join.
5.  **`chat_messages`**: Chat history (fields for message content, sender, timestamp).
6.  **`notifications`**: User alert entries (with status tracking: `is_read`, target `user_id`).
7.  **`tasks`**: Task checklist items (includes kanban statuses like `in_progress` or `rejected`, deletion markers, and descriptions).
8.  **`events`**: Calendar shoots and appointments.
9.  **`productions`**: High-level media campaigns/projects.
10. **`departments`**: Tenant sub-structures.
11. **`invitations`**: Email invitations sent to new members ([20240604_create_invitations.sql](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/supabase/migrations/20240604_create_invitations.sql)).

### Row Level Security (RLS) Policies
Row-level security is enforced on the database layer. Refer to [20260606103400_enable_rls.sql](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/supabase/migrations/20260606103400_enable_rls.sql):
*   A helper function `public.get_user_tenant_id()` is evaluated on request:
    ```sql
    CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
    RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
      SELECT tenant_id FROM profiles WHERE id = auth.uid();
    $$;
    ```
*   Data read/write permissions on tables (such as `files` and `invitations`) are locked down to match `tenant_id = get_user_tenant_id()`.

### Supabase Storage Buckets
*   **`files`**: Primary storage for user uploads. Uploads are segregated by institution folder: `{institution_id}/{timestamp}_{filename}`.
*   **`media-library`**: Fallback bucket.

### Google Drive Integration & Proxies
To bypass CORS and access restricted media assets, MediaHive routes Google Drive files through custom URLs:
*   **Production Vercel Proxy URL**: `https://thaiba-garden-media-manager.vercel.app/api/drive/image/${file_id}`
*   **Google Drive Thumbnail CDN**: `https://drive.google.com/thumbnail?id=${file_id}&sz=s1000` (sz requests pixel bounds, default size `s1000` or `w800`).
*   *Implementation Location*: [driveUtils.ts](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/lib/driveUtils.ts).

---

## 4. Key Directory Structure

```
MediaHive Windows app/
├── .mcp.json                    # MCP tools configurations
├── components.json              # Shadcn configuration (defines import paths)
├── next.config.ts               # Next.js configurations (static output settings)
├── package.json                 # Dependency manifest
├── src-tauri/                   # Rust Tauri desktop layer
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Main Tauri configurations (window sizes, bundle targets)
│   ├── error.html               # Fallback page loaded when dev-server is offline
│   └── src/
│       ├── main.rs              # System subsystem flag and app entry-point hook
│       └── lib.rs               # Setup checks (dev-server TCP checkers)
├── src/                         # Next.js frontend code
│   ├── app/                     # Page views and routing logic
│   │   ├── layout.tsx           # Global Providers & Body styles Injection
│   │   ├── globals.css          # Design System tokens (Glassmorphic variables, theme rules)
│   │   ├── login/               # User authentication panel
│   │   ├── media/               # Media viewer and upload/delete manager
│   │   ├── tasks/               # Kanban board & tasks approvals panel
│   │   ├── chat/                # Realtime chat rooms & direct message windows
│   │   └── settings/            # Theme & profile parameters
│   ├── components/              # Shared React components
│   │   ├── ui/                  # Atom-level UI styling structures (buttons, slider, glows)
│   │   ├── chat/                # Chat layout panels (Sidebar, Add user dialogs)
│   │   ├── AuthGuard.tsx        # Client side session router protection
│   │   ├── DesktopShell.tsx     # Shell navigation layout (sidebar, window chrome wrapper)
│   │   └── ShellWrapper.tsx     # Context router hiding chrome on login page
│   ├── contexts/
│   │   └── AuthContextProvider.tsx # Supabase session handler and profile loading context
│   ├── lib/                     # Custom helper functions
│   │   ├── hooks/
│   │   │   └── useMouseLight.ts # Glow cursor coordinator tracking mouse light
│   │   ├── supabaseClient.ts    # Supabase Client singleton builder
│   │   ├── driveUtils.ts        # Drive direct-links URL formatter
│   │   ├── chatUnreadTracker.ts # Client unread badges calculation manager
│   │   └── eventBus.ts          # Custom global event pub/sub helper
│   └── types/                   # TypeScript interfaces
└── supabase/
    └── migrations/              # SQL schema changes
```

---

## 5. Common Workflows & Known Quirks

### Turbopack Function Inlining TDZ Bug (Next.js 16 Turbopack)
Next.js 16 uses Turbopack which aggressively inlines small helper functions. If an inlined function uses `const`/`let` variables and gets placed *before* a sibling `let` declaration in the component body, it creates a **Temporal Dead Zone (TDZ)** violation (`ReferenceError: Cannot access 'X' before initialization`). Fix: inline function calls manually at the component level, avoiding helper functions that wrap `useId()` or similar React hooks. See `etheral-shadow.tsx` for a resolved example — the `useInstanceId()` helper was inlined to `const generatedId = useId().replace(...)`.

### Dev-Server TCP Connection Fallback (Tauri)
During local development in debug mode, if a developer launches the Tauri desktop client but forgets to run the Next.js dev server, Tauri will fail to load `http://localhost:3000`. 
*   **Behavior**: [lib.rs](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src-tauri/src/lib.rs) spawns a thread checking for an active TCP connection to `127.0.0.1:3000`. If it errors out, the main window is redirected to a locally embedded [error.html](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src-tauri/error.html) explaining how to spin up the local server.

### Next.js Static Export (`output: "export"`) Limitations
Next.js outputs static HTML/CSS/JS rather than running a Node server in production:
*   **Unoptimized Images**: The standard Next `<Image />` component relies on a Node backend to compress images. Thus, the config sets `images: { unoptimized: true }`.
*   **Dynamic Client Routing**: All paths must be dynamically resolvable on the client without runtime server-side rendering (SSR) dependencies.

### Dual Storage Routing: Supabase vs Google Drive
The media page ([media/page.tsx](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/app/media/page.tsx)) retrieves assets from multiple storage environments:
1.  **Google Drive**: Decoded using [driveUtils.ts](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/lib/driveUtils.ts) by extracting the unique file ID from stored URLs. Formats images using the `s1000` thumbnail API or calls the custom Vercel proxy.
2.  **Supabase Storage**: Fetched from the `files` or `media-library` bucket. The app makes an asynchronous client-side call to `supabase.storage.from('files').createSignedUrl(storagePath, 3600)` to obtain a secure read URL.

### LocalStorage Client-Side Chat Unreads
Because room updates can be frequent, unread chat message badges are calculated client-side to reduce database read load:
*   When a user views a room, their current time is written to `localStorage` under `mediahive_chat_last_read_${userId}`.
*   Unread statuses compare `last_message_time` (from the room data) against this value.
*   Updating this value triggers a `chat_unread_sync` event through [eventBus.ts](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/lib/eventBus.ts), forcing sidebar counters to redraw and update the parent UI badges instantly.

### Native HTML5 Drag & Drop Unreliable in Tauri/WebView2
The native HTML5 Drag and Drop API (`draggable`, `dataTransfer.getData/setData`, `ondragover`, `ondrop`) is **unreliable** in Tauri's WebView2 runtime on Windows. Two specific issues:
1. `e.dataTransfer.getData("text/plain")` returns an **empty string** during `drop` events in WebView2 (a Chromium security restriction).
2. React's synthetic event system introduces race conditions between `dragEnd` and `drop` event ordering.
**Fix**: Do NOT use native HTML5 DnD. The kanban board in `src/app/tasks/page.tsx` uses `@dnd-kit/core` v6.3.1 instead, which handles all DnD state management via `useDraggable`/`useDroppable` hooks and avoids WebView2 data transfer issues entirely. If adding new DnD features, always use `@dnd-kit`.

### Global Mouse Light Glow Effect
The premium glowing design is coordinated via a global hook [useMouseLight.ts](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/lib/hooks/useMouseLight.ts).
*   It is loaded once in [ShellWrapper.tsx](file:///d:/MediaHive%20App/MediaHive%20Windows%20app/src/components/ShellWrapper.tsx) for all authenticated, shell-rendered pages.
*   It updates global document styling elements to allow hover cards and buttons to draw dynamic highlight layers tracking the cursor.

### System Tray, Desktop Lifecycle & System Integrations
The app breaks out of normal web lifecycle constraints using a suite of native Tauri plugins:
*   **Tray Presence**: Managed in `lib.rs` using `TrayIconBuilder`. Left-clicking toggles visibility, right-clicking presents a context menu to truly Quit.
*   **Close vs Quit**: Clicking the OS 'X' intercepts the `CloseRequested` event and hides the window to the tray. True process termination only occurs when `is_quitting` is flagged true by the tray's Quit option.
*   **Autostart**: Driven by `tauri-plugin-autostart`. The frontend triggers a native OS registration, and the Rust backend checks for the `--autostart` CLI flag to suppress main window visibility on launch.
*   **Notifications**: Using `@tauri-apps/plugin-notification`, the app listens to Supabase realtime inserts on the `chat_messages` table and fires native Windows toasts *only* if the main window is hidden or minimized.
*   **Global Shortcuts**: `CmdOrCtrl+Shift+M` unminimizes and focuses the app instantly, managed via `tauri-plugin-global-shortcut`.
*   **Deep Linking**: Listens to the custom protocol `mediahive://` via `tauri-plugin-deep-link` and routes dynamically in `ShellWrapper.tsx`, relying on `tauri-plugin-single-instance` to prevent multiple processes on Windows.
*   **OTA Auto-Updater**: Integrates `tauri-plugin-updater` polling a static GitHub JSON manifest (`latest.json`), downloading binaries in the background, and prompting the user to restart using a custom React `UpdatePrompt.tsx`.
*   **Window State Persistence**: Recalls previous desktop window positions and sizing via `tauri-plugin-window-state`.

---

## 6. Changelog
| Date | Description | Author |
| :--- | :--- | :--- |
| 2026-06-30 | **Fixed CI/CD Release Pipeline & Updater Artifacts**: Upgraded pnpm-setup to v4 in workflow. Removed invalid eslint config keys and conditionally configured turbopack root to compile Next.js cleanly on Windows runners. Swapped tauri-plugin-snap-layout from Git dependency to crates.io version to bypass Git clone access failures (exit code 128). Switched to passwordless updater signing keys to resolve decryption errors, and enabled createUpdaterArtifacts to compile setup.exe, signature, and latest.json. | AI Agent |
| 2026-06-30 | **Windows 11 Snap Layouts & Native Self-Updater**: Replaced decorum with `tauri-plugin-snap-layout` for reliable hover layouts. Improved hit sensation by widening controls to 48px and increasing Titlebar height to 40px (updating `globals.css` offsets). Connected `SystemUpdatesPage` and `UpdatePrompt` to native `tauri-plugin-updater` to enable fully functional startup checks, downloads, and app restarts. | AI Agent |
| 2026-06-30 | **Windows 11 Snap Layouts integration**: Installed and integrated `tauri-plugin-decorum` v1.1.1. Configured Rust setup (`lib.rs` to register the plugin and trigger `create_overlay_titlebar()`) and capability permissions (`decorum:allow-show-snap-overlay` in `default.json`). This restores native Windows 11 snap layout flyout behavior on hover/click of the custom titlebar. | AI Agent |
| 2026-06-30 | **Persisted Telemetry Logs & UI Viewers**: Refactored `logDiagnostic` to save logs to `localStorage` (capped at 200 events) and dispatch real-time events. Created `TelemetryModal.tsx` for viewing, clearing, and copying logs. Integrated telemetry triggers in the Login page, the DesktopShell user profile menu, and the window Titlebar (visible in Tauri). Redeployed the production app. | AI Agent |
| 2026-06-30 | **Production Vercel deployment & PC diagnostic logger:** Created a real-time filesystem diagnostic logger (`/api/diagnostic-log`) that outputs logs to `auth_diagnostic_log.txt`. Configured `.vercelignore` and `.vercel/project.json` to successfully link and deploy the Next.js subdirectory to Vercel without uploading Rust target folders or hitting a 10MB body size limit. Resolved a browser redirect scrubbing issue by selectively deleting `trigger=google` while preserving `source=tauri` query parameters. | AI Agent |
| 2026-06-30 | **AuthGuard routing callback fix:** Added `/auth/callback` to the list of `PUBLIC_ROUTES` to prevent the router from immediately redirecting the callback page to the login screen before the code exchange is completed. | AI Agent |
| 2026-06-30 | **PKCE Auth Callback & Error Deep-Link Ignore:** Updated `src/app/auth/callback/page.tsx` to explicitly exchange the PKCE code for a session on the browser client and forward the tokens to the Tauri app deep link. Updated `src/components/ShellWrapper.tsx` to ignore error-related deep links for the first 2 seconds of startup, preventing cached launch arguments from hijacking the initial window layout. | AI Agent |
| 2026-06-30 | **Intercept Tauri deep link tokens for manual login:** Updated the onOpenUrl callback handler in `ShellWrapper.tsx` to be asynchronous, intercepting `mediahive://login` deep links and logging the user in inside the Tauri webview using `supabase.auth.setSession` with extracted access and refresh tokens. | AI Agent |
| 2026-06-30 | **Revert detectSessionInUrl & Tauri OAuth Deep Link Fixes:** Reverted the conditional detection check in `supabaseClient.ts` to `detectSessionInUrl: true` so the browser client successfully exchanges the PKCE code. Updated the callback handler in `src/app/auth/callback/page.tsx` to wait/poll for the session, extract access/refresh tokens, and forward them in the URL hash to Tauri via the `mediahive://login` deep link protocol. | AI Agent |
| 2026-06-30 | **Disabled callback session detection & adjusted Titlebar CSS:** Updated Supabase client to disable session/PKCE detection in external browsers when initiated from Tauri (`source=tauri`). Removed arbitrary hidden/flex utility classes from `Titlebar.tsx` container, implementing pure CSS rules in `globals.css` to hide `.window-titlebar` on normal browsers and show it exclusively on desktop wrappers via `.desktop-app .window-titlebar`. | AI Agent |
| 2026-06-30 | **Hydration & Auth Redirect Optimizations:** Added synchronous deep link redirect check at the top of `src/app/auth/callback/page.tsx` to prevent the browser's Supabase client from exchanging PKCE code. Refactored `Titlebar.tsx`, `useIsTauri.ts`, and `WindowContext.tsx` to initialize `isDesktop` to `false` and update state/document class dynamically on mount, resolving hydration mismatches, and rendering titlebar natively via CSS classes (`hidden [.desktop-app_&]:flex`). | AI Agent |
| 2026-06-30 | **Tauri Titlebar Colors & Synchronous isTauri Detection:** Standardized the window titlebar text and window control button hover styles in `Titlebar.tsx` to use standard tailwind colors (`text-zinc-400` and `hover:text-white`). Refactored `useIsTauri.ts` and `WindowContext.tsx` to initialize the `isDesktop` state synchronously by instantly checking the global `window` object properties for Tauri variables (`__TAURI_INTERNALS__`, `__TAURI__`, or `isTauri`) during mount. | AI Agent |
| 2026-06-30 | **Robust Tauri Detection & Desktop CSS Class:** Updated `useIsTauri.ts` and `WindowContext.tsx` to use an extremely robust check for Tauri (`window.__TAURI_INTERNALS__`, `window.__TAURI__`, `window.isTauri`). Added a `useEffect` inside `WindowContext.tsx` to dynamically append the `desktop-app` class to the document root element when running inside the desktop wrapper. | AI Agent |
| 2026-06-30 | **Tauri deep link callback page and AuthGuard routing:** Created `/auth/callback` page in `src/app/auth/callback/page.tsx` to handle authentication deep links back to Tauri (`mediahive://login`). Updated `loginWithGoogle` in `AuthContextProvider.tsx` to redirect to the new callback URL (`/auth/callback?source=tauri`). Added `/auth/error` and `/auth/callback` to `NO_SHELL_ROUTES` in `ShellWrapper.tsx`. | AI Agent |
| 2026-06-30 | **Tauri Deep-Link and Google OAuth Redirect Fixes:** Enabled `detectSessionInUrl: true` in `supabaseClient.ts` to allow session detection on deep-linked webview reload. Updated `loginWithGoogle` in `AuthContextProvider.tsx` to redirect to `mediahive://login` when inside Tauri app. Enhanced parsing in `ShellWrapper.tsx` to handle route mapping with host and pathname correctly. | AI Agent |
| 2026-06-30 | **Conditional detectSessionInUrl:** Updated `supabaseClient.ts` to conditionally enable `detectSessionInUrl` based on whether the code is running in a browser environment and not in Tauri (`typeof window !== 'undefined' && !('isTauri' in window)`). | AI Agent |
| 2026-06-30 | **DesktopShell Brand Logo Resize Upgrade:** Increased brand logo wrapper size from `w-9 h-9` to `w-10 h-10` and removed its internal padding (`p-0.5` to `p-0`) in `src/components/DesktopShell.tsx` to make it even more prominent. Verified compile build successfully. | AI Agent |
| 2026-06-30 | **DesktopShell Brand Logo Resize:** Increased brand logo wrapper size to `w-9 h-9` and decreased internal padding from `p-1` to `p-0.5` in `src/components/DesktopShell.tsx` to make it larger and clearer. Verified compile build successfully. | AI Agent |
| 2026-06-30 | **DesktopShell Brand Logo Update:** Replaced placeholder `Film` icon in brand header sidebar with real MediaHive logo icon image tag. Verified compile build successfully. | AI Agent |
| 2026-06-30 | **Layout background adjustments:** Removed solid `bg-black` class from `<body>` and changed viewport container background from `bg-[var(--bg-primary)]` to `bg-transparent` in `src/app/layout.tsx` to allow gradient backdrop to show through. | AI Agent |
| 2026-06-30 | **DesktopShell background fix:** Changed `backgroundColor` from `var(--bg-primary)` to `background: "transparent"` in the root `.desktop-shell-root` container to prevent overriding the body's premium dual-tone gradient background. | AI Agent |
| 2026-06-30 | **Background Gradient Relocation:** Moved the dark mode body background gradient override to the bottom of `globals.css` to prevent reset conflicts and adjusted the glow color from `#1a1610` to `#221a10` to make card glassmorphism depth pop. | AI Agent |
| 2026-06-30 | **Premium Dark Gradient Background:** Added a warm, brand-accented dark radial gradient (`#1a1610` to `#030303`) to the dark mode body and set the background-color of `.main-workspace-shell` to transparent to make the backdrop gradient visible behind the faux-glass layout shell. | AI Agent |
| 2026-06-29 | **Professional Glassmorphism & Depth Upgrade:** Transitioned solid panel backgrounds to translucent values (`rgba`) inside dark mode definitions. Added high-fidelity GPU-accelerated backdrop blur (`backdrop-filter`) to sidebar, top header, dialog modals, right details drawer, metric pods, and studio cards. Fixed Tailwind color opacity rendering bugs by replacing raw variables with direct translucent assets. Added organic, slow-drifting Honey Yellow radial ambient background glows (`::before` / `::after`) behind the layout panels. Added smooth 3D translate-Y transforms and elevation drop-shadows on card hover states. | AI Agent |
| 2026-06-29 | **Mintlify Typography Alignment:** Imported `Geist_Mono` from `next/font/google` alongside `Inter` in `layout.tsx`. Resolved a circular CSS variable reference bug in `globals.css` that was shadowing the Next.js google font loader variable and defaulting to system fallback fonts. Configured custom font family variables `--font-sans` and `--font-mono` mapped to Tailwind v4. Added typography overrides for all headings `h1` through `h6` with matching Weights (600), Line-Heights (1.15 - 1.4), and Negative Letter-Spacing (-0.02em to -0.01em) matching Mintlify's design scale, and bound all code elements to Geist Mono. | AI Agent |
| 2026-06-29 | **Mintlify-Honey Theme Polish:** Cleaned up and re-themed remaining green/teal/indigo accent elements across all operational pages (Chat, Inventory, Settings, Governance, Insights, Auth Error, Notifications, Events, Downloads, Profile, Leave Management). Re-themed `BreadcrumbTabs.tsx` active sub-navigation pills, settings tabs, and inventory pills to use a new `.active-tab-capsule` utility class defined in `globals.css` for reliable background and border rendering. Re-themed chat sidebar rooms, avatars, unread counts, text fields, and sandbox loaders. Run `pnpm build` to verify 100% build health. | AI Agent |
| 2026-06-28 | **Kanban DnD rewrite — replaced broken native HTML5 API with `@dnd-kit/core` v6.3.1.** Completely replaced the unreliable native HTML5 Drag and Drop implementation (which silently failed in WebView2/Tauri due to `dataTransfer.getData()` returning empty and race conditions between `handleDragEnd` and `handleDrop`) with `@dnd-kit/core`. Created three components: `KanbanCardView` (card visuals), `KanbanCardDraggable` (uses `useDraggable`), and `KanbanColumnDroppable` (uses `useDroppable`). Wrapped the kanban board in `<DndContext>` with `<DragOverlay>` for smooth drag preview and proper `onDragEnd` handling. Removed all native DnD state (`draggedTaskId`, `dragOverColumn`, `draggedTaskIdRef`) and handler functions (`handleDragStart`, `handleDragOver`, `handleDragLeave`, `handleDrop`). | AI Agent |
| 2026-06-28 | **Implemented Kanban Drag-and-Drop functionality:** Added high-fidelity drag-and-drop support to the task board view in `src/app/tasks/page.tsx`. Integrated optimistic UI state updates with automatic Supabase network failure rollbacks, custom `dataTransfer` effects for WebView2/Tauri desktop reliability, visual glow indicators on active hover columns, and pointer-events masking to eliminate card cursor flickering. | AI Agent |
| 2026-06-28 | **Wired Tasks/Chats navigation, moved Leave Management, and fixed Calendar events fetch:** Modified `src/app/calendar/page.tsx` to use `start_at`, `end_at`, and `created_by` columns, and added local timezone-safe formatting helpers (`getEventLocalDate`, `formatEventTime`). Synced `viewMode` in `src/app/tasks/page.tsx` with the `view` URL query parameter, adding backlog view support. Filtered chat rooms in `src/components/chat/ChatLayout.tsx` via `tab` query param to separate Direct Messages and Channels. Moved Leave Management page from `/leave/request/page.tsx` to `/leave/page.tsx` and removed the old directory. | AI Agent |
| 2026-06-28 | **Wired up top bar navigation breadcrumbs/pills:** Extracted routing logic into a separate `BreadcrumbTabs.tsx` component and wrapped it in a `<Suspense>` boundary inside the shell header to avoid layout deoptimization. Handled dynamic route mapping to Next.js `Link` components, matched routes safely at segment boundaries, compared query parameter keys/values using `URLSearchParams` to prevent react-hydration mismatches, and added `.no-scrollbar` style helper and `min-w-0` to the flex container. | AI Agent |
| 2026-06-28 | **Fixed layout display and stretching bugs in Quick Create modals:** Fixed position override by adding `!fixed` (equivalent to `position: fixed !important`) to `DialogContent` in `dialog.tsx`, preventing custom `.glass-panel` styles (`position: relative`) from breaking modal centering. Excluded Radix portals from the Next.js App Router height propagation selectors in `globals.css` using `:not([data-radix-portal])` to prevent dialog overlays and contents from stretching to full viewport height. Modals are now properly sized and centered. | AI Agent |
| 2026-06-28 | **Fixed workspace root and dashboard empty state warning logs:** Configured `turbopack.root` in `next.config.ts` to point to the parent workspace directory (silencing Next.js warnings without breaking React Client Manifest path matching). Modified `AuthContextProvider.tsx` to delay setting `loading=false` until the user profile fetch is complete (or fails), resolving the race condition that caused false-positive `[Dashboard] User has no tenant_id. Showing empty state.` warning logs on initial mount. | AI Agent |
| 2026-06-28 | **Turbopack TDZ Bug Fix in EtheralShadow — Build Failure Resolution.** Discovered and fixed a Next.js Turbopack bundler bug that inlined the `useInstanceId()` helper function directly into the EtheralShadow component body, creating a Temporal Dead Zone (TDZ) violation: the `useId()` call was assigned to variable `o` *before* the `let o` declaration in the minified output. This caused `ReferenceError: Cannot access 'o' before initialization` during SSR/prerendering of `/admin`, `/leave/request`, and `/auth/error` pages. Fix: inlined `useInstanceId()` manually by replacing it with a direct `useId()` call at the component level. Production build now completes with all 36 static pages generated successfully. | AI Agent |
| 2026-06-28 | **Phase 3 Rust/Backend Hardening (Bug Fix Plan).** Replaced 10 bare `.unwrap()` calls in `lib.rs` with `if let Err(e) = ...` + `log::error!`. Removed `features = ["deep-link"]` from `tauri-plugin-single-instance` to eliminate double deep-link registration; made single-instance callback a no-op and added dedicated `app.listen("deep-link://new-url")` listener for re-focus. Moved `window.navigate()` from background thread to `run_on_main_thread` to avoid UB. Enabled `tauri-plugin-log` in release builds with `Warn` level. Disabled `detectSessionInUrl` in supabaseClient.ts for Tauri context. `cargo check` passes clean. | AI Agent |
| 2026-06-22 | **Accessibility Fixes for Quick-Create & Chat Modals.** Added screen-reader-only `DialogDescription` components to all five quick-create modals (CreateTaskModal, CreateEventModal, FileUploadModal, CreateInventoryModal, CreateNotificationModal) and updated all five chat-related modals (AddUserModal, ChatSidebar, GroupIconUploadModal, GroupInfoSidebar, MediaCaptureModal) to include semantic/screen-reader-only `DialogDescription` elements inside their headers. This completely silences all Radix UI accessibility console warnings in the Tauri and web clients. Verified clean build and type check. | AI Agent |
| 2026-06-22 | **Home Page Quick-Create Modals & Drawer Role Alignment.** Implemented five inline quick-create modals (Task, Event, File Upload, Inventory, Notification) using Radix UI Dialog components. Integrated dynamic role-based visibility and field locking (assignee, priority, status) based on role enum (admin, manager, team, member/guest). Configured custom event reactivity (`mediahive:dashboard-refresh`) to update the Home page stats in-place. Modified the Tasks drawer (`src/app/tasks/page.tsx`) to enforce identical role locks, eliminating divergent behaviors. Verified 100% clean type check. | AI Agent |
| 2026-06-22 | **Desktop Task Creation Modal UI & Auto-Open Fix.** Defined missing `.glass-panel` and `.glass-card` classes in `globals.css` to resolve transparent modal backgrounds and bleed-through issues across the app. Added `.glass-form-input` styling for text fields, textareas, selects (custom arrow), and date inputs (calendar picker tint). Refactored tasks page to wrap its content in a `<Suspense>` boundary and used Next.js's native `useSearchParams` reactively with a one-shot `useRef` guard to auto-open the task creation modal upon navigating with `?create=true` from the home page. Verified typecheck compiles clean. | AI Agent |
| 2026-06-22 | **Desktop Quick Create Route 404 Fix.** Resolved 404 "Node Not Found" errors when clicking quick create items from the global "+ Create" button. Changed href targets in `MasterCreateButton` to point to main pages with query parameters (e.g. `/tasks?create=true`). Implemented client-side `useEffect` parameter checking hooks using offline-safe `URLSearchParams` in Tasks, Events, Media, Inventory, and Notifications pages, automatically opening local creation modals and clearing the URL query parameter via `window.history.replaceState`. | AI Agent |
| 2026-06-22 | **Desktop Layout Overlay/Titlebar Cleared.** Fixed Tauri custom titlebar overlapping and trapping the top section of the sidebar and main workspace. Added `desktop-app` class to `desktop-shell-root` when running as a desktop app. Added CSS offsets to `globals.css` to shift `.sidebar-shell` and `.main-workspace-shell` down by `36px` to clear the custom Titlebar. Verified the production build compiles successfully with the Webpack compiler. | AI Agent |
| 2026-06-22 | **Maximized Window UI Blinking and Sizing Fix.** Diagnosed and resolved WebView2/DWM compositor flickering when maximized by creating a `UnifiedStars` component that combines `StarsBackground` and `ShootingStars` into a single canvas running on a single `requestAnimationFrame` loop. Clamped the canvas drawing buffer resolution to a maximum of `1920x1080` (preventing massive textures on 4K/maximized screens) and scaled it with CSS, saving up to 80% of GPU fill-rate. Removed the parent `opacity-70` wrapper div (which was forcing an off-screen transparent composition layer and causing DWM crashes) and baked the `0.7` opacity directly into the canvas draw calls (alphas) for both standard and shooting stars. Corrected star spawn positions using layout/CSS coordinates instead of physical pixels. Fixed a pre-existing JSX syntax error in `LoginPage` (unmatched closing tag `</motion.div>` on line 926). | AI Agent |
| 2026-06-22 | **Desktop Layout Maximization Hardening.** Modified `WindowContext.tsx` to listen to `tauri://maximized` and `tauri://unmaximized` events directly for instant state synchronization. Added `window-resizing` class to `html` on resize to disable CSS transitions globally during resize (reducing lag and preventing transition overlays/gaps). Linked auth error page and AuthGuard loader to `login-page-frame` class for unified edge-flush layout behavior when maximized. Added CSS overrides to disable `backdrop-filter: blur` on maximized cards to fix a Chromium compositor bug on Windows that caused card contents (text/buttons) to disappear. Verified build compiled successfully. | AI Agent |
| 2026-06-22 | **Critical Frame Glitch Fix — Inline Style Specificity.** Root cause identified: the `login-page-frame` divs in `login/page.tsx`, `auth/error/page.tsx`, and `AuthGuard.tsx` used inline `style={{ left: 16, right: 16, bottom: 16 }}`. CSS `!important` cannot override inline styles. Imported `useWindow()` from `WindowContext` into all three components; conditionally set `left/right/bottom` to `0` (and stripped border/borderRadius/boxShadow) when `isMaximized` is true — entirely in JSX. Build verified: `✓ Compiled successfully in 3.8s`, all 36 routes clean. | AI Agent |
| 2026-06-22 | **Sizing Bug Fix: Maximized Window UI Glitch.** Analyzed diagnostic logs and identified a stale closure bug in `login/page.tsx`. The `resize` event listener `useEffect` had an empty dependency array `[]`, causing the captured `showLoginForm` to be permanently `false`. Fixed by adding `showLoginForm` to the dependency array. | AI Agent |
| 2026-06-22 | **Performance/GPU Fix: Chromium Blink on Maximize.** Diagnosed DWM overlay exhaustion. Fixed by completely disabling expensive `feColorMatrix` / SVG filters in `EtheralShadow.tsx`, removing full-screen `translate3d` layers, and capping the orbit radius calculations in `login/page.tsx` so `framer-motion` doesn't generate 4000x4000 transparent `div` textures on 4K/maximized windows. | AI Agent |
| 2026-06-22 | **Compositor Flicker Bug Fix: Maximized Window UI Glitch.** Isolated the remaining UI flicker (disappearing UI elements) bug. Testing proved the Titlebar `backdrop-filter: blur` was innocent. The true root cause of the Chromium layer overload was having multiple `position: fixed` elements while maximized. Reverted `login-page-frame` back to `position: absolute` (in `login/page.tsx` and `AuthGuard.tsx`) to prevent it from being promoted to a separate GPU compositor layer on maximize. Additionally, removed `will-change: filter, transform` from `EtheralShadow.tsx` to further reduce compositor memory pressure. Restored Titlebar `backdrop-blur-md`. Build verified clean. | AI Agent |
| 2026-06-22 | **SVG Filter Performance Optimization.** Identified massive SVG filter rendering bottlenecks causing the UI elements to blink and Chromium to drop frames on Windows. There were two full-screen `feTurbulence` filters running simultaneously. (1) In `EtheralShadow.tsx`, an `feColorMatrix` was being updated 60fps via `requestAnimationFrame`, forcing Chromium to re-render a 2560x1440 SVG displacement map constantly. Stopped this animation. (2) In `login/page.tsx`, a raw `<svg>` node with `mix-blend-overlay` was rendering fractal noise over the entire window. Replaced this with a lightweight repeating CSS `background-image` using an SVG data-uri. Build verified clean. | AI Agent |
| 2026-06-22 | **React Render Optimization (Framer Motion Glitch Fix).** Discovered two massive React bugs in `login/page.tsx` causing UI elements to blink/disappear: (1) `mousePos` was tracked in a `useState` and updated on every pixel of `onMouseMove`. This forced 60+ FPS React re-renders of the massive `Login` component tree. (2) `boxVariants` objects were defined *inside* the `Login` component, so their references mutated on every render, causing Framer Motion to panic and stutter. (3) The `layoutId` on coins was conditionally set to `undefined` during `showLoginForm` transitions, forcing Framer Motion to destroy the layout projection tree mid-animation. **Fixes:** Extracted `boxVariants` outside the component, deleted the `mousePos` state update loop, and stabilized `layoutId`. Build verified clean. | AI Agent |
| 2026-06-22 | **Root Fix: Next.js Height Chain + position:fixed frames.** Diagnosed that Next.js App Router injects internal wrapper divs (`body > div`, `[data-nextjs-scroll-focus-boundary]`) between `<body>` and the root layout with no explicit height, silently breaking every `h-full` chain downstream. Two fixes: (1) Added CSS to `globals.css` forcing those wrappers to `height: 100%`. (2) Switched all three `login-page-frame` elements from `position: absolute` to `position: fixed` — fixed elements are viewport-anchored and never depend on parent height, making `top: 36, bottom: 16` always correct regardless of ancestor height state. Also added `zIndex: 10` to all three frames. Build verified clean. | AI Agent |
| 2026-06-22 | **Root-cause login page glitch fix — layout, canvas DPR, and EtheralShadow glow.** (1) Fixed all three public-page layouts (login, auth/error, AuthGuard loader) from `p-4 flex` + inner `h-full` to `flex-col` + explicit `36px spacer` div + `flex-1 min-h-0` frame — eliminating the `h-full-inside-padded-parent` overflow/clipping bug that caused the frame to extend below the viewport. (2) Fixed `EtheralShadow` mask gradient: changed from `radial-gradient(ellipse at 50% 0%, black 0%, transparent 75%)` to `radial-gradient(ellipse 140% 120% at 50% -20%, black 0%, black 40%, transparent 90%)` — the old gradient reached transparent by ~30% of the visible panel height because its `0%` center was above the clipped visible boundary (due to `inset: -74px`). New gradient stays fully opaque for the top 40% of the visible area and fades slowly. (3) Fixed canvas DPR scaling in `shooting-stars.tsx` and `stars-background.tsx`: set `canvas.style.width/height` to CSS layout dimensions and applied `ctx.scale(dpr, dpr)` so drawing coordinates stay in CSS-pixel space. | AI Agent |
| 2026-06-22 | **UI Glitch Fixes — Canvas DPR, Router Import, CSS Maximized Overlays.** (1) Removed broken dynamic import of `useRouter` in `ShellWrapper.tsx` render body. (2) Fixed DPR canvas scaling in shooting-stars and stars-background. (3) Fixed `globals.css` `html.window-maximized` block. | AI Agent |
| 2026-06-22 | **Fixed build compilation, console updater errors, and background glow clipping.** Removed duplicate `result` attributes from the `feDisplacementMap` in `etheral-shadow.tsx` which caused Next.js compilation/build failures. Skipped the Tauri updater check entirely in Next.js development mode (`process.env.NODE_ENV === "development"`) and changed production updater check errors to console warnings, preventing Next.js dev overlay popups. Added hardware acceleration triggers (`transform: translateZ(0)` and `will-change: filter, transform`) to the animated shadow container in `etheral-shadow.tsx` to force standalone GPU layer creation, bypassing Chromium/Blink viewport clipping bugs that cut off the green ambient glow at 50% height. | AI Agent |
| 2026-06-22 | **Centralized window maximized state & pure CSS layout transitions.** Created centralized `WindowContext.tsx` to handle Tauri's window resize/maximize events with state change guards to prevent unnecessary re-renders. Simplified `Titlebar.tsx` to consume the shared context hook. Added `login-page-root` and `login-page-frame` classes to `login/page.tsx` and updated `globals.css` with maximized overrides, removing inset padding, borders, shadows, and rounded corners for a flush full-screen login card. Refactored `DesktopShell.tsx` to position the sidebar and main workspace using pure CSS custom properties (`--sidebar-width`, `--sidebar-gap`) and transitions, eliminating Framer Motion layout shift caching stutters. Verified correct layout transitions across all 4 combined maximized/windowed and expanded/collapsed sidebar states. | AI Agent |
| 2026-06-22 | **Fixed background cut-off and stacking order in login page.** Replaced external Framer mask image in EtheralShadow with an offline-safe CSS radial-gradient to prevent sharp horizontal boundary cut-offs on maximized screens. Replaced the external noise overlay image with an inline SVG data-uri. Set explicit inline zIndex properties on the Left Panel (zIndex: 5) and Right Panel (zIndex: 20) in login/page.tsx to prevent orbits and coins from bleeding into the form card. Updated Titlebar to hide the flashing red warning bar in browser fallback mode. | AI Agent |
| 2026-06-22 | **Desktop Layout Resize & Caching Fixes.** Fixed maximized window layout caching and header overlap. Downgraded Left Panel to a plain div, replacing Framer Motion percentage width animation with dynamic CSS transitions to prevent static pixel caching. Replaced inline isTauri() checks with a mounted useEffect state wrapper to resolve Next.js SSR hydration mismatches, and conditionally hid redundant inner window headers while adjusting top padding offsets (pt-[52px]) to clear the Tauri titlebar in all states. Added conditional top padding (pt-9) to DesktopShell container in Tauri mode to prevent Titlebar overlap with the sidebar and main workspace header. | AI Agent |
| 2026-06-22 | **Desktop Layout Resize & Process Fixes.** Fixed layout maximizing glitches on borderless windows and resolved process lockups. Replaced `w-screen`/`h-screen` viewport classes with percentage-based sizing (`w-full`/`h-full`) across layout, AuthGuard, error page, and login page. Replaced window resize listeners with ResizeObserver inside StarsBackground and ShootingStars, scaling drawing buffers by `devicePixelRatio` for sharp High-DPI canvas rendering. Implemented `window-maximized` HTML class sync in Titlebar and corresponding 8px padding and titlebar shifts in globals.css to fix borderless window maximization clipping. Terminated zombie background `app.exe` processes holding the single instance lock to resolve the dev-server exit issue. | AI Agent |
| 2026-06-20 | **Desktop Version Bump to 0.1.2.** Bumped version in `package.json` and `tauri.conf.json` to 0.1.2 to prepare for the signed release. | AI Agent |
| 2026-06-20 | **Windows Self-Signed Code Signing Setup.** Generated a self-signed code signing certificate and configured `tauri.conf.json` with its thumbprint to enable signed Windows builds. Added automatic certificate decoding and installation to the GitHub Actions release workflow. | AI Agent |
| 2026-06-20 | **Desktop Version Bump to 0.1.1.** Bumped version in `package.json` and `tauri.conf.json` to 0.1.1 to avoid tag collisions during the automated GitHub release build. | AI Agent |
| 2026-06-20 | **Automated OTA Releases.** Configured .github/workflows/desktop_release.yml and pointed the 	auri.conf.json updater endpoint to the GitHub Releases repository to automate OTA updates. | AI Agent |
| 2026-06-19 | **Tauri v2 Window Capabilities Fix.** Diagnosed and resolved native window control issues (drag, minimize, maximize, close) by explicitly defining v2 granular capabilities (core:window:allow-minimize, llow-maximize, llow-close, llow-start-dragging, llow-toggle-maximize, llow-is-maximized) in capabilities/default.json. | AI Agent |
| 2026-06-19 | **OTA Updater, Deep Links, and NSIS.** Implemented `mediahive://` deep linking via `tauri-plugin-deep-link` and `tauri-plugin-single-instance`, intercepting URLs in Next.js `ShellWrapper`. Added OTA auto-update capabilities via `tauri-plugin-updater` checking a static GitHub Releases JSON manifest, surfaced via a custom React `UpdatePrompt` component. Configured `perMachine` NSIS installer and generated a `license.txt` EULA for the Windows desktop rollout. | AI Agent |
| 2026-06-19 | **Deep OS Integrations & System Tray.** Configured the MediaHive Windows app to feel like a native desktop resident with System Tray presence, minimize-to-tray on close, global shortcuts (`CmdOrCtrl+Shift+M`), UI-toggleable autostart (launch minimized), and native Windows toast notifications for incoming chat messages while the app is hidden. | AI Agent |


