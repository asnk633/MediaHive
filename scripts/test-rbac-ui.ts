
import { chromium } from 'playwright';

async function runTest() {
    console.log('Starting RBAC UI Tests...');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Helper to set role in localStorage
    async function setRole(role: string) {
        await page.addInitScript((r) => {
            localStorage.setItem('user', JSON.stringify({
                id: r === 'admin' ? 1 : r === 'team' ? 2 : 3,
                email: `${r}@thaiba.com`,
                fullName: `${r.toUpperCase()} User`,
                role: r,
                institutionId: '1'
            }));
        }, role);
    }

    try {
        // 0. Setup: Create a task as Admin to ensure we have something to test
        console.log('\n[Setup] Creating test task...');
        await setRole('admin');
        await page.goto('http://localhost:3000/tasks');
        await page.waitForLoadState('networkidle');

        // Create task via API
        await page.evaluate(async () => {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
                body: JSON.stringify({
                    title: 'RBAC Test Task',
                    description: 'Testing permissions',
                    priority: 'medium',
                    institutionId: '1'
                })
            });
        });
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 1. Test Guest UI
        console.log('\n[Test 1] Guest UI');
        await setRole('guest');
        await page.goto('http://localhost:3000/tasks');
        await page.waitForLoadState('networkidle');

        // Check FAB
        const fabNewTaskText = await page.getByText('New Task').isVisible().catch(() => false);
        console.log(`Guest sees New Task FAB: ${fabNewTaskText}`);

        // Check Task Item Actions
        const deleteBtn = await page.$('button[aria-label="Delete task"]');
        console.log(`Guest sees Delete Button: ${!!deleteBtn} (Expected: false)`);


        // 2. Test Team UI
        console.log('\n[Test 2] Team UI');
        await setRole('team');
        await page.goto('http://localhost:3000/tasks');
        await page.waitForLoadState('networkidle');

        const teamDeleteBtn = await page.$('button[aria-label="Delete task"]');
        console.log(`Team sees Delete Button: ${!!teamDeleteBtn} (Expected: false)`);


        // 3. Test Admin UI
        console.log('\n[Test 3] Admin UI');
        await setRole('admin');
        await page.goto('http://localhost:3000/tasks');
        await page.waitForLoadState('networkidle');

        const adminDeleteBtn = await page.$('button[aria-label="Delete task"]');
        console.log(`Admin sees Delete Button: ${!!adminDeleteBtn} (Expected: true)`);

        const tasksCount = await page.locator('.task-row').count();
        console.log(`Tasks found: ${tasksCount}`);

        // Check Review Status Dropdown in Tasks Page
        const reviewSelect = await page.$('select[aria-label="Review status"]');
        console.log(`Admin sees Review Status Dropdown: ${!!reviewSelect} (Expected: true)`);

        // Check Debug Role
        const debugRole = await page.getByTestId('debug-role').textContent().catch(() => 'not found');
        console.log(`Debug Role: ${debugRole}`);

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        await browser.close();
    }
}

runTest();
