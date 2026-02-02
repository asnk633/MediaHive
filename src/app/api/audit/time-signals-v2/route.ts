import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { Task } from '@/types/task';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // const adminDb = adminDb;
        const snapshot = await adminDb.collection('tasks').get();
        const tasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const report = {
            totalTasks: tasks.length,
            missingUpdatedAt: 0,
            missingFirstDeliverableAt: 0,
            backfilledUpdatedAt: 0,
            backfilledFirstDeliverableAt: 0,
            details: [] as string[]
        };

        const batch = adminDb.batch();
        let ops = 0;

        for (const task of tasks) {
            let needsUpdate = false;
            const updatePayload: any = {};

            // 1. Check updatedAt
            if (!task.updatedAt) {
                report.missingUpdatedAt++;
                // Use ISO string, consistent with new tasks creation
                updatePayload.updatedAt = (task.createdAt && typeof task.createdAt === 'string')
                    ? task.createdAt
                    : new Date().toISOString();

                needsUpdate = true;
                report.backfilledUpdatedAt++;
                report.details.push(`Backfilled updatedAt for Task ${task.id}`);
            }

            // 2. Check firstDeliverableAt
            if (!task.firstDeliverableAt) {
                const delSnap = await adminDb.collection('deliverables')
                    .where('taskId', '==', task.id)
                    .get();

                if (!delSnap.empty) {
                    report.missingFirstDeliverableAt++;

                    // Sort in memory to avoid composite index requirement
                    const allDeliverables = delSnap.docs.map(doc => doc.data());
                    allDeliverables.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                        return dateA.getTime() - dateB.getTime();
                    });

                    const firstDel = allDeliverables[0];

                    // Convert to ISO if it's a timestamp object
                    let dateStr = firstDel.createdAt;
                    if (typeof firstDel.createdAt === 'object' && firstDel.createdAt.toDate) {
                        dateStr = firstDel.createdAt.toDate().toISOString();
                    } else if (typeof firstDel.createdAt === 'object' && firstDel.createdAt._seconds) {
                        dateStr = new Date(firstDel.createdAt._seconds * 1000).toISOString();
                    }

                    updatePayload.firstDeliverableAt = dateStr;
                    needsUpdate = true;
                    report.backfilledFirstDeliverableAt++;
                    report.details.push(`Backfilled firstDeliverableAt for Task ${task.id}`);
                }
            }

            if (needsUpdate) {
                const ref = adminDb.collection('tasks').doc(task.id);
                batch.update(ref, updatePayload);
                ops++;
            }
        }

        if (ops > 0) {
            await batch.commit();
        }

        return NextResponse.json({ ...report, opsCommitted: ops });

    } catch (error: any) {
        console.error("Audit Failed:", error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 200 }); // Return 200 to see error in tool
    }
}
