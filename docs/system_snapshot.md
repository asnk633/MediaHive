# MediaHive System Snapshot
Last Updated: May 2, 2026
Version: v1.0

---

## 1. CORE MODULES
- **Dashboard**: High-level overview with real-time metrics (Tasks, Events, Production Stage).
- **Tasks**: Kanban & List views with multi-user assignment and status tracking (Todo -> Done).
- **Events**: Unified calendar (Month/Week/List) with production stage mapping (Planning -> Delivery).
- **Inventory**: Asset management with status tracking, rentable fields, and booking integration.
- **Campaigns**: Strategic grouping of tasks and events for large-scale media operations.
- **Files / Downloads**: Integration with Google Drive queue for automated media ingestion.
- **Notifications**: System-wide alerts for assignments, mentions, and status changes.
- **Admin Panel**: Multi-tenant control room for user onboarding, workspace management, and system auditing.

## 2. DATA ARCHITECTURE
- **Multi-Tenant Hierarchy**: `Tenants` → `Institutions` (Workspaces) → `Users`.
- **Core Tables**:
    - `tasks`, `events`, `inventory`, `campaigns` (Scoped by `tenant_id` and `institution_id`).
    - `profiles` (Tenant-wide user data).
    - `user_institutions` (Cross-workspace role mapping).
    - `invites` (Lifecycle: Pending -> Accepted/Expired).
- **JSONB Implementation**: Used for extensible metadata:
    - `tasks.assigned_to`: Array of user UIDs/roles.
    - `events.media_coverage`: Requirements and equipment list.
    - `institutions.features`: Granular feature toggles per workspace.

## 3. AUTH & ACCESS
- **Authentication**: Supabase Auth (JWT) with secure session persistence.
- **Workspace Isolation**: Hardened `WorkspaceProvider` enforces data boundaries via `user_institutions` lookups.
- **RBAC Matrix**:
    - **Admin**: Global control within a tenant.
    - **Manager**: Team-level management and task assignment.
    - **Member**: Standard contribution access.
    - **Guest**: Read-only / limited interaction.
- **RLS**: Row-Level Security enforced on all primary tables via `tenant_id` and `auth.uid()`.

## 4. SYNC & OFFLINE SYSTEM
- **Sync Engine**: `CanonicalDataService` orchestrates all mutations via an offline mutation queue.
- **Persistence**: `localStorage` caching for all primary entities (Tasks/Events) to ensure instant load.
- **Conflict Management**: `ConflictResolutionCenter` handles divergent states between local and server data.
- **Connectivity**: Real-time sync indicators (Online/Offline/Syncing) in the Global Banner.

## 5. COLLABORATION
- **Presence System**: Real-time "Who's Online" indicators within entities.
- **Field-Level Focus**: Visual cues showing which fields are being edited by other users.
- **Optimistic Updates**: Broadcasts changes to peers via Supabase Channels before server confirmation.

## 6. ADMIN SYSTEM
- **User Lifecycle**: Branded invitation system with automated workspace linking for existing users.
- **Onboarding Flow**: Specialized UI for account setup and primary workspace selection.
- **Management**: Granular role assignment and workspace-specific permissions.

## 7. UI SYSTEM
- **Visual Identity**: **3-Tier Design System** (Canvas, Panel, Surface) using deep Zinc gradients and glassmorphism.
- **Navigation**: Adaptive **DesktopSideNav** (collapsible) and **MobileBottomNav**.
- **Interactive Elements**: Floating Action Button (FAB) with "breathing" animation and `framer-motion` transitions.

## 8. DESIGN PRINCIPLES
- **Minimalist UI**: Prioritize focus and clarity; hide complexity until needed.
- **Zero-Trust Context**: Never assume workspace context; always derive from the Single Source of Truth.
- **Offline-First Reliability**: The system must be usable and data-safe without a stable connection.
- **Role-Based Simplicity**: Interface complexity scales with user responsibility.
- **Atomic Mutations**: Data changes must be traceable and reversible where possible.

## 9. SCALE-RISK ASSESSMENT (Audit v1.0)
- **Cache Bottleneck**: `localStorage` is approaching its 5MB limit and lacks indexing. Migration to **IndexedDB** is required for large datasets.
- **Data Normalization**: `assigned_to` in JSONB is a future query performance trap; normalization to a join table is recommended.
- **Sync Integrity**: Simultaneous edits and Real-time vs Offline collisions require a **Field-Level Mutation Priority** system.
- **Admin Scalability**: Sequential bulk operations will fail as team sizes grow; **Batch Mutation API** is a priority.

## 10. KNOWN ISSUES / LIMITATIONS
- **Bulk Operations**: Currently sequential; migration to native Supabase bulk ops pending.
- **Deep Linking**: UI lacks deep-linking to specific entity IDs from widgets/notifications.
- **Media Files**: Currently "Drive-Queue" only; lacks internal preview control and metadata indexing.
- **Observability**: Production monitoring (Sentry/LogRocket) is not yet wired.

## 11. PRODUCTION READINESS
- **Ready**: Auth, Workspace Isolation, Task Management, Event Coordination, Invitation System, Design System, IndexedDB Caching, Bulk Operations.
- **In Validation**: Field-Level Conflict Resolution, Mutation Priority.
- **Pending**: Data Normalization (assigned_to), Full Sentry wiring, Media System Maturity.

---
### NEXT PHASE PRIORITIES (Q2 2026)
1. **Conflict Resolution Hardening** [DONE]: Field-Level Merging and baseUpdatedAt tracking implemented.
2. **IndexedDB Migration** [DONE]: localStorage replaced with IndexedDB for entity caching in CanonicalDataService.
3. **Bulk Operations Optimization** [DONE]: Native Supabase bulk ops integrated into SyncEngine.
4. **Data Normalization**: Migrate task assignments to a dedicated join table.
5. **Production Monitoring**: Fully wire Sentry DSN into MonitoringService.
