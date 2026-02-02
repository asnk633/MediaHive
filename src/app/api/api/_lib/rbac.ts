import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Role, Permission, hasPermission, hasRole } from '@/lib/permissions';

import { verifyUser } from '@/lib/server-utils';

export async function authorizeByPermission(req: NextRequest, requiredPermission: Permission) {
  let userId = req.headers.get('x-user-id');
  const db = await getDb();

  // 1. Try Session Cookie (Primary Method for Web App)
  if (!userId) {
    console.log(`[rbac] Attempting cookie verification for ${req.url}`);
    const sessionUser = await verifyUser(req);
    if (sessionUser) {
      console.log(`[rbac] Cookie verified. Email: ${sessionUser.email}`);
      if (sessionUser.email) {
        const [sqlUser] = await db.select().from(users).where(eq(users.email, sessionUser.email));
        if (sqlUser) {
          console.log(`[rbac] SQL User found: ID ${sqlUser.id}, Role ${sqlUser.role}`);
          const userRole = sqlUser.role as Role;
          if (hasPermission(userRole, requiredPermission)) {
            return sqlUser;
          }
          console.warn(`[authorizeByPermission] User ${sessionUser.email} (Role: ${userRole}) lacks permission ${requiredPermission}`);
          return null;
        } else {
          console.warn(`[authorizeByPermission] Firebase user ${sessionUser.email} VALID but NOT FOUND in SQL. Auto-provisioning...`);

          // JIT Provisioning
          try {
            // Check if institution 1 exists to avoid foreign key error, otherwise insert it? 
            // Assuming ID 1 exists as per seeding.

            const newUser = await db.insert(users).values({
              email: sessionUser.email,
              fullName: sessionUser.name || 'Firebase User',
              role: 'admin', // Auto-promote for development ease
              passwordHash: 'firebase_managed',
              institutionId: 1, // Default
              tenantId: 1, // Default
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }).returning();

            console.log(`[rbac] JIT Provisioning success: Created user ID ${newUser[0].id}`);
            return newUser[0];
          } catch (e) {
            console.error(`[rbac] JIT Provisioning failed:`, e);
            return null;
          }
        }
      }
    } else {
      console.log(`[rbac] Cookie verification failed (sessionUser is null)`);
    }
  }

  // 2. Legacy/Dev Header Auth (Fallback)
  if (!userId && process.env.NODE_ENV !== 'production') {
    userId = '1';
  }

  if (!userId) {
    console.warn(`[authorizeByPermission] No userId found via Cookie or Header for ${req.url}`);
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, parseInt(userId)));

  if (!user) {
    console.warn(`[authorizeByPermission] User with ID ${userId} not found in SQL database. Ensure seeding or migration is correct.`);
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