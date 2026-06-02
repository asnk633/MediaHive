# UI Styling and Data Synchronization Directive

## 1. UI & Tailwind Spacing Constraints
* **Always Use Standard Spacing Scales:** Do not use arbitrary spacing classes in Tailwind CSS (such as `h-18` or `h-22`) unless they are explicitly declared in the custom extension block in `tailwind.config.ts`.
* **Standard Scale Reminders:** Default standard vertical/horizontal height values include:
  * `h-16` (64px)
  * `h-20` (80px)
  * `h-24` (96px)
* **Collapse Prevention:** Invalid Tailwind spacing classes collapse to an auto-height in the browser, causing inner components to touch layout borders and lose vertical centering (`items-center`). Always double-check standard values.

## 2. Avatar Resolving & Data Source Prioritization
* **Direct URLs vs. Cloud Drive Proxies:** Direct web-accessible image hosts (like Supabase storage buckets) should never be processed through third-party document proxies (like the Google Drive API).
* **Prioritize Direct Links:** In resolution utilities like `getDriveImageUrl`, always check if the URL starts with `http` and does not contain `drive.google.com` or `googleusercontent.com` first, and return it directly.
* **Syncing Session State:** Ensure all database-driven metadata (such as `avatar_drive_id`, `avatar_url`, and custom `icon_url`) are fully populated in both the initial page context fetch (`page.tsx`) and the global client session contexts (`AuthContextProvider.tsx`) to avoid display mismatches between different panels.
