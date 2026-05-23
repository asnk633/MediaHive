import { supabase } from '@/lib/supabaseClient';
import { offlineDB } from '@/lib/offline/db';

/**
 * Client-side helper to get the currently authenticated user.
 * Note: For server-side, use verifyUser from @/lib/verifyUser
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    // Fetch profile for the full name to guarantee we get the real name
    let fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, name').eq('id', user.id).single();
      if (profile) {
        fullName = profile.full_name || (profile as any).name || fullName;
      }
    } catch (e) {
      // Fallback to offline cache
      try {
        const cached = await offlineDB.getProfile(user.id) as any;
        if (cached) {
          fullName = cached.full_name || cached.name || fullName;
        }
      } catch (cacheErr) {}
    }
    
    return {
      id: user.id,
      uid: user.id,
      email: user.email,
      full_name: fullName,
      ...user.user_metadata
    };
  } catch (err) {
    console.error('[getCurrentUser] Error fetching user:', err);
    return null;
  }
}
