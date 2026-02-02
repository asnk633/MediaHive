// src/app/api/tenants/[id]/route.ts
// Individual tenant API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/tenants/[id] - Get a specific tenant

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only global admin can manage tenants
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const tenantId = parseInt(id, 10);

    if (!tenantId || isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    // Fetch tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { tenant },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/tenants/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PUT /api/tenants/[id] - Update a tenant
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only global admin can manage tenants
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const tenantId = parseInt(id, 10);

    if (!tenantId || isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
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

    // Check if domain already exists for another tenant
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(and(
        eq(tenants.domain, domain),
        eq(tenants.id, tenantId)
      ));

    if (existingTenant && existingTenant.id !== tenantId) {
      return NextResponse.json(
        { error: 'A tenant with this domain already exists' },
        { status: 400 }
      );
    }

    // Update tenant
    const [tenant] = await db
      .update(tenants)
      .set({
        name,
        domain,
        settings: typeof settings === 'object' ? JSON.stringify(settings) : settings,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { tenant },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PUT /api/tenants/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id] - Delete a tenant
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only global admin can manage tenants
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const tenantId = parseInt(id, 10);

    if (!tenantId || isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    // Delete tenant
    const result = await db
      .delete(tenants)
      .where(eq(tenants.id, tenantId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/tenants/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}