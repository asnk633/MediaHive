// @ts-nocheck
// src/app/api/audit-log/route.ts
// Audit log API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { getUserFromRequest } from '../_lib/auth';
import { db } from '@/db';
import { auditLog, users } from '@/db/schema';
import { eq, and, gte, lte, count, sql, desc } from 'drizzle-orm';

// GET /api/audit-log - Get audit logs
// GET /api/audit-log?stats=true - Get audit log statistics
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can access audit logs
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);

    // Check if this is a stats request
    if (searchParams.get('stats') === 'true') {
      const period = searchParams.get('period') || 'week';

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      }

      // Get action counts
      const actionCounts = await db
        .select({
          action: auditLog.action,
          count: count()
        })
        .from(auditLog)
        .where(gte(auditLog.timestamp, startDate.toISOString()))
        .groupBy(auditLog.action)
        .orderBy(sql`count DESC`)
        .limit(10);

      // Get resource type counts
      const resourceTypeCounts = await db
        .select({
          resourceType: auditLog.resourceType,
          count: count()
        })
        .from(auditLog)
        .where(gte(auditLog.timestamp, startDate.toISOString()))
        .groupBy(auditLog.resourceType)
        .orderBy(sql`count DESC`)
        .limit(10);

      // Get daily counts for the period
      const dailyCounts = await db
        .select({
          date: sql`DATE(${auditLog.timestamp})`.as('date'),
          count: count()
        })
        .from(auditLog)
        .where(gte(auditLog.timestamp, startDate.toISOString()))
        .groupBy(sql`DATE(${auditLog.timestamp})`)
        .orderBy(sql`date`);

      // Get top users
      const topUsers = await db
        .select({
          userId: auditLog.userId,
          count: count()
        })
        .from(auditLog)
        .where(gte(auditLog.timestamp, startDate.toISOString()))
        .groupBy(auditLog.userId)
        .orderBy(sql`count DESC`)
        .limit(10);

      // Fetch user details for top users
      if (topUsers.length > 0) {
        const userIds = topUsers.map((user: any) => user.userId);
        const userDetails = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName
          })
          .from(users)
          .where(sql`id IN (${sql.join(userIds, sql`, `)})`);

        // Add user details to top users
        topUsers.forEach(user => {
          const detail = userDetails.find(u => u.id === user.userId);
          (user as any).user = detail || { id: user.userId, email: 'Unknown', fullName: 'Unknown User' };
        });
      }

      return NextResponse.json(
        {
          actionCounts,
          resourceTypeCounts,
          dailyCounts,
          topUsers,
          period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        { status: 200 }
      );
    } else {
      // Regular audit log request
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const userId = searchParams.get('userId');
      const action = searchParams.get('action');
      const resourceType = searchParams.get('resourceType');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const includeUserDetails = searchParams.get('includeUserDetails') === 'true';

      // Get user for tenant isolation
      const authUser = await getUserFromRequest(req);
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Build query conditions
      const conditions = [];

      if (userId) {
        conditions.push(eq(auditLog.userId, parseInt(userId, 10)));
      }

      // Add tenant isolation
      conditions.push(eq(auditLog.tenantId, authUser.tenantId));

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

      // Fetch audit logs with all conditions applied at once
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
        const userIds = [...new Set(logs.map(log => log.userId))];

        // Fetch user details
        const userDetails = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            role: users.role
          })
          .from(users)
          .where(sql`id IN (${sql.join(userIds, sql`, `)})`);

        // Create a map for quick lookup
        const userMap = userDetails.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, typeof userDetails[0]>);

        // Add user details to logs
        logs.forEach(log => {
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
    }
  } catch (error) {
    console.error('[GET /api/audit-log]', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/audit-log - Create an audit log entry (internal use)
export async function POST(req: NextRequest) {
  try {
    // This endpoint is for internal use only - not exposed to clients
    // In a real implementation, this would be called by server-side code

    // Get user for tenant isolation
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action, resourceType, resourceId, details, ipAddress, userAgent } = body;

    // Validate required fields
    if (!userId || !action || !resourceType) {
      return NextResponse.json(
        { error: 'userId, action, and resourceType are required' },
        { status: 400 }
      );
    }

    // Create audit log entry
    const [log] = await db
      .insert(auditLog)
      .values({
        userId,
        action,
        resourceType,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        tenantId: authUser.tenantId, // Add tenant isolation
        timestamp: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      { log },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/audit-log]', error);
    return NextResponse.json(
      { error: 'Failed to create audit log entry' },
      { status: 500 }
    );
  }
}
