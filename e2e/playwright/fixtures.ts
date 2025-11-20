import { test as base, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || "dev@local";

type AuthUser = any;

export const test = base.extend<{
  authUser: AuthUser;
}>({
  // fixture that logs in (client-side) and returns the user object
  authUser: async ({ page }: { page: Page }, use: (user: AuthUser) => Promise<void>) => {
    const resp = await page.request.get(`${BASE_URL}/api/users`);
    if (!resp.ok()) throw new Error("Failed to fetch users: " + resp.status());
    const users = await resp.json();
    const user = users.find((u: any) => u.email === TEST_EMAIL);
    if (!user) throw new Error(`Test user (${TEST_EMAIL}) not found in /api/users`);

    // ensure localStorage user is set before any navigation
    await page.addInitScript((userObj: AuthUser) => {
      window.localStorage.setItem("user", JSON.stringify(userObj));
    }, user);

    await use(user);
  },
});
export { expect };