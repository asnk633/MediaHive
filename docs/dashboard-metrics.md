
# Dashboard Metrics Definitions

> **Status:** LOCKED (Phases 3-9)
> **Source of Truth:** `src/lib/dashboardMetrics.ts`

## Core Metrics

### 1. Due Today (Legacy Merged)
**Definition**: Tasks that are overdue OR due today.
- **Condition**: 
  - `Task.dueDate` exists AND
  - `Task.status` != `'done'` AND
  - (`Task.dueDate` is strictly in the past OR `Task.dueDate` is strictly within "Today" 00:00-23:59).
- **Note**: This is a legacy behavior where "Due Today" implies "Attention Required Immediately".

### 2. Overdue
**Definition**: Tasks strictly past their due date.
- **Condition**:
  - `Task.dueDate` exists AND
  - `Task.status` != `'done'` AND
  - `Task.dueDate` < `Today 00:00`. (Strictly past).

### 3. Completed Today
**Definition**: Tasks finished within the current calendar day.
- **Condition**:
  - `Task.status` == `'done'` AND
  - `Task.completedAt` is within "Today" 00:00-23:59.

### 4. In Progress
**Definition**: Active work.
- **Condition**: `Task.status` === `'in_progress'`.

### 5. On Hold (Strict)
**Definition**: Blocked work.
- **Condition**: `Task.status` === `'on_hold'`.
- **Note**: Formerly mixed with "Blocked" tag, now strictly status-based.

### 6. Review
**Definition**: Tasks awaiting review.
- **Condition**: `Task.status` === `'review'`.

## Admin Totals

### 7. Pending Approvals
**Definition**: Tasks needing managerial sign-off.
- **Condition**: 
  - `Task.status` === `'review'` OR
  - `Task.approvalStatus` === `'pending'`.

### 8. Global Overdue
**Definition**: Same as Core Overdue but exposed for Admin Oversight.

### 9. Created By Me
**Definition**: Tasks created by the current user.
- **Condition**: `Task.createdBy.uid` === `CurrentUser.uid`.

### 10. Active Campaigns
**Definition**: Count of unique campaigns involved in the current task list.
- **Condition**: count distinct `Task.campaignId`.

## Event Metrics

### 11. Next 7 Days Events
**Definition**: Timeline view.
- **Condition**: `Event.date` is within `[Today 00:00, Today + 7 Days 23:59]`.
- **Ordering**: Ascending by date.

### 12. This Week Events
**Definition**: Weekly snapshot.
- **Condition**: `Event.date` is within `[Start of Week, End of Week]`.
- **Note**: Start of week depends on locale (usually Sunday/Monday).
