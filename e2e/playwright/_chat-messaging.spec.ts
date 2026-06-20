import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto, waitForMessage } from './helpers/navigation';

test.describe('Chat Messaging', () => {
  let testPrefix: string;

  test.beforeEach(async () => {
    testPrefix = getTestPrefix('chat');
  });

  test.afterEach(async () => {
    await cleanupByPrefix('chat_rooms', 'name', testPrefix);
  });

  test('Chat page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    await expect(page.getByRole('heading', { name: /chat/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Create chat room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-room`;
    await page.getByRole('button', { name: /create room/i }).click();
    await page.getByPlaceholder(/room name/i).fill(roomName);
    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.getByText(roomName)).toBeVisible();
  });

  test('Send text message in room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-message-room`;
    await page.getByRole('button', { name: /create room/i }).click();
    await page.getByPlaceholder(/room name/i).fill(roomName);
    await page.getByRole('button', { name: /submit/i }).click();

    await page.getByText(roomName).click();

    const messageText = 'Test message';
    await page.getByPlaceholder(/type a message/i).fill(messageText);
    await page.getByRole('button', { name: /send/i }).click();

    await waitForMessage(page, messageText);
  });

  test('View message in room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-view-room`;
    await page.getByRole('button', { name: /create room/i }).click();
    await page.getByPlaceholder(/room name/i).fill(roomName);
    await page.getByRole('button', { name: /submit/i }).click();

    await page.getByText(roomName).click();

    const messageText = 'Another test message';
    await page.getByPlaceholder(/type a message/i).fill(messageText);
    await page.getByRole('button', { name: /send/i }).click();

    await waitForMessage(page, messageText);
    await expect(page.getByText(messageText)).toBeVisible();
  });

  test('Add participant to room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-participant-room`;
    await page.getByRole('button', { name: /create room/i }).click();
    await page.getByPlaceholder(/room name/i).fill(roomName);
    await page.getByRole('button', { name: /submit/i }).click();

    await page.getByText(roomName).click();

    await page.getByRole('button', { name: /add participant/i }).click();
    await page.getByPlaceholder(/username or email/i).fill('guest');
    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText('guest')).toBeVisible();
  });

  test('Send empty message blocked', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-empty-room`;
    await page.getByRole('button', { name: /create room/i }).click();
    await page.getByPlaceholder(/room name/i).fill(roomName);
    await page.getByRole('button', { name: /submit/i }).click();

    await page.getByText(roomName).click();

    const sendButton = page.getByRole('button', { name: /send/i });

    // Attempt to send without typing
    await sendButton.click({ force: true }); // Use force in case it's disabled or behind something

    // We should expect either the button is disabled, or a warning message appears.
    // A robust way in playwright is to check if an expected error text is visible OR button is disabled.
    // Since we don't know the exact UI behavior, let's look for standard patterns:
    const isButtonDisabled = await sendButton.isDisabled();

    if (isButtonDisabled) {
        await expect(sendButton).toBeDisabled();
    } else {
        // If button is not disabled, assume a warning should be shown.
        // E.g., validation message "Message cannot be empty" or similar.
        const warning = page.locator('text=/empty|required|cannot send/i').first();
        await expect(warning).toBeVisible({ timeout: 5000 });
    }
  });

  test('Cross-user room visibility', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const guestPage = await guestContext.newPage();

    await loginAsAdmin(adminPage);
    await safeGoto(adminPage, '/chat');

    await loginAsGuest(guestPage);
    await safeGoto(guestPage, '/chat');

    const roomName = `${testPrefix}-cross-user-room`;
    await adminPage.getByRole('button', { name: /create room/i }).click();
    await adminPage.getByPlaceholder(/room name/i).fill(roomName);
    await adminPage.getByRole('button', { name: /submit/i }).click();

    await adminPage.getByText(roomName).click();
    await guestPage.getByText(roomName).click();

    const messageText = 'Hello from admin';
    await adminPage.getByPlaceholder(/type a message/i).fill(messageText);
    await adminPage.getByRole('button', { name: /send/i }).click();

    await waitForMessage(guestPage, messageText);
    await expect(guestPage.getByText(messageText)).toBeVisible();

    await adminContext.close();
    await guestContext.close();
  });
});
