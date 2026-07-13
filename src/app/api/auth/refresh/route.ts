// src/app/api/auth/refresh/route.ts
// Refresh token endpoint for secure session management

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
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
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    // Fetch user from database
    const db = await getDb();
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(String(payload.userId), 10)))
      .limit(1);
    
    const user = userResult[0];
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    
    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    const validRoles = ['admin', 'manager', 'team', 'member'] as const;
    const role = validRoles.includes(user.role as any) 
      ? (user.role as typeof validRoles[number]) 
      : 'member';

    const authUser: AuthUser = {
      id: String(user.id),
      email: user.email,
      fullName: user.fullName,
      role: role,
      institution_id: String(user.institution_id),
      tenant_id: String(user.tenantId),
    };
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await createSession(authUser);
    
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
