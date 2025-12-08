import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession, setSessionCookies } from '../../_lib/session';
import { AuthUser } from '../../_lib/auth';
import { validateSchema, loginSchema } from '@/lib/validation';
import { rateLimitMiddleware } from '../../_lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for login attempts
    const rateLimitResponse = await rateLimitMiddleware(request, true);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    const body = await request.json();
    const { email, password } = validateSchema(loginSchema, body);
    
    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const user = userResult[0];
    
    // If password is provided, validate it
    if (password) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }
    
    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    // Create secure session with JWT tokens
    const { accessToken, refreshToken } = await createSession(userWithoutPassword as AuthUser);
    
    // Create response with user data
    const response = NextResponse.json(userWithoutPassword, { status: 200 });
    
    // Set secure cookies (HTTP-only, Secure in production, SameSite)
    setSessionCookies(response, accessToken, refreshToken);
    
    return response;
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}