// e2e/playwright/helpers/mediaSeed.ts
// Helper functions for seeding media files for deterministic tests

import fs from 'fs';
import path from 'path';

// Create a directory for test media files
const TEST_MEDIA_DIR = path.join(__dirname, '..', '..', 'test-media');

// Ensure test media directory exists
export async function ensureTestMediaDir(): Promise<string> {
  try {
    await fs.promises.mkdir(TEST_MEDIA_DIR, { recursive: true });
    return TEST_MEDIA_DIR;
  } catch (error) {
    console.error('Failed to create test media directory:', error);
    throw error;
  }
}

// Create a test image file
export async function createTestImage(filename: string = 'test-image.png'): Promise<string> {
  const filePath = path.join(TEST_MEDIA_DIR, filename);
  
  // Create a simple PNG file (1x1 pixel transparent PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR chunk type
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT chunk type
    0x78, 0xDA, 0x63, 0x64, 0x60, 0x60, 0x00, 0x00, 0x00, 0x06, 0x00, 0x02, // Compressed data
    0x35, 0x1D, 0x4C, 0x01, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND chunk type
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  
  await fs.promises.writeFile(filePath, pngData);
  return filePath;
}

// Create a test video file (mock)
export async function createTestVideo(filename: string = 'test-video.mp4'): Promise<string> {
  const filePath = path.join(TEST_MEDIA_DIR, filename);
  
  // Create a simple mock video file
  const videoData = Buffer.from('MOCK_VIDEO_DATA');
  await fs.promises.writeFile(filePath, videoData);
  return filePath;
}

// Create a test audio file (mock)
export async function createTestAudio(filename: string = 'test-audio.mp3'): Promise<string> {
  const filePath = path.join(TEST_MEDIA_DIR, filename);
  
  // Create a simple mock audio file
  const audioData = Buffer.from('MOCK_AUDIO_DATA');
  await fs.promises.writeFile(filePath, audioData);
  return filePath;
}

// Create precomputed face embeddings for deterministic tests
export async function createTestEmbeddings(filename: string = 'test-embeddings.json'): Promise<string> {
  const filePath = path.join(TEST_MEDIA_DIR, filename);
  
  // Create mock face embeddings
  const embeddings = {
    'Director Suhairudeen Nurani': [
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
      // ... 118 more values to make 128-d vector
      ...Array(118).fill(0.5)
    ],
    'Principal Guest': [
      0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0,
      // ... 118 more values to make 128-d vector
      ...Array(118).fill(0.3)
    ]
  };
  
  await fs.promises.writeFile(filePath, JSON.stringify(embeddings, null, 2));
  return filePath;
}

// Clean up test media files
export async function cleanupTestMedia(): Promise<void> {
  try {
    const files = await fs.promises.readdir(TEST_MEDIA_DIR);
    for (const file of files) {
      const filePath = path.join(TEST_MEDIA_DIR, file);
      await fs.promises.unlink(filePath);
    }
    await fs.promises.rmdir(TEST_MEDIA_DIR);
  } catch (error) {
    console.warn('Failed to cleanup test media directory:', error);
  }
}

// Export all functions
export default {
  ensureTestMediaDir,
  createTestImage,
  createTestVideo,
  createTestAudio,
  createTestEmbeddings,
  cleanupTestMedia
};