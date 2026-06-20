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
| 2026-06-20 | **Windows Self-Signed Code Signing Setup.** Generated a self-signed code signing certificate and configured `tauri.conf.json` with its thumbprint to enable signed Windows builds. Added automatic certificate decoding and installation to the GitHub Actions release workflow. | AI Agent |
| 2026-06-20 | **Desktop Version Bump to 0.1.1.** Bumped version in `package.json` and `tauri.conf.json` to 0.1.1 to avoid tag collisions during the automated GitHub release build. | AI Agent |
| 2026-06-20 | **Automated OTA Releases.** Configured .github/workflows/desktop_release.yml and pointed the 	auri.conf.json updater endpoint to the GitHub Releases repository to automate OTA updates. | AI Agent |
| 2026-06-19 | **Tauri v2 Window Capabilities Fix.** Diagnosed and resolved native window control issues (drag, minimize, maximize, close) by explicitly defining v2 granular capabilities (core:window:allow-minimize, llow-maximize, llow-close, llow-start-dragging, llow-toggle-maximize, llow-is-maximized) in capabilities/default.json. | AI Agent |
| 2026-06-19 | **OTA Updater, Deep Links, and NSIS.** Implemented `mediahive://` deep linking via `tauri-plugin-deep-link` and `tauri-plugin-single-instance`, intercepting URLs in Next.js `ShellWrapper`. Added OTA auto-update capabilities via `tauri-plugin-updater` checking a static GitHub Releases JSON manifest, surfaced via a custom React `UpdatePrompt` component. Configured `perMachine` NSIS installer and generated a `license.txt` EULA for the Windows desktop rollout. | AI Agent |
| 2026-06-19 | **Deep OS Integrations & System Tray.** Configured the MediaHive Windows app to feel like a native desktop resident with System Tray presence, minimize-to-tray on close, global shortcuts (`CmdOrCtrl+Shift+M`), UI-toggleable autostart (launch minimized), and native Windows toast notifications for incoming chat messages while the app is hidden. | AI Agent |


