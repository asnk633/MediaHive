// e2e/playwright/ui/fab-bottomnav.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Redesign smoke", () => {
  test.beforeEach(async ({ page }) => {
    // ensure the app runs with the flag in CI if needed
    await page.goto("http://localhost:3000/");
  });

  test("FAB opens and menu items exist", async ({ page }) => {
    // navigate to the redesign home if set up; otherwise test main page
    await page.click('text=Home');
    // wait for FAB button to appear
    const fab = page.locator('button[title^="Open quick actions"], button[title^="Close quick actions"]');
    await expect(fab).toBeVisible();
    await fab.click();
    // menu items should appear
    await expect(page.locator('role=menu')).toBeVisible();
    await expect(page.locator('role=menuitem')).toHaveCount(3);
  });

  test("BottomNav has 6 items", async ({ page }) => {
    const items = page.locator('nav[aria-label="Main"] li');
    await expect(items).toHaveCount(6);
  });
});