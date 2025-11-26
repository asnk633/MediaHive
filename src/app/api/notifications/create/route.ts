import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { z } from 'zod';
import { sanitizeTextContent, sanitizeHtmlContent } from '@/lib/sanitizer';

// In-memory storage for mock implementation
let mockNotifications: any[] = [];
let notificationIdCounter = 1;

// Notification payload schema
const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(2000),
  audience: z.array(z.enum(['all', 'admins', 'team', 'guests'])).min(1),
  scheduledAt: z.string().nullable().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string()
  })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admins can create notifications
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can send notifications' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate the payload
    const validatedBody = notificationPayloadSchema.parse(body);
    
    const now = new Date().toISOString();
    
    const newNotification = {
      id: notificationIdCounter++,
      title: sanitizeTextContent(validatedBody.title),
      body: sanitizeHtmlContent(validatedBody.body),
      audience: validatedBody.audience,
      scheduledAt: validatedBody.scheduledAt || null,
      attachments: validatedBody.attachments || [],
      createdById: user.id,
      institutionId: user.institutionId,
      createdAt: now,
      updatedAt: now,
    };

    // In a real implementation, you would save to database here
    mockNotifications.push(newNotification);

    return NextResponse.json({ data: newNotification }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('[POST /api/notifications/create]', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// For testing purposes
export async function GET() {
  return NextResponse.json({ data: mockNotifications }, { status: 200 });
}