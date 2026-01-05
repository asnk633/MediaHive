import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { verifyUser } from '@/lib/server-utils';
import { verifyIdempotency } from '@/lib/idempotency';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const user = await verifyUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const taskId = url.pathname.split('/').pop(); // Get the last part of the path for individual task

    const db = adminDb;

    if (taskId && taskId !== 'tasks') {
      // Fetch individual task by ID
      const taskDoc = await db.collection('tasks').doc(taskId).get();

      if (!taskDoc.exists) {
        return Response.json({ error: 'Task not found' }, { status: 404 });
      }

      const taskData = taskDoc.data();
      return Response.json({ task: { id: taskDoc.id, ...taskData } });
    } else {

      // Fetch all tasks
      let query = db.collection('tasks').orderBy('createdAt', 'desc');
      const tasksSnapshot = await query.get();

      let tasks: any[] = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply filters in-memory (to avoid Firestore index requirements for now)
      const createdBy = url.searchParams.get('createdBy');
      if (createdBy) {
        tasks = tasks.filter((task: any) => task.createdBy?.uid === createdBy);
      }


      return Response.json({ tasks });
    }
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return Response.json({ error: error.message || 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only authenticated users can create tasks
    const user = await verifyUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Idempotency
    const idempotencyResponse = await verifyIdempotency(request);
    if (idempotencyResponse) return idempotencyResponse;

    const taskData = await request.json();

    const db = adminDb;
    const tags = taskData.tags || [];

    // If attached to a campaign, ensure campaign exists and add its name as a tag
    if (taskData.campaignId) {
      const campSnap = await db.collection('campaigns').doc(taskData.campaignId).get();
      if (campSnap.exists) {
        const campName = campSnap.data()?.name;
        if (campName && !tags.includes(campName)) {
          tags.push(campName);
        }
      }
    }

    // Determine Creator (Self or On Behalf Of)
    let createdBy = {
      uid: user.uid,
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      role: user.role
    };

    let meta: any = {};

    // Handle "On Behalf Of" for Admin/Team
    if (taskData.onBehalfOf && (user.role === 'admin' || user.role === 'team')) {
      const { id, name, type } = taskData.onBehalfOf;
      if (name && (type === 'department' || type === 'institution')) {
        // Synthetic Identity
        createdBy = {
          uid: `${type}_${id}`, // e.g. department_5
          name: name,
          role: type // 'department' or 'institution' as role
        };
        // Audit trail
        meta = {
          originalCreatorUid: user.uid,
          originalCreatorName: user.name || 'Unknown',
          delegatedCreation: true,
          delegatedAt: new Date().toISOString()
        };
      }
    }

    // Add the creator information
    const isGuest = user.role === 'guest';
    const newTask = {
      ...taskData,
      tags, // Include the enhanced tags list
      createdBy,
      meta: { ...(taskData.meta || {}), ...meta },
      // Guests require approval, others are auto-approved
      // If creating on behalf of Dept, assume it's approved (since Admin/Team did it)
      approvalStatus: isGuest ? 'pending' : 'approved',
      // Force status to pending for guests
      status: isGuest ? 'pending' : (taskData.status || 'todo'),
      institutionId: user.institutionId || '1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Clean up auxiliary fields not meant for DB
    delete (newTask as any).onBehalfOf;

    // db is already defined above
    // const db = getFirebaseAdminDb();

    // Add the task to Firestore
    const taskRef = await db.collection('tasks').add(newTask);

    // If Guest, notify Admins about pending approval
    if (isGuest) {
      try {
        const { ServerNotification } = await import('@/lib/server-notification');
        await ServerNotification.notifyTaskCreated(
          taskRef.id,
          newTask.title || 'Untitled Task',
          user.uid
        );
      } catch (e) {
        console.error('Failed to notify admins of guest task:', e);
      }
    }
    // If NOT Guest (or if guest assigned someone?), notify Assigneess
    // Logic: If I create a task and assign it to someone, they should know.
    else if (newTask.assignedTo && Array.isArray(newTask.assignedTo) && newTask.assignedTo.length > 0) {
      try {
        const { ServerNotification } = await import('@/lib/server-notification');
        // Filter out self-assignment to avoid spam? Usually yes.
        // Also handle object vs string structure of assignedTo
        const assigneeIds: string[] = newTask.assignedTo.map((u: any) =>
          typeof u === 'string' ? u : u.uid
        ).filter((uid: string) => uid && uid !== user.uid);

        if (assigneeIds.length > 0) {
          await ServerNotification.broadcast(assigneeIds, {
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned to task: "${newTask.title || 'Untitled'}"`,
            entityType: 'task',
            entityId: taskRef.id,
            actionUrl: `/tasks/view/${taskRef.id}`,
            sourceUserId: user.uid,
            priority: 'high'
          });
        }
      } catch (e) {
        console.error('Failed to notify assignees:', e);
      }
    }

    return Response.json({ id: taskRef.id, message: 'Task created successfully' });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return Response.json({ error: error.message || 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Only authenticated users can update tasks
    const user = await verifyUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Protect immutable fields
    delete (updateData as any).createdBy;
    delete (updateData as any).createdAt;
    delete (updateData as any).institutionId;

    const db = adminDb;

    // Get the existing task to check permissions
    const taskDoc = await db.collection('tasks').doc(id).get();
    if (!taskDoc.exists) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskDoc.data()!;

    // Check if user has permission to update this task
    // Users can update their own tasks, if they're an admin, OR if they are assigned to it.
    const isCreator = task && task.createdBy && task.createdBy.uid === user.uid;
    const isAdmin = user.role === 'admin' || user.role === 'team'; // Treating team as admin-like for editing, similar to expected behavior

    const assignedArray = Array.isArray(task.assignedTo) ? task.assignedTo : [];
    const isAssignee = assignedArray.some((u: any) => {
      const uid = typeof u === 'string' ? u : u.uid;
      return uid === user.uid;
    });

    console.log(`[API Debug] Task Update (Bulk/Main Route): TaskId=${id}, User=${user.uid}, Role=${user.role}`);
    console.log(`[API Debug] Permissions: IsAdmin=${isAdmin}, IsCreator=${isCreator}, IsAssignee=${isAssignee}`);

    if (!isCreator && !isAdmin && !isAssignee) {
      return Response.json({ error: 'Forbidden: Cannot update this task ' + `(Debug: Role=${user.role}, IsAssignee=${isAssignee})` }, { status: 403 });
    }

    // Add updatedBy and updatedAt fields
    const updatePayload: any = {
      ...updateData,
      updatedAt: new Date(),
      updatedBy: {
        uid: user.uid,
        role: user.role
      }
    };

    // Auto-approve if Admin updates a pending task (Guest Approval Workflow)
    if (isAdmin && task?.approvalStatus === 'pending') {
      updatePayload.approvalStatus = 'approved';
      // If the admin didn't explicitly set a status (or kept it as pending), move to 'todo'
      if (!updateData.status || updateData.status === 'pending') {
        updatePayload.status = 'todo';
      }

      // Optional: We could trigger a notification here to the Guest "Your task has been approved"
      // But the requirements said "verifying that all necessary notifications (Guest: Approved...)"
      // So we SHOULD trigger it.
      // Notify Guest that task is approved
      try {
        const { ServerNotification } = await import('@/lib/server-notification');
        if (task.createdBy?.uid) {
          await ServerNotification.create(task.createdBy.uid, {
            type: 'status_changed',
            title: 'Task Approved',
            message: `Your task "${task.title || 'Untitled'}" has been approved.`,
            entityType: 'task',
            entityId: id,
            actionUrl: `/tasks/view/${id}`,
            priority: 'medium',
            sourceUserId: user.uid
          });
        }
      } catch (e) {
        console.error('Failed to notify guest of approval:', e);
        // Non-blocking
      }
    }

    // --- NOTIFICATION LOGIC FOR NEW ASSIGNMENTS ---
    if (updateData.assignedTo && Array.isArray(updateData.assignedTo)) {
      try {
        const { ServerNotification } = await import('@/lib/server-notification');

        // Normalize IDs
        const currentAssigneeIds = (task.assignedTo || []).map((u: any) => typeof u === 'string' ? u : u.uid);
        const newAssigneeIds = updateData.assignedTo.map((u: any) => typeof u === 'string' ? u : u.uid);

        // Find ONLY newly added users
        const addedUserIds = newAssigneeIds.filter((uid: string) => !currentAssigneeIds.includes(uid) && uid !== user.uid);

        if (addedUserIds.length > 0) {
          await ServerNotification.broadcast(addedUserIds, {
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned to task: "${task.title || updateData.title || 'Untitled'}"`,
            entityType: 'task',
            entityId: id,
            actionUrl: `/tasks/view/${id}`,
            sourceUserId: user.uid,
            priority: 'high'
          });
        }
      } catch (e) {
        console.warn('Failed to notify new assignees:', e);
      }
    }

    // Update the task in Firestore
    const taskRef = db.collection('tasks').doc(id);
    await taskRef.update(updatePayload);

    return Response.json({ message: 'Task updated successfully' });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return Response.json({ error: error.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Only authenticated users can delete tasks
    const user = await verifyUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const taskId = url.searchParams.get('id');

    if (!taskId) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const db = adminDb;

    // Get the existing task to check permissions
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskDoc.data();

    // Check if user has permission to delete this task
    // Only admins can delete tasks
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Only admins can delete tasks' }, { status: 403 });
    }

    // Delete the task from Firestore
    await db.collection('tasks').doc(taskId).delete();

    return Response.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return Response.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}