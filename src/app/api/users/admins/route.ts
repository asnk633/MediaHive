import { NextResponse } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { db, tenantId } = await withTenant();

        const { data: adminsList, error } = await db
            .from('profiles')
            .select('id, role, full_name, official_name, email, avatar_url')
            .eq('tenant_id', tenantId)
            .eq('role', 'admin');

        if (error) return handleApiError('ADMINS_FETCH', error);

        const admins = (adminsList || []).map(profile => ({
            uid: profile.id,
            name: profile.full_name || profile.official_name || profile.email?.split('@')[0] || 'Admin',
            avatar_url: profile.avatar_url || null,
            photoURL: profile.avatar_url || null // Backward compatibility
        }));

        console.log(`[DB] query executed: fetched ${admins.length} admins`);
        return NextResponse.json({ admins });
    } catch (error: any) {
        return handleApiError('ADMINS_GET_ROUTE', error);
    }
}
