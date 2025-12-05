import type { Locator, Page } from "@playwright/test";

/**
 * Low-level mouse-based drag helper for HTML5 drag-and-drop.
 *
 * Uses mouse events (move/down/up) to simulate drag for apps that rely on
 * mouse events instead of the native HTML5 DataTransfer API.
 *
 * Exported as default so specs using `import drag from "./helpers/drag"` work.
 */
export default async function drag(
  page: Page,
  source: Locator,
  target: Locator,
  options?: { holdForMs?: number; steps?: number }
): Promise<void> {
  const holdForMs = options?.holdForMs ?? 80;
  const steps = options?.steps ?? 10;

  const sourceBox = await source.boundingBox();
  if (!sourceBox) {
    throw new Error("drag(): could not resolve boundingBox() for source locator");
  }

  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error("drag(): could not resolve boundingBox() for target locator");
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(holdForMs);
  await page.mouse.move(endX, endY, { steps });
  await page.mouse.up();
  await page.waitForTimeout(200);
}
