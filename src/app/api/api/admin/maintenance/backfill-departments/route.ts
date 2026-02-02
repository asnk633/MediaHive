import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';

export async function POST(request: NextRequest) {
    // 1. Authorization
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    // const user = { uid: 'backfill_script', role: 'admin' };

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') !== 'false'; // Default to true

    let report = [];
    let updatedCount = 0;
    let matchedCount = 0;

    try {
        // 2. Build Structure Map (Departments + Institutions)
        const deptSnapshot = await adminDb.collection('departments').get();
        const instSnapshot = await adminDb.collection('institutions').get();

        const structureMap: Record<string, { id: string, institutionId?: string, name: string, type: 'department' | 'institution' }> = {};

        // Map Departments
        deptSnapshot.forEach(doc => {
            const data = doc.data();
            const name = data.name || '';
            const normalized = name.toLowerCase().trim();
            structureMap[normalized] = { id: doc.id, institutionId: data.institutionId, name: name, type: 'department' };
            if (normalized.startsWith('thaiba ')) {
                const short = normalized.replace('thaiba ', '').trim();
                if (short && !structureMap[short]) structureMap[short] = { id: doc.id, institutionId: data.institutionId, name: name, type: 'department' };
            }
        });

        // Map Institutions
        instSnapshot.forEach(doc => {
            const data = doc.data();
            const name = data.name || '';
            const normalized = name.toLowerCase().trim();
            if (!structureMap[normalized]) {
                structureMap[normalized] = { id: doc.id, name: name, type: 'institution' };
            }
            if (normalized.startsWith('thaiba ')) {
                const short = normalized.replace('thaiba ', '').trim();
                if (short && !structureMap[short]) structureMap[short] = { id: doc.id, name: name, type: 'institution' };
            }
        });

        report.push(`Structure Map Built: ${Object.keys(structureMap).length} keys (Depts & Insts).`);

        // 3. Scan Tasks
        const tasksSnapshot = await adminDb.collection('tasks').get();
        const updatePromises: Promise<any>[] = [];

        report.push(`Scanning ${tasksSnapshot.size} tasks...`);

        for (const doc of tasksSnapshot.docs) {
            const task = doc.data();

            // Criteria: Has Legacy String AND (Missing Dept ID OR Mismatch Inst ID)
            // Focus on "Fix Legacy String".
            if (task.department && (!task.departmentId || task.departmentId === '')) {
                const legacy = task.department.toLowerCase().trim();
                const match = structureMap[legacy];

                if (match) {
                    matchedCount++;
                    let needsUpdate = false;
                    let updates: any = {};

                    if (match.type === 'department') {
                        if (task.departmentId !== match.id || task.institutionId !== match.institutionId) {
                            needsUpdate = true;
                            updates = {
                                departmentId: match.id,
                                institutionId: match.institutionId,
                                updatedAt: new Date()
                            };
                        }
                    } else {
                        // Institution Match: Link to Inst, Clear Dept
                        if (task.institutionId !== match.id) {
                            needsUpdate = true;
                            updates = {
                                departmentId: null,
                                institutionId: match.id,
                                updatedAt: new Date()
                            };
                        }
                    }

                    if (needsUpdate) {
                        report.push(`[MATCH] Task ${doc.id} ('${task.title}')`);
                        report.push(`   Legacy: '${task.department}'`);
                        report.push(`   Match:  '${match.name}' (${match.type} ID: ${match.id})`);
                        report.push(`   Action: ${JSON.stringify(updates)}`);

                        if (!dryRun) {
                            updatePromises.push(
                                doc.ref.update(updates).then(() => {
                                    return logSystemActivity({
                                        actorId: user.uid,
                                        actorRole: user.role || 'admin',
                                        action: 'task_structure_backfilled',
                                        entityType: 'task',
                                        entityId: doc.id,
                                        severity: 'warning',
                                        summary: `Backfilled Structure for Task: ${doc.id}`,
                                        metadata: { from: task.department, to: match.id, type: match.type }
                                    });
                                })
                            );
                            updatedCount++;
                        }
                    }
                } else {
                    // Debug Failure
                    report.push(`[NO MATCH] Task: '${legacy}'`);
                }
            }
        }

        report.push("--- Debug Keys (First 20) ---");
        report.push(Object.keys(structureMap).slice(0, 20).join(', '));
        report.push("-----------------------------");

        if (!dryRun && updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }

        report.push(`Result: Matched ${matchedCount}, Updated ${updatedCount} (DryRun: ${dryRun})`);

        return new NextResponse(report.join('\n'), {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
