import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

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