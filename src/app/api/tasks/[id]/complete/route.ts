import { NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';
import { TaskAutomationServiceServer } from '@/lib/task-automation.server';


export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin users can explicitly complete tasks
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can explicitly complete tasks' }, { status: 403 });
    }

    const { id } = await params;

    // Use the TaskAutomationService to complete the task
    // This ensures proper auditing, notifications, and safety checks
    const success = await TaskAutomationServiceServer.completeTask(id, user.uid);

    if (!success) {
      return NextResponse.json({ error: 'Failed to complete task. Task may not exist or may not meet completion criteria.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Task completed successfully' });
  } catch (error) {
    console.error("POST task complete error", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}