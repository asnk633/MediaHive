import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { userDepartments, users, departments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Configure for dynamic rendering to allow database access
// export const dynamic = 'force-dynamic';
export const revalidate_disabled = 0;

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Get all departments for this user
    const userDepts = await db
      .select({
        id: userDepartments.id,
        departmentId: userDepartments.departmentId,
        createdAt: userDepartments.createdAt,
        departmentName: departments.name
      })
      .from(userDepartments)
      .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
      .where(eq(userDepartments.userId, parseInt(userId)));

    return NextResponse.json(userDepts, { status: 200 });
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
    const db = await getDb();
    const body = await request.json();
    const { userId, departmentId } = body;

    // Validate required fields
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!departmentId || isNaN(parseInt(departmentId))) {
      return NextResponse.json(
        { error: 'Valid departmentId is required', code: 'INVALID_DEPARTMENT_ID' },
        { status: 400 }
      );
    }

    // Check if the user-department relationship already exists
    const existing = await db
      .select()
      .from(userDepartments)
      .where(and(
        eq(userDepartments.userId, parseInt(userId)),
        eq(userDepartments.departmentId, parseInt(departmentId))
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already assigned to this department', code: 'ALREADY_EXISTS' },
        { status: 409 }
      );
    }

    // Create the user-department relationship
    const newUserDept = await db
      .insert(userDepartments)
      .values({
        userId: parseInt(userId),
        departmentId: parseInt(departmentId),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newUserDept[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const departmentId = searchParams.get('departmentId');

    // Validate IDs
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!departmentId || isNaN(parseInt(departmentId))) {
      return NextResponse.json(
        { error: 'Valid departmentId is required', code: 'INVALID_DEPARTMENT_ID' },
        { status: 400 }
      );
    }

    // Check if the user-department relationship exists
    const existing = await db
      .select()
      .from(userDepartments)
      .where(and(
        eq(userDepartments.userId, parseInt(userId)),
        eq(userDepartments.departmentId, parseInt(departmentId))
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'User-department relationship not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the user-department relationship
    const deleted = await db
      .delete(userDepartments)
      .where(and(
        eq(userDepartments.userId, parseInt(userId)),
        eq(userDepartments.departmentId, parseInt(departmentId))
      ))
      .returning();

    return NextResponse.json(
      {
        message: 'User removed from department successfully',
        deleted: deleted[0],
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
