import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { RolePolicyService } from '@/lib/role-policies.server';

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

        const policy = await RolePolicyService.getPolicyDoc(scopeType, scopeId);
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

        await RolePolicyService.setPolicy(scopeType, scopeId, rules);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
