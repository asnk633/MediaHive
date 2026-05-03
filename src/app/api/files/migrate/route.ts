import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/files/migrate
 * @deprecated Legacy Firestore-to-Firestore migration script. 
 * Obsolete as the public.files table does not currently exist in Supabase.
 */
export async function POST(req: Request) {
    console.warn('[DEPRECATED] POST /api/files/migrate called.');
    return NextResponse.json({
        success: false,
        message: 'This migration endpoint is obsolete. File system is currently stubbed.',
        obsolete: true
    }, { status: 410 });
}
