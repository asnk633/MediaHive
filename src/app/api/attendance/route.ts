import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { db } from '@/db';
import { attendance } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// --- GET Request Handler (Fetch single or list) ---

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Attendance record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // userId is derived from the authenticated session, NEVER from searchParams
    const userId = user.uid;
    const startDate = searchParams.get('startDate'); // ISO date string
    const endDate = searchParams.get('endDate'); // ISO date string

    const filters = [];
    // userId is always enforced
    filters.push(eq(attendance.userId, userId));

    if (startDate) {
      // Filter records created on or after startDate
      filters.push(gte(attendance.created_at, startDate));
    }
    if (endDate) {
      // Filter records created on or before endDate
      filters.push(lte(attendance.created_at, endDate));
    }

    const records = await db
      .select()
      .from(attendance)
      .where(and(...filters))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(attendance.created_at)); // Order by newest first

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- POST Request Handler (Create a new record) ---
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { checkIn, checkOut } = payload;

    // derived from auth
    const userId = user.uid;
    const institution_id = user.institution_id;

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Missing required fields: checkIn', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(attendance)
      .values({
        userId,
        checkIn,
        checkOut: checkOut || null,
        institution_id,
        tenantId: 1, // Default tenant ID for now
        created_at: new Date().toISOString(),
      } as any)
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- PUT Request Handler (Update an existing record) ---
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

    const payload = await request.json();

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided', code: 'NO_DATA' },
        { status: 400 }
      );
    }

    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if record exists and belongs to the user
    const existing = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.id, parseInt(id)),
        eq(attendance.userId, user.uid)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Perform the update
    await db
      .update(attendance)
      .set({
        ...(payload as any),
        updated_at: new Date().toISOString(),
      } as any)
      .where(eq(attendance.id, parseInt(id)));

    // updated row isn't returned by .set() here with our current db helper,
    // so construct the updated object locally and return it instead.
    const updatedObj = {
      ...(existing[0] as any), // Start with existing data
      ...(payload as any), // Apply the updates
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(updatedObj, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler (Delete an existing record) ---
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

    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if record exists and belongs to the user
    const existing = await db
      .select()
      .from(attendance)
      .where(and(
        eq(attendance.id, parseInt(id)),
        eq(attendance.userId, user.uid)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(attendance)
      .where(eq(attendance.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { message: 'Attendance record deleted', deleted: deleted[0] },
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
