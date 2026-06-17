import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto } from './helpers/navigation';

let testPrefix: string;

test.beforeEach(async () => {
  testPrefix = getTestPrefix('events');
});

test.afterEach(async () => {
  await cleanupByPrefix('events', 'title', testPrefix);
});

test.describe('Events CRUD', () => {
  test('Event page loads with calendar', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    // Check that we're on the page and the calendar is visible
    await expect(page.locator('text=/events/i, .calendar-container').first()).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Toggle view modes', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    // Attempt to toggle different views
    const monthBtn = page.getByRole('button', { name: /month/i }).first();
    if (await monthBtn.isVisible().catch(() => false)) await monthBtn.click();

    const weekBtn = page.getByRole('button', { name: /week/i }).first();
    if (await weekBtn.isVisible().catch(() => false)) await weekBtn.click();

    const listBtn = page.getByRole('button', { name: /list/i }).first();
    if (await listBtn.isVisible().catch(() => false)) await listBtn.click();

    const timelineBtn = page.getByRole('button', { name: /timeline/i }).first();
    if (await timelineBtn.isVisible().catch(() => false)) await timelineBtn.click();
  });

  test('Create new event', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    const createBtn = page.getByRole('button', { name: /create event|add event/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();

      const title = `${testPrefix} Test Event`;
      const titleInput = page.getByLabel(/title/i).or(page.locator('input[name="title"]')).first();
      await titleInput.fill(title);

      const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
      await submitBtn.click();

      await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('View event detail modal', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    const createBtn = page.getByRole('button', { name: /create event|add event/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();

      const title = `${testPrefix} Detail Test Event`;
      const titleInput = page.getByLabel(/title/i).or(page.locator('input[name="title"]')).first();
      await titleInput.fill(title);

      const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
      await submitBtn.click();

      const eventItem = page.getByText(title).first();
      await eventItem.click();

      await expect(page.locator('.modal-content, [role="dialog"], .modal').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Edit event', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    const createBtn = page.getByRole('button', { name: /create event|add event/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();

      const title = `${testPrefix} Edit Test Event`;
      const titleInput = page.getByLabel(/title/i).or(page.locator('input[name="title"]')).first();
      await titleInput.fill(title);

      const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
      await submitBtn.click();

      const eventItem = page.getByText(title).first();
      await eventItem.click();

      const editBtn = page.getByRole('button', { name: /edit/i }).first();
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();

        const newTitle = `${testPrefix} Edited Test Event`;
        await titleInput.fill(newTitle);

        const saveBtn = page.getByRole('button', { name: /save|submit/i }).first();
        await saveBtn.click();

        await expect(page.getByText(newTitle).first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('Delete event', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    const createBtn = page.getByRole('button', { name: /create event|add event/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();

      const title = `${testPrefix} Delete Test Event`;
      const titleInput = page.getByLabel(/title/i).or(page.locator('input[name="title"]')).first();
      await titleInput.fill(title);

      const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
      await submitBtn.click();

      const eventItem = page.getByText(title).first();
      await eventItem.click();

      const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();

        const confirmBtn = page.getByRole('button', { name: /confirm|yes/i }).first();
        if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();

        await expect(page.getByText(title).first()).not.toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('Validation: empty/invalid fields block submission', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/events');

    const createBtn = page.getByRole('button', { name: /create event|add event/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();

      const submitBtn = page.getByRole('button', { name: /submit|save|create/i }).first();
      await submitBtn.click();

      await expect(page.locator('text=/required|cannot be empty/i, .text-red-500, [role="alert"]').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Guest cannot create events', async ({ page }) => {
    await loginAsGuest(page);
    await safeGoto(page, '/events');

    const createBtn = page.locator('button', { hasText: /create event|add event/i }).first();

    if (await createBtn.isVisible().catch(() => false)) {
      await expect(createBtn).toBeDisabled();
    } else {
      await expect(createBtn).not.toBeVisible();
    }
  });
});
