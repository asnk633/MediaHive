---
name: attendance-task-validator
description: Lists tasks for the NFC Attendance System audit and verifies completion.
---

# NFC Attendance System Task Validator

## When to use this skill
- When verifying the NFC Attendance System implementation.
- To check off completed tasks, audit code paths, and run verification.

## Workflow Checklist
- [x] SECTION 1: Database (Tables, Columns, RLS Policies, Indexes)
- [x] SECTION 2: Attendance Policies (Configs, Storage, UI Settings)
- [x] SECTION 3: NFC Infrastructure (Registration, Check-In, Check-Out, Cooldown, Campus, Location Groups)
- [x] SECTION 4: GPS Features (Radius Validation, Grace Period Geofencing, Reminders, Mock GPS detection)
- [x] SECTION 5: Attendance Requests (Missed Check-In, Remote Checkout, Approvals, Rejections, Expirations)
- [x] SECTION 6: Timeline Events (Audits, Offline Synced, Override, Auto-Closed, Device Shifts, Duplicate Cooldowns)
- [x] SECTION 7: Overtime & Hour Calculations (Regular, Overtime, Late, Early Departure, Holiday, Weekend, Field Hours)
- [x] SECTION 8: Offline Queue (Hive Cache, Syncing, Retry Backoff)
- [x] SECTION 9: Security (Biometrics, Server Time Enforcement, Device Auditing, Immutable Events)
- [x] SECTION 10: Reports (PDF, Excel, Campus and Holiday filtering)
- [x] SECTION 11: UI Routing and Screen mappings

## Verification Method
- Run the python verification tool: `python "d:\MediaHive App\execution\verify_attendance_tasks.py"`
- Inspect and verify modified Dart/Flutter files in the codebase.
- Execute database query tests via Supabase execute_sql.
