import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';

export async function GET(req: Request) {
  const decoded = await verifyUser(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = adminDb;

  // THIS must be admin firestore
  const userRef = db.collection('users').doc(decoded.uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    await userRef.set({
      uid: decoded.uid,
      email: decoded.email,
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ user: (await userRef.get()).data() });
}

export async function PATCH(req: Request) {
  const decoded = await verifyUser(req);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = adminDb;

    // Whitelist allowed fields to prevent security issues
    // Only allow updating specific profile fields
    const { avatarUrl, avatarUpdatedAt, ...otherFields } = body;

    // Construct update object with only allowed fields
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
