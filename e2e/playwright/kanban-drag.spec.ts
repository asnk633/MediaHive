import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";
import type { Page } from "@playwright/test";

// Mock task data
const MOCK_TASK = {
  id: 1,
  institutionId: 1,
  title: "e2e seeded task",
  description: "seeded by e2e mock",
  status: "todo",
  priority: "low",
  reviewStatus: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Add API mock before each test
test.beforeEach(async ({ page }) => {
  // Mock GET /api/tasks requests with query parameters
  await page.route('**/api/tasks?institutionId=1&limit=500', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [MOCK_TASK] })
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock POST /api/tasks requests
  await page.route('**/api/tasks', async route => {
    if (route.request().method() === 'POST') {
      const postData = await route.request().postDataJSON();
      const newTask = {
        ...MOCK_TASK,
        id: Date.now(),
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
      await route.continue();
    }
  });
});

test.describe("kanban", () => {
  test("guest sees tasks page with mock data", async ({ page }) => {
    // Navigate to tasks page
    await page.goto("/tasks");
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the mock task is displayed
    await expect(page.locator('text=e2e seeded task')).toBeVisible();
    await expect(page.locator('text=seeded by e2e mock')).toBeVisible();
  });

  test("tasks page shows task with correct attributes", async ({ page }) => {
    // Navigate to tasks page
    await page.goto("/tasks");
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that task element exists with correct data attribute
    const taskElement = page.locator('[data-task-id="1"]');
    await expect(taskElement).toBeVisible();
    
    // Check task content
    await expect(taskElement.locator('h3')).toHaveText('e2e seeded task');
    await expect(taskElement).toContainText('Status: todo');
    await expect(taskElement).toContainText('Priority: low');
  });
});