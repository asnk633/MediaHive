import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/app/api/_lib/rbac';
import { validateSchema, createTaskSchema } from '@/lib/validation';
import { z } from 'zod';
import { sanitizeTextContent, sanitizeHtmlContent } from '@/lib/sanitizer';
import { sendFcm } from '@/lib/sendFcm';

// Configure for static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

// In-memory storage for mock implementation
let mockTasks: any[] = [];
let taskIdCounter = 1;

// Task payload schema
const taskPayloadSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  assignedToId: z.string().nullable().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string()
  })).optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only roles with write:tasks permission can create tasks
    const user = await authorize(req, 'create:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate the payload
    const validatedBody = validateSchema(taskPayloadSchema, body);

    // Role-based field restrictions
    let priority = 'medium';
    let assignedToId: string | null = null;

    if (user.role === 'admin') {
      // Admin can set everything
      priority = validatedBody.priority;
      assignedToId = validatedBody.assignedToId || null;
    } else if (user.role === 'team') {
      // Team can set priority and assign
      priority = validatedBody.priority;
      assignedToId = validatedBody.assignedToId || null;
    } else {
      // Guest: create with defaults only
      priority = 'medium';
      assignedToId = null;
    }

    const now = new Date().toISOString();

    const newTask = {
      id: taskIdCounter++,
      title: sanitizeTextContent(validatedBody.title.trim()),
      description: validatedBody.description ? sanitizeHtmlContent(validatedBody.description) : null,
      dueDate: validatedBody.dueDate || null,
      priority,
      assignedToId,
      attachments: validatedBody.attachments || [],
      tags: validatedBody.tags || [],
      createdById: user.id,
      institutionId: user.institutionId,
      tenantId: user.tenantId,
      createdAt: now,
      updatedAt: now,
    };

    // In a real implementation, you would save to database here
    mockTasks.push(newTask);

    // Send notification if task is assigned to someone
    if (assignedToId) {
      // In a real implementation, you would:
      // 1. Look up the assigned user in the database
      // 2. Get their FCM token
      // 3. Send them a notification

      // For demonstration, we'll send to a mock token
      const mockFcmToken = 'mock-fcm-token-for-demo';
      await sendFcm(mockFcmToken, {
        title: 'New Task Assigned',
        body: `You have been assigned a new task: ${newTask.title}`,
        data: {
          taskId: newTask.id.toString(),
          type: 'task_assigned'
        }
      });
    }

    return NextResponse.json({ data: newTask }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }

    console.error('[POST /api/tasks/create]', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// For testing purposes
export async function GET() {
  return NextResponse.json({ data: mockTasks }, { status: 200 });
}