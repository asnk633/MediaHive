# Firebase Mock Runbook

This document explains how to control the Firebase mocking behavior in the Playwright test suite.

## Environment Variables

### USE_REAL_FIREBASE
- **Purpose**: Controls whether to use real Firebase or the mock implementation
- **Values**: 
  - `true` - Use real Firebase (bypasses mock)
  - `false` or unset - Use mock Firebase (default behavior)

## Local Development

### Running Tests with Mock Firebase (Default)
```bash
npm run test:full-ui
```

### Running Tests with Real Firebase
```bash
USE_REAL_FIREBASE=true npm run test:full-ui
```

On Windows PowerShell:
```powershell
$env:USE_REAL_FIREBASE="true"; npm run test:full-ui
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
# Use mock Firebase (faster, more reliable)
- name: Run UI Tests with Mock Firebase
  run: npm run test:full-ui

# Use real Firebase (slower, but tests actual integration)
- name: Run UI Tests with Real Firebase
  env:
    USE_REAL_FIREBASE: true
  run: npm run test:full-ui
```

## How It Works

1. **Mock Enabled (Default)**:
   - Intercepts `/firebase-config.json` requests and returns mock config
   - Stubs Firebase client initialization with minimal mock object
   - Sets `__FIREBASE_READY__` global flag immediately
   - Faster and more reliable test execution

2. **Real Firebase Enabled**:
   - Uses actual Firebase configuration from environment variables
   - Initializes real Firebase client
   - Waits for `__FIREBASE_READY__` global flag (up to 10 seconds)
   - Tests actual Firebase integration

## Troubleshooting

### Tests Failing with Mock Enabled
If tests fail with the mock enabled, check:
1. Mock configuration matches expected Firebase config structure
2. Mock Firebase object implements required methods
3. Global flags are being set correctly

### Tests Failing with Real Firebase
If tests fail with real Firebase, check:
1. Environment variables are properly set
2. Firebase project is accessible
3. Network connectivity to Firebase services
4. `__FIREBASE_READY__` flag is being set by the application

## Customizing the Mock

The mock implementation can be customized in:
`e2e/playwright/fixtures/mockFirebase.ts`

Key areas to modify:
- `MOCK_FIREBASE_CONFIG` - Mock Firebase configuration
- Firebase mock object methods - Add/modify as needed for specific test scenarios