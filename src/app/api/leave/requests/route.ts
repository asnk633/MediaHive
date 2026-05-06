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

    const instId = institution_id || user.user_metadata?.institution_id;

    let query = supabase
      .from(TABLES.LEAVE_REQUESTS)
      .select(`
        *,
        profiles:requested_by_id (id, full_name, avatar_url, department_id)
      `)
      .eq('institution_id', instId);

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
