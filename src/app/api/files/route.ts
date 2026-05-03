import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { supabase } from '@/lib/supabaseClient';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId } = user; // verifyUser returns user object with tenantId
        const url = new URL(req.url);
        const institutionId = url.searchParams.get('institutionId');

        let query = supabase
            .from(TABLES.MEDIA)
            .select('*')
            .eq('tenant_id', tenantId);

        if (institutionId) {
            // Point 4: Deep-link protection. Backend must reject unauthorized institution access.
            if (user.role !== 'admin' && !user.allowed_institutions?.includes(institutionId)) {
                return NextResponse.json({ error: 'Forbidden: You do not have access to this workspace' }, { status: 403 });
            }
            query = query.eq('institution_id', institutionId);
        }

        const { data: files, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('GET /api/files error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ files: files || [] });

    } catch (error: any) {
        console.error('GET /api/files catch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
