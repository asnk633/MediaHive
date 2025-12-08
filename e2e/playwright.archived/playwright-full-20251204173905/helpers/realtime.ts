// e2e/playwright/helpers/realtime.ts
// Test helpers for realtime features

import type { Page } from "@playwright/test";

/**
 * Wait for a realtime update on a specific channel
 * 
 * @param page Playwright page instance
 * @param channel SSE channel name
 * @param criteria Function to check if the update matches criteria
 * @param timeout Maximum time to wait (ms)
 * @returns Promise that resolves when the update is received
 */
export async function waitForRealtimeUpdate(
  page: Page, 
  channel: string, 
  criteria: (data: any) => boolean,
  timeout: number = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for realtime update on channel ${channel}`));
    }, timeout);

    // Create EventSource to listen for updates
    const script = `
      const eventSource = new EventSource('/api/${channel}/subscribe');
      eventSource.addEventListener('${channel}', (event) => {
        const data = JSON.parse(event.data);
        if ((${criteria.toString()})(data)) {
          eventSource.close();
          window.realtimeUpdateReceived = data;
        }
      });
      eventSource.onerror = () => {
        eventSource.close();
      };
    `;

    page.evaluate(script).catch(reject);

    // Check periodically for the update
    const intervalId = setInterval(async () => {
      try {
        const result = await page.evaluate(() => (window as any).realtimeUpdateReceived);
        if (result) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve(result);
        }
      } catch (error) {
        // Ignore errors during evaluation
      }
    }, 100);
  });
}

/**
 * Simulate network latency for testing
 * 
 * @param page Playwright page instance
 * @param latency Latency in milliseconds
 */
export async function simulateNetworkLatency(page: Page, latency: number) {
  await page.route('**/*', async route => {
    // Add delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, latency));
    await route.continue();
  });
}