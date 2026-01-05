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
                                role: 'admin'
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

            // Mock all other GETs (Stats, Deliverables, Notifications)
            // Prevents 429s from background polling
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({})
            });
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
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            department: 'Media & IT Office',
            assignedBy: { uid: 'mock-uid', name: 'Admin', role: 'admin' },
            createdBy: { uid: 'mock-uid', name: 'Admin', role: 'admin' },
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }
        };

        // Login as Admin
        await page.goto('/login');
        await expect(page.locator('input[type="email"]')).toBeVisible();

        await page.fill('input[type="email"]', ADMIN_USER.email);
        await page.fill('input[type="password"]', ADMIN_USER.password);
        await page.click('button[type="submit"]');

        // Wait for redirect to home
        try {
            await page.waitForURL('**/home', { timeout: 15000 });
        } catch (e) {
            console.log('Login timeout with media@thaibagarden.com, taking screenshot...');
            await page.screenshot({ path: 'test-results/login-failure-media.png' });
            throw e;
        }

        // Navigate to tasks
        await page.goto('/tasks');
        try {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (e) {
            console.log('/tasks load timeout, continuing...');
        }
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
        const modal = page.locator('dialog, [role="dialog"], .fixed').first();
        await expect(modal).toBeVisible();

        // Fill properly - Selector fixed based on UI inspection (Task title...)
        const titleInput = page.locator('input[placeholder="Task title..."]');
        await expect(titleInput).toBeVisible();
        await titleInput.fill(originalTitle);

        // Listen for console logs
        page.on('console', msg => console.log(`PAGE_LOG: ${msg.text()}`));

        // Fill Description
        await page.locator('textarea[placeholder="Add details..."]').fill('Regression test description');

        // Fill Due Date (Tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        await page.locator('input[type="date"]').fill(dateStr);

        // Select Department (explicitly by label or value to avoid selecting empty default)
        const deptSelect = page.locator('select');
        // 'Media & IT Office' is a known valid department from manual verification
        await deptSelect.selectOption({ label: 'Media & IT Office' });

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

        // Edit Task
        await page.getByText(originalTitle).click();

        // Wait for edit modal - assuming it's the same or similar
        await expect(titleInput).toBeVisible();
        // Check value is present
        await expect(titleInput).toHaveValue(originalTitle);

        await titleInput.fill(updatedTitle);

        // Click Save/Update
        const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Verify update
        await expect(page.getByText(updatedTitle)).toBeVisible();
        await expect(page.getByText(originalTitle)).not.toBeVisible();

        // Reload
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(updatedTitle)).toBeVisible();
    });
});
