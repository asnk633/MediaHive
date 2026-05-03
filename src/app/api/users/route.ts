import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * Fetches users with a limit. Admins only.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    // Auth Check: Admins only for listing users
    const adminUser = await requireAdminWithVerifiedEmail(request);

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, official_name, role, institution_id, department_id, status, created_at')
      .limit(safeLimit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const processedUsers = (users || []).map(u => ({
      uid: u.id,
      ...u,
      name: u.full_name || u.official_name || u.email?.split('@')[0] || 'Unknown'
    }));

    return NextResponse.json({ users: processedUsers });

  } catch (error: any) {
    console.error('[API] GET /api/users Error:', error);
    const status = error.message?.includes('Unauthorized') || error.message?.includes('Admin') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status });
  }
}

/**
 * PUT /api/users
 * Updates a user profile. Admins only.
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Verify Admin Access
    await requireAdminWithVerifiedEmail(request);

    const body = await request.json();
    const { uid, ...data } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    // 2. Logic: Handle HQ Auto-Assign for Departments
    let { institution_id, department_id } = data;

    if (department_id && !institution_id) {
      // If department_id is set but institution_id is missing, find HQ
      const { data: hqData } = await supabase
        .from('institutions')
        .select('id')
        .eq('name', 'Thaiba Garden HQ') // Standard HQ name
        .maybeSingle();

      if (hqData) {
        data.institution_id = hqData.id;
        console.log(`[UpdateUser] Auto-assigned HQ (${hqData.id}) to user ${uid}`);
      }
    }

    // 3. Update the profile
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', uid);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'User updated successfully' });

  } catch (error: any) {
    console.error('[API] PUT /api/users Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 403 });
  }
}

/**
 * POST /api/users
 * Placeholder or Error (Legacy compatibility)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed. Use GET/PUT or dedicated endpoints.' }, { status: 405 });
}
