import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { getDb } from '@/db';
import { userInstitutions, users, institutions } from '@/db/schema';
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
    // userId is derived from auth
    const userId = user.uid;

    // Get all institutions for this user
    const userInsts = await db
      .select({
        id: userInstitutions.id,
        institution_id: userInstitutions.institution_id,
        created_at: userInstitutions.created_at,
        institutionName: institutions.name
      })
      .from(userInstitutions)
      .innerJoin(institutions, eq(userInstitutions.institution_id, institutions.id))
      .where(eq(userInstitutions.userId, userId));

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
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { institution_id } = body;
    const userId = user.uid; // Derive userId from user.uid

    if (!institution_id) {
      return NextResponse.json(
        { error: 'Valid institution_id is required', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Check if the user-institution relationship already exists
    const existing = await db
      .select()
      .from(userInstitutions)
      .where(and(
        eq(userInstitutions.userId, userId),
        eq(userInstitutions.institution_id, institution_id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already assigned to this institution', code: 'ALREADY_EXISTS' },
        { status: 409 }
      );
    }

    const newUserInst = await db
      .insert(userInstitutions)
      .values({
        userId: userId,
        institution_id: institution_id,
        created_at: new Date().toISOString(),
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
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const institution_id = searchParams.get('institution_id');
    const userId = user.uid;

    if (!institution_id) {
      return NextResponse.json(
        { error: 'Valid institution_id is required', code: 'INVALID_INSTITUTION_ID' },
        { status: 400 }
      );
    }

    // Check if the user-institution relationship exists
    const existing = await db
      .select()
      .from(userInstitutions)
      .where(and(
        eq(userInstitutions.userId, userId),
        eq(userInstitutions.institution_id, Number(institution_id))
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'User-institution relationship not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(userInstitutions)
      .where(and(
        eq(userInstitutions.userId, userId),
        eq(userInstitutions.institution_id, Number(institution_id))
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
