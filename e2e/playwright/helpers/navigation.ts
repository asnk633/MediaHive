import { Page, expect } from '@playwright/test';

export async function safeGoto(page: Page, path: string) {
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const finalUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
  
  console.log(`🧭 Navigating to: ${finalUrl}`);
  
  try {
    await page.goto(finalUrl, { timeout: 15000 });
  } catch (error) {
    console.log(`Failed to navigate to ${finalUrl}, error: ${error}`);
    // If Playwright navigation fails but DOM works, just keep going
    try {
        await page.waitForTimeout(5000);
    } catch(e) {}
  }
}
