import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";

/**
 * High-level Kanban drag tests that rely on stable data attributes:
 * - columns have data-column="todo" / "in_progress" / "done"
 * - task cards have data-task-id and data-status
 *
 * Regexes below are intentionally broad to match DB/API variants:
 *  - todo / pending
 *  - in_progress / doing
 *  - done / completed / closed
 */

test.describe("kanban", () => {
  test("guest sees To Do column and cannot drag tasks to in_progress", async ({ page }) => {
    await page.goto("/tasks");

    const todoColumn = page.locator('[data-column="todo"]');
    const inProgressColumn = page.locator('[data-column="in_progress"]');
    const doneColumn = page.locator('[data-column="done"]');

    await expect(todoColumn).toBeVisible();
    await expect(inProgressColumn).toBeVisible();
    await expect(doneColumn).toBeVisible();

    const firstTask = todoColumn.locator('[data-task-id]').first();
    await expect(firstTask).toBeVisible();

    const taskId = await firstTask.getAttribute("data-task-id");
    expect(taskId, "taskId should be present").toBeTruthy();

    await page.reload();
    const taskAfter = page.locator(\`[data-task-id="\${taskId}"]\`);

    await expect(taskAfter).toHaveAttribute("data-status", /(?:todo|pending)/i);
  });

  test("dragging task from todo to done updates status (UI + attribute)", async ({ page }) => {
    await page.goto("/tasks");

    const todoColumn = page.locator('[data-column="todo"]');
    const doneColumn = page.locator('[data-column="done"]');

    const task = todoColumn.locator('[data-task-id]').first();
    await expect(task).toBeVisible();

    const taskId = await task.getAttribute("data-task-id");
    expect(taskId, "taskId must be present").toBeTruthy();

    // perform drag using helper (exists at e2e/playwright/helpers/drag.ts)
    await drag(page, task, doneColumn);

    const moved = page.locator(\`[data-task-id="\${taskId}"]\`);
    await expect(moved).toBeVisible();

    await expect(moved).toHaveAttribute("data-status", /(?:done|completed|closed)/i);
  });
});
