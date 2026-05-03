import { NextResponse, NextRequest } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Authoritative identity check (Allow missing profile for auto-creation)
    const decoded = await verifyUser(req, { strict: false });
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid, email } = decoded;
    const supabase = getSupabaseFromRequest(req);

    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
    }

    // 2. Fetch profile strictly from DB using the authenticated client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    let userData = profile;

    // 3. Auto-creation logic if profile is missing
    if (profileError || !profile) {
      console.log(`[API] Profile missing for ${uid}, attempting auto-creation...`);
      // Default to HQ institution if not found
      const { data: instData } = await supabase
        .from('institutions')
        .select('id')
        .eq('name', 'Thaiba Garden')
        .single();

      const newProfile = {
        id: uid,
        email: email || null,
        role: 'guest', // Default for new users
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
        // If creation fails, we return the decoded identity as a fallback
        return NextResponse.json({
          user: {
            uid,
            email,
            role: 'guest',
            name: email?.split('@')[0] || 'User'
          }
        });
      } else {
        userData = created;
      }
    }

    // 4. Return unified user object
    return NextResponse.json({
      user: {
        uid,
        email: email || userData.email,
        ...userData,
        // Ensure UI-friendly name exists
        name: userData.full_name || userData.official_name || email?.split('@')[0] || 'User'
      }
    });

  } catch (error: any) {
    console.error('[API] /api/users/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseFromRequest(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
  }

  try {
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

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', decoded.uid);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[API] /api/users/me PATCH Error:', error.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
