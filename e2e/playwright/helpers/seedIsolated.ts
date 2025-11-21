// e2e/playwright/helpers/seedIsolated.ts
// Helper for creating isolated test data with unique identifiers

import { seedUser, cleanupTestTasks } from './seed';
import { test } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import type { Page } from "@playwright/test";

/**
 * Create isolated test data with unique identifiers
 * 
 * @param page Playwright page instance
 * @param testRunId Unique identifier for this test run
 * @param role User role to create (default: 'admin')
 * @param taskCount Number of tasks to create (default: 3)
 * @returns Object containing the test user and created tasks
 */
export async function seedIsolatedTest(page: Page, testRunId: string, role: string = 'admin', taskCount: number = 3) {
  // Create a unique user for this test run
  const user = await seedUser(page, role);
  
  // Create tasks with unique titles using the testRunId
  const tasks = [];
  for (let i = 0; i < taskCount; i++) {
    const taskTitle = `Test Task ${i + 1} (${testRunId})`;
    const taskDescription = `Description for test task ${i + 1} in run ${testRunId}`;
    
    // In a real implementation, you would make an API call to create the task
    // For now, we'll just create mock task objects
    const task = {
      id: `${testRunId}-${i + 1}`,
      title: taskTitle,
      description: taskDescription,
      status: 'todo',
      priority: 'medium',
      createdById: user.id,
      institutionId: user.institutionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tasks.push(task);
  }
  
  return { user, tasks };
}

/**
 * Generate a unique test run ID
 * 
 * @returns Unique identifier for a test run
 */
export function generateTestRunId(): string {
  return `test-run-${uuidv4().substring(0, 8)}`;
}

/**
 * Cleanup test data for a specific test run
 * 
 * @param page Playwright page instance
 * @param testRunId Unique identifier for the test run to cleanup
 */
export async function cleanupTestRun(page: Page, testRunId: string) {
  // In a real implementation, you would make an API call to cleanup
  // For now, we'll just call the existing cleanup function
  // We need to pass dummy parameters to satisfy the function signature
  await cleanupTestTasks(page, { id: 1, institutionId: 1 } as any, testRunId);
}

/**
 * Fixture for isolated test data
 * 
 * Automatically creates isolated test data for each test
 */
export const isolatedTest = test.extend<{
  testRunId: string;
  isolatedData: { user: any; tasks: any[] };
}>({
  testRunId: async ({}, use) => {
    const testRunId = generateTestRunId();
    await use(testRunId);
    // Cleanup after test
    // Note: We can't cleanup here because we don't have access to the page
    // Cleanup should be done in the test itself
  },
  
  isolatedData: async ({ page, testRunId }, use) => {
    const data = await seedIsolatedTest(page, testRunId);
    await use(data);
  }
});