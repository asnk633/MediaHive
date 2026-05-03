import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { getDb } from '@/db';
import { userDepartments, users, departments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Configure for dynamic rendering to allow database access
// export const dynamic = 'force-dynamic';
export const revalidate_disabled = 0;

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const userId = user.uid;

    // Get all departments for this user
    const userDepts = await db
      .select({
        id: userDepartments.id,
        department_id: userDepartments.department_id,
        created_at: userDepartments.created_at,
        departmentName: departments.name
      })
      .from(userDepartments)
      .innerJoin(departments, eq(userDepartments.department_id, departments.id))
      .where(eq(userDepartments.userId, userId));

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
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check if the user-department relationship already exists
    const existing = await db
      .select()
      .from(userDepartments)
      .where(and(
        eq(userDepartments.userId, userId),
        eq(userDepartments.department_id, parseInt(department_id))
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
        userId: userId,
        department_id: parseInt(department_id),
        created_at: new Date().toISOString(),
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
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const department_id = searchParams.get('department_id');
    const userId = user.uid;

    if (!department_id || isNaN(parseInt(department_id))) {
      return NextResponse.json(
        { error: 'Valid department_id is required', code: 'INVALID_DEPARTMENT_ID' },
        { status: 400 }
      );
    }

    // Check if the user-department relationship exists
    const existing = await db
      .select()
      .from(userDepartments)
      .where(and(
        eq(userDepartments.userId, userId),
        eq(userDepartments.department_id, parseInt(department_id))
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
        eq(userDepartments.userId, userId),
        eq(userDepartments.department_id, parseInt(department_id))
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
