import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto } from './helpers/navigation';

let testPrefix: string;

test.beforeEach(async () => {
    testPrefix = getTestPrefix('campaigns');
});

test.afterEach(async () => {
    try { await cleanupByPrefix('campaigns', 'name', testPrefix); } catch (e) {}
});

test.describe('Campaigns CRUD', () => {
    test('Campaigns dashboard loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/campaigns');
        await expect(page.locator('body')).toBeVisible();
    });

    test('Create new campaign', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/campaigns');

        const createBtn = page.getByRole('button', { name: /create campaign|add campaign|new campaign/i }).first();
        await createBtn.click();

        const name = `${testPrefix} Test Campaign`;
        const nameInput = page.getByLabel(/name/i).or(page.locator('input[name="name"]')).first();
        await nameInput.fill(name);

        // Select start/end dates
        const startDateInput = page.getByLabel(/start date/i).or(page.locator('input[name="startDate"]')).first();
        await startDateInput.fill('2024-01-01');

        const endDateInput = page.getByLabel(/end date/i).or(page.locator('input[name="endDate"]')).first();
        await endDateInput.fill('2024-12-31');

        const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
        await submitBtn.click();

        await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 });
    });

    test('Edit campaign details', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/campaigns');

        const createBtn = page.getByRole('button', { name: /create campaign|add campaign|new campaign/i }).first();
        await createBtn.click();

        const name = `${testPrefix} Edit Test Campaign`;
        const nameInput = page.getByLabel(/name/i).or(page.locator('input[name="name"]')).first();
        await nameInput.fill(name);

        const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
        await submitBtn.click();

        // Wait for campaign item to appear before clicking
        const campaignItem = page.getByText(name).first();
        await expect(campaignItem).toBeVisible({ timeout: 10000 });
        await campaignItem.click();

        const editBtn = page.getByRole('button', { name: /edit/i }).first();
        await expect(editBtn).toBeVisible({ timeout: 10000 });
        await editBtn.click();

        const descriptionInput = page.getByLabel(/description/i).or(page.locator('textarea[name="description"], input[name="description"]')).first();
        const newDescription = 'Updated description';
        await expect(descriptionInput).toBeVisible({ timeout: 10000 });
        await descriptionInput.fill(newDescription);

        const saveBtn = page.getByRole('button', { name: /save|submit/i }).first();
        await saveBtn.click();

        await expect(page.getByText(newDescription).first()).toBeVisible({ timeout: 10000 });
    });

    test('Link task/event to campaign', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/campaigns');

        const createBtn = page.getByRole('button', { name: /create campaign|add campaign|new campaign/i }).first();
        await createBtn.click();

        const name = `${testPrefix} Link Test Campaign`;
        const nameInput = page.getByLabel(/name/i).or(page.locator('input[name="name"]')).first();
        await nameInput.fill(name);

        const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
        await submitBtn.click();

        // Go to task creation
        await safeGoto(page, '/tasks');
        const createTaskBtn = page.getByRole('button', { name: /create task|add task|new task/i }).first();
        await createTaskBtn.click();

        const taskTitle = `${testPrefix} Task`;
        const taskTitleInput = page.getByLabel(/title/i).or(page.locator('input[name="title"]')).first();
        await taskTitleInput.fill(taskTitle);

        // Select campaign from dropdown
        const campaignDropdown = page.getByLabel(/campaign/i).or(page.locator('select[name="campaignId"], [role="combobox"]')).first();
        await expect(campaignDropdown).toBeVisible({ timeout: 10000 });

        // Try different ways to select depending on the UI component
        const tagName = await campaignDropdown.evaluate((el) => el.tagName.toLowerCase());
        if (tagName === 'select') {
            await campaignDropdown.selectOption({ label: name });
        } else {
            await campaignDropdown.click();
            const option = page.getByText(name).first();
            await expect(option).toBeVisible({ timeout: 10000 });
            await option.click();
        }

        const taskSubmitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
        await taskSubmitBtn.click();

        // View task details
        const taskItem = page.getByText(taskTitle).first();
        await expect(taskItem).toBeVisible({ timeout: 10000 });
        await taskItem.click();

        // Verify task detail shows campaign link
        await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 });
    });

    test('Guest cannot create campaigns', async ({ page }) => {
        await loginAsGuest(page);
        await safeGoto(page, '/campaigns');

        const createBtn = page.locator('button', { hasText: /create campaign|add campaign|new campaign/i }).first();

        // Ensure either button is disabled or not visible
        const isVisible = await createBtn.isVisible();
        if (isVisible) {
            await expect(createBtn).toBeDisabled();
        } else {
            await expect(createBtn).not.toBeVisible();
        }
    });
});
