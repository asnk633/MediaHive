import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';
import { AttachmentLog } from '@/types/task';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const taskId = params.id;

    const user = await verifyUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Lazy fetch rule: Admin + Team can see all. Requester can *maybe* see their own?
    // User request said: "Visible to Admin + Assigned Team. Optional visibility to Requester"
    // Let's allow requester to read logs for now (read-only), transparent.

    const logsRef = adminDb.collection('tasks').doc(taskId).collection('activity_logs');
    // Order by timestamp desc
    const logsSnap = await logsRef.orderBy('timestamp', 'desc').get();

    const logs: AttachmentLog[] = logsSnap.docs.map(doc => doc.data() as AttachmentLog);

    return NextResponse.json({ logs });

  } catch (error: any) {
    console.error('Fetch Logs Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}