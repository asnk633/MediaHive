import { NextRequest } from 'next/server';
import { AuthUser } from './auth';
import { getUserFromRequest } from './auth';

/**
 * RBAC middleware for API routes
 * 
 * Centralized role-based access control that validates user permissions
 * for protected endpoints.
 */

// Define roles
export type UserRole = 'admin' | 'team' | 'guest';

// Define permissions
export type Permission = 
  | 'read:tasks'
  | 'write:tasks'
  | 'manage:users'
  | 'send:notifications'
  | 'review:tasks'
  | 'admin:monitoring';

// Define role permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'read:tasks',
    'write:tasks',
    'manage:users',
    'send:notifications',
    'review:tasks',
    'admin:monitoring'
  ],
  team: [
    'read:tasks',
    'write:tasks',
    'review:tasks'
  ],
  guest: [
    'read:tasks'
  ]
};

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Middleware to protect API routes by role
 * 
 * @param req Next.js request object
 * @param allowedRoles Roles that are allowed to access the route
 * @returns AuthUser object if authorized, null if not
 */
export async function authorizeByRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthUser | null> {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return null;
  }
  
  if (!hasRole(user, allowedRoles)) {
    return null;
  }
  
  return user;
}

/**
 * Middleware to protect API routes by permission
 * 
 * @param req Next.js request object
 * @param requiredPermission Permission required to access the route
 * @returns AuthUser object if authorized, null if not
 */
export async function authorizeByPermission(
  req: NextRequest,
  requiredPermission: Permission
): Promise<AuthUser | null> {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return null;
  }
  
  if (!hasPermission(user, requiredPermission)) {
    return null;
  }
  
  return user;
}