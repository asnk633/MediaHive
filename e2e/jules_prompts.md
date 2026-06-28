# Jules AI E2E Test Generation Prompts

These are the 7 prompts for Jules AI to generate the Playwright test files, adhering to the triple-reviewed E2E coverage plan.

---

## Instructions for Using Jules AI
1. Run each prompt in Jules AI.
2. Direct Jules to save the generated file to `e2e/playwright/<filename>`.
3. If Jules makes assumptions about selectors, make sure it knows to use the helpers:
   - `import { loginAsAdmin, loginAsGuest, loginAsMember } from './helpers/auth';`
   - `import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';`
   - `import { safeGoto, waitForPageReady, retryAction, waitForMessage } from './helpers/navigation';`

---

## 1. Events CRUD (`events-crud.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/events-crud.spec.ts' that tests the Events feature.
Requirements:
1. Imports auth, cleanup, and navigation helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
   import { safeGoto } from './helpers/navigation';

2. Uses a unique prefix for created events:
   let testPrefix: string;
   test.beforeEach(async () => {
     testPrefix = getTestPrefix('events');
   });

3. Cleanup:
   test.afterEach(async () => {
     await cleanupByPrefix('events', 'title', testPrefix);
   });

4. Tests to include:
   - Event page loads with calendar (login as admin, safeGoto('/events'))
   - Toggle view modes (month/week/timeline/list)
   - Create new event (click create event, fill fields containing testPrefix in title, click submit, verify visible)
   - View event detail modal (create an event first or open dialog)
   - Edit event (create event, open modal, click edit, change details, save, verify update)
   - Delete event (create event, click delete, verify gone)
   - Validation: empty/invalid fields block submission
   - Guest cannot create events (login as guest, safeGoto('/events'), verify create button not visible or disabled)
```

---

## 2. Inventory Management (`inventory-crud.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/inventory-crud.spec.ts' that tests the Inventory feature.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
   import { safeGoto } from './helpers/navigation';

2. Unique prefix:
   let testPrefix: string;
   test.beforeEach(async () => {
     testPrefix = getTestPrefix('inventory');
   });

3. Cleanup:
   test.afterEach(async () => {
     await cleanupByPrefix('inventory_items', 'name', testPrefix);
   });

4. Tests to include:
   - Inventory page loads (safeGoto('/inventory'))
   - Add new item (fill fields with testPrefix in name, submit, verify visible)
   - View item detail modal
   - Edit item
   - View inventory requests page
   - View inventory stats dashboard
   - Validation: invalid/empty input prevents item addition
   - Guest cannot add items (login as guest, verify add button hidden or disabled)
```

---

## 3. Downloads/Files (`downloads-files.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/downloads-files.spec.ts' that tests the Downloads/Files feature.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { safeGoto } from './helpers/navigation';

2. Tests to include:
   - Downloads page loads (login as admin, safeGoto('/downloads'))
   - Upload file to Google Drive (test with a real file upload. Provide a dummy local file using a buffer or temp file in the test. Assert that upload succeeds and logs the Google Drive file ID to console)
   - Download a file (find an existing download button, trigger download, assert download completes)
   - Guest cannot upload (login as guest, verify upload inputs/buttons are absent/disabled)
   - Upload unsupported file type (assert validation error triggers)
```

---

## 4. Chat Messaging (`chat-messaging.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/chat-messaging.spec.ts' that tests Chat Messaging.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
   import { safeGoto, waitForMessage } from './helpers/navigation';

2. Unique prefix and cleanup:
   let testPrefix: string;
   test.beforeEach(async () => {
     testPrefix = getTestPrefix('chat');
   });
   test.afterEach(async () => {
     await cleanupByPrefix('chat_rooms', 'name', testPrefix);
   });

3. Tests to include:
   - Chat page loads (login as admin, safeGoto('/chat'))
   - Create chat room (use name with testPrefix, verify created)
   - Send text message in room (type message, submit, verify it displays using waitForMessage helper)
   - View message in room
   - Add participant to room
   - Send empty message blocked (verify send button disabled or warning shown)
   - Cross-user room visibility (create two browser contexts in the same test using page.context().browser().newContext() or browser.newContext(). Authenticate admin in context 1 and guest/member in context 2. Send message from admin, check real-time receive in context 2 room)
```

---

## 5. Reports (`reports-view.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/reports-view.spec.ts' that tests the Reports page.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { safeGoto } from './helpers/navigation';

2. No database changes (read-only):
   - Reports dashboard loads (verify reports UI components or charts render)
   - Activity report page loads
   - Analytics report page loads
   - Performance report page loads
   - Custom report builder UI loads
   - Guest sees Access Denied on reports page (login as guest, safeGoto('/reports'), assert Access Denied is shown)
```

---

## 6. Settings (`settings-page.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/settings-page.spec.ts' that tests the Settings page.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { safeGoto } from './helpers/navigation';

2. Tests to include:
   - Settings page loads (login as admin, safeGoto('/settings'))
   - Admin sees all config options (e.g. system configurations, general settings)
   - Guest has limited access or redirect on settings page (login as guest, safeGoto('/settings'), verify restriction)
   - Settings persist after reload (change a UI configuration preference, e.g. dark mode toggle or theme if present, refresh, verify preference persists)
