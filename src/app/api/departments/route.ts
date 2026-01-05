import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { departments } from '@/db/schema';
import { eq, like } from 'drizzle-orm';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

// Configure for dynamic rendering to allow database access
// export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Authorize user with RBAC - users can read departments
    const user = await authorizeByPermission(request, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized (RBAC)' }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single department by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const department = await db
        .select()
        .from(departments)
        .where(eq(departments.id, parseInt(id)))
        .limit(1);

      if (department.length === 0) {
        return NextResponse.json(
          { error: 'Department not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(department[0], { status: 200 });
    }

    // List departments with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 1000);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(departments);

    if (search) {
      // TS/drizzle select typing mismatch — cast result to any.
      query = (query.where(like(departments.name, `%${search}%`)) as unknown) as any;
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
    // Authorize user with RBAC - only admins can create departments
    const user = await authorizeByPermission(request, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can create departments' }, { status: 403 });
    }

    const db = await getDb();
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

    const newDepartment = await db
      .insert(departments)
      .values({
        name: sanitizedName,
        tenantId: 1, // Default tenant ID for now
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newDepartment[0], { status: 201 });
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
    // Authorize user with RBAC - only admins can update departments
    const user = await authorizeByPermission(request, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can update departments' }, { status: 403 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if department exists
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Department not found', code: 'NOT_FOUND' },
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
      .update(departments)
      .set(updates)
      .where(eq(departments.id, parseInt(id)))
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
    // Authorize user with RBAC - only admins can delete departments
    const user = await authorizeByPermission(request, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete departments' }, { status: 403 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if department exists
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Department not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(departments)
      .where(eq(departments.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Department deleted successfully',
        department: deleted[0],
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