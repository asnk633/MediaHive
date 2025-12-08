// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Simple compression middleware for text-based responses
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add compression headers
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  response.headers.set('Vary', 'Accept-Encoding');
  
  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};