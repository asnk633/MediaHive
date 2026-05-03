import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, institutions, tenants } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// Only allow this endpoint in development/test environments
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Only allow in dev/test environments
  if (!isDev) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development/test environments' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, role } = body;

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = existingUser[0];
      return NextResponse.json(userWithoutPassword, { status: 200 });
    }

    // Get default tenant and institution
    let tenantId = 1;
    let institution_id = 1;

    // Check if default tenant exists
    const tenantsList = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, 1))
      .limit(1);

    if (tenantsList.length === 0) {
      // Create default tenant
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: "Default Tenant",
          domain: "default.local",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning({ id: tenants.id });
      tenantId = newTenant.id;
    }

    // Check if default institution exists
    const institutionsList = await db
      .select()
      .from(institutions)
      .where(eq(institutions.id, 1))
      .limit(1);

    if (institutionsList.length === 0) {
      // Create default institution
      const [newInstitution] = await db
        .insert(institutions)
        .values({
          name: "Default Institution",
          tenantId: tenantId,
          created_at: new Date().toISOString(),
        })
        .returning({ id: institutions.id });
      institution_id = newInstitution.id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        role,
        institution_id,
        tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error('Seed user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
