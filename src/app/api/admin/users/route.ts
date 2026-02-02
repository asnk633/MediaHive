import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { logAuditAction } from '@/lib/audit';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use the admin guard which checks both admin status and email verification
    const decodedToken = await requireAdminWithVerifiedEmail(request);

    const db = adminDb;

    // Fetch users with safety limit (Admin should rely on search/pagination eventually, but hard cap for now)
    const usersSnapshot = await db.collection('users').limit(100).get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return Response.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return Response.json({ error: error.message || 'Failed to fetch users' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use the admin guard which checks both admin status and email verification
    const decodedToken = await requireAdminWithVerifiedEmail(request);

    const { targetUserId, newRole } = await request.json();

    if (!targetUserId || !newRole) {
      return Response.json({ error: 'targetUserId and newRole are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['guest', 'team', 'admin'];
    if (!validRoles.includes(newRole)) {
      return Response.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const db = adminDb;

    // Update the user's role
    const userRef = db.collection('users').doc(targetUserId);

    // Perform update
    await userRef.update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Log audit action asynchronously (fire-and-forget to not block response)
    // We already passed the guard so we know decodedToken.uid is safe
    const performedBy = decodedToken.uid;

    // We need to fetch the admin's extra details ideally, but verifyUser token has basic info.
    // For now, we use what we have.
    logAuditAction(
      'ROLE_CHANGE',
      {
        uid: performedBy,
        email: decodedToken.email,
        role: decodedToken.role,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      },
      { id: targetUserId, collection: 'users', name: 'User' },
      { newRole, oldRole: null } // ideally fetch old role before update if strict audit needed
    ).catch(e => console.error('Audit log failed', e));

    return Response.json({ message: 'Role updated successfully' });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return Response.json({ error: error.message || 'Failed to update user role' }, { status: 403 });
  }
}
