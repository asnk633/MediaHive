# Unified Playwright Test Suite

This document explains how to use the unified Playwright test suite that covers all 6 groups of UI validation.

## Test Groups Covered

1. **FAB Visibility** - Validates Floating Action Button visibility and positioning across all viewports
2. **Safe-area Correctness** - Ensures safe-area initialization and values are correct
3. **Hydration Stability** - Detects and prevents hydration mismatches
4. **Greeting Positioning** - Validates proper positioning of greeting elements below TopBar
5. **Firebase Runtime** - Tests Firebase initialization and persistence
6. **WebView Device Behavior** - Comprehensive testing of WebView environments

## Running the Tests

### Quick Run
```bash
npm run test:full-ui
```

### Manual Run
```bash
npx playwright test unified-full-suite.spec.ts
```

### CI Mode
```bash
npx playwright test unified-full-suite.spec.ts --config=playwright.ci.config.ts
```

## Viewport Presets

The test suite runs on these viewport presets:
- Desktop: 1366×768
- Tablet: 1024×768
- Chrome Mobile: 412×915
- Pixel 7: 412×915
- Samsung S21: 360×800

## WebView Environments

The test suite emulates these WebView environments:
- Android WebView
- Chrome WebView 81
- Capacitor WebView

## Output

### Screenshots
Screenshots are saved to `test-results/` directory with descriptive names:
- `fab-visibility-{viewport}.png`
- `safe-area-{viewport}.png`
- `hydration-{viewport}.png`
- `greeting-{viewport}.png`
- `firebase-{viewport}.png`
- `webview-{environment}-test.png`

### Structured JSON Results
A comprehensive JSON report is generated at `test-results/unified-test-suite-results.json` with detailed results for each test group.

## Auto-Fix Patches

If issues are detected, apply the fixes in `ui-test-fixes.patch`:
```bash
git apply ui-test-fixes.patch
```

## Test Structure

The test suite is organized in 6 main describe blocks, each testing one group across all viewport presets. Each test:
1. Sets the appropriate viewport
2. Navigates to the relevant page
3. Performs validation checks
4. Captures screenshots
5. Records results in structured JSON format
6. Handles errors gracefully with detailed logging

## CI Integration

For CI environments, use the dedicated config file:
```bash
npx playwright test unified-full-suite.spec.ts --config=playwright.ci.config.ts
```

This configuration includes:
- Single worker for stability
- Increased retry count
- Optimized timeouts
- Specific device settings for consistent results

## Troubleshooting

### Test Failures
If tests fail, check:
1. The detailed console output for specific error messages
2. The generated screenshots for visual verification
3. The JSON results file for structured error data

### Performance Issues
If tests are slow:
1. Reduce the number of viewport presets tested
2. Use focused testing on specific groups
3. Increase timeouts in the config file

### Missing Elements
If UI elements are not found:
1. Verify the page routes are correct
2. Check that elements have the expected selectors
3. Ensure the app is fully loaded before testing