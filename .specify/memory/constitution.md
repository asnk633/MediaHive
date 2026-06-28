<!--
Sync Impact Report:
- Version change: [TEMPLATE] -> v1.0.0
- List of modified principles:
  * Principle I: Three-Surface Architecture (Created)
  * Principle II: Absolute Base URL for Mobile (Created)
  * Principle III: Offline-First Sync & State (Created)
  * Principle IV: Cross-Tenant Isolation (Created)
  * Principle V: Continuous Integration & Test Gates (Created)
- Added sections: Technology Constraints & Core Stack, Development Workflow & Master Blueprint
- Removed sections: None
- Templates requiring updates: None (aligned with defaults)
- Follow-up TODOs: None
-->

# MediaHive Constitution

## Core Principles

### I. Three-Surface Architecture
The project must maintain architectural integrity across the Next.js SaaS Web App/Core API, Flutter Mobile client, and Tauri Desktop wrapper. Any design decisions made on one surface must check for compatibility on the other two.

### II. Absolute Base URL for Mobile
Capacitor/Flutter mobile clients must route API fetches through the apiClient wrapper to dynamically prepend the absolute backend URL, preventing relative path failures. Relative '/api/' literals are banned.

### III. Offline-First Sync & State
Client state uses TanStack Query + Dexie/IndexedDB for offline capabilities. Sync mechanisms must handle access token refreshes properly to prevent token-expiry session failures.

### IV. Cross-Tenant Isolation
All database schemas, RLS policies, and migrations must enforce strict tenant boundaries, validating manager/admin tenant_id matches the target tenant of records.

### V. Continuous Integration & Test Gates
All changes must be validated against the E2E/Playwright test suites and build/type check gates. Ensure webview safeties and safe safeRequestAnimationFrame wrappers are preserved.

## Technology Constraints & Core Stack

Next.js App Router, Drizzle ORM, Supabase Postgres, Capacitor, Tauri, and Flutter.

## Development Workflow & Master Blueprint

Every change must update the corresponding Master Blueprint (e.g., MEDIAHIVE_MASTER_BLUEPRINT.md) as project memory before ending the turn.

## Governance

Amendments require documenting in CHANGELOG and updating the blueprints. All PRs must verify compliance with these Core Principles.

**Version**: 1.0.0 | **Ratified**: 2026-06-24 | **Last Amended**: 2026-06-24
