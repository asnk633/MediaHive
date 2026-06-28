# MediaHive Multi-Platform Data Presentation & Metrics Doctrine

## Overview
This document enforces the standard rules for presenting, filtering, and calculating data metrics across all MediaHive platforms (Web, Desktop, and Mobile). To ensure data integrity and user trust, **all platforms MUST display identical data for identical user contexts.**

## 1. Data Filtering (Database vs. In-Memory)
When fetching data from Supabase across any platform, observe the following rules for filtering:

### 1.1 Soft Deletes
Always filter out soft-deleted records at the database query level to minimize network payload.
- **Rule:** Apply `.eq('deleted', false)` on all table queries.

### 1.2 Demo Data (`is_demo_data`)
The `is_demo_data` column was introduced later in the schema, meaning older authentic production records have a `NULL` value for this column.
- **CRITICAL WARNING:** Do NOT use `.eq('is_demo_data', false)` in your Supabase queries. Supabase evaluates `NULL = false` as `false`, causing authentic production records to be silently dropped.
- **Rule:** Filter out demo data **in-memory / client-side** after fetching.
  - *TypeScript/JS:* `const validData = data.filter(item => !item.is_demo_data);`
  - *Dart/Flutter:* `final validData = data.where((item) => item['is_demo_data'] != true).toList();`

### 1.3 Tenancy Filtering
All requests must be strictly scoped to the user's organization.
- **Rule:** Always apply `.eq('tenant_id', userContext.tenantId)` where `tenantId` defaults to the user's `institution_id` (or equivalent organizational root).

---

## 2. Standardized Widgets & Metrics

The application displays two primary dashboards. Their timeframe scopes are fundamentally different, and their mathematical derivations must be identical across all clients.

### 2.1 System Status ("Team Today")
This widget is strictly concerned with **Today's** activity. It ignores past history (unless overdue).

- **Timeframe Boundary:** 
  - `todayStart` = 00:00:00 (Local Time)
  - `todayEnd` = 23:59:59 (Local Time)
- **Included Tasks (`totalSystemTasks`):**
  - **Due Today / Overdue:** Tasks where `status !== 'done'` AND `due_date <= todayEnd`.
  - **In Progress:** Tasks where `status === 'in_progress'` (or `'in-progress'`).
  - **On Hold:** Tasks where `status === 'on_hold'` (or `'on-hold'`, `'blocked'`).
  - **Completed Today:** Tasks where `status === 'done'` AND `completed_at` is exactly within today's boundaries.
- **Total System Tasks =** `dueToday + inProgress + onHold + completedToday`

### 2.2 My Requests ("Personal Summary" / "Global")
This widget acts as the user's historical lifetime ledger.

- **Timeframe Boundary:** All Time (Global).
- **Inclusion Criteria:** The user must be explicitly connected to the task.
  - User is the `creator_id`
  - User is listed in the `assignee_ids` or `assignee_id`
  - User's name exists in the legacy `assignee` string.
- **Metrics Breakdown:**
  - **Pending:** Status is `todo` or `pending`.
  - **In Progress:** Status is `in_progress`.
  - **In Review:** Status is `review` or `in_review`.
  - **Completed:** Status is `done` (historically).
- **Total Requests =** `pending + inProgress + inReview + completed`

---

## 3. Date & Timezone Handling
- Always normalize strings to ISO-8601 Date objects (`Date` in JS, `DateTime` in Dart) immediately upon fetching.
- Ensure all comparisons evaluating "Today" operate on the user's **Local Timezone**, not UTC, to prevent midnight rollover discrepancies (e.g. 5:30 AM IST vs 00:00 UTC).
