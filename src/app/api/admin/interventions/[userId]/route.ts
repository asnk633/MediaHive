import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { adminInterventionNotes, users } from '@/db/schema';
import { verifyUser } from '@/lib/verifyUser';
import { withTenantDrizzle, validateTenant } from '@/lib/tenantQuery';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/admin/interventions/[userId]
 * Fetch intervention history for a user
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Authorization
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Tenant Security guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/admin/interventions] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const { userId: userIdParam } = await params;
        const userId = parseInt(userIdParam);

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // 2. Fetch Data
        const db = await getDb();

        const interventions = await db.select({
            id: adminInterventionNotes.id,
            period: adminInterventionNotes.period,
            riskLevelAtTime: adminInterventionNotes.riskLevelAtTime,
            note: adminInterventionNotes.note,
            actionType: adminInterventionNotes.actionType,
            created_at: adminInterventionNotes.created_at,
            adminName: users.fullName,
            adminAvatar: users.avatar_url
        })
            .from(adminInterventionNotes)
            .leftJoin(users, and(
                eq(adminInterventionNotes.created_by, users.id),
                withTenantDrizzle(users, tenantId)
            ))
            .where(and(
                eq(adminInterventionNotes.userId, userId),
                withTenantDrizzle(adminInterventionNotes, tenantId)
            ))
            .orderBy(desc(adminInterventionNotes.period));

        return NextResponse.json({ interventions });

    } catch (error: any) {
        console.error('Failed to fetch interventions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT() {
    return NextResponse.json({ error: 'Historical accountability records are immutable.' }, { status: 405 });
}

export async function PATCH() {
    return NextResponse.json({ error: 'Historical accountability records are immutable.' }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: 'Historical accountability records are immutable.' }, { status: 405 });
}
