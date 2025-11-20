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
  
  return devUser;
}

async function seedTask(page: Page, user: any, overrides = {}) {
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
      },
      headers: {
        'x-user-data': JSON.stringify(user)
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
  
  // Wait for tasks to load
  await page.waitForSelector('.task-row', { timeout: 15000 });
}

let currentUser: any = null;

// Set up authentication before each test
test.beforeEach(async ({ page }) => {
  currentUser = await login(page);
});

test.describe("kanban", () => {
  test("guest sees tasks page with real data", async ({ page }) => {
    // Seed a task
    await seedTask(page, currentUser);
    
    // Navigate to tasks page and wait for tasks to load
    await gotoTasksAndWait(page);
    
    // Check that the real task is displayed
    await expect(page.locator('text=e2e seeded task')).toBeVisible();
    await expect(page.locator('text=seeded via e2e auth')).toBeVisible();
  });

  test("admin can see task with correct attributes", async ({ page }) => {
    // Seed a task
    await seedTask(page, currentUser);
    
    // Navigate to tasks page and wait for tasks to load
    await gotoTasksAndWait(page);
    
    // Check that task element exists with correct data attribute
    const taskElement = page.locator('[data-task-id]');
    await expect(taskElement).toBeVisible();
    
    // Check task content
    await expect(taskElement.locator('h3')).toHaveText('e2e seeded task');
    await expect(taskElement).toContainText('Status: todo');
    await expect(taskElement).toContainText('Priority: medium');
  });
});