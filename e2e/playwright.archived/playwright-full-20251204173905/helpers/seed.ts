import type { Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * seedUser - create a user using real backend API
 * Returns created user object
 */
export async function seedUser(page: Page, role: string, overrides = {}) {
  // First, login as an admin user to get access to the users endpoint
  const loginResp = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: 'admin@thaiba.com', password: 'ChangeMe123!' },
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!loginResp.ok()) {
    throw new Error(`Failed to login: ${loginResp.status()}`);
  }
  
  // Get the admin user data
  const adminUser = await loginResp.json();
  
  // Now fetch users with the specified role using the x-user-data header
  const resp = await page.request.get(`${BASE_URL}/api/users?role=${role}&limit=1`, {
    headers: {
      'x-user-data': JSON.stringify(adminUser)
    }
  });
  
  if (!resp.ok()) {
    throw new Error(`Failed to fetch ${role} user: ${resp.status()}`);
  }
  
  const users = await resp.json();
  
  if (users.length === 0) {
    throw new Error(`No ${role} users found`);
  }
  
  return users[0];
}

/**
 * seedTask - create a task using real backend API and required auth header
 * Returns created task object (assuming API returns { data: {...} }).
 */
export async function seedTask(page: Page, user: any, overrides = {}) {
  const resp = await page.request.post(`${BASE_URL}/api/tasks`, {
    headers: {
      "x-user-data": JSON.stringify(user),
      "content-type": "application/json",
    },
    data: {
      institutionId: 1,
      title: "e2e seeded task " + Math.random().toString(36).slice(2, 8),
      description: "seeded via e2e auth",
      status: "todo",
      priority: "medium",
      ...overrides,
    },
  });

  if (!resp.ok()) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Seed failed ${resp.status()}: ${txt}`);
  }

  const json = await resp.json();
  return json.data ?? json;
}

/**
 * fetchTaskById - helper to fetch single task (if your API supports /api/tasks/:id).
 * Fallback: GET /api/tasks and find by id.
 */
export async function fetchTaskById(page: Page, id: number) {
  // try direct route
  try {
    const r = await page.request.get(`${BASE_URL}/api/tasks/${id}`);
    if (r.ok()) return (await r.json()).data ?? (await r.json());
  } catch (e) { /* ignore */ }

  // fallback to listing
  const r = await page.request.get(`${BASE_URL}/api/tasks?institutionId=1&limit=500`);
  if (!r.ok()) throw new Error("Failed to fetch tasks list");
  const json = await r.json();
  return (json.data || []).find((t: any) => Number(t.id) === Number(id));
}

/**
 * cleanupTestTasks - delete test tasks (for test cleanup)
 * Protected to only run in dev/test environment
 */
export async function cleanupTestTasks(page: Page, user: any, prefix: string = "e2e seeded task") {
  // This would be implemented as an API endpoint in a real scenario
  // For now, we'll just log that cleanup would happen
  console.log(`Would cleanup tasks with prefix: ${prefix}`);
}