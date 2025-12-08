# Client/Server Component Structure

This document explains the organization of client and server components in the Thaiba Garden Media Manager project.

## Directory Structure

### Client Components
- `src/client/components/` - Client-only React components that use hooks or browser APIs
- `src/client/hooks/` - Custom React hooks that use client-side APIs
- `src/client/index.ts` - Re-exports for client components and hooks

### Server Components
- `src/components/` - Server-compatible React components (can be used in both server and client components)
- `src/app/` - Next.js App Router pages and layouts (server components by default)

## Rules

1. **Client Components**: Any component that uses React hooks (useState, useEffect, etc.) or browser APIs (window, document, localStorage) must be placed in `src/client/components/` and marked with `"use client"` at the top of the file.

2. **Server Components**: Components that don't use client-side APIs can remain in `src/components/` and should NOT have `"use client"` unless they specifically need client features.

3. **Client Hooks**: Custom hooks that use browser APIs must be placed in `src/client/hooks/`.

4. **Wrappers**: When a server component needs to use a client component, create a wrapper in the same directory as the server component that imports the client component.

## Usage Examples

### Importing Client Components
```typescript
// In client components
import { FAB } from '@/client/components/FAB';

// In server components that need client components
import { ClientFAB } from '@/components/ClientFAB'; // Wrapper component
```

### Creating Client Wrappers
```typescript
// src/components/ClientFAB.tsx
"use client";
import { FAB } from '@/client/components/FAB';

export function ClientFAB(props: any) {
  return <FAB {...props} />;
}
```

## Migration Status

All client components have been moved to the appropriate directories. Backup files have been archived.