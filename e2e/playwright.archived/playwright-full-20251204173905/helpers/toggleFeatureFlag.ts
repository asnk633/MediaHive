// e2e/playwright/helpers/toggleFeatureFlag.ts
// Helper to toggle feature flags in Playwright tests

import type { Page } from "@playwright/test";

/**
 * toggleFeatureFlag - toggle a feature flag by setting it in localStorage
 */
export async function toggleFeatureFlag(page: Page, flagName: string, enabled: boolean) {
  await page.addInitScript((args: { flagName: string; enabled: boolean }) => {
    if (args.enabled) {
      localStorage.setItem(`feature_${args.flagName}`, 'true');
    } else {
      localStorage.removeItem(`feature_${args.flagName}`);
    }
  }, { flagName, enabled });
}

/**
 * isFeatureFlagEnabled - check if a feature flag is enabled
 */
export async function isFeatureFlagEnabled(page: Page, flagName: string): Promise<boolean> {
  return await page.evaluate((flagName: string) => {
    return localStorage.getItem(`feature_${flagName}`) === 'true';
  }, flagName);
}

/**
 * enableAllFeatureFlags - enable all feature flags for testing
 */
export async function enableAllFeatureFlags(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('feature_kanban', 'true');
    localStorage.setItem('feature_fab_notify', 'true');
    localStorage.setItem('feature_review_flow', 'true');
    localStorage.setItem('feature_offline_mode', 'true');
    localStorage.setItem('feature_document_locking', 'true');
    localStorage.setItem('feature_task_timeline', 'true');
    localStorage.setItem('feature_notification_rules', 'true');
    localStorage.setItem('feature_ai_assistant', 'true');
    localStorage.setItem('feature_monitoring', 'true');
  });
}