import { supabase } from './supabaseClient';
import { TABLES } from './dbTables';

/**
 * selfHealUser
 * 
 * Ensures that an authenticated user has a corresponding record in the profiles table.
 * If missing, it auto-creates one with default values.
 */
export async function selfHealUser(userId: string, email?: string): Promise<boolean> {
  try {
    // 1. Check if profile exists
    const { data: profile, error: fetchError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('id', userId)
      .single();

    if (!fetchError && profile) {
      return true; // User exists, healthy
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[SelfHeal] Error checking user profile:', fetchError);
      return false;
    }

    // 2. Profile missing -> Auto-create
    console.warn(`[SelfHeal] 🧠 Profile missing for user ${userId}. Auto-creating...`);
    
    // We try to get tenant_id from user metadata if possible, otherwise it might stay null 
    // until the user is fully onboarded or assigned to a tenant.
    const { data: { user } } = await supabase.auth.getUser();
    const tenant_id = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id || null;

    const { error: insertError } = await supabase
      .from(TABLES.USERS)
      .insert([{
        id: userId,
        email: email || user?.email,
        full_name: user?.user_metadata?.full_name || 'New User',
        role: 'guest',
        status: 'active',
        tenant_id: tenant_id,
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('[SelfHeal] ❌ Failed to auto-create profile:', insertError);
      return false;
    }

    console.log(`[SelfHeal] ✅ Profile successfully created for user ${userId}`);
    return true;
  } catch (err) {
    console.error('[SelfHeal] ❌ Unexpected self-healing error:', err);
    return false;
  }
}
