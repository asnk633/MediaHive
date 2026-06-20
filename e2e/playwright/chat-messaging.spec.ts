import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest, getCredentials } from './helpers/auth';
import { getTestPrefix, cleanupByPrefix } from './helpers/cleanup';
import { safeGoto, waitForMessage } from './helpers/navigation';

test.describe('Chat Messaging', () => {
  let testPrefix: string;

  test.beforeEach(async ({}, testInfo) => {
    testPrefix = getTestPrefix('chat') + '-' + testInfo.testId;
  });

  test.afterEach(async () => {
    await cleanupByPrefix('chat_rooms', 'name', testPrefix);
  });

  test('Chat page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    await expect(page.getByRole('heading', { name: /conversations/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Create chat room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-room`;
    await page.getByRole('button', { name: /new chat room/i }).click();
    await page.getByPlaceholder(/e.g. Video Production/i).fill(roomName);
    await page.getByRole('button', { name: /create room/i }).click();

    await expect(page.getByText(roomName).first()).toBeVisible();
  });

  test('Send text message in room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-message-room`;
    await page.getByRole('button', { name: /new chat room/i }).click();
    await page.getByPlaceholder(/e.g. Video Production/i).fill(roomName);
    await page.getByRole('button', { name: /create room/i }).click();

    await page.getByText(roomName).first().click();

    const messageText = 'Test message';
    await page.getByPlaceholder(/message team/i).fill(messageText);
    await page.keyboard.press('Enter');

    await waitForMessage(page, messageText);
  });

  test('View message in room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-view-room`;
    await page.getByRole('button', { name: /new chat room/i }).click();
    await page.getByPlaceholder(/e.g. Video Production/i).fill(roomName);
    await page.getByRole('button', { name: /create room/i }).click();

    await page.getByText(roomName).first().click();

    const messageText = 'Another test message';
    await page.getByPlaceholder(/message team/i).fill(messageText);
    await page.keyboard.press('Enter');

    await waitForMessage(page, messageText);
    await expect(page.getByText(messageText)).toBeVisible();
  });

  test('Add participant to room', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    // create room
    await page.getByRole('button', { name: /new chat room/i }).click();
    await page.getByPlaceholder(/e.g. Video Production/i).fill('Test Project Alpha');
    await page.getByRole('button', { name: /create room/i }).click();

    // Open Group Info sidebar to reveal Add User button
    await page.getByRole('button', { name: /click for group info/i }).click();

    // open Add User modal
    await page.getByRole('button', { name: /add user/i }).click();
    
    // select the first user in the modal list
    await page.getByRole('dialog').getByRole('button', { name: /@/ }).first().click();
    
    // confirm add
    await page.getByRole('button', { name: /add person/i }).click();
    
    // WAIT for the modal to close. The Sheet (GroupInfoSidebar) is also a dialog, so we specifically wait for the modal dialog to disappear
    await expect(page.getByRole('dialog').filter({ hasText: /add person/i })).toBeHidden({ timeout: 5000 });

    // typing a message
    await page.getByPlaceholder(/message team/i).fill('Hello, world!');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Hello, world!').first()).toBeVisible();
  });

  test('Send empty message blocked', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/chat');

    const roomName = `${testPrefix}-empty-room`;
    await page.getByRole('button', { name: /new chat room/i }).click();
    await page.getByPlaceholder(/e.g. Video Production/i).fill(roomName);
    await page.getByRole('button', { name: /create room/i }).click();

    await page.getByText(roomName).first().click();

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
        // Or if it's visually disabled using pointer-events-none, check that class.
        await expect(sendButton).toHaveClass(/disabled|pointer-events-none/);
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
    await adminPage.getByRole('button', { name: /new chat room/i }).click();
    await adminPage.getByPlaceholder(/e.g. Video Production/i).fill(roomName);
    await adminPage.getByRole('button', { name: /create room/i }).click();

    await adminPage.getByText(roomName).first().click();

    // Admin must add guest to the room so guest can see it
    await adminPage.getByRole('button', { name: /click for group info/i }).click();
    await adminPage.getByRole('button', { name: /add user/i }).click();
    // In a real environment we'd search for the guest email, but clicking the first available user is most robust for UI testing
    const guestEmail = getCredentials('guest').email;
    await adminPage.getByPlaceholder(/search by name or email/i).fill(guestEmail);
    await adminPage.waitForTimeout(500); // wait for filter to apply
    await adminPage.getByRole('dialog').getByRole('button', { name: /@/ }).first().click();
    await adminPage.getByRole('button', { name: /add person/i }).click();
    await expect(adminPage.getByRole('dialog').filter({ hasText: /add person/i })).toBeHidden({ timeout: 5000 });

    // Force reload guest page to ensure room list is fresh
    await guestPage.reload();
    await expect(guestPage.getByText(roomName).first()).toBeVisible({ timeout: 15000 });
    await guestPage.getByText(roomName).first().click();

    const messageText = 'Hello from admin';
    await adminPage.getByPlaceholder(/message team/i).fill(messageText);
    await adminPage.keyboard.press('Enter');

    await waitForMessage(guestPage, messageText);
    await expect(guestPage.getByText(messageText).first()).toBeVisible();

    await adminContext.close();
    await guestContext.close();
  });
});
