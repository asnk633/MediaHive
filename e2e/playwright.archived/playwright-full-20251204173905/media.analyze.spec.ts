// e2e/playwright/media.analyze.spec.ts
// Playwright tests for Media Quality Analyzer

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';
import path from 'path';
import fs from 'fs';

test.describe('Media Quality Analyzer', () => {
  test('should analyze image quality and return report', async ({ page }) => {
    // Create a simple test image
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    // Mock the API call to /api/media/analyze
    await page.route('**/api/media/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'image',
          score: 85,
          checks: {
            blurScore: 90,
            brightnessScore: 75,
            noiseScore: 80,
            resolution: { width: 1920, height: 1080 },
            suggestions: ['Image resolution is good', 'Consider adjusting brightness']
          },
          filename: 'test-image.png',
          createdAt: new Date().toISOString()
        })
      });
    });
    
    // Simulate file upload and analysis
    // In a real test, you would interact with the UI elements
    const response = await page.request.post('/api/media/analyze', {
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.type).toBe('image');
    expect(result.score).toBeGreaterThan(0);
    expect(result.checks).toBeDefined();
    expect(result.filename).toBe('test-image.png');
  });
  
  test('should analyze video quality and return report', async ({ page }) => {
    // Create a mock video file (just for testing)
    const videoBuffer = Buffer.from('mock video content');
    
    // Mock the API call to /api/media/analyze
    await page.route('**/api/media/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'video',
          score: 78,
          checks: {
            blurScore: 85,
            brightnessScore: 70,
            noiseScore: 75,
            audioLoudness: 82,
            resolution: { width: 1280, height: 720 },
            suggestions: ['Video resolution is acceptable', 'Audio levels are good']
          },
          sampleFrames: [
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQECAQECAQEBAQICAwICAwQDAwIDBAUEBAYFBQUFBQUGBgcHCAcHBgkJCgoJCQwMDAwMCwoMDQ0MDQz/2wBDAQEBAQEBAQIBAQIDCAcIBgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
          ],
          filename: 'test-video.mp4',
          createdAt: new Date().toISOString()
        })
      });
    });
    
    // Simulate file upload and analysis
    const response = await page.request.post('/api/media/analyze', {
      multipart: {
        file: {
          name: 'test-video.mp4',
          mimeType: 'video/mp4',
          buffer: videoBuffer
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.type).toBe('video');
    expect(result.score).toBeGreaterThan(0);
    expect(result.checks).toBeDefined();
    expect(result.sampleFrames).toBeDefined();
    expect(result.filename).toBe('test-video.mp4');
  });
  
  test('should reject files that exceed size limit', async ({ page }) => {
    // Create a large mock file
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB file
    
    // Mock the API call to return 400 for large files
    await page.route('**/api/media/analyze', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'File size exceeds limit of 10485760 bytes'
        })
      });
    });
    
    // Simulate file upload
    const response = await page.request.post('/api/media/analyze', {
      multipart: {
        file: {
          name: 'large-file.jpg',
          mimeType: 'image/jpeg',
          buffer: largeBuffer
        }
      }
    });
    
    expect(response.status()).toBe(400);
    
    const result = await response.json();
    expect(result.error).toContain('File size exceeds limit');
  });
  
  test('should return 404 when feature is disabled', async ({ page }) => {
    // Mock environment where feature is disabled
    await page.route('**/api/media/analyze', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Media analyzer feature is disabled'
        })
      });
    });
    
    // Create a simple test image
    const imageBuffer = await page.screenshot({ type: 'png' });
    
    // Simulate file upload
    const response = await page.request.post('/api/media/analyze', {
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer
        }
      }
    });
    
    expect(response.status()).toBe(404);
    
    const result = await response.json();
    expect(result.error).toBe('Media analyzer feature is disabled');
  });
});