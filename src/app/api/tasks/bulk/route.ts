import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';
import { isFeatureEnabled } from '@/app/featureFlags';
import { logAuditEvent } from '@/app/api/_lib/audit';

/**
 * POST /api/tasks/bulk
 * Bulk update tasks with various operations
 * Body: { 
 *   taskIds: string[],
 *   operation: 'assign' | 'changePriority' | 'changeStatus',
 *   value: any // depends on operation
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check if workflow power tools feature is enabled
    if (!isFeatureEnabled('workflowPowerTools')) {
      return NextResponse.json({ error: 'Workflow Power Tools feature is disabled' }, { status: 403 });
    }

    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can perform bulk operations
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can perform bulk operations' }, { status: 403 });
    }

    const body = await req.json();
    const { taskIds, operation, value } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds must be a non-empty array' }, { status: 400 });
    }

    if (!operation || !['assign', 'changePriority', 'changeStatus', 'delete'].includes(operation)) {
      return NextResponse.json({ error: 'Invalid operation. Must be one of: assign, changePriority, changeStatus, delete' }, { status: 400 });
    }

    // Validate operation-specific values
    if (operation === 'changePriority' && !['low', 'medium', 'high'].includes(value)) {
      return NextResponse.json({ error: 'Invalid priority value. Must be one of: low, medium, high' }, { status: 400 });
    }

    if (operation === 'changeStatus' && !['pending', 'todo', 'in_progress', 'on_hold', 'review', 'done'].includes(value)) {
      return NextResponse.json({ error: 'Invalid status value. Must be one of: pending, todo, in_progress, on_hold, review, done' }, { status: 400 });
    }

    // Process bulk operations
    const results = [];
    const errors = [];

    for (const taskId of taskIds) {
      try {
        // Get task document
        const taskDoc = await firestore.collection('tasks').doc(taskId).get();

        if (!taskDoc.exists) {
          errors.push({ taskId, error: 'Task not found' });
          continue;
        }

        const taskData = taskDoc.data()!;

        // Handle Delete Operation
        if (operation === 'delete') {
          await firestore.collection('tasks').doc(taskId).delete();
          results.push({ taskId, updated: true });
          continue; // Skip update logic because document is gone
        }

        // Prepare update data
        const updateData: any = {
          updatedAt: new Date().toISOString(),
          updatedBy: {
            uid: user.uid,
            role: user.role
          }
        };

        // Apply operation-specific updates
        switch (operation) {
          case 'assign':
            updateData.assignedTo = value ? [{ uid: value, name: 'Bulk Assigned' }] : [];
            break;

          case 'changePriority':
            updateData.priority = value;
            break;

          case 'changeStatus':
            updateData.status = value;
            // Handle completion timestamp
            if (value === 'done' && taskData.status !== 'done') {
              updateData.completedAt = new Date().toISOString();
              updateData.completedBy = { uid: user.uid, name: user.name || 'Admin' };
            } else if (taskData.status === 'done' && value !== 'done') {
              updateData.completedAt = null;
              updateData.completedBy = null;
            }
            break;
        }

        // Update the task
        await firestore.collection('tasks').doc(taskId).update(updateData);
        results.push({ taskId, updated: true });

        // Send notifications for status changes
        if (operation === 'changeStatus') {
          try {
            const creatorUid = typeof taskData.createdBy === 'string' ? taskData.createdBy : taskData.createdBy?.uid;
            if (creatorUid && creatorUid !== user.uid) {
              let notificationTitle = '';
              let notificationBody = '';

              if (value === 'todo' && taskData.status === 'pending') {
                notificationTitle = 'Request Approved';
                notificationBody = `Your request "${taskData.title}" has been approved in bulk operation.`;
              } else if (value === 'done') {
                notificationTitle = 'Task Completed';
                notificationBody = `Task "${taskData.title}" has been marked as completed in bulk operation.`;
              } else {
                notificationTitle = 'Status Updated';
                notificationBody = `Task "${taskData.title}" moved to ${value.replace('_', ' ')} in bulk operation.`;
              }

              await ServerNotification.create(creatorUid, {
                type: 'status_changed',
                title: notificationTitle,
                message: notificationBody,
                entityType: 'task',
                entityId: taskId,
                actionUrl: `/tasks/view?id=${taskId}`,
                sourceUserId: user.uid,
                priority: value === 'done' ? 'medium' : 'low'
              });
            }
          } catch (notificationError) {
            console.error('Failed to send notification for task', taskId, notificationError);
          }
        }
      } catch (taskError) {
        errors.push({ taskId, error: taskError instanceof Error ? taskError.message : 'Failed to update task' });
      }
    }

    // Log bulk operation in audit trail
    await logAuditEvent(
      user.uid,
      'bulk_task_operation',
      'task',
      user.tenantId || 1,
      '0',
      {
        operation,
        taskCount: taskIds.length,
        successCount: results.length,
        errorCount: errors.length,
        taskIds: taskIds.slice(0, 10), // Limit stored IDs for privacy
        value
      }
    );

    return NextResponse.json({
      success: true,
      results,
      errors,
      message: `Successfully processed ${results.length} tasks. ${errors.length} tasks failed.`
    }, { status: 200 });

  } catch (error) {
    console.error('[POST /api/tasks/bulk]', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}