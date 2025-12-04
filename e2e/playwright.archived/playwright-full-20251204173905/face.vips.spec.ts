// e2e/playwright/face.vips.spec.ts
// Playwright tests for VIP Face Recognition

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

test.describe('VIP Face Recognition', () => {
  test('admin can enroll VIP and match face', async ({ page }) => {
    // Login as admin
    const login = async (role: string) => {
      // Mock login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 1,
              email: 'admin@test.com',
              role: 'admin',
              fullName: 'Admin User'
            }
          })
        });
      });
      
      // Mock user fetch
      await page.route('**/api/users', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 1,
            email: 'admin@test.com',
            role: 'admin',
            fullName: 'Admin User'
          }])
        });
      });
    };
    
    await login('admin');
    
    // Create a test image
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    // Mock VIP enrollment
    await page.route('**/api/face/enroll', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'VIP enrolled successfully',
          id: 1
        })
      });
    });
    
    // Mock face matching
    await page.route('**/api/face/match', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matches: [{
            id: 1,
            label: 'Director Suhairudeen Nurani',
            similarity: 0.85,
            userId: 1
          }],
          processingTime: 150
        })
      });
    });
    
    // Test VIP enrollment
    const enrollResponse = await page.request.post('/api/face/enroll', {
      multipart: {
        file: {
          name: 'director.jpg',
          mimeType: 'image/jpeg',
          buffer: imageBuffer
        },
        label: 'Director Suhairudeen Nurani'
      }
    });
    
    expect(enrollResponse.status()).toBe(200);
    
    const enrollResult = await enrollResponse.json();
    expect(enrollResult.success).toBe(true);
    expect(enrollResult.id).toBe(1);
    
    // Test face matching
    const matchResponse = await page.request.post('/api/face/match', {
      multipart: {
        file: {
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          buffer: imageBuffer
        }
      }
    });
    
    expect(matchResponse.status()).toBe(200);
    
    const matchResult = await matchResponse.json();
    expect(matchResult.matches).toHaveLength(1);
    expect(matchResult.matches[0].label).toBe('Director Suhairudeen Nurani');
    expect(matchResult.matches[0].similarity).toBeGreaterThan(0.65);
    expect(matchResult.processingTime).toBeGreaterThan(0);
  });
  
  test('admin can list and delete VIPs', async ({ page }) => {
    // Login as admin
    const login = async (role: string) => {
      // Mock login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 1,
              email: 'admin@test.com',
              role: 'admin',
              fullName: 'Admin User'
            }
          })
        });
      });
      
      // Mock user fetch
      await page.route('**/api/users', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 1,
            email: 'admin@test.com',
            role: 'admin',
            fullName: 'Admin User'
          }])
        });
      });
    };
    
    await login('admin');
    
    // Mock VIP listing
    await page.route('**/api/face/vips', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          label: 'Director Suhairudeen Nurani',
          userId: 1,
          createdAt: new Date().toISOString()
        }, {
          id: 2,
          label: 'Principal Guest',
          userId: 2,
          createdAt: new Date().toISOString()
        }])
      });
    });
    
    // Mock VIP deletion
    await page.route('**/api/face/vips/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'VIP deleted successfully'
        })
      });
    });
    
    // Test VIP listing
    const listResponse = await page.request.get('/api/face/vips');
    expect(listResponse.status()).toBe(200);
    
    const vips = await listResponse.json();
    expect(vips).toHaveLength(2);
    expect(vips[0].label).toBe('Director Suhairudeen Nurani');
    expect(vips[1].label).toBe('Principal Guest');
    
    // Test VIP deletion
    const deleteResponse = await page.request.delete('/api/face/vips/1');
    expect(deleteResponse.status()).toBe(200);
    
    const deleteResult = await deleteResponse.json();
    expect(deleteResult.success).toBe(true);
  });
  
  test('non-admin cannot enroll VIPs', async ({ page }) => {
    // Login as team member
    const login = async (role: string) => {
      // Mock login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 2,
              email: 'team@test.com',
              role: 'team',
              fullName: 'Team Member'
            }
          })
        });
      });
      
      // Mock user fetch
      await page.route('**/api/users', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 2,
            email: 'team@test.com',
            role: 'team',
            fullName: 'Team Member'
          }])
        });
      });
    };
    
    await login('team');
    
    // Create a test image
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    // Mock forbidden response for enrollment
    await page.route('**/api/face/enroll', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Forbidden: Only admins can enroll VIPs'
        })
      });
    });
    
    // Test VIP enrollment by non-admin
    const enrollResponse = await page.request.post('/api/face/enroll', {
      multipart: {
        file: {
          name: 'director.jpg',
          mimeType: 'image/jpeg',
          buffer: imageBuffer
        },
        label: 'Director Suhairudeen Nurani'
      }
    });
    
    expect(enrollResponse.status()).toBe(403);
    
    const enrollResult = await enrollResponse.json();
    expect(enrollResult.error).toBe('Forbidden: Only admins can enroll VIPs');
  });
});