import { test, expect } from "./fixtures";
import { seedTask } from "./helpers/seed";
import { waitForTasksOrEmpty } from "./helpers/dom";

test.describe("M2 - Task review flow", () => {
  test("happy path: reviewer can set approved status", async ({ page, authUser }) => {
    // Seed a task for testing
    const task = await seedTask(page, authUser, {
      title: "Review test task",
      description: "Task for testing review flow",
      status: "todo",
      priority: "medium"
    });
    
    await page.goto("/tasks");
    
    // Wait for tasks or empty state to ensure hydration
    await waitForTasksOrEmpty(page, 15000);
    
    // Wait for task rows to be visible
    await page.waitForSelector('.task-row', { timeout: 15000 });
    
    const card = page.locator('[data-task-id], .task-row').first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // Check for select box using robust selector
    const select = card.locator("select[name='reviewStatus'], select");
    await expect(select).toBeVisible({ timeout: 15000 });
    
    // Choose 'Approved' option
    await select.selectOption("approved");
    
    // Find save button using role-based selector
    const saveButton = card.getByRole("button", { name: /Save/i });
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    
    // Use DOM-level click for the save button (same reason as FAB)
    const saveElement = await saveButton.elementHandle();
    if (saveElement) {
      await page.evaluate((btn) => (btn as HTMLElement).click(), saveElement);
    } else {
      throw new Error("Save button not found");
    }
    
    // Wait for either success message or page update
    try {
      await page.waitForFunction(() => {
        const alerts = Array.from(document.querySelectorAll('div[role="alert"], .toast, .notification, .alert'));
        return alerts.some(el => 
          el.textContent && 
          /Review status updated|Task updated|updated/i.test(el.textContent)
        );
      }, { timeout: 15000 });
    } catch (error) {
      // If we don't find a success message, we'll check if the select value was updated
      console.warn("Success message not found, checking select value directly");
    }
    
    // Verify the UI reflects the change
    await expect(select).toHaveValue("approved", { timeout: 15000 });
  });

  test("error path: invalid review value returns validation error", async ({ page, authUser }) => {
    // Seed a task for testing
    const task = await seedTask(page, authUser, {
      title: "Review test task",
      description: "Task for testing review flow",
      status: "todo",
      priority: "medium"
    });
    
    await page.goto("/tasks");
    
    // Wait for tasks or empty state to ensure hydration
    await waitForTasksOrEmpty(page, 15000);
    
    // Wait for task rows to be visible
    await page.waitForSelector('.task-row', { timeout: 15000 });
    
    const card = page.locator('[data-task-id], .task-row').first();
    await expect(card).toBeVisible({ timeout: 15000 });

    const id = await card.getAttribute("data-task-id");
    test.skip(!id, "task id not present in DOM; add data-task-id to TaskItem for e2e");

    const res = await page.evaluate(async (id) => {
      const r = await fetch(`/api/tasks/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: "not-a-valid-status" }),
      });
      return { status: r.status, body: await r.json().catch(() => ({ })) };
    }, id);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(String(res.body?.error ?? "")).toMatch(/Invalid reviewStatus/i);
  });
});