import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { getSupabaseFromRequest } from '@/lib/server-utils';
import { logAuditAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await requireAdminWithVerifiedEmail(request);
    const { targetUid, newRole } = await request.json();

    if (!targetUid || !newRole) {
      return NextResponse.json({ error: 'targetUid and newRole are required' }, { status: 400 });
    }

    const validRoles = ['guest', 'team', 'admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: `Role must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUid);

    if (error) throw error;

    logAuditAction(
      'ROLE_CHANGE',
      {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      },
      { id: targetUid, collection: 'profiles', name: 'User' },
      { newRole }
    ).catch(e => console.error('Audit log failed', e));

    return NextResponse.json({ message: 'Role updated successfully', success: true });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user role' }, { status: 403 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminWithVerifiedEmail(request);

    const supabase = getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, updated_at, full_name, official_name');

    if (error) throw error;

    const filteredUsers = (users || []).map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      updated_at: u.updated_at,
      displayName: u.full_name || u.official_name
    }));

    return NextResponse.json({ users: filteredUsers });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 403 });
  }
}

