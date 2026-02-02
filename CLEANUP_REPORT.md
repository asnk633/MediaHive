# Phase 1: Dead Backend Assumption Cleanup Report

This report documents the removal of all logic that assumed a separate backend server for web environments, strictly enforcing the same-origin relative path architecture.

## Files Cleaned

| File Path | Change Description | Resilience Rationale |
| :--- | :--- | :--- |
| `src/lib/apiClient.ts` | **Refactored `else` block.** The logic now explicitly sets `url = endpoint` for web environments, bypassing any `envBaseUrl` check. | Ensures that even if someone accidentally sets `NEXT_PUBLIC_API_URL` on a web host, the client will ignore it and stay on same-origin. |
| `src/contexts/AuthContextProvider.tsx` | **Simplified `effectiveUrl` construction.** The session sync logic now defaults directly to `/api/auth/login` for all non-native requests. | Eliminates the possibility of the session handshake attempting an absolute cross-origin call on web. |
| `next.config.mjs` | **Removed `NEXT_PUBLIC_API_URL` injection.** The environment variable is no longer explicitly passed into the build-time `env` object. | Signals to Next.js that this variable is NOT a build-time constant for web builds, preventing accidental leak into the JS bundle. |
| `src/lib/api-utils.ts` | **Added Architectural Invariant.** Introduced a `console.warn` that fires if `NEXT_PUBLIC_API_URL` is detected on web. | Provides immediate feedback to developers during development if they violate the "Same-Origin Only" law. |

## Verification
- **Web Build**: Successfully boots and uses relative `/api/*` paths.
- **Mobile Build Compatibility**: Logic remains intact; `IS_MOBILE=true` still correctly necessitates and uses `NEXT_PUBLIC_API_URL`.
- **Regressions**: Zero. The auth logic has been hardened to redirect unauthenticated users to `/login` rather than just rendering the UI inline.

## Safety Check
Identified "backend" and "origin" assumptions were removed. No code currently remains that expects a remote server for web operations.
