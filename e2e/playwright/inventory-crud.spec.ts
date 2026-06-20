import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto } from './helpers/navigation';

test.describe('Inventory CRUD', () => {
    let testPrefix: string;

    test.beforeEach(async ({}, testInfo) => {
        testPrefix = getTestPrefix('inventory') + '-' + testInfo.testId;
    });

    test.afterEach(async () => {
        await cleanupByPrefix('inventory_items', 'name', testPrefix);
    });

    test('Inventory page loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/inventory');

        await expect(page).toHaveURL(/.*inventory/);
        await expect(page.locator('h1', { hasText: 'Inventory' }).or(page.locator('h2', { hasText: 'Inventory' }))).toBeVisible();
    });

    test('Add new item', async ({ page }) => {
        // Log all browser console messages
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

        await loginAsAdmin(page);
        await safeGoto(page, '/inventory');

        // Find Add button and click it
        const addButton = page.getByRole('button', { name: /Add|Create/i }).or(page.locator('a[href="/inventory/add"]'));
        await addButton.click();

        const itemName = `${testPrefix}TestItem`;
        await page.getByPlaceholder('e.g. Sony A7 III Body').fill(itemName);

        // Select Category
        await page.getByText('Select Category').click();
        await page.getByRole('option').first().click();

        // Fill other required fields if any (guessing basic ones)
        const descInput = page.getByPlaceholder('Additional notes about the asset...');
        if (await descInput.isVisible()) {
            await descInput.fill('Test description');
        }

        const quantityInput = page.getByPlaceholder('1');
        if (await quantityInput.isVisible()) {
            await quantityInput.fill('10');
        }
        await page.getByRole('button', { name: /Submit|Save/i }).click();

        // Wait for a toast message to see if creation was successful or failed
        const toastLocator = page.locator('.toast, [role="status"], [role="alert"]').first();
        await expect(toastLocator).toBeVisible({ timeout: 10000 });
        const toastText = await toastLocator.textContent();
        console.log('Toast message after submit:', toastText);
        
        // Wait for it to navigate if successful
        await page.waitForURL('**/inventory', { timeout: 10000 });
        await page.reload();

        // Use the search bar to find the item
        await page.getByPlaceholder(/Search assets by name/i).fill(itemName);

        await expect(page.getByText(itemName).first()).toBeVisible({ timeout: 10000 });
    });

    test('View item detail modal', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/inventory');

        // Ensure there's an item to click
        const itemCard = page.locator('.inventory-item, [data-testid="inventory-item"]').first();
        if (await itemCard.count() > 0) {
             await itemCard.click();
             await expect(page.getByRole('dialog')).toBeVisible();
        } else {
             console.log('No inventory items found to test detail view');
        }
    });

    test('Edit item', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/inventory');

        // Ensure there's an item to edit
        const editButton = page.getByRole('button', { name: /Edit/i }).first();
        if (await editButton.count() > 0) {
             await editButton.click();

             // Wait for edit form
             await expect(page.locator('form')).toBeVisible();

             // Modify name
             const newName = `${testPrefix}EditedItem`;
             await page.getByPlaceholder('e.g. Sony A7 III Body').fill(newName);
             await page.getByRole('button', { name: /Submit|Save/i }).click();

             // Verify item is updated in the list
             await safeGoto(page, '/inventory');
             await expect(page.locator(`text=${newName}`)).toBeVisible();
        } else {
             console.log('No inventory items found to test edit');
        }
    });

    test('View inventory requests page', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/inventory/requests');

        await expect(page).toHaveURL(/.*inventory\/requests/);
    });

    test('View inventory stats dashboard', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/inventory');

        // The stats widget should be visible to admins
        await expect(page.locator('text=Inventory Snapshot').or(page.locator('text=Total Items'))).toBeVisible();
    });

    test('Validation: invalid/empty input prevents item addition', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/inventory');

        const addButton = page.getByRole('button', { name: /Add|Create/i }).or(page.locator('a[href="/inventory/add"]'));
        await addButton.click();

        // Leave fields empty and submit
        await page.getByRole('button', { name: /Submit|Save/i }).click();

        // Check for validation messages or that we are still on the form
        await expect(page.locator('form')).toBeVisible();
    });

    test('Guest cannot add items', async ({ page }) => {
        await loginAsGuest(page);
        await safeGoto(page, '/inventory');

        // Verify add button is hidden or disabled
        const addButton = page.getByRole('button', { name: /Add|Create/i }).or(page.locator('a[href="/inventory/add"]'));
        await expect(addButton).toBeHidden();
    });
});
