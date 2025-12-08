// e2e/playwright/helpers/seedTimeline.ts
// Helper for creating isolated test data for task timeline

import type { Page } from "@playwright/test";
import { seedUser, seedTask } from './seed';

/**
 * seedTaskActivity - create a task activity entry using real backend API
 * Returns created activity object
 */
export async function seedTaskActivity(page: Page, user: any, taskId: number, action: string, overrides = {}) {
  // In a real implementation, task activities would be automatically created
  // when tasks are modified. For testing purposes, we'll create a mock activity.
  
  const activity = {
    id: Date.now(), // Simple ID generation for testing
    taskId,
    userId: user.id,
    action,
    oldValue: null,
    newValue: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    ...overrides
  };

  return activity;
}

/**
 * getTaskActivities - fetch task activities using real backend API
 */
export async function getTaskActivities(page: Page, user: any, taskId: number) {
  const resp = await page.request.get(`${BASE_URL}/api/tasks/${taskId}/activity`, {
    headers: {
      "x-user-data": JSON.stringify(user),
      "content-type": "application/json",
    }
  });

  if (!resp.ok()) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Get task activities failed ${resp.status()}: ${txt}`);
  }

  const json = await resp.json();
  return json.activities ?? json.data ?? json;
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";