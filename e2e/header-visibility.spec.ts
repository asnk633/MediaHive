import { test, expect } from '@playwright/test';

test('Header visibility on mobile', async ({ page }) => {
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
  if (greetingBox) {
    expect(greetingBox.y).toBeGreaterThanOrEqual(0);
    expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(915);
  }
});

test('Header visibility on desktop', async ({ page }) => {
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
  
  // Assert that "Good Morning" heading is visible
  expect(greetingBox).toBeTruthy();
  if (greetingBox) {
    expect(greetingBox.y).toBeGreaterThanOrEqual(0);
    expect(greetingBox.y + greetingBox.height).toBeLessThanOrEqual(768);
  }
});