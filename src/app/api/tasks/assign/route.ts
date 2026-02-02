
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';

// Configure for static export
export const dynamic = 'force-dynamic';

/**
 * POST /api/tasks/assign?id={taskId}
 * Assign task to user (admin only)
 * Body: { assignedToId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Both admins and team members can assign tasks
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json(
        { error: 'Only admins and team members can assign tasks' },
        { status: 403 }
      );
    }

    // Get task ID from query parameters
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }

    // Get task document
    const taskDoc = await firestore.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data()!;

    // Check if user has permission to assign to this task
    // Admins can assign any task
    // Team members can only assign their own tasks
    if (user.role === 'team') {
      const creatorId = taskData.createdBy?.uid || (typeof taskData.createdBy === 'string' ? taskData.createdBy : null);
      if (creatorId !== user.uid) {
        return NextResponse.json({ error: 'Team members can only assign their own tasks' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { assignedToId } = body;

    if (assignedToId !== null && typeof assignedToId !== 'string') {
      return NextResponse.json(
        { error: 'assignedToId must be a string or null' },
        { status: 400 }
      );
    }

    // Logic to toggle assignment (Add if not present, Remove if present)
    let currentAssignments = Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [];
    // Normalize current assignments to ensure they are objects
    currentAssignments = currentAssignments.map((a: any) => typeof a === 'string' ? { uid: a } : a);

    const isAssigned = currentAssignments.some((a: any) => a.uid === assignedToId);
    let newAssignments = [];

    if (isAssigned) {
      // Remove
      newAssignments = currentAssignments.filter((a: any) => a.uid !== assignedToId);
    } else {
      // Add
      const assignedUserName = body.assignedUserName || 'Unknown User';

      // Fetch user profile to get avatarUrl
      let avatarUrl = null;
      try {
        const userSnap = await firestore.collection('users').doc(assignedToId).get();
        if (userSnap.exists) {
          const u = userSnap.data();
          avatarUrl = u?.avatarUrl || u?.photoURL || null;
        }
      } catch (e) {
        console.warn('Failed to fetch user avatar for assignment:', e);
      }

      newAssignments = [...currentAssignments, { uid: assignedToId, name: assignedUserName, avatarUrl }];
    }

    const updateData: any = {
      assignedTo: newAssignments,
      // Update legacy field to the last assigned user or null
      assignedToId: newAssignments.length > 0 ? newAssignments[newAssignments.length - 1].uid : null,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        uid: user.uid,
        role: user.role
      }
    };

    await firestore.collection('tasks').doc(taskId).update(updateData);

    // Send notification only if ADDING a new assignment
    if (!isAssigned && assignedToId && taskData.createdBy) {
      // Validate createdBy safely before accessing uid
      const creatorId = taskData.createdBy.uid || (typeof taskData.createdBy === 'string' ? taskData.createdBy : null);

      if (creatorId && creatorId !== user.uid) {
        const assignedUserName = body.assignedUserName || 'Unknown User';
        try {
          // Notify Creator
          await ServerNotification.notifyTaskAssignedToCreator(
            taskId,
            taskData.title,
            creatorId,
            user.uid,
            assignedUserName
          );

          // Notify Assignee
          await ServerNotification.notifyTaskAssigned(
            taskId,
            taskData.title,
            assignedToId,
            user.uid
          );
        } catch (notifError) {
          console.error('Notification failed but assignment succeeded:', notifError);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/tasks/assign]', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}
