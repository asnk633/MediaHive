import { test, expect } from "./fixtures";
import drag from "./helpers/drag";
import { waitForTasksOrEmpty } from "./helpers/dom";
import { seedTask } from "./helpers/seed";
import type { Page } from "@playwright/test";

/**
 * Navigate to tasks page and wait for hydration to complete
 * Waits for task rows to be rendered before proceeding
 */
async function gotoTasksAndWait(page: Page) {
  // Navigate to tasks page
  await page.goto("/tasks");
  
  // Wait for tasks or empty state to ensure hydration
  await waitForTasksOrEmpty(page, 15000);
}

test.describe("kanban", () => {
  test("guest sees tasks page with real data", async ({ page, authUser }) => {
    // Seed a task
    const task = await seedTask(page, authUser);
    
    // Navigate to tasks page and wait for tasks to load
    await gotoTasksAndWait(page);
    
    // Check that the real task is displayed using robust selector
    const taskElement = page.locator(`[data-task-id="${task.id}"], .task-row[data-task-id="${task.id}"]`).first();
    await expect(taskElement).toBeVisible();
    // Updated to match the actual seeded task title pattern
    await expect(taskElement.locator('h3')).toContainText('e2e seeded task');
    await expect(taskElement).toContainText('seeded via e2e auth');
  });

  test("admin can see task with correct attributes", async ({ page, authUser }) => {
    // Seed a task
    const task = await seedTask(page, authUser);
    
    // Navigate to tasks page and wait for tasks to load
    await gotoTasksAndWait(page);
    
    // Check that task element exists with correct data attribute using robust selector
    const taskElement = page.locator(`[data-task-id="${task.id}"], .task-row[data-task-id="${task.id}"]`).first();
    await expect(taskElement).toBeVisible();
    
    // Check task content
    await expect(taskElement.locator('h3')).toContainText('e2e seeded task');
    await expect(taskElement).toContainText('Status: todo');
    await expect(taskElement).toContainText('Priority: medium');
  });
});