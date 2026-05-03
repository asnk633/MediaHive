import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { getSupabaseFromRequest, verifyUser } from '@/lib/server/server-utils';
import { logAuditAction } from '@/lib/audit';
import { withTenant } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Tenant Security Guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      console.error(`[POST /api/admin/roles] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    const { targetUid, newRole } = await request.json();

    if (!targetUid || !newRole) {
      return NextResponse.json({ error: 'targetUid and newRole are required' }, { status: 400 });
    }

    const validRoles = ['guest', 'team', 'admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: `Role must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const supabase = await getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { error } = await withTenant(
      supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        }),
      tenantId
    )
      .eq('id', targetUid);

    if (error) throw error;

    logAuditAction(
      'ROLE_CHANGE',
      {
        uid: user.uid,
        email: user.email,
        role: user.role,
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
    const token = await requireAdminWithVerifiedEmail(request);
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Tenant Security Guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      console.error(`[GET /api/admin/roles] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    const supabase = await getSupabaseFromRequest(request);
    if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

    const { data: users, error } = await withTenant(
      supabase
        .from('profiles')
        .select('id, email, role, created_at, updated_at, full_name, official_name'),
      tenantId
    );

    if (error) throw error;

    const filteredUsers = (users || []).map((u: any) => ({
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

