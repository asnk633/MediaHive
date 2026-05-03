// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { Permission, Role, hasPermission, hasRole } from '@/lib/permissions';
import { verifyUser, AuthenticatedUser } from '@/lib/server-utils';

/**
 * Modern RBAC Authorization
 * Relies on Supabase JWT verification and the 'profiles' table.
 */
export async function authorizeByPermission(req: NextRequest, requiredPermission: Permission): Promise<AuthenticatedUser | null> {
  const user = await verifyUser(req);

  if (!user) {
    console.warn(`[rbac] No authenticated user found for ${req.url}`);
    return null;
  }

  const userRole = user.role as Role;

  if (!hasPermission(userRole, requiredPermission)) {
    console.warn(`[rbac] User ${user.email} (Role: ${userRole}) lacks permission: ${requiredPermission}`);
    return null;
  }

  return user;
}

export function withAuth(handler: Function, permission: Permission) {
  return async (req: NextRequest, ...args: any[]) => {
    const user = await authorizeByPermission(req, permission);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }
    return handler(req, user, ...args);
  };
}

export { hasRole, hasPermission };
export const authorize = authorizeByPermission;
