import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { SmartRulesEngineServer } from '@/lib/smart-rules.server';
import { Task } from '@/types/task';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // const adminDb = adminDb;
        const snapshot = await adminDb.collection('tasks').get();
        const tasks: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const report = {
            totalTasks: tasks.length,
            byStage: {
                shoot: 0,
                edit: 0,
                review: 0,
                publish: 0,
                intake: 0,
                general: 0,
                unknown: 0
            } as Record<string, number>,
            auditTimestamp: new Date().toISOString(),
            unresolved: [] as string[]
        };

        tasks.forEach(task => {
            const inferred = SmartRulesEngineServer.inferStage(task);

            if (report.byStage[inferred] !== undefined) {
                report.byStage[inferred]++;
            } else {
                report.byStage['unknown']++;
                report.unresolved.push(task.title);
            }
        });

        // Sort by stage for cleaner view, though keys are fixed
        console.log("Audit Report Generated:", report);

        return NextResponse.json(report);

    } catch (error: any) {
        console.error("Audit Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
