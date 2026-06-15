import { test, expect } from '@playwright/test';

// Credentials from kanban-dnd.spec.ts which are likely valid for Real Firebase
const ADMIN_USER = {
    email: 'media@thaibagarden.com',
    password: 'media@thaiba'
};

test.describe('Task Editing Regression', () => {

    let mockTask: any; // Type 'any' for simplicity in test file
    let originalTitle = `Test Task ${Date.now()}`;
    let updatedTitle = `Updated ${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        console.log('--- Starting Test Setup ---');
        page.on('console', msg => console.log(`[BROWSER][${msg.type()}] ${msg.text()}`));

        // Unified Mock Handler to isolate UI from Backend completely
        await page.route('**/api/**', async route => {
            const url = route.request().url();
            const method = route.request().method();

            // Allow Auth to proceed to real backend (for session cookie)
            if (url.includes('/auth/')) {
                await route.continue();
                return;
            }

            // Mock Users
            if (url.includes('/api/users')) {
                if (url.includes('/me')) {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            user: {
                                uid: 'mock-uid',
                                name: 'Admin',
                                email: ADMIN_USER.email,
                                role: 'admin',
                                institution_id: '1',
                                department_id: 1
                            }
                        })
                    });
                } else {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            teamMembers: [{ uid: 'mock-uid', name: 'Admin' }],
                            admins: [{ uid: 'mock-uid', name: 'Admin' }],
                            users: []
                        })
                    });
                }
                return;
            }

            // Mock Write Operations (POST/PUT/DELETE)
            // This catches addTask, updateTask, assign, etc.
            if (['POST', 'PUT', 'DELETE'].includes(method)) {
                const postData = route.request().postData();
                if (postData) {
                    try {
                        const payload = JSON.parse(postData);
                        if (payload.title) mockTask.title = payload.title;
                        if (payload.description) mockTask.description = payload.description;
                        if (payload.status) mockTask.status = payload.status;
                        if (payload.priority) mockTask.priority = payload.priority;
                    } catch (e) {
                        console.log('Failed to parse post data in mock:', e);
                    }
                }
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: mockTask.id,
                        success: true,
                        // Return mock task for some responses if needed
                        task: mockTask
                    })
                });
                return;
            }

            // Mock Task Read Operations
            if (url.includes('/api/tasks')) {
                // Heuristic: URL path depth to distinguish list vs detail
                // /api/tasks (List) vs /api/tasks/123 (Detail)
                const isDetail = /\/api\/tasks\/[^?]+/.test(url);

                if (isDetail && !url.includes('/assign')) {
                    // Single Task
                    console.log('MOCK: Serving DETAIL');
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ task: mockTask })
                    });
                } else {
                    // Task List
                    console.log('MOCK: Serving LIST');
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ tasks: [mockTask] })
                    });
                }
                return;
            }

            // Mock chat unreads API to return an empty array to prevent TypeError crash
            if (url.includes('/api/chat/rooms')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([])
                });
                return;
            }

            // Mock all other GETs (Stats, Deliverables, Notifications)
            // Prevents 429s from background polling
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
        });

        // Intercept Supabase REST API requests to isolate from real backend
        await page.route('**/rest/v1/**', async route => {
            const url = route.request().url();
            const method = route.request().method();
            console.log(`MOCK SUPABASE: [${method}] ${url}`);

            if (method === 'POST') {
                const postData = route.request().postData();
                if (postData) {
                    try {
                        const payload = JSON.parse(postData);
                        const item = Array.isArray(payload) ? payload[0] : payload;
                        if (item.title) mockTask.title = item.title;
                        if (item.description) mockTask.description = item.description;
                        if (item.status) mockTask.status = item.status;
                        if (item.priority) mockTask.priority = item.priority;
                    } catch (e) {
                        console.log('Failed to parse Supabase insert payload:', e);
                    }
                }
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(mockTask)
                });
            } else if (method === 'PATCH') {
                const postData = route.request().postData();
                if (postData) {
                    try {
                        const payload = JSON.parse(postData);
                        if (payload.title) mockTask.title = payload.title;
                        if (payload.description) mockTask.description = payload.description;
                        if (payload.status) mockTask.status = payload.status;
                        if (payload.priority) mockTask.priority = payload.priority;
                    } catch (e) {
                        console.log('Failed to parse Supabase patch payload:', e);
                    }
                }
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([mockTask])
                });
            } else if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([mockTask])
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({})
                });
            }
        });

        // Initialize Mock Task
        originalTitle = `Test Task ${Date.now()}`;
        updatedTitle = `Updated ${Date.now()}`;
        mockTask = {
            id: 'mock-task-123',
            title: originalTitle,
            description: 'Regression test description',
            status: 'todo',
            priority: 'medium',
            due_date: new Date(Date.now() + 86400000).toISOString(),
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            department: 'Media & IT Office',
            assignedBy: { uid: 'mock-uid', name: 'Admin', role: 'admin' },
            createdBy: { uid: 'mock-uid', name: 'Admin', role: 'admin' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
        };

        // Programmatic login bypass
        await page.goto('/login');
        await page.evaluate(() => {
            localStorage.setItem('playwright_test_auth', 'true');
            localStorage.setItem('playwright_test_role', 'admin');
            localStorage.setItem('playwright_test_institution_id', '1');
            localStorage.setItem('playwright_test_department_id', '1');
            localStorage.setItem('mediahive_onboarding_complete', 'true');
            localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
        });
        try {
            await page.goto('/home');
        } catch (e: any) {
            if (!e.message.includes('ERR_ABORTED') && !e.message.includes('NS_BINDING_ABORTED')) throw e;
        }
        await expect(page).toHaveURL(/.*home/, { timeout: 10000 });

        // Navigate to tasks
        try {
            await page.goto('/tasks');
        } catch (e: any) {
            if (!e.message.includes('ERR_ABORTED') && !e.message.includes('NS_BINDING_ABORTED')) throw e;
        }
        await page.waitForLoadState('load');
    });

    test('Data Integrity: Edit title only', async ({ page }) => {
        // Switch to List View for reliable verification
        const listBtn = page.getByTitle('List View');
        if (await listBtn.isVisible()) {
            await listBtn.click();
        }

        // Check for FAB or New Task button with robust aria-label selector
        // This covers both Desktop Link and Mobile FAB if modeled correctly
        const newTaskBtn = page.getByLabel('New Task');

        console.log('Waiting for create option...');
        try {
            await expect(newTaskBtn).toBeVisible({ timeout: 10000 });
            await newTaskBtn.click();
        } catch (e) {
            console.log('No create option found after wait.');
            console.log('URL:', page.url());
            // Fallback: Try finding by Link HREF if Label fails (e.g. FAB hidden)
            const link = page.locator('a[href="/tasks/new"]');
            if (await link.isVisible()) {
                await link.click();
            } else {
                await page.screenshot({ path: 'test-results/no-create-button.png' });
                throw new Error('Create button missing');
            }
        }

        // Create Task
        // Create Task Modal check (skip if on /tasks/new page)
        if (!page.url().includes('/tasks/new')) {
            const modal = page.locator('dialog, [role="dialog"], .fixed').first();
            await expect(modal).toBeVisible();
        }
        // Wait for form to be fully rendered
        await page.waitForLoadState('networkidle');

        // Fill properly - use getByPlaceholder for resilient selection across input/textarea
        const titleInput = page.getByPlaceholder('What needs to be done?');
        await expect(titleInput).toBeVisible({ timeout: 10000 });
        await titleInput.fill(originalTitle);

        // Fill Description
        await page.getByPlaceholder('Add details...').fill('Regression test description');

        // Fill Due Date (Tomorrow) using the keyboard shortcut Alt+ArrowRight
        await page.keyboard.press('Alt+ArrowRight');

        // Select Department via DropdownSelector (custom popover-based UI, not native <select>)
        // The form uses DropdownSelector which renders as a Button trigger + Popover with buttons inside
        // Click the department trigger button and select the first available option
        const deptTrigger = page.locator('button').filter({ hasText: /Select option|None/ }).first();
        if (await deptTrigger.count() > 0 && await deptTrigger.isVisible() && await deptTrigger.isEnabled()) {
            await deptTrigger.click();
            // Wait for popover to open and click first real option (skip "None")
            const deptOption = page.locator('[role="presentation"] button, [data-radix-popper-content-wrapper] button').filter({ hasNotText: 'None' }).first();
            if (await deptOption.count() > 0) {
                await deptOption.click();
            } else {
                // Close popover if no option found
                await page.keyboard.press('Escape');
            }
        }

        // Monitor for alerts (validation failures)
        page.on('dialog', async dialog => {
            console.log(`Alert detected: ${dialog.message()}`);
            await dialog.dismiss();
        });

        // Find Create button
        const createBtn = page.getByRole('button', { name: /create/i }).first();
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toBeEnabled();
        await createBtn.click();

        // Verify creation
        await expect(page.getByText(originalTitle)).toBeVisible();

        // Edit Task - Click the Edit task button directly on the task row
        const editBtn = page.getByRole('button', { name: 'Edit task' }).first();
        await expect(editBtn).toBeVisible({ timeout: 10000 });
        await editBtn.click();

        // Wait for edit dialog to appear (Radix Dialog may take time to render)
        const editDialog = page.locator('[role="dialog"]');
        await expect(editDialog).toBeVisible({ timeout: 10000 });

        // Wait for edit modal - re-locate the title input since it may be in a new modal
        const editTitleInput = page.locator('input[placeholder="What needs to be done?"]');
        await expect(editTitleInput).toBeVisible({ timeout: 10000 });
        // Check value is present
        await expect(editTitleInput).toHaveValue(originalTitle);

        await editTitleInput.fill(updatedTitle);

        // Click Save/Update
        const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
        await expect(saveBtn).toBeVisible({ timeout: 5000 });
        await saveBtn.click();

        // Verify update
        await expect(page.getByText(updatedTitle)).toBeVisible();
        await expect(page.getByText(originalTitle)).not.toBeVisible();

        // Reload
        await page.reload();
        await page.waitForLoadState('load');
        await expect(page.getByText(updatedTitle)).toBeVisible();
    });
});
