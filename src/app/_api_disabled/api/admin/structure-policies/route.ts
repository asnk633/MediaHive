import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { StructurePolicyService } from '@/lib/structure-policies.server';
import { DEFAULT_GLOBAL_POLICY_RULES, AutomationRulePolicy } from '@/types/structure-policy';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const scopeType = searchParams.get('scopeType') as any;
        const scopeId = searchParams.get('scopeId');

        if (!scopeType || !scopeId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const policy = await StructurePolicyService.getPolicyDoc(scopeType, scopeId);

        // Return existing policy OR default structure if missing (so UI works)
        // If missing, rules are empty. UI should merge with Defaults?
        // Let's return what we found, UI handles merging.
        return NextResponse.json({ policy: policy || { scopeType, scopeId, rules: {} } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { scopeType, scopeId, rules } = body;

        if (!scopeType || !scopeId || !rules) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        await StructurePolicyService.setPolicy(scopeType, scopeId, rules);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
