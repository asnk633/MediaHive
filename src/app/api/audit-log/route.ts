import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, authorizeByPermission } from '@/lib/server/server-utils';
import { getDb } from '@/db';
import { auditLog, users, tenants } from '@/db/schema';
import { eq, and, gte, lte, count, sql, desc, inArray } from 'drizzle-orm';
import { withTenantDrizzle } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Initialize Database
    const db = await getDb();

    // 2. Authorize user for tenant isolation
    const authUser = await verifyUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Map Supabase User to Local User (Integer IDs)
    // The audit_log table and others in SQLite use integer IDs for performance and consistency.
    // However, authUser.tenant_id/uid are UUIDs from Supabase.
    // We lookup the local tenant and user based on email.
    const [localUser] = await db
      .select({
        id: users.id,
        tenantId: users.tenantId
      })
      .from(users)
      .where(eq(users.email, authUser.email as string))
      .limit(1);

    // Fallback/Validation for Tenant Context
    // If localUser is found, use its tenantId (integer).
    // Otherwise fallback to 1 (default tenant) for local dev/initial setup.
    const localTenantId = localUser?.tenantId || 1;
    const localUserId = localUser?.id;

    // RBAC Check - only admin can access audit logs
    const { authorized } = await authorizeByPermission(req, 'manage:users');
    if (!authorized) {
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
        .where(
          and(
            gte(auditLog.createdAt, startDate.toISOString()),
            eq(auditLog.tenantId, localTenantId)
          )
        )
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
        .where(
          and(
            gte(auditLog.createdAt, startDate.toISOString()),
            eq(auditLog.tenantId, localTenantId)
          )
        )
        .groupBy(auditLog.resourceType)
        .orderBy(sql`count DESC`)
        .limit(10);

      // Get daily counts for the period
      const dailyCounts = await db
        .select({
          date: sql`DATE(${auditLog.createdAt})`.as('date'),
          count: count()
        })
        .from(auditLog)
        .where(
          and(
            gte(auditLog.createdAt, startDate.toISOString()),
            eq(auditLog.tenantId, localTenantId)
          )
        )
        .groupBy(sql`DATE(${auditLog.createdAt})`)
        .orderBy(sql`date`);

      // Get top users
      const topUsers = await db
        .select({
          userId: auditLog.userId,
          count: count()
        })
        .from(auditLog)
        .where(
          and(
            gte(auditLog.createdAt, startDate.toISOString()),
            eq(auditLog.tenantId, localTenantId)
          )
        )
        .groupBy(auditLog.userId)
        .orderBy(sql`count DESC`)
        .limit(10);

      // Fetch user details for top users
      const uIds = topUsers.map((u: any) => u.userId).filter(Boolean);
      if (uIds.length > 0) {
        const userDetails = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName
          })
          .from(users)
          .where(inArray(users.id, uIds as number[]));

        topUsers.forEach((user: any) => {
          const detail = userDetails.find((u: any) => u.id === user.userId);
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
    }

    // Regular audit log request
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const userIdFilter = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeUserDetails = searchParams.get('includeUserDetails') === 'true';

    const conditions = [];
    if (userIdFilter) conditions.push(eq(auditLog.userId, userIdFilter));
    
    // Always enforce tenant isolation
    conditions.push(eq(auditLog.tenantId, localTenantId));
    
    if (action) conditions.push(eq(auditLog.action, action));
    if (resourceType) conditions.push(eq(auditLog.resourceType, resourceType));
    if (startDate) conditions.push(gte(auditLog.createdAt, startDate));
    if (endDate) conditions.push(lte(auditLog.createdAt, endDate));

    const offset = (page - 1) * limit;
    const logs = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    if (includeUserDetails && logs.length > 0) {
      const uIds = [...new Set(logs.map((log: any) => log.userId))]
        .filter((id): id is number => id !== null && id !== undefined);

      if (uIds.length > 0) {
        const userDetails = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            role: users.role
          })
          .from(users)
          .where(inArray(users.id, uIds));

        const userMap = userDetails.reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);

        logs.forEach((log: any) => {
          (log as any).user = userMap[log.userId as number] || null;
        });
      }
    }

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
  } catch (error: any) {
    console.error('[GET /api/audit-log] ❌ Critical Error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch audit logs', 
        details: error?.message || 'Database connection error or schema mismatch'
      },
      { status: 500 }
    );
  }
}

// POST /api/audit-log - Create an audit log entry (internal use)
export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const authUser = await verifyUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Map to local user context
    const [localUser] = await db
      .select({
        id: users.id,
        tenantId: users.tenantId
      })
      .from(users)
      .where(eq(users.email, authUser.email as string))
      .limit(1);

    const localTenantId = localUser?.tenantId || 1;
    const localUserId = localUser?.id;

    const body = await req.json();
    const { action, resourceType, resourceId, details, ipAddress, userAgent } = body;

    if (!action || !resourceType) {
      return NextResponse.json(
        { error: 'action and resourceType are required' },
        { status: 400 }
      );
    }

    const [log] = await db
      .insert(auditLog)
      .values({
        userId: localUserId || null,
        action,
        resourceType,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        tenantId: localTenantId,
        createdAt: new Date().toISOString(),
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
