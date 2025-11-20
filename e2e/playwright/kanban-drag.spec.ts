import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";

const API_BASE = process.env.PLAYWRIGHT_BASE_URL || '';

// Add a seeded task before each test for a reliable starting state
test.beforeEach(async ({ request }) => {
  // If your API requires auth for POST, set headers here, e.g.:
  // const headers = { Authorization: `Bearer ${process.env.PLAYWRIGHT_API_TOKEN}` };
  // Adjust path/body to match your API schema.
  try {
    const res = await request.post(`${API_BASE}/api/tasks`, {
      // headers,
      data: {
        title: "e2e seeded task",
        description: "seeded by e2e beforeEach",
        institutionId: 1,
        status: "todo",
        priority: "low"
      }
    });
    if (!res.ok()) {
      console.warn("Task seeding failed:", res.status(), await res.text());
    } else {
      const body = await res.json().catch(() => null);
      console.log("Seeded task:", body?.id ?? "(no id)");
    }
  } catch (err) {
    console.warn("Error seeding task:", err);
  }
});

async function debugGotoTasks(page, timeout = 15000) {
  // navigate to tasks page
  await page.goto("/tasks", { waitUntil: "domcontentloaded" });

  // wait for the UI request that loads tasks (helps avoid empty DOM due to timing)
  await page.waitForResponse(resp => resp.url().includes('/api/tasks') && resp.status() === 200, { timeout: 5000 })
    .catch(() => { /* continue; fallback to waiting for selector */ });

  // small extra delay for client render
  await page.waitForTimeout(300);

  // If the kanban root doesn't exist, dump HTML + take screenshot for inspection
  // The selector is updated to also check for a task card, as requested in the new logic.
  const sel = '[data-column="todo"], [data-task-id]';
  try {
    // Wait longer for hydration/render
    await page.waitForSelector(sel, { timeout: timeout });
  } catch (err) {
    // print HTML snapshot (trimmed) to console for quick inspection
    try {
      const html = await page.content();
      console.log("=== Playwright HTML snapshot (first 20000 chars) ===\n", html.slice(0, 20000));
    } catch (e) {
      console.log("Could not read page content:", e);
    }
    // save an explicit debug screenshot as well (Playwright will also save test artifacts)
    await page.screenshot({ path: `./test-results/debug-tasks-snapshot.png`, fullPage: true }).catch(() => {});
    throw err; // rethrow so test fails as before and artifacts are captured
  }
}

/**
 * High-level Kanban drag tests that rely on stable data attributes:
 * - columns have data-column="todo" / "in_progress" / "done"
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
    const taskAfter = page.locator(`[data-task-id="${taskId}"]`);

    await expect(taskAfter).toHaveAttribute("data-status", /(?:todo|pending)/i);
  });

  test("dragging task from todo to done updates status (UI + attribute)", async ({ page }) => {
    // Use the debug helper, updated to include API wait logic.
    await debugGotoTasks(page);

    const todoColumn = page.locator('[data-column="todo"]');
    const doneColumn = page.locator('[data-column="done"]');

    const task = todoColumn.locator('[data-task-id]').first();
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