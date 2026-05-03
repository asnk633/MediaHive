# Auth Gate Implementation

## Summary
The global Auth Gate has been successfully implemented to prevent any dashboard page or data request from loading before the Supabase session is securely confirmed. 

In addition, the Server-Side Rendering (SSR) utilities were completely migrated from `@supabase/auth-helpers-nextjs` to `@supabase/ssr` as per modern Next.js 16 standards.

## Implementation Details

### 1. Global AuthGate Component
A new component `src/components/auth/AuthGate.tsx` was created.
*   **Behavior**: It intercepts the rendering process. On mount, it awaits `supabase.auth.getSession()`.
*   **Loading State**: Displays a full-screen loading spinner while resolving the session.
*   **Redirection**: If `session` is entirely missing, it forces a hard redirect to `/login`.
*   **Resolution**: Render passes to the `children` prop only when `isAuthenticated` is explicitly true.

### 2. Layout Integration
`src/app/(shell)/layout.tsx` was modified to wrap `ShellProviders` with the `<AuthGate>`.
*   Because all dashboard pages are nested within this Shell layout, no client-side route code will execute until Auth resolves.

### 3. TanStack Query Constraints
To provide an additional layer of security across the App Router ecosystem, `useTasks`, `useEvents`, and `useCampaigns` were updated to utilize the `useAuth` object.
*   Each query hook now passes `enabled: !!user` to `@tanstack/react-query`, completely silencing background fetches prior to auth.

### 4. Realtime Subscriptions
Realtime listeners via `.channel()` primarily reside in client-side page/component logic (e.g., `TasksPageClient.tsx`, `EventsClient.tsx`).
*   Because these components are children of the `(shell)` layout, the `AuthGate` strictly prevents their `useEffect` lifecycle methods from mounting or triggering until authentication is verified.

### 5. Migration to `@supabase/ssr`
*   Uninstalled the deprecated `@supabase/auth-helpers-nextjs`.
*   Replaced the backend auth checking logic within `verifyUser.ts` with `createServerClient` from `@supabase/ssr`.
*   Ensures that Next.js 16 routing cleanly parses Supabase cookies via `next/headers` without legacy API errors.
