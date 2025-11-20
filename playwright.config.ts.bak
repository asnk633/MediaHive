import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from .env or .env.local
dotenv.config();

// Use BASE_URL from .env, or default to localhost:3000
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * Merged Playwright Configuration
 *
 * This file combines two configurations:
 * 1. A role-based setup (admin, team, guest) with a webServer and specific timeouts.
 * 2. A CI-aware, cross-browser setup (Chromium, Firefox, WebKit).
 *
 * The merged approach creates project groups for each role (admin, team, guest)
 * and allows running them against different browsers (using device descriptors).
 */
export default defineConfig({
  // Use the cleaner path from the second config
  testDir: "e2e/playwright",

  // Use the longer timeout from the first config
  timeout: 120000,
  // Use the longer expect timeout from the first config
  expect: { timeout: 10000 },

  // --- Settings from the CI-aware config (File 2) ---
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Use CI-aware retries
  retries: process.env.CI ? 2 : 0,
  // Use CI-aware workers
  workers: process.env.CI ? 1 : undefined,
  // Combine reporters from both
  reporter: [
    ["list"], // From File 2 (good for console)
    ["html", { open: "never" }], // From both
  ],

  // --- Global 'use' block (merged) ---
  use: {
    baseURL: BASE_URL,
    // Common settings from both files
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",

    // Use explicit timeouts from File 2, as File 1's actionTimeout: 0 is risky
    actionTimeout: 10000,
    navigationTimeout: 20000,
    // Note: 'headless: false' and 'viewport' from File 1 are omitted
    // in favor of device descriptors in the projects section.
  },

  // --- Projects (Merged Role + Browser strategy) ---
  // This structure combines the roles from File 1 with the
  // cross-browser devices from File 2.
  projects: [
    // === Admin Role Projects ===
    {
      name: "admin-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/states/admin.json",
      },
    },
    // {
    //   name: "admin-firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     storageState: "e2e/states/admin.json",
    //   },
    // },
    // {
    //   name: "admin-webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //     storageState: "e2e/states/admin.json",
    //   },
    // },

    // === Team Role Projects ===
    {
      name: "team-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/states/team.json",
      },
    },
    // {
    //   name: "team-firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     storageState: "e2e/states/team.json",
    //   },
    // },
    // {
    //   name: "team-webkit",
    //   use: {
    * ...devices["Desktop Safari"],
    //     storageState: "e2e/states/team.json",
    //   },
    // },

    // === Guest Role Projects ===
    {
      name: "guest-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/states/guest.json",
      },
    },
    // {
    //   name: "guest-firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //     storageState: "e2e/states/guest.json",
    //   },
    // },
    // {
    //   name: "guest-webkit",
    //   use: {
    * ...devices["Desktop Safari"],
    //     storageState: "e2e/states/guest.json",
    //   },
    // },
  ],

  // --- WebServer (from File 1) ---
  // This is crucial for running the app locally before tests.
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});