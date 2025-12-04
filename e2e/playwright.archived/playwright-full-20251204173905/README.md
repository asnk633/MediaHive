# Playwright E2E Test Suite

This is a complete Playwright test suite for the Kanban UI with real backend integration.

## Test Structure

- `fixtures.ts` - Playwright fixtures for authentication
- `helpers/seed.ts` - Task seeding and fetching helpers
- `helpers/drag.ts` - Drag and drop helper using mouse movements
- `kanban.full.spec.ts` - Full test suite

## Environment Variables

- `PLAYWRIGHT_BASE_URL` - Base URL for the app (default: http://localhost:3000)
- `PLAYWRIGHT_TEST_EMAIL` - Email of test user (default: dev@local)

## Running Tests

1. Make sure the app is running locally:
   ```bash
   npm run dev
   ```

2. Run all tests:
   ```bash
   npx playwright test
   ```

3. Run tests in headed mode:
   ```bash
   npx playwright test --headed
   ```

4. Run specific test file:
   ```bash
   npx playwright test e2e/playwright/kanban.full.spec.ts
   ```

## Test Configuration

The `playwright.config.cjs` file is configured with:
- Headful mode by default for easier debugging
- 60 second timeout for tests
- HTML reporter for detailed results
- Chromium browser only (can be extended)

## CI/CD

The `.github/workflows/playwright.yml` workflow:
1. Installs dependencies
2. Builds the app
3. Seeds the database (placeholder - replace with actual commands)
4. Starts the server
5. Runs Playwright tests
6. Uploads test results

## Implementation Notes

- Tests use real backend API calls (no mocking)
- Authentication is handled via localStorage injection before page load
- Task creation uses the required `x-user-data` header
- Tests wait for proper hydration and UI rendering
- Selector mapping allows for easy adjustment if UI changes
- Drag and drop uses realistic mouse movements

## Current Limitations

The current app UI doesn't implement Kanban columns, so drag and drop tests are commented out. They will be enabled when the Kanban UI is implemented.