// src/app/api/auth/logout/route.ts
// Logout endpoint to securely clear session

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies } from '../../_lib/session';
import { logAuditEvent } from '../../_lib/audit';
import { rateLimitMiddleware } from '../../_lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for logout requests
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Get user IP address for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Get user agent for audit logging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Get user from request for audit logging
    // Note: We're not using the standard getUserFromRequest here because
    // the session might be invalid, but we still want to log the attempt
    let userId = null;
    try {
      const authHeader = request.headers.get('x-user-data');
      if (authHeader) {
        const user = JSON.parse(authHeader);
        userId = user.id;
      }
    } catch {
      // If we can't parse the user, we'll log without user ID
    }
    
    // Log the logout attempt
    if (userId) {
      // TODO: Get proper tenantId from request context
      const tenantId = 1; // Default tenant for development
      await logAuditEvent(
        userId,
        'logout',
        'user',
        tenantId,
        userId,
        { action: 'logout' },
        ipAddress,
        userAgent
      );
    }
    
    // Create response
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Clear all session cookies
    clearSessionCookies(response);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}