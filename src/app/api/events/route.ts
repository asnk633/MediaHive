import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq, like, and, or, gte, lte, desc } from 'drizzle-orm';
import { authorize } from '../_lib/rbac';
import { hasRole } from '@/lib/permissions';
import { validateSchema, createEventSchema, updateEventSchema } from '@/lib/validation';
import { z } from 'zod';
import { sanitizeHtmlContent, sanitizeTextContent } from '@/lib/sanitizer';

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
  try {
    const user = await authorize(request, 'read:events');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single event fetch
    if (id) {
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

      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, parseInt(id)))
        .limit(1);

      if (event.length === 0) {
        return NextResponse.json(
          { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(event[0], { status: 200 });
    }

    // List events with filtering, search, and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const conditions = [eq(events.institutionId, user.institutionId)];

    // Non-admin users only see approved events
    if (!hasRole(user, ['admin'])) {
      conditions.push(eq(events.approvalStatus, 'approved'));
    }

    // Search filter (title only to avoid nullable description issues)
    if (search) {
      conditions.push(like(events.title, `%${search}%`));
    }

    // Date range filters
    if (from) {
      conditions.push(gte(events.startTime, from));
    }

    if (to) {
      conditions.push(lte(events.endTime, to));
    }

    let query = db.select().from(events);

    if (conditions.length > 0) {
      // Avoid complex generic mismatch from drizzle select types by casting.
      query = (query.where(and(...conditions)) as unknown) as any;
    }

    const results = await query
      .orderBy(desc(events.startTime))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }

    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- POST Request Handler ---
export async function POST(request: NextRequest) {
  try {
    const user = await authorize(request, 'create:events');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only team and admin can create events (enforced by permission check above, but double check role if needed)
    // The permission 'create:events' is assigned to admin and team in permissions.ts

    const body = await request.json();
    const validatedBody = validateSchema(createEventSchema, body);
    const { title, description, startTime, endTime } = validatedBody;

    const now = new Date().toISOString();

    // Admin events are auto-approved, team events need approval
    const approvalStatus = hasRole(user, ['admin']) ? 'approved' : 'pending';

    const newEvents = await db
      .insert(events)
      .values({
        title: sanitizeTextContent(title.trim()),
        description: description ? sanitizeHtmlContent(description.trim()) : null,
        startTime,
        endTime,
        approvalStatus,
        createdById: user.id,
        institutionId: user.institutionId,
        tenantId: user.tenantId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ data: newEvents[0] }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }

    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- PUT Request Handler ---
export async function PUT(request: NextRequest) {
  try {
    const user = await authorize(request, 'edit:events');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedBody = validateSchema(updateEventSchema, body);

    // Check if event exists
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(id)));

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only creator or admin can update
    if (existingEvent.createdById !== user.id && !hasRole(user, ['admin'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: any = { updatedAt: new Date().toISOString() };

    // Prepare updates from validated body
    if (validatedBody.title !== undefined) {
      updates.title = sanitizeTextContent(validatedBody.title.trim());
    }

    if (validatedBody.description !== undefined) {
      updates.description = validatedBody.description ? sanitizeHtmlContent(validatedBody.description.trim()) : null;
    }

    if (validatedBody.startTime !== undefined) {
      updates.startTime = validatedBody.startTime;
    }

    if (validatedBody.endTime !== undefined) {
      updates.endTime = validatedBody.endTime;
    }

    if (validatedBody.approvalStatus !== undefined) {
      updates.approvalStatus = validatedBody.approvalStatus;
    }

    if (Object.keys(updates).length === 1) { // Only updatedAt
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedEvents = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, parseInt(id)))
      .returning();

    return NextResponse.json({ data: updatedEvents[0] }, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }

    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest) {
  try {
    const user = await authorize(request, 'delete:events');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Validate ID parameter
    const idSchema = z.number().int().positive();
    try {
      idSchema.parse(parseInt(id));
    } catch {
      return NextResponse.json({ error: 'Valid ID is required' }, { status: 400 });
    }

    // Check if event exists
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, parseInt(id)));

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only creator or admin can delete
    if (existingEvent.createdById !== user.id && !hasRole(user, ['admin'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(events).where(eq(events.id, parseInt(id)));

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }

    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}