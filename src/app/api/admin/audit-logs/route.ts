import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/server';
import { requireVerifiedEmailForRoleChange } from '@/lib/emailVerificationGuard';

export async function POST(request: NextRequest) {
  try {
    // Use the email verification guard which checks both admin status and email verification
    const decodedToken = await requireVerifiedEmailForRoleChange(request);

    // The guard already verified admin status and email verification
    if (!decodedToken.isAdmin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse the request body
    const { targetUserId, newRole, oldRole } = await request.json();

    // Validate required fields
    if (!targetUserId || !newRole) {
      return Response.json({ error: 'targetUserId and newRole are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['guest', 'team', 'admin'];
    if (!validRoles.includes(newRole)) {
      return Response.json({ error: `Role must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    // Get Firestore instance
    const db = adminDb;

    // Get the current user document to verify it exists
    const userDocRef = db.collection('users').doc(targetUserId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return Response.json({ error: 'Target user does not exist' }, { status: 404 });
    }

    // Create a batch write for atomic operation
    const batch = db.batch();

    // Update the user's role
    batch.update(userDocRef, {
      role: newRole,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Create audit log entry
    const auditLogRef = db.collection('audit_logs').doc();
    batch.set(auditLogRef, {
      action: 'ROLE_CHANGE',
      targetUserId,
      oldRole: oldRole || userDoc.data()?.role, // Use provided oldRole or current role
      newRole,
      performedBy: decodedToken.uid, // Admin's UID
      timestamp: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || null,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    });

    // Commit the batch (atomic operation)
    await batch.commit();

    return Response.json({
      success: true,
      message: `Role updated to ${newRole} for user ${targetUserId}`,
      logId: auditLogRef.id
    });

  } catch (error: any) {
    console.error('Error updating role with audit log:', error);

    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    return Response.json({ error: 'Failed to update role with audit log' }, { status: 500 });
  }
}

// Additional endpoint to read audit logs
export async function GET(request: NextRequest) {
  try {
    // Use the email verification guard which checks both admin status and email verification
    const decodedToken = await requireVerifiedEmailForRoleChange(request);

    // The guard already verified admin status and email verification
    if (!decodedToken.isAdmin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get Firestore instance
    const db = adminDb;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const targetUserId = searchParams.get('targetUserId');
    const performedBy = searchParams.get('performedBy');

    // Get all audit logs (in a real app, you'd want to add pagination and filtering)
    const snapshot = await db.collection('audit_logs').orderBy('timestamp', 'desc').get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return Response.json({ auditLogs: logs });

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return Response.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}