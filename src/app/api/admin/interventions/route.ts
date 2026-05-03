import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { adminInterventionNotes, users } from '@/db/schema';
import { authorizeByPermission } from '@/lib/auth-server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createInterventionSchema = z.object({
    userId: z.number(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    riskLevel: z.enum(['Low', 'Medium', 'High']),
    note: z.string().min(1),
    actionType: z.enum([
        'Observation',
        'Counselled',
        'Warning Issued',
        'Support Planned',
        'No Action Needed'
    ])
});

/**
 * POST /api/admin/interventions
 * Create a new intervention note
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 1. Authorization
        const authResult = await authorizeByPermission('write:intervention');
        if (!authResult.authorized || !authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const currentUser = authResult.user;

        // 2. Validation
        const body = await request.json();
        const result = createInterventionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.format() },
                { status: 400 }
            );
        }

        const { userId, period, riskLevel, note, actionType } = result.data;
        const db = await getDb();

        // 3. Check for existing note (One per period constraint)
        const existing = await db.select()
            .from(adminInterventionNotes)
            .where(
                and(
                    eq(adminInterventionNotes.userId, userId),
                    eq(adminInterventionNotes.period, period)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'An intervention note already exists for this period.' },
                { status: 409 }
            );
        }

        // 4. Create Note
        await db.insert(adminInterventionNotes).values({
            userId,
            period,
            riskLevelAtTime: riskLevel,
            note,
            actionType,
            created_by: currentUser.id,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: any) {
        console.error('Failed to create intervention:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
