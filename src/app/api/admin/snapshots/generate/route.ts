import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/lib/auth-server';
import { generateDailySnapshots } from '@/lib/snapshot.server';

/**
 * POST /api/admin/snapshots/generate
 * Manually trigger snapshot generation
 * Admin-only endpoint for testing and manual backfill
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Require admin permission
        const authResult = await authorizeByPermission('manage:users');
        if (!authResult.authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[API] Manual snapshot generation triggered');

        // Generate snapshots
        const result = await generateDailySnapshots();

        return NextResponse.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        console.error('[API] Snapshot generation failed:', error);
        return NextResponse.json(
            {
                error: 'Snapshot generation failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
