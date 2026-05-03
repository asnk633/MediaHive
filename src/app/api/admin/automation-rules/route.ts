import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { automationRules } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyUser } from '@/lib/verifyUser';
import { withTenantDrizzle, validateTenant } from '@/lib/tenantQuery';

export async function GET(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Security guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        console.error(`[GET /api/admin/automation-rules] ❌ Missing tenant context for user: ${user.uid}`);
        return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    try {
        const customRules = await db.query.automationRules.findMany({
            where: and(
                eq(automationRules.isSystem, false),
                withTenantDrizzle(automationRules, tenantId)
            ),
            orderBy: [desc(automationRules.version)]
        });

        const systemRules = await db.query.automationRules.findMany({
            where: and(
                eq(automationRules.isSystem, true),
                withTenantDrizzle(automationRules, tenantId)
            )
        });

        return NextResponse.json({
            custom: customRules,
            system: systemRules
        });
    } catch (e) {
        console.error('Failed to fetch automation rules:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Security guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        console.error(`[POST /api/admin/automation-rules] ❌ Missing tenant context for user: ${user.uid}`);
        return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { ruleKey, scopeType, scopeId, eventType, action, priority, conditions } = body;

        const newRule = await db.insert(automationRules).values({
            ruleKey,
            scopeType,
            scopeId,
            eventType,
            action,
            priority,
            conditions: JSON.stringify(conditions),
            version: 1,
            enabled: false,
            isSystem: false,
            tenantId: typeof tenantId === 'string' && !isNaN(Number(tenantId)) ? Number(tenantId) : tenantId as any,
            createdBy: user.id
        }).returning();

        return NextResponse.json(newRule[0]);
    } catch (e) {
        console.error('Failed to create automation rule:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tenant Security guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        console.error(`[PATCH /api/admin/automation-rules] ❌ Missing tenant context for user: ${user.uid}`);
        return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    try {
        const { id, command } = await req.json();

        if (command === 'activate') {
            const rule = await db.query.automationRules.findFirst({
                where: and(
                    eq(automationRules.id, id),
                    withTenantDrizzle(automationRules, tenantId)
                )
            });

            if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            // Disable other versions
            await db.update(automationRules)
                .set({ enabled: false })
                .where(and(
                    eq(automationRules.ruleKey, rule.ruleKey),
                    eq(automationRules.isSystem, false),
                    withTenantDrizzle(automationRules, tenantId)
                ));

            // Enable this one
            await db.update(automationRules)
                .set({ enabled: true })
                .where(and(
                    eq(automationRules.id, id),
                    withTenantDrizzle(automationRules, tenantId)
                ));

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
    } catch (e) {
        console.error('Failed to update automation rule:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
