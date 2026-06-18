import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto } from './helpers/navigation';

test.describe('Kanban Task Board', () => {
  let testPrefix: string;

  test.beforeEach(async () => {
    testPrefix = getTestPrefix('tasks_kanban');
  });

  test.afterEach(async () => {
    await cleanupByPrefix('tasks', 'title', testPrefix);
  });

  test('Tasks board loads', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks' }).first()).toBeVisible();
  });

  test('Switch to Kanban View', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/tasks');

    // Switch to Kanban View
    await page.locator('button[title="Kanban Board"]').click();

    // Assert columns are visible
    await expect(page.locator('text=To Do').first()).toBeVisible();
    await expect(page.locator('text=Working').first()).toBeVisible();
    await expect(page.locator('text=On Hold').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test('Create a task in To Do', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/tasks');

    // Create new task
    await page.getByRole('link', { name: 'New Task' }).click();
    await page.getByPlaceholder('e.g., Q3 Marketing Report').fill(`${testPrefix} New Task`);
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Wait for task to appear in list
    await expect(page.locator(`text=${testPrefix} New Task`).first()).toBeVisible();

    // Switch to Kanban View
    await page.locator('button[title="Kanban Board"]').click();

    // Verify added to 'To Do' column
    const todoColumn = page.locator('div').filter({ hasText: /^To Do$/ }).locator('..');
    await expect(todoColumn.locator(`text=${testPrefix} New Task`).first()).toBeVisible();
  });

  test('Drag and drop task between columns', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/tasks');

    // Create new task
    await page.getByRole('link', { name: 'New Task' }).click();
    await page.getByPlaceholder('e.g., Q3 Marketing Report').fill(`${testPrefix} Drag Drop Task`);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.locator(`text=${testPrefix} Drag Drop Task`).first()).toBeVisible();

    // Switch to Kanban View
    await page.locator('button[title="Kanban Board"]').click();

    // Find card and drag to 'Working'
    const card = page.locator(`text=${testPrefix} Drag Drop Task`).first().locator('..').locator('..');
    const workingColumnHeader = page.locator('text=Working').first();

    await card.dragTo(workingColumnHeader);

    // Verify task status updates
    await expect(page.locator('text=Task status updated to Working')).toBeVisible();

    // Verify it's in the working column
    const workingColumn = page.locator('div').filter({ hasText: /^Working$/ }).locator('..');
    await expect(workingColumn.locator(`text=${testPrefix} Drag Drop Task`).first()).toBeVisible();
  });

  test('Keyboard navigation drag-and-drop', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/tasks');

    // Create new task
    await page.getByRole('link', { name: 'New Task' }).click();
    await page.getByPlaceholder('e.g., Q3 Marketing Report').fill(`${testPrefix} Keyboard Nav Task`);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.locator(`text=${testPrefix} Keyboard Nav Task`).first()).toBeVisible();

    // Switch to Kanban View
    await page.locator('button[title="Kanban Board"]').click();

    // Find card grab handle
    const cardDragHandle = page.locator(`text=${testPrefix} Keyboard Nav Task`).first().locator('..').locator('..').locator('div[title="Drag to reorder"]');

    await cardDragHandle.focus();

    // Press Space to grab
    await page.keyboard.press('Space');

    // Press ArrowRight to move to Working
    await page.keyboard.press('ArrowRight');

    // Press Space to drop
    await page.keyboard.press('Space');

    // Verify task status updates
    await expect(page.locator('text=Task status updated to Working')).toBeVisible();

    // Verify it's in the working column
    const workingColumn = page.locator('div').filter({ hasText: /^Working$/ }).locator('..');
    await expect(workingColumn.locator(`text=${testPrefix} Keyboard Nav Task`).first()).toBeVisible();
  });

  test('Apply column filter', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/tasks');

    // Create new task with low priority
    await page.getByRole('link', { name: 'New Task' }).click();
    await page.getByPlaceholder('e.g., Q3 Marketing Report').fill(`${testPrefix} Low Priority Task`);
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.locator(`text=${testPrefix} Low Priority Task`).first()).toBeVisible();

    // Create new task with high priority
    await page.getByRole('link', { name: 'New Task' }).click();
    await page.getByPlaceholder('e.g., Q3 Marketing Report').fill(`${testPrefix} High Priority Task`);

    // Set to high priority
    await page.locator('button', { hasText: 'High' }).click();

    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.locator(`text=${testPrefix} High Priority Task`).first()).toBeVisible();

    // Apply filter for high priority
    await page.locator('button[aria-label="Filter priority"]').click();
    await page.getByRole('option', { name: 'High' }).click();

    // Verify non-matching cards disappear
    await expect(page.locator(`text=${testPrefix} High Priority Task`).first()).toBeVisible();
    await expect(page.locator(`text=${testPrefix} Low Priority Task`).first()).toBeHidden();
  });
});
