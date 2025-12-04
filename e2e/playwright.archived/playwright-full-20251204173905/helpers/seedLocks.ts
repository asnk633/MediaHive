// e2e/playwright/helpers/seedLocks.ts
// Helper for creating isolated test data for document locking

import type { Page } from "@playwright/test";
import { seedUser, seedTask } from './seed';

/**
 * seedLock - create a task lock using real backend API
 * Returns created lock object
 */
export async function seedLock(page: Page, user: any, taskId: number, overrides = {}) {
  const resp = await page.request.post(`${BASE_URL}/api/locks/acquire`, {
    headers: {
      "x-user-data": JSON.stringify(user),
      "content-type": "application/json",
    },
    data: {
      taskId,
      ...overrides,
    },
  });

  if (!resp.ok()) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Seed lock failed ${resp.status()}: ${txt}`);
  }

  const json = await resp.json();
  return json.lock ?? json.data ?? json;
}

/**
 * releaseLock - release a task lock using real backend API
 */
export async function releaseLock(page: Page, user: any, taskId: number) {
  const resp = await page.request.post(`${BASE_URL}/api/locks/release`, {
    headers: {
      "x-user-data": JSON.stringify(user),
      "content-type": "application/json",
    },
    data: {
      taskId,
    },
  });

  if (!resp.ok()) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Release lock failed ${resp.status()}: ${txt}`);
  }

  return await resp.json();
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";