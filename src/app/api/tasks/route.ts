import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { verifyIdempotency } from '@/lib/idempotency';
import { ServerNotification } from '@/lib/server-notification';
import { logSystemActivity } from '@/lib/server/activity-logger';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const db = adminDb;

    // Check if this is a request for a specific ID (Legacy/Fallback handling)
    // In strict Next.js App Router, [id] should handle this, but preserving logic just in case.
    const pathSegments = url.pathname.split('/');
    const lastSegment = pathSegments.pop();
    const isListRequest = lastSegment === 'tasks' || lastSegment === '';

    if (!isListRequest && lastSegment) {
      const taskDoc = await db.collection('tasks').doc(lastSegment).get();
      if (!taskDoc.exists) return Response.json({ error: 'Task not found' }, { status: 404 });
      return Response.json({ task: { id: taskDoc.id, ...taskDoc.data() } });
    }

    // --- OPTIMIZED LIST FETCH ---
    // GUARDRAIL: DO NOT REMOVE LIMIT CAP (100) OR UNBOUNDED READS WILL REGRESS COST
    // PATTERN: Server-side Filtering + Pagination required.

    // 1. Parse Query Parameters
    const limitParam = parseInt(url.searchParams.get('limit') || '20', 10);
    const safeLimit = Math.min(Math.max(limitParam, 1), 100); // Enforce 1-100 limit
    const cursor = url.searchParams.get('cursor'); // Pagination token

    // Filters
    const institutionId = url.searchParams.get('institutionId');
    const status = url.searchParams.get('status');
    const createdBy = url.searchParams.get('createdBy');
    // Note: assignedTo filter is complex (array of objects), skipping server-side for now to avoid schema dependency.

    // 2. Build Query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collection('tasks');

    // Mandatory Scoping (if provided)
    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }

    // Apply Filters
    const statuses = url.searchParams.getAll('status');
    if (statuses.length > 0) {
      // If multiple statuses, use 'in' operator (Max 10 per Firestore limit)
      // If single, use '=='
      if (statuses.length === 1) {
        query = query.where('status', '==', statuses[0]);
      } else {
        query = query.where('status', 'in', statuses.slice(0, 10));
      }
    }
    if (createdBy) {
      query = query.where('createdBy.uid', '==', createdBy);
    }

    // Ordering (Required for pagination)
    query = query.orderBy('createdAt', 'desc');

    // Cursor Pagination
    if (cursor) {
      try {
        // Expected cursor format: "ISOString" (since we order by createdAt)
        // For standard robust pagination, we just pass the value.
        // If sorting by multiple fields, we need multiple values.
        // Here we stick to simple 'createdAt' based cursor.
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          // Create a proper Timestamp object for Firestore
          // Note: We need the exact timestamp type. 
          // Since we use admin SDK, dates are usually converted to Timestamps.
          query = query.startAfter(cursorDate);
        }
      } catch (e) {
        console.warn('Invalid cursor format', e);
      }
    }

    // limiting (fetching one extra to detect next page)
    const snapshot = await query.limit(safeLimit + 1).get();

    // 3. Process Results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tasks = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    let nextPageToken = null;
    if (tasks.length > safeLimit) {
      const nextItem = tasks.pop(); // Remove the extra item
      // Use the last item of the valid set as the cursor
      const lastItem = tasks[tasks.length - 1];
      if (lastItem && lastItem.createdAt) {
        // Check if createdAt is a Firestore Timestamp or Date
        const dateVal = (lastItem.createdAt as any).toDate ? (lastItem.createdAt as any).toDate() : new Date(lastItem.createdAt);
        nextPageToken = dateVal.toISOString();
      }
    }

    return Response.json({
      tasks,
      meta: {
        limit: safeLimit,
        count: tasks.length,
        nextPageToken
      }
    });

  } catch (error: any) {
    console.error('Error fetching tasks internal:', error);
    // Helpful error for missing indexes
    if (error.code === 5 || error.message?.includes('index')) {
      console.error('MISSING INDEX:', error.details || error.message);
    }
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

    // Structure Resolution:
    // 1. Explicitly provided (e.g. from form)
    // 2. Fallback to User's Institution
    // 3. Fallback to global default (Config)
    // 4. REJECT if none
    const institutionId = taskData.institutionId || user.institutionId || process.env.DEFAULT_INSTITUTION_ID;

    // Integrity Check - NO FALLBACK TO '1'
    if (!institutionId) {
      return Response.json({ error: 'Structure Error: Missing institutionId. Please select an institution.' }, { status: 400 });
    }

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
      institutionId: institutionId,
      departmentId: taskData.departmentId || null, // Ensure explicit null if not set, or preserve passed value
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Clean up legacy fields - Never write free-text structure again
    delete (newTask as any).department; // Legacy freeze

    // Add the task to Firestore
    const taskRef = await db.collection('tasks').add(newTask);

    // If Guest, notify Admins about pending approval
    await logSystemActivity({
      actorId: user.uid,
      actorRole: user.role || 'guest',
      action: 'task_created',
      entityType: 'task',
      entityId: taskRef.id,
      summary: `Task created: ${newTask.title}`,
      metadata: {
        priority: newTask.priority,
        status: newTask.status
      },
      visibility: { mode: 'internal' }
    });

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

    // Protect immutable fields (Owner/Time)
    delete (updateData as any).createdBy;
    delete (updateData as any).createdAt;

    const db = adminDb;

    // Get the existing task to check permissions
    const taskDoc = await db.collection('tasks').doc(id).get();
    if (!taskDoc.exists) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskDoc.data()!;

    // Check if user has permission to update this task
    const isCreator = task && task.createdBy && task.createdBy.uid === user.uid;
    const isAdmin = user.role === 'admin' || user.role === 'team';

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

    // Structure Protection: Only Admins can move tasks between Structures
    if (!isAdmin) {
      delete (updateData as any).institutionId;
      delete (updateData as any).departmentId;
    } else {
      // Log Structure Change if Admin is changing it
      if ((updateData.institutionId && updateData.institutionId !== task.institutionId) ||
        (updateData.departmentId && updateData.departmentId !== task.departmentId)) {

        await logSystemActivity({
          actorId: user.uid,
          actorRole: user.role || 'unknown',
          action: 'task_structure_changed',
          entityType: 'task',
          entityId: id,
          severity: 'warning',
          summary: `Task moved to Inst: ${updateData.institutionId || task.institutionId}, Dept: ${updateData.departmentId || 'None'}`,
          metadata: {
            oldInstitution: task.institutionId,
            newInstitution: updateData.institutionId,
            oldDepartment: task.departmentId,
            newDepartment: updateData.departmentId
          }
        });
      }
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

    await logSystemActivity({
      actorId: user.uid,
      actorRole: user.role || 'guest',
      action: 'task_deleted',
      entityType: 'task',
      entityId: taskId,
      summary: `Task deleted: ${task?.title || 'Unknown'}`,
      severity: 'warning',
      visibility: { mode: 'admin' }
    });

    return Response.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return Response.json({ error: error.message || 'Failed to delete task' }, { status: 500 });
  }
}