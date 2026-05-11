import { supabase } from '@/lib/supabaseClient';

/**
 * tenantContext
 * 
 * Standardized helper to resolve tenant and user context from the active session.
 * Throws a clear error if the session or tenant context is missing.
 * 
 * @returns {Promise<{ tenantId: string, userId: string, institutionId: string | null }>}
 */
export async function tenantContext(): Promise<{ tenantId: string, userId: string, institutionId: string | null }> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('[AUTH] session validation failed', error);
        throw new Error('Unauthorized: No active session');
    }
    if (!session) {
        // Silently throw so callers can handle unauthenticated state (e.g. public pages)
        throw new Error('Unauthorized: No active session');
    }

    // Extract tenant_id from JWT claims (app_metadata preferred for security)
    let tenantId = session.user?.app_metadata?.tenant_id || session.user?.user_metadata?.tenant_id;
    let institutionId = session.user?.user_metadata?.institution_id || session.user?.app_metadata?.institution_id;

    // Fallback: If missing from metadata, fetch from profiles table
    if (!tenantId || !institutionId) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('tenant_id, institution_id')
            .eq('id', session.user.id)
            .maybeSingle();
        
        if (profile) {
            if (!tenantId) tenantId = profile.tenant_id;
            if (!institutionId) institutionId = profile.institution_id;
        } else if (profileError) {
            console.error('[TENANT] Failed to fetch profile fallback:', profileError);
        }
    }

    if (!tenantId) {
        console.error('[TENANT] context missing for user', session.user.id);
        throw new Error('Unauthorized: Tenant context missing');
    }

    console.log(`[TENANT] context resolved: ${tenantId.slice(0, 8)}... (Inst: ${institutionId ? String(institutionId).slice(0, 8) : 'None'})`);

    return {
        tenantId: tenantId as string,
        userId: session.user.id,
        institutionId: institutionId as string | null
    };
}
