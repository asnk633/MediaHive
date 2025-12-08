// src/app/api/admin/audit/route.ts
// Admin-only immutable audit log API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { getUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/db';
import { auditLog, users } from '@/db/schema';
import { eq, and, gte, lte, count, sql, desc, inArray } from 'drizzle-orm';

// GET /api/admin/audit - Get audit logs (admin-only, readonly)
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can access audit logs
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user for tenant isolation
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    conditions.push(eq(auditLog.tenantId, authUser.tenantId));

    if (userId) {
      conditions.push(eq(auditLog.userId, parseInt(userId, 10)));
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
      const userIds = [...new Set(logs.map((log: any) => log.userId))] as number[];

      // Fetch user details using inArray instead of sql template
      const userDetails = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role
        })
        .from(users)
        .where(inArray(users.id, userIds));

      // Create a map for quick lookup
      const userMap = userDetails.reduce((acc: Record<number, typeof userDetails[0]>, user: typeof userDetails[0]) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<number, typeof userDetails[0]>);

      // Add user details to logs
      logs.forEach((log: any) => {
        (log as any).user = userMap[log.userId] || null;
      });
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