import { Page, expect } from '@playwright/test';

/**
 * safeGoto navigate safely to a URL and waits for load state.
 */
export async function safeGoto(page: Page, url: string) {
  const finalUrl = url.startsWith('/') ? `${process.env.E2E_BASE_URL || 'http://localhost:3000'}${url}` : url;
  console.log(`🧭 Navigating to: ${finalUrl}`);
  
  await page.goto(finalUrl, {
    timeout: 30000,
    waitUntil: 'load'
  });
  
  await waitForPageReady(page);
}

/**
 * waitForPageReady waits for the page structure to load and dismisses standard onboarding/welcome banners.
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  
  // Attempt to dismiss onboarding dialogs or welcome modals if present
  try {
    const welcomeDismiss = page.locator('button:has-text("Get Started"), button:has-text("Dismiss"), button[aria-label="Close"]');
    if (await welcomeDismiss.isVisible()) {
      await welcomeDismiss.click();
    }
  } catch (e) {
    // Welcome dismiss button not found/interactable, move on
  }
}

/**
 * retryAction executes an async function multiple times before throwing an error.
 */
export async function retryAction<T>(
  fn: () => Promise<T>,
  retries?: number,
  delay: number = 1000
): Promise<T> {
  const maxRetries = retries !== undefined ? retries : parseInt(process.env.E2E_RETRY_COUNT || '3', 10);
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`❌ Action failed after ${attempt} attempts`);
        throw error;
      }
      console.warn(`⚠️ Action failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * waitForMessage waits until a specific message is visible on the page using polling.
 */
export async function waitForMessage(page: Page, text: string, timeout = 10000) {
  await expect.poll(async () => {
    return page.locator(`text=${text}`).first().isVisible();
  }, {
    timeout,
    intervals: [500, 1000, 2000]
  }).toBeTruthy();
}
