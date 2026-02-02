// src/app/api/automation-rules/[id]/route.ts
// Individual automation rule API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { db } from '@/db';
import { automationRules } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/automation-rules/[id] - Get a specific automation rule
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only admin can manage automation rules
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const ruleId = parseInt(id, 10);

    if (!ruleId || isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      );
    }

    // Fetch automation rule
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.id, ruleId),
        eq(automationRules.tenantId, user.tenantId)
      ));

    if (!rule) {
      return NextResponse.json(
        { error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { rule },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/automation-rules/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation rule' },
      { status: 500 }
    );
  }
}

// PUT /api/automation-rules/[id] - Update an automation rule (full update)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only admin can manage automation rules
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const ruleId = parseInt(id, 10);

    if (!ruleId || isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.json();
    const { name, description, triggerType, triggerConfig, conditions, actions, enabled } = body;

    // Validate required fields
    if (!name || !triggerType || !actions) {
      return NextResponse.json(
        { error: 'Name, triggerType, and actions are required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {
      name,
      description,
      triggerType,
      triggerConfig: typeof triggerConfig === 'object' ? JSON.stringify(triggerConfig) : triggerConfig,
      conditions: typeof conditions === 'object' ? JSON.stringify(conditions) : conditions,
      actions: typeof actions === 'object' ? JSON.stringify(actions) : actions,
      enabled: enabled === true || enabled === false ? enabled : true,
      updatedAt: new Date().toISOString(),
    };

    // Update automation rule
    const [rule] = await db
      .update(automationRules)
      .set(updates)
      .where(and(
        eq(automationRules.id, ruleId),
        eq(automationRules.tenantId, user.tenantId)
      ))
      .returning();

    if (!rule) {
      return NextResponse.json(
        { error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { rule },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PUT /api/automation-rules/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

// PATCH /api/automation-rules/[id] - Update an automation rule (partial update)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only admin can manage automation rules
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const ruleId = parseInt(id, 10);

    if (!ruleId || isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.json();
    const { name, description, triggerType, triggerConfig, conditions, actions, enabled } = body;

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (triggerType !== undefined) updates.triggerType = triggerType;
    if (triggerConfig !== undefined) {
      updates.triggerConfig = typeof triggerConfig === 'object' ? JSON.stringify(triggerConfig) : triggerConfig;
    }
    if (conditions !== undefined) {
      updates.conditions = typeof conditions === 'object' ? JSON.stringify(conditions) : conditions;
    }
    if (actions !== undefined) {
      updates.actions = typeof actions === 'object' ? JSON.stringify(actions) : actions;
    }
    if (enabled !== undefined) updates.enabled = enabled === true || enabled === false ? enabled : true;

    // Update automation rule
    const [rule] = await db
      .update(automationRules)
      .set(updates)
      .where(and(
        eq(automationRules.id, ruleId),
        eq(automationRules.tenantId, user.tenantId)
      ))
      .returning();

    if (!rule) {
      return NextResponse.json(
        { error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { rule },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/automation-rules/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/automation-rules/[id] - Delete an automation rule
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC - only admin can manage automation rules
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const ruleId = parseInt(id, 10);

    if (!ruleId || isNaN(ruleId)) {
      return NextResponse.json(
        { error: 'Invalid rule ID' },
        { status: 400 }
      );
    }

    // Delete automation rule
    const result = await db
      .delete(automationRules)
      .where(and(
        eq(automationRules.id, ruleId),
        eq(automationRules.tenantId, user.tenantId)
      ));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/automation-rules/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}