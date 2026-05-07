import { NextResponse, NextRequest } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';
import { getSupabaseServerClient } from '@/lib/supabaseServerClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // We try withTenant first. If it fails, we might be a new user without a profile/tenant.
    let context;
    try {
      context = await withTenant();
    } catch (err: any) {
      // Fallback for auto-creation: get raw session
      const supabase = await getSupabaseServerClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const uid = session.user.id;
      const email = session.user.email;

      console.log(`[API] Profile context missing for ${uid}, attempting auto-creation...`);

      // Default to HQ institution if not found
      const { data: instData } = await supabase
        .from('institutions')
        .select('id')
        .eq('name', 'Thaiba Garden')
        .single();

      const newProfile = {
        id: uid,
        email: email || null,
        role: 'member',
        institution_id: instData?.id || null,
        created_at: new Date().toISOString()
      };

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('[API] Failed to auto-create profile:', createError.message);
        return NextResponse.json({
          user: {
            uid,
            email,
            role: 'member',
            name: email?.split('@')[0] || 'User'
          }
        });
      }

      return NextResponse.json({
        user: {
          uid: created.id,
          email: created.email,
          ...created,
          name: created.full_name || created.official_name || created.email?.split('@')[0] || 'User'
        }
      });
    }

    const { user, tenantId, db } = context;

    // Fetch full profile to ensure consistency
    const { data: profile, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) return handleApiError('ME_FETCH', error || new Error('Profile not found'));

    return NextResponse.json({
      user: {
        uid: user.id,
        email: user.email,
        ...profile,
        name: profile.full_name || profile.official_name || user.email?.split('@')[0] || 'User'
      }
    });

  } catch (error: any) {
    return handleApiError('ME_ROUTE', error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { db, tenantId, user } = await withTenant();
    const body = await req.json();

    // Whitelist allowed fields
    const { avatar_url, avatar_updated_at, avatar_drive_id } = body;
    const updates: any = {};
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (avatar_updated_at !== undefined) updates.avatar_updated_at = avatar_updated_at;
    if (avatar_drive_id !== undefined) updates.avatar_drive_id = avatar_drive_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid updates provided' }, { status: 400 });
    }

    const { error } = await db
      .from('profiles')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', user.id);

    if (error) return handleApiError('ME_UPDATE', error);

    console.log(`[DB] query executed: updated profile for user ${user.id}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return handleApiError('ME_PATCH_ROUTE', error);
  }
}
