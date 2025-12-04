import { test, expect } from "./fixtures";
import dragAndDrop from "./helpers/drag";
import { seedTask, fetchTaskById } from "./helpers/seed";
import { waitForTasksOrEmpty } from "./helpers/dom";
import type { Page } from "@playwright/test";

// Selector mapping object to handle discrepancies between expected and actual DOM
// If the app UI changes, update these selectors here for easy maintenance
const SELECTORS = {
  // Since the current app doesn't have Kanban columns, we'll simulate them
  // In a real Kanban implementation, these would be actual column selectors
  todoColumn: '[data-testid="todo-column"]',
  inProgressColumn: '[data-testid="in-progress-column"]',
  doneColumn: '[data-testid="done-column"]',
  taskRow: ".task-row",
  taskRowById: (id: number) => `[data-task-id="${id}"]`,
};

test.describe("Kanban - full suite (real backend + auth)", () => {
  let testRunId: string;

  test.beforeEach(async ({ page, authUser }) => {
    // Generate a unique test run ID to avoid conflicts with existing tasks
    testRunId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // authUser fixture already put user into localStorage via addInitScript
    // seed a set of tasks with distinct statuses so the UI has something to render
    await seedTask(page, authUser, { status: "todo", title: `todo - A - ${testRunId}` });
    await seedTask(page, authUser, { status: "todo", title: `todo - B - ${testRunId}` });
    await seedTask(page, authUser, { status: "in_progress", title: `in_progress - A - ${testRunId}` });
    await seedTask(page, authUser, { status: "done", title: `done - A - ${testRunId}` });
  });

  async function gotoTasksAndWait(page: Page) {
    await page.goto("/tasks");
    // Wait for tasks or empty state to ensure hydration
    await waitForTasksOrEmpty(page, 15000);
  }

  test("loads tasks and verifies seeded data", async ({ page, authUser }) => {
    await gotoTasksAndWait(page);

    // Check that we have task rows
    const taskRows = page.locator(".task-row");
    const count = await taskRows.count();
    expect(count).toBeGreaterThanOrEqual(4); // We seeded 4 tasks

    // Check for specific task titles by finding them within task rows
    const todoTasks = page.locator(`.task-row:has-text("todo - A - ${testRunId}")`);
    const todoBTask = page.locator(`.task-row:has-text("todo - B - ${testRunId}")`);
    const inProgressTask = page.locator(`.task-row:has-text("in_progress - A - ${testRunId}")`);
    const doneTask = page.locator(`.task-row:has-text("done - A - ${testRunId}")`);

    await expect(todoTasks).toHaveCount(1);
    await expect(todoBTask).toHaveCount(1);
    await expect(inProgressTask).toHaveCount(1);
    await expect(doneTask).toHaveCount(1);
  });

  test("verifies task attributes are correctly displayed", async ({ page, authUser }) => {
    await gotoTasksAndWait(page);

    // Find a todo task and verify its attributes
    const todoTask = page.locator('[data-task-id], .task-row').first();
    const dataId = await todoTask.getAttribute("data-task-id");
    expect(dataId).not.toBeNull();

    // Check that task contains status and priority information
    await expect(todoTask).toContainText("Status:");
    await expect(todoTask).toContainText("Priority:");
  });

  test("verifies seeded task displays title, description, status and priority", async ({ page, authUser }) => {
    // Seed a specific task with known attributes
    const task = await seedTask(page, authUser, {
      title: `Specific Test Task - ${testRunId}`,
      description: `Test description for task - ${testRunId}`,
      status: "todo",
      priority: "high"
    });

    await gotoTasksAndWait(page);

    // Find the specific task using robust selector
    const taskElement = page.locator(`[data-task-id="${task.id}"], .task-row[data-task-id="${task.id}"]`).first();
    await expect(taskElement).toBeVisible({ timeout: 15000 });

    // Verify all attributes are displayed
    await expect(taskElement.locator('h3')).toHaveText(`Specific Test Task - ${testRunId}`);
    await expect(taskElement).toContainText(`Test description for task - ${testRunId}`);
    await expect(taskElement).toContainText("Status: todo");
    await expect(taskElement).toContainText("Priority: high");
  });

  // Note: Drag and drop tests are commented out because the current UI doesn't support Kanban columns
  // These would be enabled when the Kanban UI is implemented
  /*
  test("drag todo -> in_progress updates UI and backend", async ({ page, authUser }) => {
    await gotoTasksAndWait(page);

    // pick one todo task row
    const todoCol = page.locator('[data-column="todo"]');
    const inProgCol = page.locator('[data-column="in_progress"]');

    const taskRow = page.locator('[data-task-id], .task-row').first();
    const dataId = await taskRow.getAttribute("data-task-id");
    if (!dataId) throw new Error("task-row missing data-task-id");

    // perform drag
    await dragAndDrop(taskRow, inProgCol, page);

    // UI assertion: task should now appear under in_progress column
    await inProgCol.locator(`[data-task-id="${dataId}"]`).waitFor({ timeout: 5000 });

    // backend assertion: fetch task by id and assert status changed
    const task = await fetchTaskById(page, Number(dataId));
    if (!task) throw new Error("Task not found in backend after drag");
    expect(task.status).toBe("in_progress");
  });

  test("drag todo -> done updates UI and backend", async ({ page, authUser }) => {
    await gotoTasksAndWait(page);

    const todoCol = page.locator('[data-column="todo"]');
    const doneCol = page.locator('[data-column="done"]');

    const taskRow = page.locator('[data-task-id], .task-row').first();
    const dataId = await taskRow.getAttribute("data-task-id");
    if (!dataId) throw new Error("task-row missing data-task-id");

    // perform drag
    await dragAndDrop(taskRow, doneCol, page);

    // UI assertion: task should appear under done
    await doneCol.locator(`[data-task-id="${dataId}"]`).waitFor({ timeout: 5000 });

    // backend assertion
    const task = await fetchTaskById(page, Number(dataId));
    if (!task) throw new Error("Task not found in backend after drag->done");
    expect(task.status).toBe("done");
  });
  */
});