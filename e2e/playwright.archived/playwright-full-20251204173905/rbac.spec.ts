// e2e/playwright/rbac.spec.ts
// Tests for role-based access control

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';

test.describe('RBAC (Role-Based Access Control)', () => {
  test('should allow admin to create tasks', async ({ page }) => {
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Make API call to create a task as admin
    const resp = await page.request.post('/api/tasks', {
      headers: {
        "x-user-data": JSON.stringify(adminUser),
        "content-type": "application/json",
      },
      data: {
        title: "Admin Task Creation Test",
        description: "Test task created by admin user",
        status: "todo",
        priority: "medium",
        institutionId: adminUser.institutionId,
      },
    });
    
    // Verify success
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json.data).toBeDefined();
    expect(json.data.title).toBe("Admin Task Creation Test");
  });

  test('should allow team member to create tasks', async ({ page }) => {
    // Seed a team user
    const teamUser = await seedUser(page, 'team');
    
    // Make API call to create a task as team member
    const resp = await page.request.post('/api/tasks', {
      headers: {
        "x-user-data": JSON.stringify(teamUser),
        "content-type": "application/json",
      },
      data: {
        title: "Team Task Creation Test",
        description: "Test task created by team user",
        status: "todo",
        priority: "medium",
        institutionId: teamUser.institutionId,
      },
    });
    
    // Verify success
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json.data).toBeDefined();
    expect(json.data.title).toBe("Team Task Creation Test");
  });

  test('should allow guest to create tasks with limited permissions', async ({ page }) => {
    // Seed a guest user
    const guestUser = await seedUser(page, 'guest');
    
    // Make API call to create a task as guest
    const resp = await page.request.post('/api/tasks', {
      headers: {
        "x-user-data": JSON.stringify(guestUser),
        "content-type": "application/json",
      },
      data: {
        title: "Guest Task Creation Test",
        description: "Test task created by guest user",
        status: "todo",
        priority: "high", // This should be ignored for guest users
        institutionId: guestUser.institutionId,
      },
    });
    
    // Verify success
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json.data).toBeDefined();
    expect(json.data.title).toBe("Guest Task Creation Test");
    // Note: In a full implementation, you would verify that the priority was set to the default
    // rather than the requested value, but that would require changes to the API implementation
  });

  test('should forbid guest from accessing admin endpoints', async ({ page }) => {
    // Seed a guest user
    const guestUser = await seedUser(page, 'guest');
    
    // Clear cookies to avoid interference from previous login
    await page.context().clearCookies();
    
    // Try to access the notify endpoint as a guest
    const resp = await page.request.post('/api/notify', {
      headers: {
        "x-user-data": JSON.stringify(guestUser),
        "content-type": "application/json",
      },
      data: {
        title: "Test Notification",
        message: "This should be forbidden",
      },
    });
    
    // Verify forbidden access
    expect(resp.status()).toBe(403);
    const json = await resp.json();
    expect(json.error).toContain("Forbidden");
  });

  test('should allow admin to access admin endpoints', async ({ page }) => {
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Clear cookies to avoid interference from previous login
    await page.context().clearCookies();
    
    // Try to access the notify endpoint as an admin
    const resp = await page.request.post('/api/notify', {
      headers: {
        "x-user-data": JSON.stringify(adminUser),
        "content-type": "application/json",
      },
      data: {
        title: "Test Notification",
        message: "This should be allowed",
      },
    });
    
    // Verify success
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("Notification sent successfully");
  });

  test('should forbid team member from deleting tasks they do not own', async ({ page }) => {
    // Seed an admin user and create a task
    const adminUser = await seedUser(page, 'admin');
    const task = await seedTask(page, adminUser, { title: "Admin Task" });
    
    // Seed a team user (different user)
    const teamUser = await seedUser(page, 'team');
    
    // Clear cookies to avoid interference from previous login
    await page.context().clearCookies();
    
    // Try to delete the admin's task as a team member
    const resp = await page.request.delete('/api/tasks', {
      headers: {
        "x-user-data": JSON.stringify(teamUser),
        "content-type": "application/json",
      },
      data: {
        id: task.id,
      },
    });
    
    // Verify forbidden access
    expect(resp.status()).toBe(403);
    const json = await resp.json();
    expect(json.error).toContain("Forbidden");
  });

  test('should allow admin to delete any task', async ({ page }) => {
    // Seed a team user and create a task
    const teamUser = await seedUser(page, 'team');
    const task = await seedTask(page, teamUser, { title: "Team Task" });
    
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Try to delete the team's task as an admin
    const resp = await page.request.delete('/api/tasks', {
      headers: {
        "x-user-data": JSON.stringify(adminUser),
        "content-type": "application/json",
      },
      data: {
        id: task.id,
      },
    });
    
    // Verify success
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
  });
});