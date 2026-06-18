import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest, loginAsMember } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto } from './helpers/navigation';

let testPrefix: string;

test.beforeEach(async () => {
  testPrefix = getTestPrefix('leave');
});

test.afterEach(async () => {
  await cleanupByPrefix('leave_requests', 'reason', testPrefix);
});

test.describe('Leave Request System', () => {
  test('Leave requests dashboard loads', async ({ page }) => {
    await loginAsMember(page);
    await safeGoto(page, '/leave');
    await expect(page.locator('text=My Leave Requests').first()).toBeVisible();
  });

  test('Create a new leave request and check pending status', async ({ page }) => {
    await loginAsMember(page);
    await safeGoto(page, '/leave');

    // Click 'New Request' button
    await page.locator('button:has-text("New Request")').click();

    // Wait for the form to load
    await expect(page.locator('text=Select Leave Category')).toBeVisible();

    // Select start and end date using DateSelector
    // To keep the e2e robust, since date selection might be complex with popovers,
    // we'll try to click the start date and select next month, or simply tomorrow

    // Click Start Date
    await page.locator('button:has-text("Select date")').first().click();
    // In shadcn calendar, we can select a day that is not disabled
    // Find the next available day by looking at available days
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(15).click(); // Click some day in middle of month

    // Click End Date
    await page.locator('button:has-text("Select date")').click();
    // Select a day after the start date
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(16).click();

    // Fill the reason containing the testPrefix
    await page.fill('textarea', testPrefix + ' - need some time off');

    // Submit the form
    await page.locator('button:has-text("Submit Request")').click();

    // Verify redirection to my-requests and pending status
    await expect(page.locator('text=My Leave Requests').first()).toBeVisible();
    await expect(page.locator(`text=${testPrefix}`)).toBeVisible();
    // Check for "pending" status (assuming there's an indicator)
    await expect(page.locator(`div:has-text("${testPrefix}")`).locator('text=Pending').first()).toBeVisible();
  });

  test('Double-booking validation triggers overlap warning', async ({ page }) => {
    await loginAsMember(page);

    // Create first request manually to setup overlap
    await safeGoto(page, '/leave/request');

    // Start date
    await page.locator('button:has-text("Select date")').first().click();
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(15).click();

    // End date
    await page.locator('button:has-text("Select date")').click();
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(16).click();

    await page.fill('textarea', testPrefix + ' - first request');
    await page.locator('button:has-text("Submit Request")').click();
    await expect(page.locator(`text=${testPrefix} - first request`)).toBeVisible();

    // Attempt second request with same dates
    await safeGoto(page, '/leave/request');

    // Start date
    await page.locator('button:has-text("Select date")').first().click();
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(15).click();

    // End date
    await page.locator('button:has-text("Select date")').click();
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(16).click();

    await page.fill('textarea', testPrefix + ' - overlapping request');

    // Overlap should be detected dynamically and show the warning
    await expect(page.locator('text=Overlap Detected')).toBeVisible();
  });

  test('Manager approval flow', async ({ page }) => {
    // 1. Create a request as member first to ensure there's one to approve
    await loginAsMember(page);
    await safeGoto(page, '/leave/request');

    // Set dates
    await page.locator('button:has-text("Select date")').first().click();
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(15).click();

    await page.locator('button:has-text("Select date")').click();
    await page.locator('.rdp-day:not(.rdp-day_disabled)').nth(16).click();

    await page.fill('textarea', testPrefix + ' - waiting approval');
    await page.locator('button:has-text("Submit Request")').click();
    await expect(page.locator(`text=${testPrefix} - waiting approval`)).toBeVisible();

    // 2. Login as Admin to approve
    await loginAsAdmin(page);
    await safeGoto(page, '/leave');

    // Assuming /leave redirects to /admin/leave-requests for admin as per page.tsx
    // Or we should land on leave requests page.

    // Locate the request
    const requestCard = page.locator(`div:has-text("${testPrefix} - waiting approval")`).first();
    await expect(requestCard).toBeVisible();

    // Click Approve
    await requestCard.locator('button:has-text("Approve")').click();

    // We expect the request to either disappear or change status to approved
    // Wait for the success toast or removal from pending list
    await expect(page.locator('text=Leave request approved')).toBeVisible();
  });

  test('Guest cannot request leave', async ({ page }) => {
    await loginAsGuest(page);
    await safeGoto(page, '/leave/request');

    // Should see restricted message or be redirected
    await expect(page.locator('text=Service Restricted')).toBeVisible();
  });
});
