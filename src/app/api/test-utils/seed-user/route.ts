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

    // Ensure database is initialized
    const { getDb } = await import('@/db');
    const { sql } = await import('drizzle-orm');
    const dbInstance = await getDb();

    // Ensure core tables exist (Manual initialization for robustness in test env)
    console.log('[DB] Ensuring core tables exist...');

    // Drop existing tables to enforce schema updates during debugging
    await dbInstance.run(sql`DROP TABLE IF EXISTS users`);
    await dbInstance.run(sql`DROP TABLE IF EXISTS departments`);
    await dbInstance.run(sql`DROP TABLE IF EXISTS institutions`);
    await dbInstance.run(sql`DROP TABLE IF EXISTS tenants`);

    await dbInstance.run(sql`CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      domain TEXT NOT NULL UNIQUE,
      settings TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
    await dbInstance.run(sql`CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      created_at TEXT NOT NULL
    )`);
    await dbInstance.run(sql`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      created_at TEXT NOT NULL
    )`);
    await dbInstance.run(sql`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL,
      institution_id INTEGER NOT NULL REFERENCES institutions(id),
      department_id INTEGER REFERENCES departments(id),
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
    console.log('[DB] Tables verified.');

    // Check if user already exists
    const existingUser = await dbInstance
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        institution_id: users.institution_id,
        tenantId: users.tenantId,
        created_at: users.created_at,
        updated_at: users.updated_at
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(existingUser[0], { status: 200 });
    }

    // Get default tenant and institution
    let tenantId = 1;
    let institution_id = 1;

    // Check if default tenant exists
    const tenantsList = await dbInstance
      .select()
      .from(tenants)
      .where(eq(tenants.id, 1))
      .limit(1);

    if (tenantsList.length === 0) {
      // Create default tenant
      const [newTenant] = await dbInstance
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
    const institutionsList = await dbInstance
      .select()
      .from(institutions)
      .where(eq(institutions.id, 1))
      .limit(1);

    if (institutionsList.length === 0) {
      // Create default institution
      const [newInstitution] = await dbInstance
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
    const [newUser] = await dbInstance
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
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        institution_id: users.institution_id,
        tenantId: users.tenantId,
        created_at: users.created_at,
        updated_at: users.updated_at
      });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Seed user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || String(error)) },
      { status: 500 }
    );
  }
}

