import { NextResponse, NextRequest } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[API] /api/users/me Hit');

  try {
    const decoded = await verifyUser(req);
    if (!decoded) {
      console.log('[API] /api/users/me Unauthorized (verifyUser returned null)');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = decoded;
    console.log(`[API] /api/users/me Authorized for ${uid}`);

    const db = adminDb;
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      console.log(`[API] /api/users/me Creating new user record for ${uid}`);
      await userRef.set({
        uid: uid,
        email: decoded.email,
        createdAt: new Date(),
        role: 'guest'
      });

      // Return immediately
      return NextResponse.json({
        user: {
          uid,
          email: decoded.email,
          role: 'guest'
        }
      });
    }

    return NextResponse.json({ user: { uid, ...snap.data() } });
  } catch (error: any) {
    console.error('[API] /api/users/me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = adminDb;

    // Whitelist allowed fields
    const { avatarUrl, avatarUpdatedAt, ...otherFields } = body;
    const updates: any = {};
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (avatarUpdatedAt !== undefined) updates.avatarUpdatedAt = avatarUpdatedAt;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid updates provided' }, { status: 400 });
    }

    await db.collection('users').doc(decoded.uid).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
