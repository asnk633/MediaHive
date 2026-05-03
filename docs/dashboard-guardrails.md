
# Dashboard Guardrails & Enforcement

To maintain system integrity, several layers of protection are active.

## 1. Type-Level Immutability
**File**: `src/lib/dashboardMetrics.ts`
- The `DashboardMetrics` interface uses `readonly` fields.
- **Effect**: Widgets cannot mutate metric values locally (e.g., `metrics.dueToday++` is a compile error).

## 2. Runtime Integrity Checks (Dev Only)
**File**: `src/lib/dashboardMetrics.ts` -> `assertDashboardMetrics()`
- Runs after calculation in `HomeClient`.
- **Checks**:
  - Usage of negative numbers.
  - Missing event arrays.
  - Malformed admin totals.
- **Outcome**: `console.error` if data integrity is violated.

## 3. Strict Normalization Pipeline
**File**: `src/lib/normalization.ts`
- **Rule**: No component may consume raw fetch outcomes directly for metrics.
- **Enforcement**: strict TS types `NormalizedTask` (Date fields are non-optional `Date | null`). Passing raw `Task[]` to the metrics engine causes a TS error.

## 4. ESLint Widget Restrictions
**File**: `eslint.config.mjs`
- **Rule**: `no-restricted-syntax`
- **Scope**: `src/components/home/widgets/**`
- **Forbidden**: 
  - `.filter(...)` on any variable named `tasks` or `events`.
  - `.reduce(...)`.
- **Reason**: Prevents "Shadow Logic" (calculating metrics inside UI components).

## 5. Regression Test Suite
**File**: `src/__tests__/unit/dashboardMetrics.test.ts`
- **Trigger**: Run `npm run test:unit`.
- **Scope**: Validates all semantic rules.
- **Requirement**: Must remain green.
