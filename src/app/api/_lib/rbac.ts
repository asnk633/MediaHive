import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Role, Permission, hasPermission, hasRole } from '@/lib/permissions';

export async function authorizeByPermission(req: NextRequest, requiredPermission: Permission) {
  let userId = req.headers.get('x-user-id');

  if (!userId && process.env.NODE_ENV !== 'production') {
    userId = '1';
  }

  if (!userId) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));

  if (!user) {
    return null;
  }

  const userRole = user.role as Role;

  if (!hasPermission(userRole, requiredPermission)) {
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