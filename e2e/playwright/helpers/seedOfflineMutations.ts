// e2e/playwright/helpers/seedOfflineMutations.ts
// Helper for creating isolated test data for offline mutations

import type { Page } from "@playwright/test";
import { seedUser, seedTask } from './seed';

/**
 * seedOfflineMutation - create an offline mutation entry in local storage
 * Returns created mutation object
 */
export async function seedOfflineMutation(page: Page, mutation: any) {
  // Generate a unique ID for the mutation
  const id = `mutation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const offlineMutation = {
    id,
    timestamp: Date.now(),
    retries: 0,
    ...mutation
  };

  // Store in localStorage to simulate offline queue
  await page.addInitScript((mutation) => {
    const existing = localStorage.getItem('offlineQueue');
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(mutation);
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
  }, offlineMutation);

  return offlineMutation;
}

/**
 * getOfflineMutations - fetch offline mutations from local storage
 */
export async function getOfflineMutations(page: Page) {
  return await page.evaluate(() => {
    const existing = localStorage.getItem('offlineQueue');
    return existing ? JSON.parse(existing) : [];
  });
}

/**
 * clearOfflineMutations - clear offline mutations from local storage
 */
export async function clearOfflineMutations(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('offlineQueue');
  });
}

/**
 * simulateOfflineMutation - simulate an offline mutation by intercepting API calls
 */
export async function simulateOfflineMutation(page: Page, url: string, method: string, data: any) {
  // This would typically be implemented using Playwright's route interception
  // For now, we'll just store it in the offline queue
  return await seedOfflineMutation(page, {
    type: method.toLowerCase() === 'post' ? 'create' : method.toLowerCase() === 'patch' ? 'update' : 'delete',
    endpoint: url,
    payload: data
  });
}