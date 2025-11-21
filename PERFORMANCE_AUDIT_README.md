# Performance Audit System

## Overview

This performance audit system provides comprehensive performance monitoring and optimization capabilities for the Thaiba Garden Media Manager. It includes automated audits, dashboard visualization, and CI/CD integration.

## Features

- **Lighthouse Audits**: Web performance, accessibility, best practices, and SEO analysis
- **Load Testing**: Automated load testing with autocannon
- **Bundle Analysis**: JavaScript bundle size analysis
- **Playwright Integration**: Performance test execution and reporting
- **Database Query Analysis**: SQL query performance checks
- **Dashboard UI**: Visual reporting at `/admin/performance`
- **CI/CD Integration**: Automated nightly audits via GitHub Actions

## Installation

The required dependencies are already included in the project's `package.json`. To install:

```bash
npm install
```

This will install all required devDependencies:
- `lighthouse`: Web performance auditing
- `chrome-launcher`: Chrome browser automation
- `autocannon`: HTTP/1.1 benchmarking tool
- `source-map-explorer`: Bundle analysis
- `fs-extra`: Enhanced file system operations
- `dayjs`: Date/time handling
- `minimist`: Command line argument parsing

## Usage

### Running a Full Audit

To run a complete performance audit locally:

```bash
npm run audit:full
```

This command will:
1. Run Lighthouse audit on the base URL
2. Execute load tests with autocannon
3. Run Playwright performance tests
4. Analyze bundle sizes
5. Generate reports in `reports/performance/YYYY-MM-DD/`

### CI Mode

For CI environments (headless mode):

```bash
npm run audit:ci
```

### Viewing Reports

#### Dashboard UI

Access the performance dashboard at:
```
http://localhost:3000/admin/performance
```

The dashboard provides:
- Report selection and navigation
- Lighthouse scores visualization
- Load test results
- Detailed report viewing

#### Direct API Access

Reports can also be accessed via API endpoints:
- List reports: `GET /api/perf/reports?type=list`
- Get summary: `GET /api/perf/reports?date=YYYY-MM-DD&type=summary`
- Get Lighthouse JSON: `GET /api/perf/reports?date=YYYY-MM-DD&type=lighthouse-json`
- Get Lighthouse HTML: `GET /api/perf/reports?date=YYYY-MM-DD&type=lighthouse-html`
- Get autocannon results: `GET /api/perf/reports?date=YYYY-MM-DD&type=autocannon`

### Generated Artifacts

Reports are stored in `reports/performance/` with the following structure:

```
reports/performance/
├── YYYY-MM-DD/
│   ├── lighthouse.html
│   ├── lighthouse.json
│   ├── autocannon.json
│   ├── playwright-test-results/
│   ├── bundle-*.html
│   └── summary.md
└── latest/
    ├── summary.md
    └── [symlinks to latest reports]
```

## Configuration

The audit system can be configured via `.audit-config.json`:

### Lighthouse Configuration
- Performance thresholds for each category
- Enabled audit categories

### Autocannon Configuration
- Target endpoints for load testing
- Test duration and connection settings
- Performance thresholds

### Playwright Configuration
- Test file patterns
- Timeout settings

### Bundle Analysis
- Maximum chunk and total bundle sizes

### Database Analysis
- Slow query thresholds
- Queries to analyze with EXPLAIN

## CI/CD Integration

The system includes a GitHub Actions workflow that:
- Runs nightly at 2 AM UTC
- Can be triggered manually via workflow_dispatch
- Installs required dependencies
- Builds and starts the application
- Runs performance audits
- Uploads artifacts

## Requirements

- **Chrome/Chromium**: Required for Lighthouse audits
  - Ubuntu/Debian: `sudo apt-get install chromium-browser`
  - macOS: `brew install --cask chromium`
  - Windows: Download Chrome from https://www.google.com/chrome/

- **Node.js**: Version 18 or higher

## Security

- Performance dashboard is only available in development mode
- Can be enabled in production with `PERF_DASHBOARD_ENABLED=true`
- All reports are stored locally and not exposed publicly

## Troubleshooting

### Chrome/Chromium Not Found

If you see "Chrome/Chromium not found" errors:
1. Install Chrome or Chromium using the commands above
2. Ensure it's available in your PATH

### Permission Errors

If you encounter permission errors:
1. Ensure the `reports/` directory is writable
2. Run commands with appropriate permissions

### Load Test Failures

If load tests fail:
1. Verify the target endpoints are accessible
2. Check server logs for errors
3. Adjust connection counts for your environment

## Customization

### Adding New Audit Types

To extend the audit system:
1. Add new scripts in `scripts/audit/`
2. Update `scripts/audit/full-audit.js` to call new audits
3. Modify the dashboard UI to display new results

### Modifying Thresholds

Adjust performance thresholds in `.audit-config.json` to match your requirements.

## Future Enhancements

- Database query analysis integration
- Custom performance metrics collection
- Alerting system for performance regressions
- Historical performance trend analysis
- Mobile performance testing