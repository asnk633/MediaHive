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

    if (error || !session) {
        console.error('[AUTH] session validation failed', error);
        throw new Error('Unauthorized: No active session');
    }

    // Extract tenant_id from JWT claims (app_metadata preferred for security)
    const tenantId = session.user?.app_metadata?.tenant_id || session.user?.user_metadata?.tenant_id;
    
    // Also try to get institution_id from metadata if possible
    let institutionId = session.user?.user_metadata?.institution_id || session.user?.app_metadata?.institution_id;

    if (!tenantId) {
        console.error('[TENANT] context missing for user', session.user.id);
        throw new Error('Unauthorized: Tenant context missing');
    }

    // If missing from metadata, we might need a quick profile check (cached)
    if (!institutionId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('institution_id')
            .eq('id', session.user.id)
            .maybeSingle();
        
        if (profile) {
            institutionId = profile.institution_id;
        }
    }

    console.log(`[TENANT] context resolved: ${tenantId.slice(0, 8)}... (Inst: ${institutionId ? institutionId.slice(0, 8) : 'None'})`);

    return {
        tenantId: tenantId as string,
        userId: session.user.id,
        institutionId: institutionId as string | null
    };
}
