import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";

// High-level Kanban drag tests that rely on stable data attributes:
// - columns have data-column="todo" / "in_progress" / "done"
// - task cards have data-task-id and data-status

test.describe("kanban", () => {
  // Use three roles if you have storageState fixtures configured.
  // If not, the tests below assume an unauthenticated guest flow.
  test("guest sees To Do column and cannot drag tasks to in_progress", async ({ page }) => {
    await page.goto("http://localhost:3000/tasks");

    // ensure columns exist
    const todoColumn = page.locator('[data-column="todo"]');
    const inProgressColumn = page.locator('[data-column="in_progress"]');
    const doneColumn = page.locator('[data-column="done"]');

    await expect(todoColumn).toBeVisible();
    await expect(inProgressColumn).toBeVisible();
    await expect(doneColumn).toBeVisible();

    // pick the first task in todo
    const firstTask = todoColumn.locator('[data-task-id]').first();
    await expect(firstTask).toBeVisible();

    // attempt drag -> should not change status for guest (RBAC enforced)
    await drag(page, firstTask, inProgressColumn);
    // small wait for any server roundtrip
    await page.waitForTimeout(300);

    // reload and assert the task is still in todo (status unchanged)
    const taskId = await firstTask.getAttribute("data-task-id");
    await page.reload();
    const taskAfter = page.locator(\`[data-task-id="\${taskId}"]\`);
    // ensure the task remains in todo column (data-status still "todo" or "pending")
    await expect(taskAfter).toHaveAttribute("data-status", /(?:todo|pending)/i);
  });

  test("team: can drag task from To Do -> In Progress (happy path)", async ({ page }) => {
    // if you have a storage state for team user, load via context; else login manually
    await page.goto("http://localhost:3000/tasks");

    const todoColumn = page.locator('[data-column="todo"]');
    const inProgressColumn = page.locator('[data-column="in_progress"]');

    await expect(todoColumn).toBeVisible();
    await expect(inProgressColumn).toBeVisible();

    // choose first available task in todo
    const src = todoColumn.locator('[data-task-id]').first();
    await expect(src).toBeVisible();

    // perform drag
    await drag(page, src, inProgressColumn);
    // wait for optimistic update or server update to occur
    await page.waitForTimeout(800);

    // Assert task now exists in in_progress column
    const taskId = await src.getAttribute("data-task-id");
    // Reload to ensure persisted change
    await page.reload();
    const moved = page.locator(\`[data-task-id="\${taskId}"]\`);
    await expect(moved).toHaveAttribute("data-status", /(?:in[_-]?progress|inprogress|doing)/i);
  });

  test("admin sees all columns including Done and can move to Done", async ({ page }) => {
    await page.goto("http://localhost:3000/tasks");
    const doneColumn = page.locator('[data-column="done"]');
    await expect(doneColumn).toBeVisible();

    // Move a task to done (if available)
    const anyTask = page.locator('[data-column="in_progress"] [data-task-id]').first();
    if (await anyTask.count() === 0) {
      test.skip(true, "no tasks in in_progress to test move-to-done");
      return;
    }
    const id = await anyTask.getAttribute("data-task-id");
    await drag(page, anyTask, doneColumn);
    await page.waitForTimeout(800);
    await page.reload();
    const final = page.locator(\`[data-task-id="\${id}"]\`);
    await expect(final).toHaveAttribute("data-status", /(?:done|completed|closed|finished)/i);
  });
});
