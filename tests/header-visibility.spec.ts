import { test, expect } from '@playwright/test';

test.describe('Header Visibility Tests', () => {
  test('Desktop viewport - Header visibility', async ({ page }) => {
    // Set viewport to typical desktop dimension
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get TopBar bounding box
    const topBar = await page.locator('header.topbar').first();
    const topBarBox = await topBar.boundingBox();
    
    // Get "Good Morning" heading bounding box
    const greetingHeading = await page.getByText('Good Morning').first();
    const greetingBox = await greetingHeading.boundingBox();
    
    // Assert that TopBar is fully within viewport
    expect(topBarBox).toBeTruthy();
    if (topBarBox) {
      expect(topBarBox.y).toBeGreaterThanOrEqual(0);
      expect(topBarBox.y + topBarBox.height).toBeLessThanOrEqual(768);
    }
    
    // Assert that "Good Morning" heading is visible directly below TopBar
    expect(greetingBox).toBeTruthy();
    if (greetingBox && topBarBox) {
      expect(greetingBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height);
      expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(768);
    }
    
    // Assert FAB presence
    const fab = await page.locator('.fab-main').first();
    await expect(fab).toBeVisible();
  });

  test('Tablet viewport - Header visibility', async ({ page }) => {
    // Set viewport to typical tablet dimension
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get TopBar bounding box
    const topBar = await page.locator('header.topbar').first();
    const topBarBox = await topBar.boundingBox();
    
    // Get "Good Morning" heading bounding box
    const greetingHeading = await page.getByText('Good Morning').first();
    const greetingBox = await greetingHeading.boundingBox();
    
    // Assert that TopBar is fully within viewport
    expect(topBarBox).toBeTruthy();
    if (topBarBox) {
      expect(topBarBox.y).toBeGreaterThanOrEqual(0);
      expect(topBarBox.y + topBarBox.height).toBeLessThanOrEqual(768);
    }
    
    // Assert that "Good Morning" heading is visible directly below TopBar
    expect(greetingBox).toBeTruthy();
    if (greetingBox && topBarBox) {
      expect(greetingBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height);
      expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(768);
    }
    
    // Assert FAB presence
    const fab = await page.locator('.fab-main').first();
    await expect(fab).toBeVisible();
  });

  test('Mobile viewport - Header visibility', async ({ page }) => {
    // Set viewport to typical mobile dimension
    await page.setViewportSize({ width: 412, height: 915 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get TopBar bounding box
    const topBar = await page.locator('header.topbar').first();
    const topBarBox = await topBar.boundingBox();
    
    // Get "Good Morning" heading bounding box
    const greetingHeading = await page.getByText('Good Morning').first();
    const greetingBox = await greetingHeading.boundingBox();
    
    // Assert that TopBar is fully within viewport
    expect(topBarBox).toBeTruthy();
    if (topBarBox) {
      expect(topBarBox.y).toBeGreaterThanOrEqual(0);
      expect(topBarBox.y + topBarBox.height).toBeLessThanOrEqual(915);
    }
    
    // Assert that "Good Morning" heading is visible directly below TopBar
    expect(greetingBox).toBeTruthy();
    if (greetingBox && topBarBox) {
      expect(greetingBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height);
      expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(915);
    }
    
    // Assert FAB presence
    const fab = await page.locator('.fab-main').first();
    await expect(fab).toBeVisible();
  });

  test('Android WebView-like viewport - Header visibility', async ({ page }) => {
    // Set viewport to typical Android WebView dimension
    await page.setViewportSize({ width: 360, height: 640 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get TopBar bounding box
    const topBar = await page.locator('header.topbar').first();
    const topBarBox = await topBar.boundingBox();
    
    // Get "Good Morning" heading bounding box
    const greetingHeading = await page.getByText('Good Morning').first();
    const greetingBox = await greetingHeading.boundingBox();
    
    // Assert that TopBar is fully within viewport
    expect(topBarBox).toBeTruthy();
    if (topBarBox) {
      expect(topBarBox.y).toBeGreaterThanOrEqual(0);
      expect(topBarBox.y + topBarBox.height).toBeLessThanOrEqual(640);
    }
    
    // Assert that "Good Morning" heading is visible directly below TopBar
    expect(greetingBox).toBeTruthy();
    if (greetingBox && topBarBox) {
      expect(greetingBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height);
      expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(640);
    }
    
    // Assert FAB presence
    const fab = await page.locator('.fab-main').first();
    await expect(fab).toBeVisible();
  });

  test('Pixel 7 viewport - Header visibility', async ({ page }) => {
    // Set viewport to Pixel 7 dimensions
    await page.setViewportSize({ width: 412, height: 915 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get TopBar bounding box
    const topBar = await page.locator('header.topbar').first();
    const topBarBox = await topBar.boundingBox();
    
    // Get "Good Morning" heading bounding box
    const greetingHeading = await page.getByText('Good Morning').first();
    const greetingBox = await greetingHeading.boundingBox();
    
    // Assert that TopBar is fully within viewport
    expect(topBarBox).toBeTruthy();
    if (topBarBox) {
      expect(topBarBox.y).toBeGreaterThanOrEqual(0);
      expect(topBarBox.y + topBarBox.height).toBeLessThanOrEqual(915);
    }
    
    // Assert that "Good Morning" heading is visible directly below TopBar
    expect(greetingBox).toBeTruthy();
    if (greetingBox && topBarBox) {
      expect(greetingBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height);
      expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(915);
    }
    
    // Assert FAB presence
    const fab = await page.locator('.fab-main').first();
    await expect(fab).toBeVisible();
  });
});