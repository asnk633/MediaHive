// src/app/api/admin/audit/route.ts
// Admin-only immutable audit log API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { getUserFromRequest } from '@/app/api/_lib/auth';
import { getDb } from '@/db';
import { auditLog, users } from '@/db/schema';
import { eq, and, gte, lte, count, sql, desc, inArray } from 'drizzle-orm';

// Configure for dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/audit - Get audit logs (admin-only, readonly)
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can access audit logs
    const user = await authorizeByPermission(req, 'read:audit_log');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user for tenant isolation
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Cap at 100
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeUserDetails = searchParams.get('includeUserDetails') === 'true';

    // Build query conditions
    const conditions: any[] = [];

    // Add tenant isolation
    // Use the DB user (user) which is fresher than the session token (authUser)
    if (user.tenantId) {
      conditions.push(eq(auditLog.tenantId, user.tenantId));
    } else {
      // Fallback or Super Admin: show everything or default to 1?
      // For now, let's assume default tenant 1 if not specified
      conditions.push(eq(auditLog.tenantId, 1));
    }

    if (userId) {
      conditions.push(eq(auditLog.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLog.action, action));
    }

    if (resourceType) {
      conditions.push(eq(auditLog.resourceType, resourceType));
    }

    if (startDate) {
      conditions.push(gte(auditLog.timestamp, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditLog.timestamp, endDate));
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch audit logs with all conditions applied
    const logs = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.timestamp))
      .limit(limit)
      .offset(offset);

    // If requested, include user details
    if (includeUserDetails && logs.length > 0) {
      // Get unique user IDs
      const userIds = [...new Set(logs.map((log: any) => log.userId))];

      try {
        const { adminAuth } = await import('@/lib/firebase/server');
        const auth = adminAuth;

        // Fetch users from Firebase (max 100 per batch, matched by logs limit)
        const userRecords = await auth.getUsers(
          userIds.map(uid => ({ uid: String(uid) }))
        );

        // Create a map for quick lookup
        const userMap: Record<string, any> = {};
        userRecords.users.forEach(u => {
          userMap[u.uid] = {
            id: u.uid,
            email: u.email,
            fullName: u.displayName || u.email || 'Unknown User',
            role: 'user' // We don't know the role from Auth alone, but display doesn't strictly need it
          };
        });

        // Add user details to logs
        logs.forEach((log: any) => {
          (log as any).user = userMap[log.userId] || null;
        });
      } catch (err) {
        console.error('Failed to resolve Firebase users for audit log:', err);
        // logs will implicitly have user: null
      }
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json(
      {
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/admin/audit]', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST method is not allowed - this is a readonly endpoint
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// PUT method is not allowed - this is a readonly endpoint
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// DELETE method is not allowed - this is a readonly endpoint
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
