// src/app/api/tenants/route.ts
// Tenants API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '../_lib/rbac';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/tenants - Get all tenants (admin only)
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - only global admin can manage tenants
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all tenants
    const allTenants = await db
      .select()
      .from(tenants)
      .orderBy(tenants.name);

    return NextResponse.json(
      { tenants: allTenants },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/tenants]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST /api/tenants - Create a new tenant (admin only)
export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only global admin can manage tenants
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { name, domain, settings } = body;

    // Validate required fields
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, domain));

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A tenant with this domain already exists' },
        { status: 400 }
      );
    }

    // Create tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name,
        domain,
        settings: typeof settings === 'object' ? JSON.stringify(settings) : settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      { tenant },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/tenants]', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}