import { supabase } from '@/lib/supabaseClient';

/**
 * Client-side helper to get the currently authenticated user.
 * Note: For server-side, use verifyUser from @/lib/verifyUser
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    return {
      id: user.id,
      uid: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      ...user.user_metadata
    };
  } catch (err) {
    console.error('[getCurrentUser] Error fetching user:', err);
    return null;
  }
}
