import { NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';
import { logServerActivity } from '@/lib/server/activity-logger';

// Dynamic route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const docSnap = await firestore.collection('tasks').doc(id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("GET task error", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const data = await request.json();

    // Fetch current task for comparison and permission check
    const taskRef = firestore.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const currentTask = taskDoc.data() || {};

    // PERMISSION CHECK
    // 1. Admin/Team roles can always edit
    const hasRolePermission = user.role === 'admin' || user.role === 'team';

    // 2. Creator can always edit
    const isCreator = currentTask.createdBy === user.uid || (typeof currentTask.createdBy === 'object' && currentTask.createdBy.uid === user.uid);

    // 3. Assignees can always edit (explicitly allowed for status updates)
    const assignedArray = Array.isArray(currentTask.assignedTo) ? currentTask.assignedTo : [];
    const isAssignee = assignedArray.some((u: any) => {
      const uid = typeof u === 'string' ? u : u.uid;
      return uid === user.uid;
    });

    console.log(`[API Debug] Task Update Attempt: TaskId=${id}, User=${user.uid}, Role=${user.role}`);
    console.log(`[API Debug] Permissions: RolePerm=${hasRolePermission}, IsCreator=${isCreator}, IsAssignee=${isAssignee}`);
    console.log(`[API Debug] Assignees: ${JSON.stringify(assignedArray)}`);

    if (!hasRolePermission && !isCreator && !isAssignee) {
      console.error(`[API] Forbidden access to task ${id}. User: ${user.uid}, Role: ${user.role}`);
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions (Debug: Role=' + user.role + ')' }, { status: 403 });
    }

    // Perform Update
    await taskRef.update({
      ...data,
      updatedAt: new Date().toISOString()
    });

    // --- NOTIFICATION LOGIC ---
    // 1. Status Changed (e.g. Pending -> Todo/Approved)
    if (data.status && data.status !== currentTask.status) {
      // Notify Creator if someone else changed it
      if (currentTask.createdBy && currentTask.createdBy !== user.uid) {
        let msg = `Task status updated to ${data.status}`;
        if (data.status === 'todo' && currentTask.status === 'pending') {
          msg = `Your task "${currentTask.title}" has been approved.`;
        } else if (data.status === 'done') {
          // Handled by notifyTaskCompleted usually, but good fallback
          msg = `Your task "${currentTask.title}" is completed.`;
        }

        // We don't have a generic "notifyUpdate" in ServerNotification yet, 
        // so we use 'create' directly or existing helper if it fits.
        // 'notifyTaskCompleted' fits 'done'. 
        // For approval, we can use a generic notification.

        if (data.status === 'done') {
          await ServerNotification.notifyTaskCompleted(id, currentTask.title, currentTask.createdBy, user.uid);
        } else {
          // Generic update notification
          // We can use 'priority_updated' type or just raw create if needed, 
          // but let's see if we can misuse 'task_assigned' or similar? No.
          // Best to use 'info' or 'task_update' if supported.
          // Looking at ServerNotification.ts, 'priority_updated' is specific.
          // Let's use `create` directly for now to be safe.
          await ServerNotification.create(currentTask.createdBy, {
            type: 'task_assigned', // Using valid enum type, title differentiates
            title: 'Task Status Updated',
            message: msg,
            entityType: 'task',
            entityId: id,
            actionUrl: `/tasks/view/${id}`,
            sourceUserId: user.uid,
            priority: 'medium'
          });
        }
      }
    }

    // 2. Task Assigned
    if (data.assignedTo && Array.isArray(data.assignedTo)) {
      const oldAssignees = new Set((currentTask.assignedTo || []).map((u: any) => typeof u === 'string' ? u : u.uid));
      const newAssignees = data.assignedTo.map((u: any) => typeof u === 'object' ? u.uid : u);

      const addedAssignees = newAssignees.filter((uid: string) => !oldAssignees.has(uid));

      if (addedAssignees.length > 0) {
        // Notify Assignees
        for (const assigneeId of addedAssignees) {
          if (assigneeId) {
            await ServerNotification.notifyTaskAssigned(id, currentTask.title || 'Untitled Task', assigneeId, user.uid);
          }
        }

        // Notify Creator ("Your task assigned to X")
        // Robust UID extraction
        const creatorUid = typeof currentTask.createdBy === 'object' ? currentTask.createdBy.uid : currentTask.createdBy;


        if (creatorUid && creatorUid !== user.uid) {
          const nameStr = addedAssignees.length === 1 ? "a team member" : `${addedAssignees.length} team members`;
          await ServerNotification.notifyTaskAssignedToCreator(id, currentTask.title || 'Untitled Task', creatorUid, user.uid, nameStr);
        }
      }

      await logServerActivity({
        type: 'task_assigned',
        entityType: 'task',
        entityId: id,
        title: `Task Assigned: ${data.assignedTo.length} users`,
        performedBy: user.name || 'Unknown',
        performedByRole: user.role || 'admin',
        metadata: {
          addedAssignees
        }
      });
    }

    if (data.status && data.status !== currentTask.status) {
      await logServerActivity({
        type: data.status === 'done' ? 'task_completed' : 'task_status_change',
        entityType: 'task',
        entityId: id,
        title: `Task Status: ${data.status}`,
        performedBy: user.name || 'Unknown',
        performedByRole: user.role || 'admin',
        metadata: {
          oldStatus: currentTask.status,
          newStatus: data.status
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("PATCH task error", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    // Fetch title before delete for log
    const docSnap = await firestore.collection('tasks').doc(id).get();
    const taskTitle = docSnap.exists ? docSnap.data()?.title : 'Unknown Task';

    await firestore.collection('tasks').doc(id).delete();

    await logServerActivity({
      type: 'task_deleted',
      entityType: 'task',
      entityId: id,
      title: `Task Deleted: ${taskTitle}`,
      performedBy: user.name || 'Unknown',
      performedByRole: user.role || 'admin'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE task error", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}