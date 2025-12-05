import { test, expect } from "@playwright/test";

test.describe("M2 - Task review flow", () => {
  const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

  test("happy path: reviewer can set approved status", async ({ page }) => {
    await page.goto(`${BASE}/tasks`);
    const card = page.locator(".task-row").first();
    await expect(card).toBeVisible();

    // choose 'Approved' and click Save
    await card.locator("select").selectOption("approved");
    const save = card.locator("button", { hasText: "Save" });
    await Promise.all([
      page.waitForEvent("dialog").then((d) => d.dismiss()), // if app triggers alert()
      save.click(),
    ]);
  });

  test("error path: invalid review value returns validation error", async ({ page }) => {
    await page.goto(`${BASE}/tasks`);
    const card = page.locator(".task-row").first();
    await expect(card).toBeVisible();

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
