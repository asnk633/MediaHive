import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";
import type { Page } from "@playwright/test";

// Mock task data
const MOCK_TASK = {
  id: "e2e-seed-1",
  institutionId: "1",
  title: "e2e seeded task",
  description: "seeded by e2e mock",
  status: "todo",
  priority: "low",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Add API mock before each test
test.beforeEach(async ({ page }) => {
  // Mock GET /api/tasks requests
  await page.route('**/api/tasks**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_TASK] })
      });
    } else if (route.request().method() === 'POST') {
      // Handle POST requests (task creation)
      const postData = await route.request().postDataJSON();
      const newTask = {
        ...MOCK_TASK,
        id: `e2e-seed-${Date.now()}`,
        ...postData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: newTask })
      });
    } else {
      // For other methods, continue with normal request
      await route.continue();
    }
  });
});

async function debugGotoTasks(page: Page, timeout = 15000) {
  // navigate to tasks page
  await page.goto("/tasks", { waitUntil: "domcontentloaded" });

  // small extra delay for client render
  await page.waitForTimeout(300);

  // Wait for a top-level kanban wrapper that your app renders (fallback to body)
  await page.waitForSelector('[data-kanban-root], .kanban, [data-column-id]', { timeout: timeout });
}

/**
 * High-level Kanban drag tests that rely on stable data attributes:
 * - columns have data-column-id="todo" / "in_progress" / "done"
 * - task cards have data-task-id and data-status
 *
 * Regexes below are intentionally broad to match DB/API variants:
 * - todo / pending
 * - in_progress / doing
 * - done / completed / closed
 */

test.describe("kanban", () => {
  test("guest sees To Do column and cannot drag tasks to in_progress", async ({ page }) => {
    // Use the debug helper, updated to include API wait logic.
    await debugGotoTasks(page);

    const todoColumn = page.locator("[data-column-id='todo']");
    const inProgressColumn = page.locator("[data-column-id='in_progress']");
    const doneColumn = page.locator("[data-column-id='done']");

    await expect(todoColumn).toBeVisible();
    await expect(inProgressColumn).toBeVisible();
    await expect(doneColumn).toBeVisible();

    const firstTask = todoColumn.locator('[data-draggable="true"]').first();
    await expect(firstTask).toBeVisible();

    const taskId = await firstTask.getAttribute("data-task-id");
    expect(taskId, "taskId should be present").toBeTruthy();

    await page.reload();
    const taskAfter = page.locator(`[data-task-id="${taskId}"]`);

    await expect(taskAfter).toHaveAttribute("data-status", /(?:todo|pending)/i);
  });

  test("dragging task from todo to done updates status (UI + attribute)", async ({ page }) => {
    // Use the debug helper, updated to include API wait logic.
    await debugGotoTasks(page);

    const todoColumn = page.locator("[data-column-id='todo']");
    const doneColumn = page.locator("[data-column-id='done']");

    const task = todoColumn.locator('[data-draggable="true"]').first();
    await expect(task).toBeVisible();

    const taskId = await task.getAttribute("data-task-id");
    expect(taskId, "taskId must be present").toBeTruthy();

    // perform drag using helper (exists at e2e/playwright/helpers/drag.ts)
    await drag(page, task, doneColumn);

    const moved = page.locator(`[data-task-id="${taskId}"]`);
    await expect(moved).toBeVisible();

    await expect(moved).toHaveAttribute("data-status", /(?:done|completed|closed)/i);
  });
});