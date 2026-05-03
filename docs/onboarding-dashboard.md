
# Onboarding Guide: Dashboard System

Welcome to the MediaHive Dashboard. This system is heavily guarded to prevent calculation drift.

## 🛑 The Golden Rule
**NEVER calculate counts, totals, or filter lists inside a Widget.**

If you need a new number (e.g., "Urgent Tasks"):
1.  Add it to `DashboardMetrics` interface (`src/lib/dashboardMetrics.ts`).
2.  Implement logic in `computeDashboardMetrics`.
3.  Add a test case in `src/__tests__/unit/dashboardMetrics.test.ts`.
4.  Run tests.
5.  Consume it in the widget as `metrics.urgentTasks`.

## 🛠️ How to Work

### 1. Data Flow
- Data comes from `HomeClient`.
- It is **Normalized** immediately.
- It is passed to the **Metrics Engine**.
- Computed metrics are passed to **Widgets**.

### 2. Running Tests
Run the unit test suite to verify you haven't broken existing logic:
```bash
npm run test:unit src/__tests__/unit/dashboardMetrics.test.ts
```

### 3. Benchmarking
If you suspect performance issues with large datasets:
```bash
npm run test:unit src/__tests__/unit/dashboardMetricsBench.test.ts
```

### 4. Debugging
- In **development**, check the Console.
- "Phase-3 Parity Audit" logs will show you exactly how tasks are bucketed.
- `assertDashboardMetrics` will scream if you produce invalid data.

## 🤝 Key Contacts
- **Pipeline Authority**: `src/lib/normalization.ts`
- **Logic Authority**: `src/lib/dashboardMetrics.ts`
- **Safety Authority**: `.eslintrc`
