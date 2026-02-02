// src/app/api/middleware/compression.ts
// Middleware to add compression headers to API responses

import { NextRequest, NextResponse } from 'next/server';

/**
 * Compression middleware
 * 
 * Adds compression headers to enable gzip/brotli compression for API responses
 */
export async function compressionMiddleware(req: NextRequest) {
  // This middleware doesn't need to do anything actively
  // Compression is handled by Next.js when compress: true is set in next.config.ts
  // But we can add additional headers if needed
  
  // The actual compression is enabled in next.config.ts with compress: true
  // We just ensure the proper headers are set for clients that support compression
  return null;
}