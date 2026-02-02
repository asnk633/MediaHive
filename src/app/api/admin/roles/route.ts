import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Use the admin guard which checks both admin status and email verification
    const decodedToken = await requireAdminWithVerifiedEmail(request);

    const { targetUid, newRole } = await request.json();

    // Validate inputs
    if (!targetUid || !newRole) {
      return Response.json({
        error: 'targetUid and newRole are required'
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['guest', 'team', 'admin'];
    if (!validRoles.includes(newRole)) {
      return Response.json({
        error: `Role must be one of: ${validRoles.join(', ')}`
      }, { status: 400 });
    }

    const db = adminDb;

    // Create a batch write for atomic operation
    const batch = db.batch();

    // Update the user's role
    const userRef = db.collection('users').doc(targetUid);
    batch.update(userRef, {
      role: newRole,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Create audit log entry
    const auditLogRef = db.collection('audit_logs').doc();
    batch.set(auditLogRef, {
      action: 'ROLE_CHANGE',
      targetUserId: targetUid,
      oldRole: null, // Will be populated with previous role in a real implementation
      newRole,
      performedBy: decodedToken.uid, // Admin's UID
      timestamp: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || null,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    });

    // Commit the batch
    await batch.commit();

    return Response.json({
      message: 'Role updated successfully',
      success: true
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return Response.json({
      error: error.message || 'Failed to update user role'
    }, { status: 403 });
  }
}

// Optional: GET endpoint to fetch user roles for admin UI
export async function GET(request: NextRequest) {
  try {
    // Use the admin guard which checks both admin status and email verification
    const decodedToken = await requireAdminWithVerifiedEmail(request);

    const db = adminDb;

    // Fetch all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter out sensitive data before sending to client
    const filteredUsers = users.map(user => {
      const userData = user as any; // Type assertion since Firestore data is untyped
      return {
        id: user.id,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        displayName: userData.displayName || userData.fullName
      };
    });

    return Response.json({ users: filteredUsers });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return Response.json({
      error: error.message || 'Failed to fetch users'
    }, { status: 403 });
  }
}
