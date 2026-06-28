# Quickstart Validation: MediaHive Core Architecture

## Validation Scenarios

### Scenario 1: Multi-Tenant RLS Policy Validation
Test that User A under Tenant A cannot view or modify the logs of Tenant B.
1. Authenticate as User A (Tenant A manager).
2. Attempt to select from `presence_logs` where `tenant_id` equals Tenant B's ID.
3. **Expected result**: Database returns an empty result set or access violation error.

### Scenario 2: Relative Paths Linter Gate Check
Run the ESLint suite to guarantee no relative endpoint formats are introduced in the codebase.
1. Run lint check.
2. **Expected result**: The linter flags any occurrences of direct `/api/` references in client fetches.
