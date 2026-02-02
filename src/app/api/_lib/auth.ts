
// src/app/api/_lib/auth.ts
// RBAC helpers for API routes

import { NextRequest } from 'next/server';
import { TaskStatus } from '@/types';
import { loggingMiddleware } from '../api-utils/logging';
import { getUserFromRequest as getSessionUser } from './session';
import { AuthUser, UserRole } from './types';

export type { AuthUser };
export type { UserRole };

/**
 * Extract user from request headers or session cookie
 * Prefers JWT tokens, falls back to legacy session cookie, then x-user-data header
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Log the request for debugging
    await loggingMiddleware(req);

    // Use our enhanced session management
    const user = await getSessionUser(req);
    if (user) {
      return user;
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

/**
 * Check if user can change task status based on role and current status
 */
export function canChangeTaskStatus(
  user: AuthUser | null,
  currentStatus: TaskStatus,
  newStatus: TaskStatus
): boolean {
  if (!user) return false;

  // Admins can change to any status
  if (isAdmin(user)) {
    return true;
  }

  // Team members can move tasks forward in the workflow
  if (user.role === 'team') {
    const statusOrder: Record<TaskStatus, number> = {
      pending: -1,
      todo: 0,
      in_progress: 1,
      on_hold: 1,
      review: 2,
      done: 3,
    };

    // Allow moving forward or staying in same status
    return statusOrder[newStatus] >= statusOrder[currentStatus];
  }

  // Guests can only move their own tasks to in_progress
  if (user.role === 'guest') {
    return currentStatus === 'todo' && newStatus === 'in_progress';
  }

  return false;
}