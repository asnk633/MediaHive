
# Dashboard Data Pipeline Architecture

## 1. Overview
The dashboard data flow is a strict, unidirectional pipeline designed to ensure consistency, type safety, and centralized logic. No component outside this pipeline is permitted to perform raw data manipulation or metric calculation.

## 2. The Canonical Pipeline
Data moves through four distinct stages:

```mermaid
graph TD
    A[CanonicalDataService] -->|Raw Data| B[Normalization Layer]
    B -->|NormalizedTask[]| C[Metrics Engine]
    C -->|DashboardMetrics| D[HomeClient]
    D -->|Readonly Metrics| E[Widgets]
```

### Stage 1: Fetch (CanonicalDataService)
- **Source**: `src/services/canonicalDataService.ts`
- **Responsibility**: Fetches raw data from backend APIs.
- **Constraints**: Applies `TASK_FETCH_LIMIT` to prevent O(N) overload.
- **Output**: Raw JSON objects (Tasks, Events).

### Stage 2: Normalization (The Gatekeeper)
- **Source**: `src/lib/normalization.ts`
- **Responsibility**: 
  - Coerces all dates to strict `Date | null` objects.
  - Handles Firestore Timestamps, ISO strings, and edge cases.
  - Filters out invalid timestamps.
- **Functions**: `normalizeTasks(raw)`, `normalizeEvents(raw)`
- **Output**: `NormalizedTask[]`, `NormalizedEvent[]` (Strictly Typed).

### Stage 3: Computation (The Metrics Engine)
- **Source**: `src/lib/dashboardMetrics.ts`
- **Responsibility**: 
  - Consumes Normalized Data.
  - Applies all business logic and status rules.
  - **NO** date parsing allowed (assumes valid inputs).
- **Output**: `DashboardMetrics` (Readonly Interface).

### Stage 4: Consumption (UI Layer)
- **Source**: `src/app/(shell)/home/HomeClient.tsx`
- **Responsibility**: 
  - Manages state (`tasks`, `events`).
  - Memoizes metrics computation.
  - Distributes data to widgets.
- **Widgets**: Can ONLY read calculated metrics. **Forbidden** from filtering raw arrays.

## 3. Timezone Policy
- **Storage**: UTC (Firestore).
- **Client**: Local Time (Browser interpreted).
- **Normalization**: Converts all inputs to local JS `Date` objects relative to the user's browser.
- **Bucketing**: "Today", "This Week", etc., are calculated based on the user's local execution context (`new Date()` in `dashboardMetrics.ts`).

## 4. Forbidden Patterns
❌ **Downstream Filtering**: Widgets must never use `.filter()`, `.map()`, or `.reduce()` on `tasks` arrays to verify counts.
❌ **Ad-hoc Parsing**: `new Date(task.dueDate)` is forbidden in widgets. Use normalized fields only.
❌ **Bypassing Normalization**: Fetching data and passing it directly to `computeDashboardMetrics` without `normalizeTasks` is a type violation.
