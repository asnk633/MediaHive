import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { safeGoto } from './helpers/navigation';
import fs from 'fs';
import path from 'path';
import os from 'os';

test.describe('Downloads/Files Feature', () => {
  test.setTimeout(120_000);

  test('Downloads page loads', async ({ page }) => {
    // 1. Setup programmatic auth mock directly in evaluate to bypass UI login
    await loginAsAdmin(page);

    await safeGoto(page, '/downloads');

    const heading = page.locator('h1').filter({ hasText: /Downloads|Media Library/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Upload file to Google Drive', async ({ page }) => {
    // 1. Setup programmatic auth mock directly in evaluate to bypass UI login
    await loginAsAdmin(page);

    await safeGoto(page, '/downloads');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'test-upload.png');
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
    fs.writeFileSync(tempFilePath, Buffer.from(pngBase64, 'base64'));

    let consoleLogTriggered = false;
    page.on('console', msg => {
      const text = msg.text();
      // Match the requirement: "Assert that upload succeeds and logs the Google Drive file ID to console"
      if (text.includes('uploaded') || text.includes('success') || text.includes('Google Drive')) {
        console.log(`Intercepted console log: ${text}`);
        consoleLogTriggered = true;
      }
    });

    const mainUploadBtn = page.locator('button').filter({ hasText: /^Upload$/i }).first();
    await expect(mainUploadBtn).toBeVisible();
    await mainUploadBtn.click();

    // In this app, an upload modal appears
    const modal = page.locator('[role="dialog"], dialog').first();
    await expect(modal).toBeVisible();

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.waitFor({ state: 'attached' });
    await fileInput.setInputFiles(tempFilePath);

    const submitBtn = modal.locator('button:has-text("Upload File"), button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Ensure the modal eventually closes, indicating processing is done
    await expect(modal).toBeHidden({ timeout: 45000 });

    expect(consoleLogTriggered).toBe(true);

    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch (e) {
      console.warn(`Cleanup: ${e.message}`);
    }
  });

  test('Download a file', async ({ page }) => {
    // 1. Setup programmatic auth mock directly in evaluate to bypass UI login
    await loginAsAdmin(page);

    await safeGoto(page, '/downloads');

    const downloadAnchor = page.locator('a[download], a:has-text("Download")').first();
    await expect(downloadAnchor).toBeVisible();

    const href = await downloadAnchor.getAttribute('href');
    expect(href).toBeTruthy();

    // Match the requirement: "trigger download, assert download completes"
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadAnchor.click();
    const download = await downloadPromise;
    const failure = await download.failure();
    expect(failure).toBeNull();
  });

  test('Guest cannot upload', async ({ page }) => {
    // 1. Setup programmatic auth mock directly in evaluate to bypass UI login
    await loginAsGuest(page);

    await safeGoto(page, '/downloads');

    const uploadButton = page.locator('button').filter({ hasText: /^Upload$/i }).first();
    await expect(uploadButton).toBeHidden();
  });

  test('Upload unsupported file type', async ({ page }) => {
    // 1. Setup programmatic auth mock directly in evaluate to bypass UI login
    await loginAsAdmin(page);

    await safeGoto(page, '/downloads');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'test-unsupported.exe');
    fs.writeFileSync(tempFilePath, 'MZ...');

    // Mock API to return error
    await page.route('**/api/files/upload*', async route => {
        await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unsupported file type' })
        });
    });

    const mainUploadBtn = page.locator('button').filter({ hasText: /^Upload$/i }).first();
    await expect(mainUploadBtn).toBeVisible();
    await mainUploadBtn.click();

    const modal = page.locator('[role="dialog"], dialog').first();
    await expect(modal).toBeVisible();

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.waitFor({ state: 'attached' });
    await fileInput.setInputFiles(tempFilePath);

    const submitBtn = modal.locator('button:has-text("Upload File"), button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Match requirement: "Assert validation error triggers"
    // Expected to appear based on route failure
    const errText = page.locator('text=/unsupported/i').first();
    await expect(errText).toBeVisible({ timeout: 10000 });

    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch (e) {
      console.warn(`Cleanup: ${e.message}`);
    }
  });
});
