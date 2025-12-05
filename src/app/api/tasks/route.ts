import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

// Helper to verify auth and role
async function verifyUser(request: Request) {
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : 'guest';
    return { uid: decoded.uid, role };
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Allow admin/team to create directly, guests to 'request' (which might be a different status or collection)
  // For now, we'll allow creation but force status to 'pending' for everyone, 
  // and maybe strictly check role if we want to block guests from creating 'working' tasks.

  const data = await request.json();

  if (user.role === 'guest') {
    // Guests can only create "requests"
    data.status = 'pending';
    data.isRequest = true;
  }

  const res = await admin.firestore().collection('tasks').add({
    ...data,
    createdBy: user.uid,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ id: res.id });
}

export async function PUT(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'admin' && user.role !== 'team') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await admin.firestore().collection('tasks').doc(id).update(data);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await admin.firestore().collection('tasks').doc(id).delete();
  return NextResponse.json({ success: true });
}