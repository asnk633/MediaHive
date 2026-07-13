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

    // 2. Extract Tenant context from JWT (app_metadata ONLY)
    let tenantId = session.user?.app_metadata?.tenant_id;
    let role = session.user?.app_metadata?.role;

    // 🧠 FALLBACK: If missing in JWT, check DB (essential for initial sync or local dev)
    if (!tenantId || !role) {
        console.log(`[DB] 🕵️ Context missing in JWT for ${session.user.id}, re-syncing from DB profiles...`);
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', session.user.id)
            .single();
        
        if (profile) {
            tenantId = tenantId || profile.tenant_id;
            role = role || profile.role;
        }
    }

    if (!tenantId) {
        console.error('[DB] ❌ Unauthorized: Tenant context missing for user', session.user.id);
        throw new Error('Unauthorized: Tenant context missing');
    }

    // 3. Create a merged user object with verified metadata
    const mergedUser = {
        ...session.user,
        app_metadata: {
            ...session.user.app_metadata,
            tenant_id: tenantId,
            role: role
        }
    };

    console.log(`[DB] ✅ Context established: Tenant ${String(tenantId).slice(0, 8)}..., Role ${role} for user ${String(session.user?.id).slice(0, 8)}...`);

    return {
        db: supabase,
        tenantId: tenantId as string,
        user: mergedUser
    };
}

/**
 * handleApiError
 * 
 * Standardized error handler for tenant-aware API routes.
 */
export function handleApiError(context: string, error: any) {
    console.error(`[DB] ❌ ${context} Error:`, JSON.stringify(error, null, 2));

    let status = 500;
    let safeMessage = 'Internal Server Error';

    if (error.code === 'PGRST116') {
        status = 404;
        safeMessage = 'Resource not found';
    } else if (error.message?.includes('Unauthorized') || error.message?.includes('Authentication required')) {
        status = 401;
        safeMessage = 'Authentication required';
    } else if (error.message?.includes('Forbidden') || error.message?.includes('Permission denied')) {
        status = 403;
        safeMessage = 'Access denied';
    }

    return NextResponse.json({
        error: safeMessage,
        context: process.env.NODE_ENV !== 'production' ? context : undefined
    }, {
        status
    });
}
