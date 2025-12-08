# Phase M4: Feature & Stability Upgrades

This document describes the changes implemented in Phase M4 of the Thaiba Garden Media Manager project.

## Features Implemented

### 1. Improved UX and Accessibility for FAB + Role Gating
- Added `data-testid` attributes to FAB component for stable testing
- Ensured Notify button is rendered only based on server-provided role
- Added proper aria labels for accessibility

### 2. Hardened RBAC Across APIs and Frontend
- Created centralized RBAC middleware in [src/app/api/_lib/rbac.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/_lib/rbac.ts)
- Updated all API endpoints to use the new RBAC system
- Implemented role-based permissions for different user types

### 3. Optimistic UI Updates
- Implemented optimistic updates for task actions (move, status, review)
- Added E2E coverage for optimistic UI behavior

### 4. Feature-Flag System
- Created runtime feature flags system in [src/app/featureFlags.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/featureFlags.ts)
- Added dev-only API endpoint for feature flag management
- Created FeatureFlagProvider for frontend integration

### 5. Improved Test Infrastructure
- Created parallel-safe DB seeding with isolated test data
- Added deterministic test data generation
- Implemented test isolation with cleanup helpers

### 6. Monitoring and Debugging
- Added lightweight request logging for E2E troubleshooting (dev-only)
- Created monitoring endpoint at `/api/health/debug`

## Database Changes

### New Columns Added to Tasks Table
- `lastUpdatedBy` - References the user who last updated the task
- `isArchived` - Boolean flag to mark archived tasks

### Indexes Added
- `idx_tasks_institution_status` - For filtering by institution and status
- `idx_tasks_assigned_to` - For filtering by assignee
- `idx_tasks_created_by` - For filtering by creator
- `idx_tasks_last_updated_by` - For filtering by last updater

## Files Modified/Added

### Backend
- [src/app/api/_lib/rbac.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/_lib/rbac.ts) - New RBAC middleware
- [src/app/api/_lib/auth.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/_lib/auth.ts) - Updated to use RBAC and add request logging
- [src/app/api/tasks/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/tasks/route.ts) - Updated to use RBAC
- [src/app/api/tasks/[id]/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/tasks/%5Bid%5D/route.ts) - Updated to use RBAC
- [src/app/api/tasks/[id]/review/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/tasks/%5Bid%5D/review/route.ts) - Updated to use RBAC
- [src/app/api/notify/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/notify/route.ts) - Updated to use RBAC
- [src/app/api/admin/feature-flags/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/admin/feature-flags/route.ts) - New feature flag API
- [src/app/api/health/debug/route.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/health/debug/route.ts) - New monitoring endpoint
- [src/app/api/middleware/logging.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/api/middleware/logging.ts) - New logging middleware

### Frontend
- [src/components/FAB.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/FAB.tsx) - Added data-testid attributes
- [src/components/TaskItem.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/TaskItem.tsx) - Added data attributes and accessibility improvements
- [src/components/FeatureFlagProvider.tsx](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/components/FeatureFlagProvider.tsx) - New feature flag provider
- [src/app/featureFlags.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/app/featureFlags.ts) - New feature flags system

### Database
- [src/db/schema.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/src/db/schema.ts) - Added new columns and indexes
- [migrations/2025xxxx_add_task_columns.sql](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/migrations/2025xxxx_add_task_columns.sql) - Migration script
- [migrations/2025xxxx_add_task_columns_rollback.sql](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/migrations/2025xxxx_add_task_columns_rollback.sql) - Rollback script

### Testing
- [e2e/playwright/fab.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/fab.spec.ts) - New FAB tests
- [e2e/playwright/optimistic.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/optimistic.spec.ts) - New optimistic update tests
- [e2e/playwright/rbac.spec.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/rbac.spec.ts) - New RBAC tests
- [e2e/playwright/helpers/seedIsolated.ts](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/e2e/playwright/helpers/seedIsolated.ts) - New isolated seeding helper

### CI/CD
- [.github/workflows/playwright-e2e.yml](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/.github/workflows/playwright-e2e.yml) - Updated workflow with matrix testing
- [playwright.config.cjs](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/playwright.config.cjs) - Updated configuration

### Scripts
- [scripts/run-e2e-isolated.ps1](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/scripts/run-e2e-isolated.ps1) - PowerShell script for isolated test runs

## Running Tests Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the Playwright tests:
   ```bash
   npx playwright test
   ```

3. To run tests with isolated data:
   ```bash
   ./scripts/run-e2e-isolated.ps1
   ```

## Migration Instructions

### Applying the Migration

1. Run the migration script:
   ```bash
   # SQLite example
   sqlite3 your_database.db < migrations/2025xxxx_add_task_columns.sql
   ```

### Rolling Back the Migration

If you need to rollback the changes:

1. Run the rollback script:
   ```bash
   # SQLite example
   sqlite3 your_database.db < migrations/2025xxxx_add_task_columns_rollback.sql
   ```

## Security Considerations

- Session cookies are HttpOnly, Secure (when in production) and SameSite=Lax
- Server-side validation of x-user-data content to prevent privilege escalation
- All admin-sensitive API endpoints are protected with RBAC checks
- Dev/test-only endpoints are behind environment flags

## Manual Steps Required

1. Update your database with the new migration script
2. Ensure all team members have the latest code
3. Run tests to verify the implementation