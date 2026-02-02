# API Architecture

> [!CAUTION]
> ### ⚠️ ARCHITECTURAL LAW
> This file defines non-negotiable system rules.
> Violating this document will break production parity.
> **Do not modify without explicit architectural approval.**

To ensure environmental parity and simplify deployments (localhost, Vercel, and mobile), the application uses the following API route strategy:

## Core Principles

- **Web Builds (Vercel + Localhost)**:
  - ALWAYS use same-origin relative paths (`/api/*`).
  - `NEXT_PUBLIC_API_URL` is **NOT** used and will trigger a warning if set.
  - This allows the app to work seamlessly across multiple Vercel preview environments without requiring manual URL updates.

- **Mobile Builds (Capacitor)**:
  - MUST set `NEXT_PUBLIC_API_URL` to a valid absolute origin (e.g., `https://thaiba-garden-media-manager.vercel.app`).
  - Since mobile apps run from `http://localhost` (Capacitor origin), they cannot use relative paths to the backend server.

## Environment Configuration

### .env.local (Web Development)
```bash
# Force local API mode (restoring real backend connectivity)
NEXT_PUBLIC_DEV_NO_API=false

# DO NOT set NEXT_PUBLIC_API_URL here.
# It will trigger an invariant warning in console.
```

### Vercel (Web Production/Preview)
- No `NEXT_PUBLIC_API_URL` required. The app automatically infers the origin.

### Capacitor .env (Native Build)
```bash
# MUST be set for native builds to find the backend
NEXT_PUBLIC_API_URL=https://thaiba-garden-media-manager.vercel.app
```

## Internal Implementation
The logic is centralized in `src/lib/api-utils.ts` via the `getApiBaseUrl()` function. 

```typescript
if (isNative) {
  return process.env.NEXT_PUBLIC_API_URL || null; // Null triggers Guard
}
return ''; // Signifies relative path
```
