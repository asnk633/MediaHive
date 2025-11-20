import { Page, Locator } from "@playwright/test";

/**
 * Performs a low-level drag-and-drop between two locators using mouse events.
 * This avoids flaky .dragTo for complex UIs and overlays.
 *
 * Usage:
 *   await drag(page, sourceLocator, targetLocator);
 *
 * The helper will:
 *  - compute bounding boxes
 *  - move the mouse to the center of source, press, move in steps, and release on target
 */
export async function drag(page: Page, source: Locator, target: Locator) {
  const srcBox = await source.boundingBox();
  const dstBox = await target.boundingBox();
  if (!srcBox || !dstBox) {
    throw new Error("drag: source or target has no bounding box");
  }

  const startX = srcBox.x + srcBox.width / 2;
  const startY = srcBox.y + srcBox.height / 2;
  const endX = dstBox.x + dstBox.width / 2;
  const endY = dstBox.y + dstBox.height / 2;

  // Small step-wise movement to imitate real drag (helps with some drag libraries)
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    const y = startY + ((endY - startY) * i) / steps;
    await page.mouse.move(x, y);
    // gentle delay to help the UI settle
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

export default drag;
