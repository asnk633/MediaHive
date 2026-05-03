// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // STUB: The 'public.files' table does not exist in the current Supabase schema.
        // Returning an empty array to prevent UI crashes. 
        // Migration to Supabase Storage or a new 'files' table is pending.
        console.warn('GET /api/files: public.files table is missing. Returning empty array.');

        return NextResponse.json({ files: [] });

    } catch (error: any) {
        console.error('GET /api/files error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
