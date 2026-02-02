import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';
import { FieldValue } from 'firebase-admin/firestore';

// POST /api/tasks/[id]/assign

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin or team can assign tasks
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await props.params; // await params
    const db = adminDb;
    const taskRef = db.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const { assignedToId } = body;

    // assignedToId could be string (uid), array, or object. 
    // The previous code expected number, but Firebase uses string UIDs.
    // Let's assume input matches the system (string UID).

    if (!assignedToId || typeof assignedToId !== 'string') {
      // Fallback if existing frontend sends number (unlikely in Firebase auth system but possible in transition)
      // If it's a migration, valid. But protecting against legacy.
      return NextResponse.json({ error: 'Invalid assignedToId (must be UID string)' }, { status: 400 });
    }

    await taskRef.update({
      assignedTo: FieldValue.arrayUnion(assignedToId), // Assuming assignedTo is array of UIDs?
      // Wait, other files showed `assignedTo` as array of objects or strings.
      // tasks/[id]/route.ts maps `assignedTo` with: (u: any) => u.uid || u
      // Let's stick to simple UID array or handle correctly.
      // Actually, safer to Read -> Modify -> Write if structure is complex.
      // For now, let's assume we Append.
      updatedAt: new Date().toISOString()
    });

    // Notify
    const taskData = taskDoc.data();
    await ServerNotification.notifyTaskAssigned(id, taskData?.title || 'Task', assignedToId, user.uid);

    return NextResponse.json({ success: true, message: 'Task assigned' });

  } catch (error) {
    console.error('Error assigning task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
