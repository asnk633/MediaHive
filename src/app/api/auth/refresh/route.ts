// src/app/api/auth/refresh/route.ts
// Refresh token endpoint for secure session management

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyRefreshToken, createSession, setSessionCookies } from '../../_lib/session';
import { AuthUser } from '../../_lib/auth';
import { rateLimitMiddleware } from '../../_lib/rate-limiter';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for refresh token requests
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not provided' },
        { status: 401 }
      );
    }
    
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    // Fetch user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    
    const user = userResult[0];
    
    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    // Create new session with fresh tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await createSession(userWithoutPassword as AuthUser);
    
    // Create response
    const response = NextResponse.json(
      { message: 'Token refreshed successfully' },
      { status: 200 }
    );
    
    // Set new secure cookies
    setSessionCookies(response, newAccessToken, newRefreshToken);
    
    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
