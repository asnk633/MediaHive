import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { adminInterventionNotes, users } from '@/db/schema';
import { authorizeByPermission } from '@/lib/auth-server';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/interventions/[userId]
 * Fetch intervention history for a user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Authorization
        const authResult = await authorizeByPermission('read:reports');
        if (!authResult.authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
            createdAt: adminInterventionNotes.createdAt,
            adminName: users.fullName,
            adminAvatar: users.avatarUrl
        })
            .from(adminInterventionNotes)
            .leftJoin(users, eq(adminInterventionNotes.createdBy, users.id))
            .where(eq(adminInterventionNotes.userId, userId))
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
