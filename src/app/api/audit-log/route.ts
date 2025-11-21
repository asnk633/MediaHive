// src/app/api/audit-log/route.ts
// Audit log API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '../_lib/rbac';
import { db } from '@/db';
import { auditLog, users } from '@/db/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';

// GET /api/audit-log - Get audit logs
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can access audit logs
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeUserDetails = searchParams.get('includeUserDetails') === 'true';

    // Build query conditions
    const conditions = [];
    
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

    // Fetch audit logs
    let logsQuery = db
      .select()
      .from(auditLog)
      .orderBy(auditLog.timestamp, 'desc')
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      logsQuery = logsQuery.where(and(...conditions));
    }

    const logs = await logsQuery;

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
    let totalCountQuery = db.select({ count: count() }).from(auditLog);
    
    if (conditions.length > 0) {
      totalCountQuery = totalCountQuery.where(and(...conditions));
    }
    
    const [{ count: totalCount }] = await totalCountQuery;

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
    console.error('[GET /api/audit-log]', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// GET /api/audit-log/stats - Get audit log statistics
export async function GET_STATS(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can access audit logs
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week';
    const tenantId = searchParams.get('tenant') || 'all';

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

    // Build tenant condition
    const tenantCondition = tenantId !== 'all' ? eq(auditLog.tenantId, parseInt(tenantId)) : undefined;

    // Get action counts
    const actionCounts = await db
      .select({
        action: auditLog.action,
        count: count()
      })
      .from(auditLog)
      .where(and(
        tenantCondition,
        gte(auditLog.timestamp, startDate.toISOString())
      ))
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
      .where(and(
        tenantCondition,
        gte(auditLog.timestamp, startDate.toISOString())
      ))
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
      .where(and(
        tenantCondition,
        gte(auditLog.timestamp, startDate.toISOString())
      ))
      .groupBy(sql`DATE(${auditLog.timestamp})`)
      .orderBy(sql`date`);

    // Get top users
    const topUsers = await db
      .select({
        userId: auditLog.userId,
        count: count()
      })
      .from(auditLog)
      .where(and(
        tenantCondition,
        gte(auditLog.timestamp, startDate.toISOString())
      ))
      .groupBy(auditLog.userId)
      .orderBy(sql`count DESC`)
      .limit(10);

    // Fetch user details for top users
    if (topUsers.length > 0) {
      const userIds = topUsers.map(user => user.userId);
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
  } catch (error) {
    console.error('[GET /api/audit-log/stats]', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log statistics' },
      { status: 500 }
    );
  }
}

// POST /api/audit-log - Create an audit log entry (internal use)
export async function POST(req: NextRequest) {
  try {
    // This endpoint is for internal use only - not exposed to clients
    // In a real implementation, this would be called by server-side code
    
    const body = await req.json();
    const { userId, action, resourceType, resourceId, details, ipAddress, userAgent, tenantId } = body;

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
        tenantId: tenantId || null,
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