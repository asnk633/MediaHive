// src/app/api/_lib/auth.ts
// RBAC helpers for API routes

import { NextRequest } from 'next/server';
import { UserRole } from '@/types';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  institutionId: number;
}

/**
 * Extract user from request headers or session cookie
 * Prefers session cookie, falls back to x-user-data header
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
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
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user can modify resource (owner or admin)
 */
export function canModify(user: AuthUser | null, resourceOwnerId: number): boolean {
  if (!user) return false;
  return user.id === resourceOwnerId || isAdmin(user);
}

/**
 * Validate task status transition based on user role
 */
export function canChangeTaskStatus(
  user: AuthUser | null,
  currentStatus: string,
  newStatus: string
): boolean {
  if (!user) return false;

  // Admin can change any status
  if (isAdmin(user)) return true;

  // Team can move tasks through workflow
  if (user.role === 'team') {
    const validTransitions: Record<string, string[]> = {
      'todo': ['in_progress'],
      'in_progress': ['review', 'todo'],
      'review': ['done', 'in_progress'],
      'done': [], // Can't change from done without admin
    };
    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // Guest cannot change status
  return false;
}