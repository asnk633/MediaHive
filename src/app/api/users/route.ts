import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // GUARDRAIL: Role-based filtering or specific ID is required to avoid full user base scans.
    // Use /admins or /team for dedicated lists, or ?role=XYZ query.
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty strings
    const lastPathPart = pathParts[pathParts.length - 1]; // Get the last part of the path

    const db = adminDb;

    // Check if this is a request for a specific ID (Legacy/Fallback handling)
    // In strict Next.js App Router, [id] should handle this, but preserving logic just in case.
    if (lastPathPart && !['users', 'team', 'admins'].includes(lastPathPart)) {
      // ... (Preserving legacy single-user fetch logic just in case)
      const user = await verifyUser(request);
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.uid !== lastPathPart && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const userDoc = await db.collection('users').doc(lastPathPart).get();
      if (!userDoc.exists) return Response.json({ error: 'User not found' }, { status: 404 });
      return Response.json({ user: { uid: userDoc.id, ...userDoc.data() } });
    }

    // --- OPTIMIZED LIST FETCH ---
    // Handles /api/users?role=...&limit=...

    // Auth Check
    const decodedToken = await requireAdminWithVerifiedEmail(request);

    // Parse Query
    const role = url.searchParams.get('role');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    // Cursor could be added here similar to Tasks API if needed, 
    // but users list is often smaller. Adding simplified limit logic first.
    const cursor = url.searchParams.get('cursor');

    let query: FirebaseFirestore.Query = db.collection('users');

    // Server-Side Filters (Index SAFE)
    if (role) {
      query = query.where('role', '==', role);
    }

    // Ordering needed for pagination
    // Default order by name? or created? Firestore docs are unordered by default.
    // Let's order by name or email if possible, but 'name' might be missing.
    // 'email' is usually present.
    // query = query.orderBy('email'); 

    // For now, simple limit without specific ordering (Firestore orders by ID? No, random/docID).
    // To support cursor, we need deterministic ordering.
    // query = query.orderBy(admin.firestore.FieldPath.documentId());

    // Applying Limit
    query = query.limit(safeLimit);

    const usersSnapshot = await query.get();

    const users = usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return {
        uid: doc.id,
        ...userData,
        name: userData.officialName || userData.name || userData.displayName || userData.email || 'Unknown'
      };
    });

    return Response.json({ users });

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

    // Enforce XOR Affiliation Logic (Modified for HQ Auto-Assign)
    let { institutionId, departmentId } = data;

    // Logic: 
    // If user is assigned to a Department (Unit), they MUST belong to an Institution for permissions to work.
    // We automatically assign them to "Thaiba Garden HQ" in this case.

    if (departmentId) {
      if (!institutionId) {
        // Auto-assign HQ
        const { ensureHeadquartersInstitution } = await import('@/lib/server-utils');
        const hqId = await ensureHeadquartersInstitution();

        // Mutate the data object to be saved
        data.institutionId = hqId;
        console.log(`[UpdateUser] Auto-assigned HQ (${hqId}) to user ${uid} because Department was set.`);
      }
      // If institutionId WAS provided along with departmentId, we allow it (e.g. maybe specific unit in specific inst?)
      // For now, we assume the "One or the other" UI means "Standard Inst" OR "HQ Unit".
    } else if (institutionId) {
      // If Institution is set, Department should be null (per current UI logic)
      // We ensure data.departmentId is null if not provided? 
      // The UI sends explicit null. We trust the UI or the partial update.
    }

    /* 
    // REMOVED: Strict XOR check. database now allows both if one is HQ.
    if (institutionId && departmentId) {
      return Response.json({ error: 'User cannot be affiliated with both an Institution and a Department.' }, { status: 400 });
    }
    */

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

    // Legacy route handling (team/admins) removed as they have dedicated route files.
    // Continue to main logic...

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST request:', error);
    return Response.json({ error: error.message || 'Failed to process request' }, { status: 403 });
  }
}
