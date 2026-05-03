// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { getDriveClient } from '@/lib/drive';
import { logFileDeleted } from '@/app/api/_lib/audit';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // STUB: public.files table is missing.
        console.warn(`GET /api/files/${id}: public.files table missing. Returning 404.`);
        return NextResponse.json({ error: 'File not found (Migration Pending)' }, { status: 404 });

    } catch (error: any) {
        console.error('GET /api/files/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // STUB: Action cannot be performed without the files table, but we return 200 to avoid UI crash loops.
        console.warn(`DELETE /api/files/${id}: public.files table missing. Stubbing success.`);
        return NextResponse.json({ success: true, id, message: 'Stubbed Delete' });

    } catch (error: any) {
        console.error('DELETE /api/files/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
