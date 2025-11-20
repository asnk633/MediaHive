import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function login(page: Page) {
  const LOGIN_URL = BASE_URL + "/api/users";
  
  const resp = await page.request.get(LOGIN_URL);
  
  if (!resp.ok()) {
    throw new Error("Login failed: " + resp.status() + " " + (await resp.text()));
  }
  
  const users = await resp.json();
  const devUser = users.find((u: any) => u.email === "dev@local");
  
  if (!devUser) {
    throw new Error("Dev user not found");
  }
  
  // Store user in localStorage to simulate login
  await page.addInitScript((user) => {
    window.localStorage.setItem('user', JSON.stringify(user));
  }, devUser);
}

async function seedTask(page: Page, overrides = {}) {
  // First, ensure we're logged in
  await login(page);
  
  const resp = await page.request.post(
    BASE_URL + "/api/tasks",
    {
      data: {
        institutionId: 1,
        title: "e2e seeded task",
        description: "seeded via e2e auth",
        status: "todo",
        priority: "medium",
        ...overrides,
      }
    }
  );

  if (!resp.ok()) {
    throw new Error("Seed failed: " + resp.status() + " " + (await resp.text()));
  }

  return (await resp.json()).data;
}

async function gotoTasksAndWait(page: Page) {
  // Navigate to tasks page
  await page.goto("/tasks");
  
  // Wait for kanban columns to be visible
  await page.waitForSelector('[data-column="todo"]', { timeout: 15000 });
  await page.waitForSelector('[data-column="in_progress"]', { timeout: 15000 });
  await page.waitForSelector('[data-column="done"]', { timeout: 15000 });
}

// Set up authentication before each test
test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe("kanban", () => {
  test("guest sees tasks page with real data", async ({ page }) => {
    // Seed a task
    await seedTask(page);
    
    // Navigate to tasks page and wait for kanban
    await gotoTasksAndWait(page);
    
    // Check that the real task is displayed
    await expect(page.locator('text=e2e seeded task')).toBeVisible();
    await expect(page.locator('text=seeded via e2e auth')).toBeVisible();
  });

  test("admin can see all kanban columns", async ({ page }) => {
    // Seed a task
    await seedTask(page);
    
    // Navigate to tasks page and wait for kanban
    await gotoTasksAndWait(page);
    
    // Check that all kanban columns are visible
    await expect(page.locator('[data-column="todo"]')).toBeVisible();
    await expect(page.locator('[data-column="in_progress"]')).toBeVisible();
    await expect(page.locator('[data-column="done"]')).toBeVisible();
  });
});