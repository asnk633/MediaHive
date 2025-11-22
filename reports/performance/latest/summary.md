# Performance Audit Report

**Generated:** 2025-11-21 21:28:37

## Lighthouse Results

**URL:** http://localhost:3000/

**Audit Time:** 2025-11-21T15:58:20.352Z

| Category | Score |
|----------|-------|
| Performance | 69/100 |
| Accessibility | 95/100 |
| Best Practices | 78/100 |
| SEO | 73/100 |

## Load Test Results (Autocannon)

**Target URL:** http://localhost:3000/api/tasks

**Duration:** 6s

**Connections:** 20

| Metric | Value |
|--------|-------|
| Requests/sec | 940.67 |
| Latency (ms) | 20.70 |
| Throughput (bytes/sec) | 348064.00 |

## Recommendations

- Review Lighthouse scores and address issues in categories below 90
- Optimize API endpoints with high latency or low throughput
- Check for memory leaks in long-running tests
- Consider implementing caching for frequently accessed resources
- Review bundle sizes and optimize large JavaScript chunks

## Generated Artifacts

The following artifacts were generated during this audit:

- autocannon.json
- lighthouse.html
- lighthouse.json
- summary.md

