
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { AutomationRule, DEFAULT_SYSTEM_RULES, RuleAction } from '@/types/automation-rules';
import { logSystemActivity } from '@/app/api/_lib/audit';

const COLLECTION = 'automation_rules';

export async function GET(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const snap = await adminDb.collection(COLLECTION).get();
        const customRules = snap.docs.map(d => d.data() as AutomationRule);

        // Transform System Defaults to array format for UI
        const systemRules = Object.entries(DEFAULT_SYSTEM_RULES)
            .filter(([_, r]) => !!r)
            .map(([eventType, rule]) => ({
                ...rule!,
                id: `system_${eventType}`,
                scopeType: 'global' as const,
                scopeId: 'global',
                eventType,
                enabled: true,
                locked: true,
                priority: 0,
                version: 1,
                conditions: rule.conditions || []
            }));

        return NextResponse.json({ custom: customRules, system: systemRules });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { ruleKey, scopeType, scopeId, eventType, conditions, action, priority } = body;

        // Determine Version
        // Query existing versions for this ruleKey
        const existingSnap = await adminDb.collection(COLLECTION)
            .where('ruleKey', '==', ruleKey)
            .where('scopeType', '==', scopeType)
            .where('scopeId', '==', scopeId)
            .get();

        let version = 1;
        if (!existingSnap.empty) {
            const versions = existingSnap.docs.map(d => d.data().version || 0);
            version = Math.max(...versions) + 1;
        }

        const id = `${scopeType}:${scopeId}:${ruleKey}:${version}`;

        const newRule: AutomationRule = {
            id,
            ruleKey,
            version,
            scopeType,
            scopeId,
            eventType,
            conditions,
            action: action as RuleAction,
            priority: priority || 1,
            enabled: false, // Draft
            locked: false,  // Draft
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await adminDb.collection(COLLECTION).doc(id).set(newRule);

        await logSystemActivity(user.uid, 0, {
            type: 'system_update',
            description: `Created draft rule ${ruleKey} v${version}`,
            metadata: { ruleKey, version, action: 'create_draft' }
        });

        return NextResponse.json({ success: true, rule: newRule });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to create rule' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, conditions, action, priority } = body;

        const docRef = adminDb.collection(COLLECTION).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

        const data = doc.data() as AutomationRule;
        if (data.locked) {
            return NextResponse.json({ error: 'Cannot edit locked rule' }, { status: 400 });
        }

        await docRef.update({
            conditions,
            action,
            priority,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, command } = body;

        if (command !== 'activate') {
            return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
        }

        const docRef = adminDb.collection(COLLECTION).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        const rule = doc.data() as AutomationRule;

        // Activate
        await docRef.update({
            enabled: true,
            locked: true,
            updatedAt: new Date().toISOString()
        });

        // "Previous versions auto-locked on activation"
        // They should already be locked if they were active, but ensure enabled=false?
        // Let's Disable older versions to be clean, though engine handles it.
        const siblingsSnap = await adminDb.collection(COLLECTION)
            .where('ruleKey', '==', rule.ruleKey)
            .where('scopeType', '==', rule.scopeType)
            .where('scopeId', '==', rule.scopeId)
            .where('version', '<', rule.version)
            .get();

        const batch = adminDb.batch();
        siblingsSnap.docs.forEach(d => {
            batch.update(d.ref, { enabled: false, locked: true });
        });
        await batch.commit();

        await logSystemActivity(user.uid, 0, {
            type: 'system_update',
            description: `Activated rule ${rule.ruleKey} v${rule.version}`,
            metadata: { ruleKey: rule.ruleKey, version: rule.version, action: 'activate' }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to activate' }, { status: 500 });
    }
}
