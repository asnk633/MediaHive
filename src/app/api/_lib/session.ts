// src/app/api/_lib/session.ts
// Session management utilities with security enhancements

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { AuthUser, UserRole } from './types';
import crypto from 'crypto';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Dynamic fallback secret for development if APP_SECRET is missing or weak
let JWT_SECRET = process.env.APP_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: APP_SECRET environment variable is missing or less than 32 characters in production!');
  }
  console.warn('WARNING: APP_SECRET is missing or weak (less than 32 characters). Generating a secure dynamic fallback in memory.');
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
}

const SESSION_MAX_AGE = 900; // 15 minutes default (short-lived access tokens)
const REFRESH_TOKEN_MAX_AGE = parseInt(process.env.REFRESH_TOKEN_MAX_AGE || '2592000', 10); // 30 days default

// JWT secret key
const getJwtSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET);
};

/**
 * Create a secure session with access and refresh tokens
 */
export async function createSession(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
  const secretKey = getJwtSecretKey();
  const now = Math.floor(Date.now() / 1000);
  
  // Create access token (short-lived)
  const accessToken = await new SignJWT({
    sub: String(user.id),
    role: user.role,
    tenant_id: user.tenant_id || user.tenantId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE)
    .sign(secretKey);
  
  // Create refresh token (longer-lived)
  const refreshToken = await new SignJWT({ sub: String(user.id) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TOKEN_MAX_AGE)
    .sign(secretKey);
  
  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.sub as string,
      role: payload.role as UserRole,
      tenant_id: payload.tenant_id as string,
    } as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return { userId: String(payload.sub) };
  } catch {
    return null;
  }
}

/**
 * Set secure session cookies
 */
export function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  // Set access token cookie
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'strict',
  });
  
  // Set refresh token cookie
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/',
    sameSite: 'strict',
  });
}

/**
 * Clear session cookies
 */
export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
}

/**
 * Get user from request with token verification
 */
export async function getUserFromRequest(req: NextRequest, res?: NextResponse): Promise<AuthUser | null> {
  // Try access token first
  const accessToken = req.cookies.get('access_token')?.value;
  if (accessToken) {
    const user = await verifyAccessToken(accessToken);
    if (user) {
      return user;
    }
  }
  
  // Fall back to refresh token for automatic renewal
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      try {
        const db = await getDb();
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(payload.userId, 10)))
          .limit(1);
        
        const user = userResult[0];
        if (user) {
          const authUser: AuthUser = {
            id: String(user.id),
            email: user.email,
            fullName: user.fullName,
            role: user.role as UserRole,
            tenant_id: String(user.tenantId),
            institution_id: String(user.institution_id),
          };
          
          const tokens = await createSession(authUser);
          
          // If NextResponse context is passed, set the cookies directly on it
          if (res) {
            setSessionCookies(res, tokens.accessToken, tokens.refreshToken);
          } else {
            // Attempt to write using Next.js headers (next/headers cookies)
            // This is allowed in state-changing routes and Server Actions, but may fail in GET route handlers.
            try {
              const cookieStore = await cookies();
              cookieStore.set('access_token', tokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: SESSION_MAX_AGE,
                path: '/',
                sameSite: 'strict',
              });
              cookieStore.set('refresh_token', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: REFRESH_TOKEN_MAX_AGE,
                path: '/',
                sameSite: 'strict',
              });
            } catch {
              // Ignore cookie setting failures in GET route handlers (will fallback to next request)
            }
          }
          
          return authUser;
        }
      } catch (err) {
        console.error('[SESSION] In-flight token renewal failed:', err);
      }
    }
  }
  
  return null;
}
