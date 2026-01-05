// src/app/api/_lib/rate-limiter.ts
// Rate limiting middleware for API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { getEnvVar } from '@/lib/env-validator';

// Get rate limiting configuration from environment variables
const RATE_LIMIT_WINDOW = getEnvVar('RATE_LIMIT_WINDOW', 'number', 900); // 15 minutes default
const RATE_LIMIT_MAX = getEnvVar('RATE_LIMIT_MAX', 'number', 100); // 100 requests per window default

// Create rate limiter instances
const authRateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_MAX,
  duration: RATE_LIMIT_WINDOW,
});

const strictAuthRateLimiter = new RateLimiterMemory({
  points: 5, // Only 5 attempts for strict endpoints
  duration: RATE_LIMIT_WINDOW,
});

/**
 * Rate limiting middleware for authentication endpoints
 * @param req Next.js request object
 * @param strict Whether to use strict rate limiting (for login attempts)
 * @returns NextResponse if rate limited, null if allowed
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  strict: boolean = false
): Promise<NextResponse | null> {
  try {
    // Get client IP address
    const clientIp = getClientIp(req);
    
    if (!clientIp) {
      // If we can't determine the IP, we'll still allow the request
      // but log a warning for monitoring
      console.warn('Unable to determine client IP for rate limiting');
      return null;
    }
    
    // Choose the appropriate rate limiter
    const limiter = strict ? strictAuthRateLimiter : authRateLimiter;
    
    try {
      // Consume a point for this request
      await limiter.consume(clientIp);
      return null; // Allow the request
    } catch (rateLimiterRes: any) {
      // Rate limit exceeded
      const retrySecs = rateLimiterRes.msBeforeNext / 1000;
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: retrySecs
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retrySecs.toString(),
            'X-RateLimit-Limit': strict ? '5' : RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
          }
        }
      );
    }
  } catch (error) {
    // If there's an error with rate limiting, we should still allow the request
    // to avoid blocking legitimate users due to rate limiting issues
    console.error('Rate limiting error:', error);
    return null;
  }
}

/**
 * Get client IP address from request
 * @param req Next.js request object
 * @returns Client IP address or null if not found
 */
function getClientIp(req: NextRequest): string | null {
  // Try to get IP from various headers (in order of preference)
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'fastly-client-ip', // Fastly
  ];
  
  for (const header of ipHeaders) {
    const ip = req.headers.get(header);
    if (ip) {
      // Handle multiple IPs in x-forwarded-for (comma separated)
      const firstIp = ip.split(',')[0].trim();
      if (firstIp && isValidIp(firstIp)) {
        return firstIp;
      }
    }
  }
  
  // If no headers provided IP, fallback to socket remote address
  // Note: This may not be available in all environments
  return null;
}

/**
 * Validate IP address format
 * @param ip IP address string
 * @returns Whether the IP is valid
 */
function isValidIp(ip: string): boolean {
  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part, 10) <= 255);
  }
  
  // Basic IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}