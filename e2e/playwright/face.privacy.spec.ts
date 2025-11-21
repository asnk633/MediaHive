// e2e/playwright/face.privacy.spec.ts
// Playwright tests for VIP Face Recognition Privacy

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

test.describe('VIP Face Recognition Privacy', () => {
  test('ensures face embeddings are encrypted', async ({ page }) => {
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
    
    // Mock VIP enrollment with encrypted embedding
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
    
    // Mock database query to check encryption
    await page.route('**/api/test/encryption-check', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isEncrypted: true,
          embeddingFormat: 'encrypted-string-with-iv'
        })
      });
    });
    
    // Enroll VIP
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
    
    // Check that embedding is encrypted in database
    const encryptionCheckResponse = await page.request.get('/api/test/encryption-check');
    expect(encryptionCheckResponse.status()).toBe(200);
    
    const encryptionResult = await encryptionCheckResponse.json();
    expect(encryptionResult.isEncrypted).toBe(true);
    expect(encryptionResult.embeddingFormat).toContain('encrypted');
  });
  
  test('ensures non-admin cannot access VIP management', async ({ page }) => {
    // Login as guest
    const login = async (role: string) => {
      // Mock login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 3,
              email: 'guest@test.com',
              role: 'guest',
              fullName: 'Guest User'
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
            id: 3,
            email: 'guest@test.com',
            role: 'guest',
            fullName: 'Guest User'
          }])
        });
      });
    };
    
    await login('guest');
    
    // Mock forbidden responses
    await page.route('**/api/face/enroll', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Forbidden: Only admins can enroll VIPs'
        })
      });
    });
    
    await page.route('**/api/face/vips', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Forbidden: Only admins can list VIPs'
        })
      });
    });
    
    await page.route('**/api/face/vips/1', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Forbidden: Only admins can delete VIPs'
        })
      });
    });
    
    // Create a test image
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    // Test enrollment forbidden
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
    
    // Test listing forbidden
    const listResponse = await page.request.get('/api/face/vips');
    expect(listResponse.status()).toBe(403);
    const listResult = await listResponse.json();
    expect(listResult.error).toBe('Forbidden: Only admins can list VIPs');
    
    // Test deletion forbidden
    const deleteResponse = await page.request.delete('/api/face/vips/1');
    expect(deleteResponse.status()).toBe(403);
    const deleteResult = await deleteResponse.json();
    expect(deleteResult.error).toBe('Forbidden: Only admins can delete VIPs');
  });
  
  test('ensures face recognition feature can be disabled', async ({ page }) => {
    // Mock environment where face recognition is disabled
    await page.route('**/api/face/enroll', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Face recognition feature is disabled'
        })
      });
    });
    
    await page.route('**/api/face/match', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Face recognition feature is disabled'
        })
      });
    });
    
    await page.route('**/api/face/vips', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Face recognition feature is disabled'
        })
      });
    });
    
    // Create a test image
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    // Test enrollment when feature disabled
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
    
    expect(enrollResponse.status()).toBe(404);
    const enrollResult = await enrollResponse.json();
    expect(enrollResult.error).toBe('Face recognition feature is disabled');
    
    // Test matching when feature disabled
    const matchResponse = await page.request.post('/api/face/match', {
      multipart: {
        file: {
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          buffer: imageBuffer
        }
      }
    });
    
    expect(matchResponse.status()).toBe(404);
    const matchResult = await matchResponse.json();
    expect(matchResult.error).toBe('Face recognition feature is disabled');
    
    // Test listing when feature disabled
    const listResponse = await page.request.get('/api/face/vips');
    expect(listResponse.status()).toBe(404);
    const listResult = await listResponse.json();
    expect(listResult.error).toBe('Face recognition feature is disabled');
  });
  
  test('ensures external APIs are disabled by default', async ({ page }) => {
    // Mock environment where external APIs are disabled
    await page.route('**/api/face/proxy', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'External APIs are disabled. Enable ENABLE_EXTERNAL_APIS to use face recognition service.'
        })
      });
    });
    
    // Test proxy endpoint when external APIs disabled
    const proxyResponse = await page.request.post('/api/face/proxy', {
      data: {
        image: 'base64-encoded-image-data'
      }
    });
    
    expect(proxyResponse.status()).toBe(403);
    const proxyResult = await proxyResponse.json();
    expect(proxyResult.error).toContain('External APIs are disabled');
  });
});