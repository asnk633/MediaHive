import { getSupabaseServerClient } from '@/lib/supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * withTenant
 * 
 * Centralized helper for tenant-aware database access in API routes.
 * Extracts tenant context from the session JWT and returns a scoped client.
 */
export async function withTenant() {
    const supabase = await getSupabaseServerClient();

    // 1. Get Session for JWT claims
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('[DB] ❌ Unauthorized: No session found');
        throw new Error('Unauthorized: Authentication required');
    }

    // 2. Extract Tenant ID from JWT (app_metadata or user_metadata)
    // Preference: app_metadata (synced from DB) > user_metadata (session sync)
    const tenantId = session.user?.app_metadata?.tenant_id || session.user?.user_metadata?.tenant_id;

    if (!tenantId) {
        console.error('[DB] ❌ Unauthorized: Tenant context missing for user', session.user.id);
        throw new Error('Unauthorized: Tenant context missing');
    }

    console.log(`[DB] ✅ Tenant context established: ${tenantId.slice(0, 8)}... for user ${session.user.id.slice(0, 8)}...`);

    return {
        db: supabase,
        tenantId: tenantId as string,
        user: session.user
    };
}

/**
 * handleApiError
 * 
 * Standardized error handler for tenant-aware API routes.
 */
export function handleApiError(context: string, error: any) {
    console.error(`[DB] ❌ ${context} Error:`, JSON.stringify(error, null, 2));

    return NextResponse.json({
        error: error.message || 'Internal Server Error',
        context,
        code: error.code
    }, {
        status: error.code === 'PGRST116' ? 404 : 500
    });
}