```

---

## 7. User Management (`user-management.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/user-management.spec.ts' that tests User Management page.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { safeGoto } from './helpers/navigation';

2. Tests to include:
   - Users list page loads (login as admin, safeGoto('/users') or '/admin/users' as appropriate)
   - User count >= 1 (verify list renders at least the logged-in user profile)
   - View own profile details
   - Profile shows correct role badge (e.g. Administrator/Admin)
   - Guest sees limited user list or restricted access depending on RBAC rules
```

---

## 8. Manager Analytics Dashboard (`manager-analytics.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/manager-analytics.spec.ts' that tests the Manager Analytics Dashboard.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest, loginAsMember } from './helpers/auth';
   import { safeGoto } from './helpers/navigation';

2. Tests to include:
   - Manager Analytics page loads (login as admin, safeGoto('/manager-analytics'), assert title or headers visible)
   - Recharts visual components render (verify SVGs or specific chart container CSS classes exist)
   - Velocity tracking widget shows metrics
   - Role boundaries:
     - Guest is denied (login as guest, safeGoto('/manager-analytics'), verify redirect or 'Access Denied' alert)
     - Standard Member is denied (login as member, safeGoto('/manager-analytics'), verify redirect or restriction)
```

---

## 9. Leave Requests & Approval Flow (`leave-requests.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/leave-requests.spec.ts' that tests the Leave Request system.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest, loginAsMember } from './helpers/auth';
   import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
   import { safeGoto } from './helpers/navigation';

2. Unique prefix and database cleanup:
   let testPrefix: string;
   test.beforeEach(async () => {
     testPrefix = getTestPrefix('leave');
   });
   test.afterEach(async () => {
     await cleanupByPrefix('leave_requests', 'reason', testPrefix);
   });

3. Tests to include:
   - Leave requests dashboard loads (login as member, safeGoto('/leave'))
   - Create a new leave request (fill start date, end date, and reason containing testPrefix, submit, verify status is 'pending')
   - Double-booking validation: attempting to request leave on overlapping dates should trigger a validation block or warning
   - Manager approval flow (login as admin, safeGoto('/leave'), locate the member's pending request, click 'Approve', verify status changes to 'approved')
   - Guest cannot request leave (login as guest, verify request form/button is restricted)
```

---

## 10. Governance & Shift Policies (`governance-policies.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/governance-policies.spec.ts' that tests Governance Configuration and Shift Policies.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest, loginAsMember } from './helpers/auth';
   import { safeGoto } from './helpers/navigation';

2. Tests to include:
   - Governance CommandCenter screen loads (login as admin, safeGoto('/governance'))
   - Edit shift policy (click settings, change start/end time, shift grace period, or lunch breaks, save, verify persistence)
   - Configure deputy fallbacks (navigate to `/governance/deputies`, select a manager, assign a deputy user, save, verify listed)
   - RBAC restriction (login as member/guest, verify settings modification controls are disabled or page throws Access Denied)
```

---

## 11. Kanban Task Board & Drag-Drop (`tasks-kanban.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/tasks-kanban.spec.ts' that tests the Kanban Task Board.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin } from './helpers/auth';
   import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
   import { safeGoto } from './helpers/navigation';

2. Unique prefix and database cleanup:
   let testPrefix: string;
   test.beforeEach(async () => {
     testPrefix = getTestPrefix('tasks_kanban');
   });
   test.afterEach(async () => {
     await cleanupByPrefix('tasks', 'title', testPrefix);
   });

3. Tests to include:
   - Tasks board loads (login as admin, safeGoto('/tasks'))
   - Switch to Kanban View (assert columns 'To Do', 'Working', 'On Hold', 'Done' are visible)
   - Create a task in 'To Do' (fill title with testPrefix, verify added to 'To Do' column)
   - Drag and drop task between columns (find card, drag to 'Working' column locator, verify card shifts and updates status on backend)
   - Keyboard navigation drag-and-drop:
     - Focus task card, press 'Space' to grab
     - Press 'ArrowRight' to move to next column
     - Press 'Space' to drop, verify task status updates
   - Apply column filter (filter by priority, verify non-matching cards disappear)
```

---

## 12. Campaigns Management (`campaigns-crud.spec.ts`)
```text
Write a Playwright test file saved to 'e2e/playwright/campaigns-crud.spec.ts' that tests the Campaigns feature.
Requirements:
1. Imports helpers:
   import { test, expect } from '@playwright/test';
   import { loginAsAdmin, loginAsGuest } from './helpers/auth';
   import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
   import { safeGoto } from './helpers/navigation';

2. Unique prefix and database cleanup:
   let testPrefix: string;
   test.beforeEach(async () => {
     testPrefix = getTestPrefix('campaigns');
   });
   test.afterEach(async () => {
     await cleanupByPrefix('campaigns', 'name', testPrefix);
   });

3. Tests to include:
   - Campaigns dashboard loads (login as admin, safeGoto('/campaigns'))
   - Create new campaign (fill name containing testPrefix, select start/end dates, click submit, verify visible)
   - Edit campaign details (open edit modal, change description, save, verify)
   - Link task/event to campaign (go to task creation, select the created campaign from dropdown, submit task, verify task detail shows campaign link)
   - Guest cannot create campaigns (login as guest, verify controls are restricted)
```

