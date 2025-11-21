import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
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
    
    // Set session cookie
    const sessionToken = encodeURIComponent(JSON.stringify(userWithoutPassword));
    
    // Create response with user data
    const response = NextResponse.json(userWithoutPassword, { status: 200 });
    
    // Set secure cookie (HTTP-only)
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}