# Offline Strategy & Future Sync Roadmap

## Current State: Phase 4 (Mobile Awareness)

The application currently operates in a "Mobile Aware" mode. When running in a Capacitor environment (Android), backend-dependent features are explicitly guarded to prevent errors and ensure a stable user experience.

### Architectural Constraints
- **No Backend Access**: The mobile build is a static export and assumes no reliable backend connection.
- **Guard Mechanism**: `isNative` hook (wrapping Capacitor core) is used to detect the environment.
- **Safety**: `OfflinePlaceholder` components replace the main content of:
  - Inventory
  - Files
  - Reports
  - Downloads
  - Tasks

### Features status on Mobile
- **Read Only / Disabled**: Inventory, Files, Reports, Downloads, Tasks.
- **Realtime**: Polling (Notifications, Tasks, Activity Feed) is disabled to save resources.

---

## Future State: Phase 5+ (Offline Sync)

The goal is to enable offline read/write capabilities for specific modules, synchronizing data when a connection is available.

### Strategy
1. **Sync Service**: A `SyncService` will orchestrate data synchronization.
2. **Local Storage**: Data will be persisted locally (e.g., SQLite, PouchDB, or localStorage depending on size).
3. **Guard Evolution**: The current `isNative` guards will be updated to check `!syncService.isReady` instead of blocking all native access.

### Integration Points
Markers (`// TODO: [Future Sync]`) have been placed in the following files to indicate where the sync logic should be hooked:
- `src/app/(shell)/inventory/InventoryClient.tsx`
- `src/app/(shell)/files/FilesClient.tsx`
- `src/app/(shell)/reports/ReportsClient.tsx`
- `src/app/(shell)/downloads/DownloadsClient.tsx`
- `src/app/(shell)/tasks/TasksPageClient.tsx`

### Interface Definition
See `src/services/sync/types.ts` for the proposed contract.
