import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { institutions } from '@/db/schema';
import { eq, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single institution by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const institution = await db
        .select()
        .from(institutions)
        .where(eq(institutions.id, parseInt(id)))
        .limit(1);

      if (institution.length === 0) {
        return NextResponse.json(
          { error: 'Institution not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(institution[0], { status: 200 });
    }

    // List institutions with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(institutions);

    if (search) {
      // TS/drizzle select typing mismatch — cast result to any.
      query = (query.where(like(institutions.name, `%${search}%`)) as unknown) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_REQUIRED_FIELD' },
        { status: 400 }
      );
    }

    // Sanitize and prepare data
    const sanitizedName = name.trim();

    const newInstitution = await db
      .insert(institutions)
      .values({
        name: sanitizedName,
        tenantId: 1, // Default tenant ID for now
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newInstitution[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if institution exists
    const existing = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_FIELD' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updates: { name?: string } = {};
    if (name !== undefined) {
      updates.name = name.trim();
    }

    // If no fields to update, return current record
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    const updated = await db
      .update(institutions)
      .set(updates)
      .where(eq(institutions.id, parseInt(id)))
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if institution exists
    const existing = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Institution not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(institutions)
      .where(eq(institutions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Institution deleted successfully',
        institution: deleted[0],
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