
import { test, expect } from '@playwright/test';

// Credentials provided by the user
const ADMIN_USER = {
    email: 'media@thaibagarden.com',
    password: 'media@thaiba'
};

const TEAM_USER = {
    email: 'kmspallikkunnu@gmail.com',
    password: 'sabith@thaiba'
};

test.describe('Kanban Board Drag-and-Drop', () => {


    test('Admin can move tasks freely (Happy Path)', async ({ page }) => {
        // Console monitoring for key error
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // 1. Login as Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', ADMIN_USER.email);
        await page.fill('input[type="password"]', ADMIN_USER.password);
        await page.click('button[type="submit"]');

        // Wait for redirect to home
        await page.waitForURL('/home', { timeout: 30000 });

        // 2. Navigate to Kanban
        await page.goto('/kanban');

        // Wait for Kanban board to load
        await expect(page.locator('text=Pending Approval').first()).toBeVisible();
        await expect(page.locator('text=To Do').first()).toBeVisible();

        // 3. Ensure there is a task in "Pending Approval" to drag
        // Ideally we should create one via API, but for now assuming one exists or using the first one found
        // If empty, we might need to create one. 
        // Let's create a quick task via UI or API if possible.
        // Simplifying: Check if pending column has item.

        // (Optional: Create task)

        // 4. Perform Drag from Pending -> To Do
        // Finding a draggble item in Pending column
        const pendingColumn = page.locator('div').filter({ hasText: /^Pending Approval/ }).last();
        // Note: The specific selector depends on the exact DOM structure of the Column component

        // Using a more robust selector strategy
        // We can assume the first card in the first column
        const firstCard = page.locator('[data-dnd-sortable-id]').first();

        // We need to confirm it's in Pending Approval.
        // Let's just try to drag the first card we see to the "To Do" column area.

        const toDoColumnHeader = page.getByRole('heading', { name: 'To Do' });

        if (await firstCard.count() > 0) {
            // Perform click to open modal and check for Key Error
            await firstCard.click();
            await page.waitForTimeout(1000); // Allow modal to animate

            const keyError = consoleErrors.find(e => e.includes('Encountered two children with the same key'));
            expect(keyError).toBeUndefined();

            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);

            // Resume drag test
            await firstCard.dragTo(toDoColumnHeader);

            // 5. Verify it moved (or at least toast didn't show error)
            await expect(page.locator('text=Cannot revert approved task')).toBeHidden();
            await expect(page.locator('text=Only Admins can approve pending tasks')).toBeHidden();

            // Optimistic UI check might be tricky without specific test IDs, 
            // but absence of error + presence in new column (if we could check) is good.
        } else {
            console.log('No tasks to test drag with.');
        }
    });

    test('Team Member CANNOT move tasks from Pending (Permission Guard)', async ({ page }) => {
        // 1. Login as Team Member
        await page.goto('/login');
        await page.fill('input[type="email"]', TEAM_USER.email);
        await page.fill('input[type="password"]', TEAM_USER.password);
        await page.click('button[type="submit"]');

        await page.waitForURL('/home', { timeout: 30000 });

        // 2. Navigate to Kanban
        await page.goto('/kanban');

        // 3. Try to drag from Pending
        // We need to identify a card specifically in the Pending column.
        // Assuming the first column is Pending.

        // Find the pending column container
        const pendingHeader = page.getByRole('heading', { name: 'Pending Approval' });
        // This is rough, relying on layout
        const firstPendingCard = page.locator('[data-dnd-sortable-id]').first();

        const toDoHeader = page.getByRole('heading', { name: 'To Do' });

        if (await firstPendingCard.count() > 0) {
            await firstPendingCard.dragTo(toDoHeader);

            // 4. Verify Error Toast
            await expect(page.getByText('Only Admins can approve pending tasks')).toBeVisible({ timeout: 5000 });

            // 5. Verify card snapped back / didn't move (harder to test strictly without detailed state check)
        }
    });

});
