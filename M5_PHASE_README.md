# Phase M5: Kanban 2.0 + Notifications Overhaul + Full Real-Time Updates

This document describes the changes implemented in Phase M5 of the Thaiba Garden Media Manager project.

## Features Implemented

### 1. Kanban 2.0 – Real Backend + Realtime Sync

#### Backend
- Added `/api/kanban` endpoint returning:
  - Grouped tasks by status
  - Counts per status
  - Metadata (last updated, optimistic tokens etc.)
- Added websocket/sse channel at `/api/kanban/subscribe` for realtime updates:
  - New task
  - Task updated
  - Task moved between columns
  - ReviewStatus updated
- Added optimistic concurrency check:
  - Added version column to tasks (int, default 1)
  - When updating, server compares client version to DB version
  - If mismatch → return { conflict: true, latest: {...task} }

#### Frontend
- Implemented Kanban board with columns: todo / in_progress / on_hold / done
- Draggable items with realtime move updates (via SSE)
- Conflict resolution popup
- "Ghost card" for optimistic preview

### 2. Notification System 2.0

#### Backend
- Added notifications DB table with fields: id, userId, title, body, readAt, createdAt
- Endpoints:
  - POST `/api/notifications/send` (Admin only; uses RBAC)
  - GET `/api/notifications/list` (authenticated)
  - POST `/api/notifications/read` (mark read)
- Added SSE at `/api/notifications/subscribe` to push notifications live

#### Frontend
- New Notification dropdown panel inside topbar
- Shows unread count bubble (red dot)
- Sliding dropdown showing notifications
- Click → mark as read
- Local small "toast-style popup" when realtime notification arrives

### 3. User Presence & Activity Indicator

#### Backend
- Added heartbeat endpoint: `/api/presence/ping`
- Added presence tracking in memory (dev) or simple SQLite table (prod-safe)
- userId, lastSeenAt, online

#### Frontend
- Topbar: green dot for online admins
- TaskItem: small dot showing if "AssignedTo" user is online

### 4. Global Event Bus (Client) + Shared Query Cache

- Added a small client-side event bus system with modules listening to:
  - Notifications
  - Kanban updates
  - Presence updates
- Task list and Kanban share same cached data
- Update UI from events instantly

### 5. Project-Wide Hardening & DevX Improvements

- Zero stale-query issues
- Added global useServerSync() hook for SSE/WebSocket
- Added test helper: waitForRealtimeUpdate(page, channel, criteria)
- Added network latency simulation endpoint `/api/dev/slow/:ms`

## Database Changes

### New Tables
- `notifications` - Store user notifications
- `presence` - Track user online status

### Modified Tables
- `tasks` - Added version column for optimistic concurrency control

## Files Modified/Added

### Backend
- [src/app/api/kanban/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/kanban/route.ts) - Kanban API endpoint
- [src/app/api/kanban/subscribe/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/kanban/subscribe/route.ts) - Kanban SSE endpoint
- [src/app/api/notifications/send/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/notifications/send/route.ts) - Notification send endpoint
- [src/app/api/notifications/list/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/notifications/list/route.ts) - Notification list endpoint
- [src/app/api/notifications/read/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/notifications/read/route.ts) - Notification read endpoint
- [src/app/api/notifications/subscribe/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/notifications/subscribe/route.ts) - Notification SSE endpoint
- [src/app/api/presence/ping/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/presence/ping/route.ts) - Presence ping endpoint
- [src/app/api/_lib/realtime.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/_lib/realtime.ts) - Realtime utilities
- [src/db/schema.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/db/schema.ts) - Updated database schema
- [migrations/2025xxxx_add_realtime_and_notifications.sql](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/migrations/2025xxxx_add_realtime_and_notifications.sql) - Database migration

### Frontend
- [src/components/KanbanBoard.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/KanbanBoard.tsx) - Main Kanban board component
- [src/components/KanbanColumn.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/KanbanColumn.tsx) - Kanban column component
- [src/components/KanbanCard.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/KanbanCard.tsx) - Kanban card component
- [src/components/NotificationPanel.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/NotificationPanel.tsx) - Notification dropdown panel
- [src/components/PresenceDot.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/PresenceDot.tsx) - Presence indicator dot
- [src/hooks/useKanbanRealtime.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/hooks/useKanbanRealtime.ts) - Kanban realtime hook
- [src/hooks/useNotificationsRealtime.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/hooks/useNotificationsRealtime.ts) - Notifications realtime hook
- [src/hooks/usePresence.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/hooks/usePresence.ts) - Presence hook
- [src/hooks/useServerSync.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/hooks/useServerSync.ts) - Server sync hook
- [src/lib/eventBus.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/lib/eventBus.ts) - Event bus utility

### Testing
- [e2e/playwright/kanban.realtime.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/kanban.realtime.spec.ts) - Kanban realtime tests
- [e2e/playwright/notifications.realtime.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/notifications.realtime.spec.ts) - Notification realtime tests
- [e2e/playwright/presence.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/presence.spec.ts) - Presence tests
- [e2e/playwright/shared-cache.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/shared-cache.spec.ts) - Shared cache tests
- [e2e/playwright/helpers/realtime.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/helpers/realtime.ts) - Realtime test helpers

### CI
- [.github/workflows/playwright-e2e.yml](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/.github/workflows/playwright-e2e.yml) - Updated workflow

## Running Tests Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the Playwright tests:
   ```bash
   npx playwright test
   ```

## Migration Instructions

### Applying the Migration

1. Run the migration script:
   ```bash
   # SQLite example
   sqlite3 your_database.db < migrations/2025xxxx_add_realtime_and_notifications.sql
   ```

### Rolling Back the Migration

If you need to rollback the changes:

1. Run the rollback script:
   ```bash
   # SQLite example
   sqlite3 your_database.db < migrations/2025xxxx_add_realtime_and_notifications_rollback.sql
   ```

## Security Considerations

- All realtime endpoints are protected with proper authentication
- SSE connections are properly cleaned up when closed
- Notification sending is restricted to admin users only
- Presence tracking does not expose sensitive user information

## Manual Steps Required

1. Update your database with the new migration script
2. Ensure all team members have the latest code
3. Run tests to verify the implementation