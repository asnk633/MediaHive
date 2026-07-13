import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TABLES } from '@/lib/dbTables';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const institution_id = searchParams.get('institution_id');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch verified profile role and institution from the database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, institution_id')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'member';
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    let instId = institution_id && isUuid(institution_id) ? institution_id : null;

    // Enforce isolation: standard users (non-admins) can only query their own institution
    if (userRole !== 'admin') {
      const userInstId = profile?.institution_id;
      instId = userInstId && isUuid(userInstId) ? userInstId : null;
      
      if (!instId) {
        return NextResponse.json({ error: 'Forbidden: No institution assigned' }, { status: 403 });
      }
    } else {
      // Admins: if no query param is explicitly requested, attempt fallback to their profile's institution
      if (!instId && profile?.institution_id && isUuid(profile.institution_id)) {
        instId = profile.institution_id;
      }
    }

    let query = supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select(`
        *,
        profiles:requested_by_id (id, full_name, avatar_url, department_id)
      `);

    if (instId) {
      query = query.eq('institution_id', instId);
    } else {
      console.warn('[LEAVE REQUESTS] No valid UUID for institution_id scope. Returning empty array in dev/fallback mode.');
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json([]);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('requested_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API/LeaveRequests] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  
  try {
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // For submissions (member)
    const { data, error } = await supabase
      .from(TABLES.LEAVE_REQUESTS)
      .insert([{
        ...body,
        requested_by_id: user.id,
        requested_by_name: user.user_metadata?.full_name || 'Unknown',
        institution_id: user.user_metadata?.institution_id,
        status: 'pending',
        requested_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API/LeaveRequests] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
