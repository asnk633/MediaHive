import { NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin';

// Helper to verify auth and role (reused logic, ideally shared)
async function verifyAdmin(request: Request) {
    const { auth, firestore } = await getHelper();
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return null;

    try {
        const decoded = await auth.verifyIdToken(token);
        const userDoc = await firestore.collection('users').doc(decoded.uid).get();
        const role = userDoc.exists ? userDoc.data()?.role : 'guest';

        // Check if user is admin
        if (role !== 'admin') return null;

        return { uid: decoded.uid, role };
    } catch (e) {
        return null;
    }
}

async function getHelper() {
    const app = getFirebaseAdminApp();
    const auth = app.auth();
    const firestore = app.firestore();
    return { auth, firestore };
}

export async function GET(request: Request) {
    const { auth, firestore } = await getHelper();

    // Verify Admin
    // const requester = await verifyAdmin(request);
    // if (!requester) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        // 1. List all users from Auth (limit 100 for now)
        const listUsersResult = await auth.listUsers(100);
        const users = listUsersResult.users.map((u: any) => ({
            uid: u.uid,
            email: u.email,
            name: u.displayName,
            photoURL: u.photoURL,
            lastSignInTime: u.metadata.lastSignInTime,
            creationTime: u.metadata.creationTime,
        }));

        // 2. Fetch roles from Firestore for these users
        // We can do a getAll or individual fetches. For <100, getAll is okay-ish or map.
        // Better: Query 'users' collection.
        const userDocs = await firestore.collection('users').get();
        const roleMap: Record<string, string> = {};
        userDocs.forEach((doc: any) => {
            roleMap[doc.id] = doc.data().role;
        });

        // 3. Merge
        const merged = users.map((u: any) => ({
            ...u,
            role: roleMap[u.uid] || 'guest' // Default to guest if no record
        }));

        return NextResponse.json({ users: merged });
    } catch (error) {
        console.error('List users error', error);
        return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { firestore } = await getHelper();

    // Verify Admin
    // const requester = await verifyAdmin(request);
    // if (!requester) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { uid, role } = await request.json();

        if (!uid || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        if (!['admin', 'team', 'guest'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

        // Update Firestore
        await firestore.collection('users').doc(uid).set({ role }, { merge: true });

        return NextResponse.json({ success: true, uid, role });
    } catch (error) {
        console.error('Update role error', error);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}
