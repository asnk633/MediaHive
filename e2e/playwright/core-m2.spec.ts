import { test, expect } from "./fixtures";
import { seedTask } from "./helpers/seed";

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
    const card = page.locator(`[data-task-id="${task.id}"]`);
    await expect(card).toBeVisible({ timeout: 15000 });

    // choose 'Approved' and click Save
    await card.locator("select").selectOption("approved");
    const save = card.locator("button", { hasText: "Save" });
    await Promise.all([
      page.waitForEvent("dialog").then((d) => d.dismiss()), // if app triggers alert()
      save.click(),
    ]);
    
    // Verify the UI reflects the change
    await expect(card.locator("select")).toHaveValue("approved");
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
    const card = page.locator(`[data-task-id="${task.id}"]`);
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