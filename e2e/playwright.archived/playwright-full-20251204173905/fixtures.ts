import { test as base, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || "admin@thaiba.com";

type AuthUser = any;

export const test = base.extend<{
  authUser: AuthUser;
}>({
  // fixture that logs in (client-side) and returns the user object
  authUser: async ({ page }: { page: Page }, use: (user: AuthUser) => Promise<void>) => {
    // Login via API to get session cookie
    const loginResp = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: TEST_EMAIL, password: "ChangeMe123!" },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!loginResp.ok()) {
      throw new Error(`Failed to login: ${loginResp.status()}`);
    }
    
    const user = await loginResp.json();
    
    // Also set localStorage for client-side compatibility
    await page.addInitScript((userObj: any) => {
      window.localStorage.setItem("user", JSON.stringify(userObj));
    }, user);

    await use(user);
  },
});

// Enhanced fixture with login functionality
export const testWithLogin = base.extend<{
  authUser: AuthUser;
  loginAs: (role: string) => Promise<AuthUser>;
}>({
  authUser: async ({ page }: { page: Page }, use: (user: AuthUser) => Promise<void>) => {
    // Login via API to get session cookie
    const loginResp = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: TEST_EMAIL, password: "ChangeMe123!" },
      headers: { "Content-Type": "application/json" }
    });
    
    if (!loginResp.ok()) {
      throw new Error(`Failed to login: ${loginResp.status()}`);
    }
    
    const user = await loginResp.json();

    await use(user);
  },

  loginAs: async ({ page }: { page: Page }, use: (loginFn: (role: string) => Promise<AuthUser>) => Promise<void>) => {
    const login = async (role: string) => {
      // Fetch users and find one with the specified role
      const resp = await page.request.get(`${BASE_URL}/api/users?role=${role}&limit=1`);
      if (!resp.ok()) throw new Error(`Failed to fetch ${role} users: ${resp.status()}`);
      const users = await resp.json();
      
      if (users.length === 0) {
        throw new Error(`No ${role} users found`);
      }
      
      const user = users[0];
      
      // Login via API to get session cookie
      const loginResp = await page.request.post(`${BASE_URL}/api/auth/login`, {
        data: { email: user.email, password: "ChangeMe123!" },
        headers: { "Content-Type": "application/json" }
      });
      
      if (!loginResp.ok()) {
        throw new Error(`Failed to login as ${role}: ${loginResp.status()}`);
      }
      
      // Also set localStorage for client-side compatibility
      await page.addInitScript((userObj: any) => {
        window.localStorage.setItem("user", JSON.stringify(userObj));
      }, user);
      
      return user;
    };

    await use(login);
  }
});

export { expect };