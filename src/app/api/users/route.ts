import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { verifyUser } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const lastPathPart = pathParts[pathParts.length - 1]; // Get the last part of the path

    const db = adminDb;

    // Check if this is a specific user request (e.g., /api/users/uid)
    if (lastPathPart && lastPathPart !== 'users' && lastPathPart !== 'team' && lastPathPart !== 'admins') {
      // For fetching a single user, we need to verify the user is authenticated
      // and can only access their own profile or be an admin
      const user = await verifyUser(request);
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Users can only fetch their own profile, or admins can fetch any profile
      if (user.uid !== lastPathPart && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Cannot access other user\'s profile' }, { status: 403 });
      }

      const userDoc = await db.collection('users').doc(lastPathPart).get();

      if (!userDoc.exists) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userDoc.data();
      return Response.json({ user: { uid: userDoc.id, ...userData } });
    }
    // Handle team members route
    else if (lastPathPart === 'team') {
      // Check if user is authenticated and has admin privileges
      const user = await verifyUser(request);
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const usersSnapshot = await db.collection('users').get();
      const teamMembers = usersSnapshot.docs
        .map(doc => {
          const userData = doc.data();
          return {
            uid: doc.id,
            role: userData.role,
            name: userData.officialName || userData.name || userData.email || 'Unknown',
            email: userData.email,
            avatarUrl: userData.avatarUrl,
            photoURL: userData.photoURL
          };
        })
        .filter(user => user.role === 'team' || user.role === 'admin')
        .map(user => ({
          uid: user.uid,
          name: user.name,
          avatarUrl: user.avatarUrl,
          photoURL: user.photoURL
        }));

      return Response.json({ teamMembers });
    }
    // Handle admins route
    else if (lastPathPart === 'admins') {
      // Check if user is authenticated and has admin privileges
      await requireAdminWithVerifiedEmail(request);

      const usersSnapshot = await db.collection('users').get();
      const admins = usersSnapshot.docs
        .map(doc => {
          const userData = doc.data();
          return {
            uid: doc.id,
            role: userData.role,
            name: userData.officialName || userData.name || userData.email || 'Unknown',
            avatarUrl: userData.avatarUrl,
            photoURL: userData.photoURL
          };
        })
        .filter(user => user.role === 'admin')
        .map(user => ({
          uid: user.uid,
          name: user.name,
          avatarUrl: user.avatarUrl,
          photoURL: user.photoURL
        }));

      return Response.json({ admins });
    }
    // Default: fetch all users (admin only)
    else {
      // Check if user is authenticated and has admin privileges for fetching all users
      const decodedToken = await requireAdminWithVerifiedEmail(request);

      const usersSnapshot = await db.collection('users').get();
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      return Response.json({ users });
    }
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return Response.json({ error: error.message || 'Failed to fetch users' }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin privileges
    const decodedToken = await requireAdminWithVerifiedEmail(request);

    const { uid, ...data } = await request.json();

    if (!uid) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = adminDb;

    // Update the user in Firestore
    const userRef = db.collection('users').doc(uid);

    // Enforce XOR Affiliation Logic
    const { institutionId, departmentId } = data;

    // Logic: 
    // If BOTH are present -> Error
    // If neither is present -> Warning? Or allow for legacy?
    // Strict Mode: One must be present.
    // For now, we validate if they are explicitly being updated.

    if (institutionId && departmentId) {
      return Response.json({ error: 'User cannot be affiliated with both an Institution and a Department.' }, { status: 400 });
    }

    // If updating, ensure we clear the other one if needed.
    // However, the client should send null for the one being cleared.
    // If client sends { institutionId: 'xyz' }, we should probably set departmentId: null automatically?
    // Let's rely on client sending { institutionId: 'xyz', departmentId: null }.

    await userRef.update(data);

    return Response.json({ message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return Response.json({ error: error.message || 'Failed to update user' }, { status: 403 });
  }
}

// Additional route for fetching team members only
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if user is authenticated and has admin privileges for certain operations
    if (path.includes('/team') || path.includes('/admins')) {
      await requireAdminWithVerifiedEmail(request);
    } else {
      // For other operations, just require authentication
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return Response.json({ error: 'Missing authorization header' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];

      const { adminAuth } = await import('@/lib/firebase/server');
      const auth = adminAuth;
      const decodedToken = await auth.verifyIdToken(token);
      console.log('[AUTH AUDIT] Verified Token for UID:', decodedToken.uid, 'Project ID (aud):', decodedToken.aud);
    }

    const db = adminDb;

    // Handle team members route
    if (path.includes('/team')) {
      const usersSnapshot = await db.collection('users').get();
      const teamMembers = usersSnapshot.docs
        .map(doc => {
          const userData = doc.data();
          return {
            uid: doc.id,
            role: userData.role,
            name: userData.officialName || userData.name || userData.email || 'Unknown',
            email: userData.email,
            avatarUrl: userData.avatarUrl,
            photoURL: userData.photoURL
          };
        })
        .filter(user => user.role === 'team' || user.role === 'admin')
        .map(user => ({
          uid: user.uid,
          name: user.name,
          avatarUrl: user.avatarUrl,
          photoURL: user.photoURL
        }));

      return Response.json({ teamMembers });
    }

    // Handle admins route
    if (path.includes('/admins')) {
      const usersSnapshot = await db.collection('users').get();
      const admins = usersSnapshot.docs
        .map(doc => {
          const userData = doc.data();
          return {
            uid: doc.id,
            role: userData.role,
            name: userData.officialName || userData.name || userData.email || 'Unknown',
            avatarUrl: userData.avatarUrl,
            photoURL: userData.photoURL
          };
        })
        .filter(user => user.role === 'admin')
        .map(user => ({
          uid: user.uid,
          name: user.name,
          avatarUrl: user.avatarUrl,
          photoURL: user.photoURL
        }));

      return Response.json({ admins });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST request:', error);
    return Response.json({ error: error.message || 'Failed to process request' }, { status: 403 });
  }
}