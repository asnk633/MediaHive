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
  // Mock GET /api/tasks requests with query parameters
  await page.route('**/api/tasks?**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_TASK] })
      });
    } else {
      // For other methods, continue with normal request
      await route.continue();
    }
  });
  
  // Also mock POST requests to /api/tasks
  await page.route('**/api/tasks', async route => {
    if (route.request().method() === 'POST') {
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

  // Wait for the page to load content (either tasks or "No tasks here")
  await page.waitForSelector('div', { timeout: timeout });
}

/**
 * Kanban drag tests - simplified for current tasks page structure
 */

test.describe("kanban", () => {
  test("guest sees tasks page with content", async ({ page }) => {
    // Use the debug helper
    await debugGotoTasks(page);

    // Check that the page loaded (it will show "No tasks here" if mock isn't working)
    const content = await page.content();
    expect(content).not.toContain("No tasks here.");
    
    // Check that our mock task is present in the DOM
    expect(content).toContain("e2e seeded task");
  });

  test("tasks page loads and shows mock data", async ({ page }) => {
    // Use the debug helper
    await debugGotoTasks(page);

    // Check that the page loaded
    const content = await page.content();
    expect(content).not.toContain("No tasks here.");
    
    // Check that our mock task is present
    expect(content).toContain("e2e seeded task");
  });
});