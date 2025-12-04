import type { Page, Locator } from "@playwright/test";

/**
 * dragAndDropByBoundingBoxes - robust drag helper using bounding boxes and page.mouse
 * source and target are Locators.
 */
export default async function dragAndDrop(source: Locator, target: Locator, page: Page) {
  const sBox = await source.boundingBox();
  const tBox = await target.boundingBox();
  if (!sBox || !tBox) throw new Error("Element bounding box not available for drag");

  const startX = sBox.x + sBox.width / 2;
  const startY = sBox.y + sBox.height / 2;
  const endX = tBox.x + tBox.width / 2;
  const endY = tBox.y + tBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // small intermediate move to simulate human drag
  await page.mouse.move((startX + endX) / 2, (startY + endY) / 2, { steps: 8 });
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();

  // allow time for UI/backend update
  await page.waitForTimeout(300);
}
