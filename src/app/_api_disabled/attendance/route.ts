import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendance } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// --- GET Request Handler (Fetch single or list) ---
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

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate'); // ISO date string
    const endDate = searchParams.get('endDate'); // ISO date string

    const filters = [];
    if (userId && !isNaN(parseInt(userId))) {
      filters.push(eq(attendance.userId, parseInt(userId)));
    }
    if (startDate) {
      // Filter records created on or after startDate
      filters.push(gte(attendance.createdAt, startDate));
    }
    if (endDate) {
      // Filter records created on or before endDate
      filters.push(lte(attendance.createdAt, endDate));
    }

    const records = await db
      .select()
      .from(attendance)
      .where(and(...filters))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(attendance.createdAt)); // Order by newest first

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
    const payload = await request.json();
    const { userId, checkIn, checkOut, institutionId } = payload;

    if (!userId || !checkIn || !institutionId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, checkIn, institutionId', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(attendance)
      .values({
        userId,
        checkIn,
        checkOut: checkOut || null,
        institutionId,
        tenantId: 1, // Default tenant ID for now
        createdAt: new Date().toISOString(),
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

    // Check if record exists
    const existing = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, parseInt(id)))
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
        updatedAt: new Date().toISOString(),
      } as any)
      .where(eq(attendance.id, parseInt(id)));

    // updated row isn't returned by .set() here with our current db helper,
    // so construct the updated object locally and return it instead.
    const updatedObj = { 
        ...(existing[0] as any), // Start with existing data
        ...(payload as any), // Apply the updates
        updatedAt: new Date().toISOString() 
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

    // Check if record exists
    const existing = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, parseInt(id)))
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