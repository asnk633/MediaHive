// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { getSupabaseFromRequest } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const showArchived = url.searchParams.get('archived') === 'true';

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    let query = supabase.from('institutions').select('*');
    if (!showArchived) {
      query = query.eq('status', 'active');
    }

    const { data: institutions, error } = await query;
    if (error) throw error;

    return NextResponse.json({ institutions });
  } catch (error: any) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch institutions' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWithVerifiedEmail(request);

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Institution name is required' }, { status: 400 });
    }

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const newInstitution = {
      name: name.trim(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('institutions')
      .insert(newInstitution)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error creating institution:', error);
    return NextResponse.json({ error: error.message || 'Failed to create institution' }, { status: 403 });
  }
}
