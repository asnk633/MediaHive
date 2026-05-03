import { test, expect } from '@playwright/test';

// Phase 8A Verification Suite
test.describe('Phase 8A: Real-Time Awareness', () => {

    test('Scenario A - Normal Live Update', async ({ page, context }) => {
        // 1. Setup - Mock a second user modifying a task
        await page.goto('http://localhost:3000/tasks?devBypass=true');
        await page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({ uid: 'user-A', name: 'User A', role: 'admin' }));
        });

        // 2. Wait for application to settle
        await page.waitForTimeout(2000);

        // 3. Inject a remote task update mimicking Firebase incoming from User B
        const remoteTaskUpdate = {
            id: 'task-1',
            title: 'Remote Edited Task',
            updatedBy: { uid: 'user-B', name: 'User B' },
            updatedAt: { seconds: Math.floor(Date.now() / 1000) }
        };

        await page.evaluate((taskUpdate) => {
            // Find the Sync Remote Tasks callback indirectly by invoking awarenessService manually
            // We know `syncRemoteTasks` runs `processTaskUpdate` internally on incoming tasks
            const { awarenessService } = window as any;
            if (awarenessService) {
                awarenessService.processTaskUpdate(
                    taskUpdate,
                    { id: 'task-1', title: 'Old Task' },
                    { uid: 'user-A' }
                );
            } else {
                console.error("Awareness service not exposed globally");
            }
        }, remoteTaskUpdate);

        // 4. Verification: The awareness indicator should appear passively
        // Using loose text match because the toast might say 'updated by User B'
        const notification = page.locator('text="Activity Update"');
        await expect(notification).toBeVisible({ timeout: 5000 });

        const textDesc = page.locator('text="User B"');
        await expect(textDesc).toBeVisible();
    });

    test('Scenario B - Buffering during Offline/Replay', async ({ page }) => {
        await page.goto('http://localhost:3000/tasks?devBypass=true');
        await page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({ uid: 'user-A', name: 'User A', role: 'admin' }));
        });

        // 1. Set Offline State
        await page.evaluate(() => {
            const { awarenessService } = window as any;
            if (awarenessService) {
                awarenessService.setSystemState({ isOffline: true });
            }
        });

        // 2. Inject remote update
        await page.evaluate(() => {
            const { awarenessService } = window as any;
            if (awarenessService) {
                awarenessService.processTaskUpdate(
                    { id: 'task-1', title: 'Offline Mod', updatedBy: { uid: 'user-C', name: 'User C' }, updatedAt: { seconds: Math.floor(Date.now() / 1000) } },
                    { id: 'task-1', title: 'Old Task' },
                    { uid: 'user-A' }
                );
            }
        });

        // 3. Verification: Indicator should NOT be visible
        const notification = page.locator('text="Activity Update"');
        await expect(notification).toBeHidden();

        // 4. Verify buffer
        const bufferSize = await page.evaluate(() => {
            const { awarenessService } = window as any;
            return awarenessService ? awarenessService.getBufferedUpdates().length : 0;
        });
        expect(bufferSize).toBeGreaterThan(0);

        // 5. Come back online
        await page.evaluate(() => {
            const { awarenessService } = window as any;
            if (awarenessService) {
                awarenessService.setSystemState({ isOffline: false });
                awarenessService.processBufferedUpdates();
            }
        });

        // 6. Verification: Indicator now visible
        const restoreNotification = page.locator('text="updates available while you were away"');
        await expect(restoreNotification).toBeVisible({ timeout: 5000 });
    });

    test('Scenario C - Echo Deduplication', async ({ page }) => {
        await page.goto('http://localhost:3000/tasks?devBypass=true');
        await page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({ uid: 'user-A', name: 'User A', role: 'admin' }));
        });

        // 1. Inject remote update FROM THE SAME USER (echo)
        await page.evaluate(() => {
            const { awarenessService } = window as any;
            if (awarenessService) {
                awarenessService.processTaskUpdate(
                    { id: 'task-1', title: 'My Own Mod', updatedBy: { uid: 'user-A', name: 'User A' }, updatedAt: { seconds: Math.floor(Date.now() / 1000) } },
                    { id: 'task-1', title: 'Old Task' },
                    { uid: 'user-A' }
                );
            }
        });

        // 2. Verification: The indicator must NOT appear
        const notification = page.locator('text="Activity Update"');
        await expect(notification).toBeHidden();
    });

});
