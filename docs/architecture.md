# Capacitor Navigation Rules

This document outlines the required navigation patterns for the Thaiba MediaHive platform when running in a Capacitor-wrapped Android environment.

## The Problem: RSC Requests & Boot Loops

Next.js App Router uses Server Components and a client-side cache. When using "soft" navigation (`router.push` or `router.replace`):
1. Next.js attempts to fetch the target page's payload via `_rsc` requests (e.g., `home/index.txt?_rsc=...`).
2. On some Android WebViews, especially during the initial hydration phase after a fresh boot, these requests can fail, hang, or trigger inconsistent behavior.
3. If navigation happens in a root bootstrap (`src/app/page.tsx`), a soft redirect can lead to a state where the app reloads itself infinitely.

## The Solution: nativeNavigate

We use a custom helper `nativeNavigate` located in `src/lib/utils.ts`.

### Why Hard Reload?

For native environments, `nativeNavigate` uses `window.location.href = target`. This performs a "hard" navigation.
- **Benefits**: It clears the hydration state, stops the current execution, and loads the new page as a fresh entry point. This bypasses the logic that triggers `_rsc` requests during the unstable boot phase.
- **Stability**: It ensures the app settles correctly on the target page (e.g., `/home/`).

## Rules for Developers

1. **NO `router.push` / `router.replace`**: Never use these for programmatic navigation in client components.
2. **NO `redirect()`**: Avoid using the Next.js `redirect()` function in server/client code that runs during the boot phase.
3. **USE `nativeNavigate(path, router, source)`**:
   - `path`: The target URL (e.g., `/home`).
   - `router`: The Next.js router instance (used as fallback for Web).
   - `source`: A descriptive string for Logcat debugging (e.g., `Profile (Sign Out)`).

## Boot Loop Guard

The root bootstrap in `src/app/page.tsx` uses a "Dual Guard":
- **Storage**: Checks both `sessionStorage` and `localStorage` for a `boot_redirected` flag.
- **Pathname**: Verifies the current path isn't already the target.
- **Cleanup**: The flag is cleared in `HomeClient.tsx` once the app stabilizes, allowing redirects on the next app restart.

## Regression Protection

- **ESLint**: A `no-restricted-syntax` rule is active to fail builds if `router.push`, `router.replace`, or `redirect()` are used.
- **CI Enforcement**: The lint rule is executed in CI pipelines and will block merges that introduce forbidden navigation APIs.
- **Runtime**: In development builds, calling these methods on the router will trigger a red console warning in the WebView.

## Hardening & Optimization Pass (v2.5)

The app is protected against common native-web failure modes:

### 1. Build Hardening
- **ProGuard/R8**: Native binary is minified and obfuscated. Critical bridges for Capacitor and Firebase are preserved via `proguard-rules.pro`.
- **Resource Shrinking**: Unused drawables and strings are stripped during the release build.

### 2. Startup Hardening
- **Boot Deferral**: Non-critical auth/sync logic is postponed until the first shell render completes.
- **Dynamic Chunks**: Non-essential pages are code-split to reduce the blocking main JS bundle.

### 3. Memory & Resource Safety
- **AbortController**: All API fetches via `apiClient` are cancellable and must be aborted on component unmount to prevent leaks.
- **Service Worker Persistence**: Hardened `sw.js` ensures offline resilience even after process death.

## Performance Budgets

Cold boot performance must be monitored. Android cold boot must reach `/home/` within:
- **Emulator**: ≤ 6s
- **Real Device**: ≤ 4s

Violations of the boot sequence logic or loops are flagged by the `scripts/sanity-check-boot.js` script.

## Known Failure Modes Prevented

The navigation fix and loop guard prevent the following high-priority issues:
1. **Infinite Reload Loop**: Prevents the root bootstrap from re-navigating to `/home` every time the app hydrates.
2. **Repeated Root Bootstrap**: Ensures the entry logic only runs once per fresh app launch.
3. **_rsc Fetch Hangs**: Bypasses the buggy Android WebView behavior during hydration by using hard navigation.
4. **WebView Hydration Mismatch**: Prevents React hydration errors caused by inconsistent server/client states during soft redirects.
5. **Admin Guard Cascade**: Prevents the `WelcomeGate` and `AdminLayout` from triggering simultaneous redirects.
6. **Auth Redirect Storm**: Prevents multiple session-sync attempts from conflicting with the root navigation.
