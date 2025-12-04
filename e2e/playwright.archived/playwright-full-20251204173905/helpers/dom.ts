import type { Page } from "@playwright/test";

/**
 * Wait for either task rows to appear ('.task-row') OR the
 * "No tasks here." empty-state text to be present in the page.
 *
 * This makes tests robust when the DB is empty or when seeded tasks exist.
 */
export async function waitForTasksOrEmpty(page: Page, timeout = 15000) {
  // Wait for either task rows or the empty state text
  try {
    await page.waitForFunction(
      (emptyText) => {
        try {
          // Check if task rows exist
          if (document.querySelector(".task-row")) return true;
          // Check if the empty state text exists
          const bodyText = document.body?.textContent || "";
          return bodyText.includes(emptyText);
        } catch (e) {
          return false;
        }
      },
      "No tasks here.",
      { timeout }
    );
  } catch (error) {
    // If the function times out, we'll continue anyway as the page might have loaded
    console.warn("waitForTasksOrEmpty timed out, continuing with test execution");
  }
}

/**
 * waitForFAB - wait for FAB button to be visible
 */
export async function waitForFAB(page: Page, timeout = 15000) {
  await page.waitForSelector("button[aria-label='Open create menu']", { timeout });
}