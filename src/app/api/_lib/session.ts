// src/app/api/_lib/session.ts
// Session management utilities with security enhancements

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { AuthUser } from './types';

// Environment variables
// NOTE: The fallback secret is only for development and must NEVER be used in production
const JWT_SECRET = process.env.APP_SECRET || 'fallback_secret_key_for_development';
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '604800'); // 7 days default
const REFRESH_TOKEN_MAX_AGE = parseInt(process.env.REFRESH_TOKEN_MAX_AGE || '2592000'); // 30 days default

// JWT secret key
const getJwtSecretKey = () => {
  const secret = JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Create a secure session with access and refresh tokens
 */
export async function createSession(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
  const secretKey = getJwtSecretKey();
  const now = Math.floor(Date.now() / 1000);
  
  // Create access token (short-lived)
  const accessToken = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE)
    .sign(secretKey);
  
  // Create refresh token (longer-lived)
  const refreshToken = await new SignJWT({ userId: user.id })
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
    return payload.user as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: number } | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return { userId: payload.userId as number };
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
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
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
      // In a real implementation, you would fetch the user from DB
      // For now, we'll just return null to force re-login
      // A full implementation would re-issue tokens here
      return null;
    }
  }
  

  
  return null;
}
