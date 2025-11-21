import type { Page } from "@playwright/test";

/**
 * Wait for either task rows to appear ('.task-row') OR the
 * "No tasks here." empty-state text to be present in the page.
 *
 * This makes tests robust when the DB is empty or when seeded tasks exist.
 */
export async function waitForTasksOrEmpty(page: Page, timeout = 15000) {
  // Runs inside browser context; check for .task-row or the empty text
  await page.waitForFunction(
    (emptyText) => {
      try {
        if (document.querySelector(".task-row")) return true;
        const body = document.body?.innerText || "";
        return body.includes(emptyText);
      } catch (e) {
        return false;
      }
    },
    "No tasks here.",
    { timeout }
  );
}
