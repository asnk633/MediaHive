# MediaHive Web App & Core API Blueprint

This document is the platform blueprint and system memory for the **MediaHive Web App & Core API** (Next.js context).

---

## 1. Core Architecture Overview
* **Framework**: Next.js App Router (`^16.0.7`) + React (`^19.2.1`)
* **State Management**: Jotai for local state, TanStack React Query (`^5.0.0`) for server state.
* **Authentication**: Supabase Auth (Service Account in REST APIs, user sessions in client).
* **Database / ORM**: Drizzle ORM + Supabase PostgreSQL (local sqlite fallback via `dev.db`).

---

## 2. Platform-Specific Quirks & Constraints

### 🔌 HTTP/1.1 Socket Starvation (SSE Connections)
* **Quirk**: In local development environments, Next.js serves assets over HTTP/1.1. Browsers restrict active sockets to the same domain to exactly 6.
* **Impact**: Opening multiple persistent Server-Sent Events (SSE) connections (such as subscribing to notifications from multiple components) blocks all other API requests, causing extreme slowness and loading delays.
* **Constraint**: Any SSE client (e.g., `listenNotifications`) must run through a unified Pub/Sub manager to share a single connection per user, keeping active sockets to exactly 1.

### ⏱️ Sequential API Loops (N+1 Query Bottleneck)
* **Quirk**: Performing database queries sequentially inside a loop (e.g., fetching room messages and unreads) blocks execution threads and accumulates network roundtrip latency.
* **Constraint**: Loop operations fetching room/task metadata must be parallelized concurrently using `Promise.all` to limit sequential database roundtrips.

---

## 3. Web Changelog

| Date | Component | Description | Author |
| :--- | :--- | :--- | :--- |
| 2026-06-28 | DB Schema Check | Fixed dotenv loading order and key fallback in checkSchema.ts to verify Supabase alignment correctly. | AI Agent |
| 2026-06-28 | Build Config | Migrated deprecated Sentry properties (disableLogger, automaticVercelMonitors) to webpack-nested structures. | AI Agent |
| 2026-06-28 | Health Checks | Resolved DTO Mapping schema checks, removed dead links, and deleted empty API directory. | AI Agent |
| 2026-06-28 | Tasks / Permissions | Allowed 'manager' role to view TaskConfidenceView and AdminConfidencePanel. | AI Agent |
| 2026-06-28 | SSE / Notifications | Rewrote `notificationRealtime.ts` to implement connection sharing Pub/Sub. | AI Agent |
| 2026-06-28 | Chat API / Performance | Parallelized room details queries in `/api/chat/rooms` GET using `Promise.all`. | AI Agent |
| 2026-06-28 | API Typecheck | Resolved TypeScript errors across API endpoints and db seed script, enabling clean Next.js production builds. | AI Agent |

