# Tasks: MediaHive Core Architecture

**Input**: Design documents from `/specs/001-mediahive-core-architecture/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are requested via E2E Playwright verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directories for Next.js app, Flutter app, and Tauri app per implementation plan
- [ ] T002 Configure compiler options and environment template files under .env.example
- [ ] T003 [P] Configure ESLint custom rule `no-restricted-syntax` inside eslint.config.mjs to ban direct `/api/` references in mobile builds

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define main Postgres database schemas using Drizzle ORM inside src/db/schema.ts
- [ ] T005 Setup Supabase client initializers inside src/lib/supabaseClient.ts
- [ ] T006 [P] Configure global tenant-aware authentication verification middleware inside src/middleware.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Tenant Workspace & Role-Based Quick-Create (Priority: P1) 🎯 MVP

**Goal**: Enable role-based quick-create modal dialogues on the main workspace dashboard.

**Independent Test**: Log in as different test credentials and verify element toggles and fields lock/unlock behavior on dashboard.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create Tenant entity mapping inside src/models/tenant.ts
- [ ] T008 [P] [US1] Create User database entity model inside src/models/user.ts
- [ ] T009 [US1] Implement dynamic dashboard quick-create components inside src/components/QuickCreateModal.tsx
- [ ] T010 [US1] Wire role check verification logic on Home dashboard inside src/app/page.tsx
- [ ] T011 [US1] Implement dashboard data-refresh listeners inside src/components/DashboardContainer.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Offline-First Mobile Operation (Priority: P2)

**Goal**: Support logging presence data offline using mobile local database and sync automatically once online.

**Independent Test**: Disable device connectivity, record check-in event, toggle network back on, and observe automatic SQLite-to-Postgres sync.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create PresenceLog database schema inside src/models/presence.ts
- [ ] T013 [P] [US2] Define local IndexedDB schema setup inside src/lib/offlineStore.ts
- [ ] T014 [US2] Implement mobile connectivity detection and auto-trigger sync scheduler inside mediahive_mobile/lib/services/sync_service.dart
- [ ] T015 [US2] Write authorization token refresh interceptor inside mediahive_mobile/lib/services/auth_interceptor.dart

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Native Desktop Shell Titlebar & Maximized State (Priority: P3)

**Goal**: Adapt Tauri borderless window headers smoothly during maximized states.

**Independent Test**: Toggle window maximize and assert title padding coordinates are adapted dynamically.

### Implementation for User Story 3

- [ ] T016 [P] [US3] Create window utility listeners for Tauri window events inside src/context/WindowContext.tsx
- [ ] T017 [US3] Implement responsive native-like header bar inside src/components/Titlebar.tsx
- [ ] T018 [US3] Add styling classes for borderless maximized layout shifts inside src/app/globals.css

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 [P] Update user documentation mapping architecture details inside docs/architecture.md
- [ ] T020 Run quickstart.md validation scenarios to verify E2E system behavior
- [ ] T021 Update system documentation blueprint records inside MEDIAHIVE_MASTER_BLUEPRINT.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete
