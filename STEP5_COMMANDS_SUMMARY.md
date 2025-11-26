# Hardening/Stability Commands Summary

## Branch Setup
```bash
git fetch origin
git checkout -b hardening/stability-performance-step5
```

## Baseline Tests
```bash
npm ci
npm run lint || true
npm run test || true
npx playwright test --reporter=list || true
```

## Error Handling Implementation
```bash
# Created files:
# - src/components/ErrorBoundary.tsx
# - src/lib/logger.ts
# - src/lib/monitor.ts
# - src/components/KeyboardNavigationDetector.tsx
```

## Network Stability Implementation
```bash
# Created files:
# - src/lib/fetcher.ts
# - src/lib/network.ts
# - src/components/OfflineBanner.tsx
```

## Production Build & Analysis
```bash
# Clean build directory
rm -rf .next

# Production build with increased memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build

# Run production server
npm run start

# Bundle analysis
npm install @next/bundle-analyzer --save-dev
ANALYZE=true npx next build

# Copy analysis reports
mkdir bundle-analysis
cp .next/analyze/* bundle-analysis/
```

## Lighthouse Audits
```bash
# Install Lighthouse
npm install lighthouse @lhci/cli --save-dev

# Run Lighthouse audits
npx lhci autorun

# Copy reports
mkdir lighthouse-reports
cp .lighthouseci/* lighthouse-reports/
```

## CI Updates
```bash
# Updated .github/workflows/playwright.yml to include:
# - lint step
# - unit test step
# - artifact retention for reports
```

## Documentation
```bash
# Created STEP5_PR_DESCRIPTION.md
```