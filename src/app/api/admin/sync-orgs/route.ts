import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { institutions, departments } from '@/db/schema';
import { DEPARTMENTS, INSTITUTIONS } from '@/lib/constants/organizations';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Authorize - Admin only
        const user = await authorizeByPermission(request, 'manage:users');
        if (!user) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const db = await getDb();
        const results = {
            institutionsAdded: 0,
            departmentsAdded: 0,
        };

        // 1. Sync Institutions
        const existingInsts = await db.select().from(institutions);
        const existingInstNames = new Set(existingInsts.map((i: any) => i.name));

        for (const instName of INSTITUTIONS) {
            if (!existingInstNames.has(instName)) {
                await db.insert(institutions).values({
                    name: instName,
                    tenantId: 1,
                    created_at: new Date().toISOString()
                });
                results.institutionsAdded++;
            }
        }

        // 2. Sync Departments
        const existingDepts = await db.select().from(departments);
        const existingDeptNames = new Set(existingDepts.map((d: any) => d.name));

        for (const deptName of DEPARTMENTS) {
            if (!existingDeptNames.has(deptName)) {
                await db.insert(departments).values({
                    name: deptName,
                    tenantId: 1,
                    created_at: new Date().toISOString()
                });
                results.departmentsAdded++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced successfully. Added ${results.institutionsAdded} institutions and ${results.departmentsAdded} departments.`,
            results
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + (error as Error).message },
            { status: 500 }
        );
    }
}
