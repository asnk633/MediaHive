import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Role, hasPermission, Permission } from '@/lib/permissions';

export async function authorizeByPermission(req: NextRequest, requiredPermission: Permission) {
  // 1. Get User ID from Header (Simulated Auth) or Session
  // In a real app, this would be a session token. 
  // For this project, we might be using a header or a mock session.
  // Let's assume a custom header 'x-user-id' for now, or fallback to a default if dev.

  let userId = req.headers.get('x-user-id');

  // DEV FALLBACK
  if (!userId && process.env.NODE_ENV !== 'production') {
    // Default to admin for dev convenience if not specified
    // userId = '1'; 
  }

  if (!userId) {
    return null; // Unauthorized
  }

  const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));

  if (!user) {
    return null;
  }

  const userRole = user.role as Role;

  if (!hasPermission(userRole, requiredPermission)) {
    return null; // Forbidden
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