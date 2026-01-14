import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { InstitutionPolicyService } from '@/lib/institution-policies.server';
import { InstitutionPolicy } from '@/types/institution-policy';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const policy = await InstitutionPolicyService.resolve(params.id);
        return NextResponse.json({ policy });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { rules } = body;

        await InstitutionPolicyService.updatePolicy(params.id, rules);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
