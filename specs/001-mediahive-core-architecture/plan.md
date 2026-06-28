# Implementation Plan: MediaHive Core Architecture

**Branch**: `001-mediahive-core-architecture` | **Date**: 2026-06-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-mediahive-core-architecture/spec.md`

## Summary
Define the technical blueprint for the MediaHive project, outlining the Next.js SaaS Web/API surface, Tauri Desktop client, and Flutter Mobile client. The technical approach ensures proper offline-first operation, absolute endpoint routing for mobile/Capacitor, and tenant isolation at the Supabase/PostgreSQL layer.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js/Tauri), Dart 3.x (Flutter), Rust 1.x (Tauri backend)

**Primary Dependencies**: Next.js 16, Flutter SDK, Tauri v2.11, Capacitor 7.x, Drizzle ORM, Supabase client

**Storage**: PostgreSQL (Supabase hosting), SQLite (local dev & mobile offline), IndexedDB/Dexie (web offline)

**Testing**: Playwright (Web/E2E), Flutter test (mobile), Jest/Vitest (Web unit)

**Target Platform**: Web browsers, Windows/macOS desktop, iOS/Android mobile devices

**Project Type**: Multi-platform web-service, desktop-app, and mobile-app suite

**Performance Goals**: UI rendering transitions under 100ms, offline state changes sync under 3 seconds upon reconnecting

**Constraints**: Banned direct `/api/` relative paths in mobile; must verify tokens before sync; must enforce manager tenant boundary in database row-level security (RLS)

**Scale/Scope**: Multi-tenant workspace supporting dozens of organizations with role permissions (Admin, Manager, Member, Guest)

## Constitution Check

All Core Principles from the MediaHive Constitution are satisfied:
1. **Three-Surface Architecture**: Web, Flutter, and Tauri wrappers are documented in parallel structures.
2. **Absolute Base URL for Mobile**: Banned `/api/` relative paths checks are maintained via static code linters.
3. **Offline-First Sync & State**: Local storage (SQLite/IndexedDB) mirrors schemas and implements token refresh checks during synchronization.
4. **Cross-Tenant Isolation**: RLS policies enforce checks checking manager's own organizational ID.
5. **Continuous Integration & Test Gates**: Headless WebView safety and E2E Playwright test runs are established.

## Project Structure

### Documentation (this feature)

```text
specs/001-mediahive-core-architecture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
api/ or src/
├── app/                 # Next.js App Router (web and API backend)
├── components/          # Web dashboard elements
└── lib/                 # Core utilities and apiClient wrappers

mediahive_mobile/        # Flutter codebase
├── lib/
│   ├── services/        # FCMService, AuthService, NfcService
│   └── screens/         # LoginScreen, ProfileScreen

MediaHive Windows app/   # Tauri codebase
├── src-tauri/           # Rust application state
└── src/                 # Hosted Tauri web assets
```

**Structure Decision**: A multi-directory monorepo containing Web/API in the root, Flutter mobile under `mediahive_mobile/`, and Tauri desktop wrapper in `MediaHive Windows app/`.

## Complexity Tracking

No violations to track.
