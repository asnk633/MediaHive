import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { userInstitutions, users, institutions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Configure for dynamic rendering to allow database access
// export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Get all institutions for this user
    const userInsts = await db
      .select({
        id: userInstitutions.id,
        institutionId: userInstitutions.institutionId,
        createdAt: userInstitutions.createdAt,
        institutionName: institutions.name
      })
      .from(userInstitutions)
      .innerJoin(institutions, eq(userInstitutions.institutionId, institutions.id))
      .where(eq(userInstitutions.userId, parseInt(userId)));

    return NextResponse.json(userInsts, { status: 200 });
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
    const { userId, institutionId } = body;

    // Validate required fields
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!institutionId || isNaN(parseInt(institutionId))) {
      return NextResponse.json(
        { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Check if the user-institution relationship already exists
    const existing = await db
      .select()
      .from(userInstitutions)
      .where(and(
        eq(userInstitutions.userId, parseInt(userId)),
        eq(userInstitutions.institutionId, parseInt(institutionId))
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already assigned to this institution', code: 'ALREADY_EXISTS' },
        { status: 409 }
      );
    }

    // Create the user-institution relationship
    const newUserInst = await db
      .insert(userInstitutions)
      .values({
        userId: parseInt(userId),
        institutionId: parseInt(institutionId),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newUserInst[0], { status: 201 });
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
    const institutionId = searchParams.get('institutionId');

    // Validate IDs
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (!institutionId || isNaN(parseInt(institutionId))) {
      return NextResponse.json(
        { error: 'Valid institutionId is required', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Check if the user-institution relationship exists
    const existing = await db
      .select()
      .from(userInstitutions)
      .where(and(
        eq(userInstitutions.userId, parseInt(userId)),
        eq(userInstitutions.institutionId, parseInt(institutionId))
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'User-institution relationship not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the user-institution relationship
    const deleted = await db
      .delete(userInstitutions)
      .where(and(
        eq(userInstitutions.userId, parseInt(userId)),
        eq(userInstitutions.institutionId, parseInt(institutionId))
      ))
      .returning();

    return NextResponse.json(
      {
        message: 'User removed from institution successfully',
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