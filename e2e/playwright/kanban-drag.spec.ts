import { test, expect } from "@playwright/test";
import drag from "./helpers/drag";
import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

/**
 * Login helper that fetches users from the backend and stores the specified user in localStorage
 * This simulates the client-side login flow of the application
 */
async function login(page: Page) {
  const LOGIN_URL = BASE_URL + "/api/users";
  
  const resp = await page.request.get(LOGIN_URL);
  
  if (!resp.ok()) {
    throw new Error("Login failed: " + resp.status() + " " + (await resp.text()));
  }
  
  const users = await resp.json();
  // Use the email from environment variable or fallback to dev user
  const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL || "dev@local";
  const user = users.find((u: any) => u.email === testEmail);
  
  if (!user) {
    throw new Error(`User with email ${testEmail} not found`);
  }
  
  // Store user in localStorage to simulate login before page navigation
  await page.addInitScript((userData) => {
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, user);
  
  return user;
}

/**
 * Seed task helper that creates a task using the real backend API
 * Includes the required x-user-data header for authentication
 */
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

/**
 * Navigate to tasks page and wait for hydration to complete
 * Waits for task rows to be rendered before proceeding
 */
async function gotoTasksAndWait(page: Page) {
  // Navigate to tasks page
  await page.goto("/tasks");
  
  // Wait for tasks to load and hydration to complete
  await page.waitForSelector('.task-row', { timeout: 15000 });
  
  // Additional wait to ensure full hydration
  await page.waitForTimeout(1000);
}

let currentUser: any = null;

// Set up authentication before each test
test.beforeEach(async ({ page }) => {
  currentUser = await login(page);
});

test.describe("kanban", () => {
  test("guest sees tasks page with real data", async ({ page }) => {
    // Seed a task
    const task = await seedTask(page, currentUser);
    
    // Navigate to tasks page and wait for tasks to load
    await gotoTasksAndWait(page);
    
    // Check that the real task is displayed
    const taskElement = page.locator(`[data-task-id="${task.id}"]`);
    await expect(taskElement).toBeVisible();
    await expect(taskElement.locator('h3')).toHaveText('e2e seeded task');
    await expect(taskElement).toContainText('seeded via e2e auth');
  });

  test("admin can see task with correct attributes", async ({ page }) => {
    // Seed a task
    const task = await seedTask(page, currentUser);
    
    // Navigate to tasks page and wait for tasks to load
    await gotoTasksAndWait(page);
    
    // Check that task element exists with correct data attribute
    const taskElement = page.locator(`[data-task-id="${task.id}"]`);
    await expect(taskElement).toBeVisible();
    
    // Check task content
    await expect(taskElement.locator('h3')).toHaveText('e2e seeded task');
    await expect(taskElement).toContainText('Status: todo');
    await expect(taskElement).toContainText('Priority: medium');
  });
});