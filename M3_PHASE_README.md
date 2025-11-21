# Phase M3 Implementation

This document describes the changes made in Phase M3 for the Thaiba Garden Media Manager project.

## Summary of Changes

### 1. Server-side Authentication
- Added `/api/auth/login` POST endpoint for server-side authentication
- Enhanced `getUserFromRequest` function to prefer session cookies over `x-user-data` header
- Added session token cookie management with proper security settings

### 2. Review API Fixes
- Fixed `/api/tasks/[id]/review` route to properly await params
- Added `reviewStatus` column to tasks table with migration script
- Updated Drizzle schema to include the new column

### 3. FAB Component Improvements
- Verified that FAB already shows "Notify" only for Admin role
- Added server-side guard for notify endpoint at `/api/notify`

### 4. Playwright Test Hardening
- Enhanced fixtures with `loginAs` helper for role-based authentication
- Improved test reliability with better wait strategies and robust locators
- Added `waitForFAB` helper function
- Updated all tests to use proper authentication patterns

### 5. Test Database Seeding and Cleanup
- Enhanced seed helper with `seedUser` function
- Added test cleanup endpoint at `/api/test-utils/cleanup` (protected for dev/test only)
- Improved task seeding with better error handling

### 6. Playwright Configuration
- Updated Playwright config with recommended settings
- Set appropriate timeouts, retries, and reporters
- Separated HTML report output from test results

### 7. GitHub Actions CI Workflow
- Added new workflow file at `.github/workflows/playwright-e2e.yml`
- Configured matrix for Node.js versions
- Added proper artifact uploads for test results and HTML reports

## How to Run Tests Locally

### Prerequisites
1. Ensure the development server is running:
   ```bash
   npm run dev
   ```

2. Set environment variables (optional, defaults are provided):
   ```bash
   PLAYWRIGHT_BASE_URL=http://localhost:3000
   PLAYWRIGHT_TEST_EMAIL=dev@local
   ```

### Running Tests
```bash
# Run all Playwright tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/playwright/core-v1.spec.ts

# Run tests in headed mode (for debugging)
npx playwright test --headed
```

### Applying the Patch
To apply the changes from the patch file:
```bash
git apply m3-phase.patch
```

## Environment Variables
- `PLAYWRIGHT_BASE_URL` - Base URL for the application (default: http://localhost:3000)
- `PLAYWRIGHT_TEST_EMAIL` - Email of test user (default: dev@local)
- `NODE_ENV` - Environment (development/test/production)

## Security Notes
- Session tokens are stored as HTTP-only cookies for security
- Test cleanup endpoint is only available in development/test environments
- Password validation is optional for development but required in production