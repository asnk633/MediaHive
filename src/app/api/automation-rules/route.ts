// src/app/api/automation-rules/route.ts
// Automation rules API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { db } from '@/db';
import { automationRules } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/automation-rules - Get all automation rules for tenant
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can manage automation rules
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const enabled = searchParams.get('enabled');

    // Build query conditions
    const conditions = [eq(automationRules.tenantId, user.tenantId)];
    
    if (enabled !== null) {
      conditions.push(eq(automationRules.enabled, enabled === 'true'));
    }

    // Fetch automation rules
    const rules = await db
      .select()
      .from(automationRules)
      .where(and(...conditions))
      .orderBy(automationRules.createdAt);

    return NextResponse.json(
      { rules },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/automation-rules]', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

// POST /api/automation-rules - Create a new automation rule
export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can manage automation rules
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { name, description, triggerType, triggerConfig, conditions, actions, enabled = true } = body;

    // Validate required fields
    if (!name || !triggerType || !actions) {
      return NextResponse.json(
        { error: 'Name, triggerType, and actions are required' },
        { status: 400 }
      );
    }

    // Create automation rule
    const [rule] = await db
      .insert(automationRules)
      .values({
        name,
        description,
        triggerType,
        triggerConfig: typeof triggerConfig === 'object' ? JSON.stringify(triggerConfig) : triggerConfig,
        conditions: typeof conditions === 'object' ? JSON.stringify(conditions) : conditions,
        actions: typeof actions === 'object' ? JSON.stringify(actions) : actions,
        enabled: enabled === true || enabled === false ? enabled : true,
        tenantId: user.tenantId,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(
      { rule },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/automation-rules]', error);
    return NextResponse.json(
      { error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}
