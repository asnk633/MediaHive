// src/app/api/_lib/auth.ts
// RBAC helpers for API routes

import { NextRequest } from 'next/server';
import { UserRole } from '@/types';
import { loggingMiddleware } from '../middleware/logging';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  institutionId: number;
  tenantId: number; // Add tenantId for multi-tenant support
}

/**
 * Extract user from request headers or session cookie
 * Prefers session cookie, falls back to x-user-data header
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Log the request for debugging
    await loggingMiddleware(req);
    
    // First, try to get user from session cookie (server-side)
    const sessionToken = req.cookies.get('session_token')?.value;
    
    if (sessionToken) {
      // In a real implementation, you would validate the session token
      // For this demo, we'll just parse it as JSON (not secure for production)
      try {
        const user = JSON.parse(decodeURIComponent(sessionToken)) as AuthUser;
        return user;
      } catch {
        // If session token is invalid, continue to check x-user-data header
      }
    }
    
    // Fallback to x-user-data header (for backward compatibility)
    const userHeader = req.headers.get('x-user-data');
    if (userHeader) {
      const user = JSON.parse(userHeader) as AuthUser;
      return user;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user can modify a resource (admin or creator)
 */
export function canModify(user: AuthUser | null, creatorId: number): boolean {
  if (!user) return false;
  return isAdmin(user) || user.id === creatorId;
}