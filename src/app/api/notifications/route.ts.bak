import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db'; // Assumes Drizzle ORM connection
import { notifications } from '@/db/schema'; // Assumes Drizzle schema definition
import { eq, and, desc } from 'drizzle-orm';

// --- GET Request Handler (Fetch single or list of notifications) ---
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single notification by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const notification = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, parseInt(id)))
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(notification[0], { status: 200 });
    }

    // List notifications with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Filters from original Drizzle script
    const userId = searchParams.get('userId');
    const readParam = searchParams.get('read');
    
    // Integrated filter from the second script
    const institutionId = searchParams.get('institutionId');

    let query = db.select().from(notifications);

    // Build filter conditions
    const conditions = [];
    
    // Filter by userId
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(notifications.userId, parseInt(userId)));
    }

    // Filter by institutionId (Integrated from second script)
    if (institutionId) {
      if (isNaN(parseInt(institutionId))) {
        return NextResponse.json(
          { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
          { status: 400 }
        );
      }
      // Assuming the notifications table has an institutionId column for this merge
      // If it doesn't, this line would need to be removed or adapted via a JOIN.
      // For merging purposes, we assume the Drizzle schema can accommodate this.
      if ('institutionId' in notifications) {
      conditions.push(eq((notifications as any).institutionId, parseInt(institutionId)));
    } else if ('institution_id' in notifications) {
      conditions.push(eq((notifications as any).institution_id, parseInt(institutionId)));
    } else {
      // notifications schema does not have an institution column; skip institution filter
      console.warn('notifications schema missing institutionId — skipping institution filter');
    }
    }

    // Filter by read status
    if (readParam !== null) {
      // Maps 'true'/'1' or 'false'/'0' string to boolean
      const readValue = readParam === 'true' || readParam === '1';
      conditions.push(eq(notifications.read, readValue));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- POST Request Handler (Create new notification) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Integrated fields: 'body' maps to 'message', and 'audience' is new.
    const { userId, type, title, message, body: bodyContent, read, metadata, institutionId, audience } = body;

    // --- Validation ---

    // Drizzle validation for userId
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Combined validation for title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }
    
    // Validation for message (Drizzle's name) or body (second script's name)
    const finalMessage = (message || bodyContent)?.trim();
    if (!finalMessage) {
        return NextResponse.json(
            { error: 'message or body is required', code: 'MISSING_MESSAGE' },
            { status: 400 }
        );
    }

    // Validation for institutionId (Integrated from second script)
    if (institutionId) {
        if (isNaN(parseInt(institutionId))) {
            return NextResponse.json(
                { error: 'institutionId must be a valid integer if provided', code: 'INVALID_INSTITUTION_ID' },
                { status: 400 }
            );
        }
    }

    // Validate metadata if provided
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata === 'string') {
        try {
          JSON.parse(metadata);
        } catch {
          return NextResponse.json(
            { error: 'metadata must be valid JSON', code: 'INVALID_METADATA' },
            { status: 400 }
          );
        }
      } else if (typeof metadata !== 'object') {
        return NextResponse.json(
          { error: 'metadata must be valid JSON', code: 'INVALID_METADATA' },
          { status: 400 }
        );
      }
    }

    // --- Prepare Data ---
    const notificationData: any = {
      userId: parseInt(userId),
      type: type?.trim() || 'GENERAL', // type was required in Drizzle but not in the second script; setting a default if missing
      title: title.trim(),
      message: finalMessage, // Use the combined/validated message
      read: read === true || read === 1,
      createdAt: new Date().toISOString(),
      
      // Integrated/assumed fields
      institutionId: institutionId ? parseInt(institutionId) : null,
      audience: audience || 'team', // Default to 'team' from the second script
    };

    if (metadata !== undefined && metadata !== null) {
      notificationData.metadata = typeof metadata === 'string' 
        ? JSON.parse(metadata) 
        : metadata;
    }
    
    // --- Insert ---
    const newNotification = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- PUT Request Handler (Full update of an existing notification) ---
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
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

    const body = await request.json();
    const { userId, type, title, message, body: bodyContent, read, metadata, institutionId, audience } = body;

    // --- Validation (similar to POST, but optional) ---
    const updateData: any = {};
    
    // userId
    if (userId !== undefined) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json({ error: 'userId must be a valid integer', code: 'INVALID_USER_ID' }, { status: 400 });
      }
      updateData.userId = parseInt(userId);
    }
    
    // type
    if (type !== undefined) {
      if (typeof type !== 'string' || type.trim() === '') {
        return NextResponse.json({ error: 'type must be a non-empty string', code: 'INVALID_TYPE' }, { status: 400 });
      }
      updateData.type = type.trim();
    }
    
    // title
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({ error: 'title must be a non-empty string', code: 'INVALID_TITLE' }, { status: 400 });
      }
      updateData.title = title.trim();
    }
    
    // message (or body)
    const finalMessageUpdate = message || bodyContent;
    if (finalMessageUpdate !== undefined) {
        if (typeof finalMessageUpdate !== 'string' || finalMessageUpdate.trim() === '') {
            return NextResponse.json({ error: 'message/body must be a non-empty string', code: 'INVALID_MESSAGE' }, { status: 400 });
        }
        updateData.message = finalMessageUpdate.trim();
    }
    
    // read
    if (read !== undefined) {
      updateData.read = read === true || read === 1;
    }
    
    // institutionId
    if (institutionId !== undefined) {
        if (isNaN(parseInt(institutionId))) {
            return NextResponse.json({ error: 'institutionId must be a valid integer', code: 'INVALID_INSTITUTION_ID' }, { status: 400 });
        }
        updateData.institutionId = parseInt(institutionId);
    }
    
    // audience
    if (audience !== undefined) {
        updateData.audience = audience;
    }

    // metadata
    if (metadata !== undefined) {
      if (metadata !== null) {
        if (typeof metadata === 'string') {
          try {
            updateData.metadata = JSON.parse(metadata);
          } catch {
            return NextResponse.json({ error: 'metadata must be valid JSON', code: 'INVALID_METADATA' }, { status: 400 });
          }
        } else if (typeof metadata === 'object') {
          updateData.metadata = metadata;
        } else {
            return NextResponse.json({ error: 'metadata must be valid JSON or null', code: 'INVALID_METADATA' }, { status: 400 });
        }
      } else {
        updateData.metadata = null;
      }
    }
    
    // --- Update ---
    const updated = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- PATCH Request Handler (Update 'read' status only) ---
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const readParam = searchParams.get('read');

    if (!id || isNaN(parseInt(id))) {
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

    // Determine read value
    const readValue = readParam === 'true' || readParam === '1' ? true : false;

    const updated = await db
      .update(notifications)
      .set({ read: readValue })
      .where(eq(notifications.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
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

    if (!id || isNaN(parseInt(id))) {
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
        notification: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}