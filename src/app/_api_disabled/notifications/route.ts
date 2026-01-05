import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';
import { getUserFromRequest, isAdmin } from '../_lib/auth';
import { validateSchema, createNotificationSchema } from '@/lib/validation';
import { z } from 'zod';
import { sanitizeHtmlContent, sanitizeTextContent } from '@/lib/sanitizer';

// --- GET Request Handler (Fetch notifications for current user) ---
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const read = searchParams.get('read');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions: any[] = [eq(notifications.userId, user.id)];

    // Filter by read status if provided
    if (read !== null) {
      const isRead = read === 'true';
      if (isRead) {
        conditions.push(isNull(notifications.readAt));
      } else {
        conditions.push(isNull(notifications.readAt));
      }
    }

    // Filter by category if provided
    if (category) {
      conditions.push(eq(notifications.category, category));
    }

    // Filter by date range if provided
    if (startDate) {
      conditions.push(gte(notifications.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(notifications.createdAt, endDate));
    }

    const notificationsList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json({ data: notificationsList }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- POST Request Handler (Create notification - admin only) ---
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create notifications
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only admins can create notifications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, title, body: notificationBody, category, ttl } = validateSchema(createNotificationSchema, body);

    const createdAt = new Date().toISOString();

    const inserted = await db
      .insert(notifications)
      .values({
        createdAt,
        title: sanitizeTextContent(title),
        body: sanitizeHtmlContent(notificationBody),
        userId,
        category: category || 'general',
        ttl: ttl || 86400, // Default 24 hours TTL
        readReceipt: false,
        updatedAt: createdAt,
      })
      .returning();

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- PATCH Request Handler (Update an existing notification) ---
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Validate ID parameter
    const idSchema = z.number().int().positive();
    try {
      idSchema.parse(parseInt(id));
    } catch {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only allow specific updates
    const safeUpdates: any = {};
    if (updates.read !== undefined) {
      safeUpdates.readAt = updates.read ? new Date().toISOString() : null;
    }
    if (updates.title) safeUpdates.title = sanitizeTextContent(updates.title);
    if (updates.body) safeUpdates.body = sanitizeHtmlContent(updates.body);
    if (updates.category) safeUpdates.category = updates.category;
    if (updates.ttl !== undefined) safeUpdates.ttl = updates.ttl;
    if (updates.readReceipt !== undefined) safeUpdates.readReceipt = updates.readReceipt;

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_VALID_FIELDS' },
        { status: 400 }
      );
    }

    // Always update the updatedAt field
    safeUpdates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(notifications)
      .set(safeUpdates)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler (Delete an existing notification) ---
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Validate ID parameter
    const idSchema = z.number().int().positive();
    try {
      idSchema.parse(parseInt(id));
    } catch {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if notification exists
    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(notifications)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Notification deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}