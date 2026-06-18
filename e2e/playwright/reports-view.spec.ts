import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { safeGoto } from './helpers/navigation';

test.describe('Reports View', () => {

    test('Reports dashboard loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/reports');
        await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
    });

    test('Activity report page loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/reports/activity');
        await expect(page.getByRole('heading', { name: 'Activity Report', exact: true })).toBeVisible();
    });

    test('Analytics report page loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/reports/analytics');
        await expect(page.getByRole('heading', { name: 'Analytics Dashboard', exact: true })).toBeVisible();
    });

    test('Performance report page loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/reports/performance');
        await expect(page.getByRole('heading', { name: 'Performance Metrics', exact: true })).toBeVisible();
    });

    test('Custom report builder UI loads', async ({ page }) => {
        await loginAsAdmin(page);
        await safeGoto(page, '/reports/custom');
        await expect(page.getByRole('heading', { name: 'Custom Report Builder', exact: true })).toBeVisible();
    });

    test('Guest sees Access Denied on reports page', async ({ page }) => {
        await loginAsGuest(page);
        await safeGoto(page, '/reports');
        await expect(page.getByText('Access Denied', { exact: true })).toBeVisible();
    });

});
