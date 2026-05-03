import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { getSupabaseFromRequest } from '@/lib/server-utils';
import { logAuditAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdminWithVerifiedEmail(request);

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(100)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: (users || []).map(u => ({ id: u.id, ...u })) });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await requireAdminWithVerifiedEmail(request);
    const { targetUserId, newRole } = await request.json();

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'targetUserId and newRole are required' }, { status: 400 });
    }

    const validRoles = ['guest', 'team', 'admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (error) throw error;

    logAuditAction(
      'ROLE_CHANGE',
      {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      },
      { id: targetUserId, collection: 'profiles', name: 'User' },
      { newRole }
    ).catch(e => console.error('Audit log failed', e));

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user role' }, { status: 403 });
  }
}
