import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';

/**
 * GET /api/admin/drive-queue
 * Fetches the drive queue items for the institution.
 */
export async function GET(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institution_id') || user.institution_id;

    if (!institutionId) {
        return NextResponse.json({ error: 'institution_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('drive_queue')
        .select('*')
        .eq('status', 'pending')
        .order('detected_at', { ascending: false });

    if (error) {
        console.error('[DRIVE_QUEUE_GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map snake_case to camelCase for the frontend types (DriveQueueItem)
    const items = ((data as any[]) || []).map(item => ({
        id: item.id,
        driveFileId: item.drive_file_id,
        name: item.name,
        mimeType: item.mime_type,
        size: item.size,
        webViewLink: item.web_view_link,
        thumbnailLink: item.thumbnail_link,
        uploaded_by: item.uploaded_by,
        detectedAt: item.detected_at,
        status: item.status
    }));

    return NextResponse.json(items);
}

/**
 * POST /api/admin/drive-queue
 * Approves or Rejects items in the queue.
 */
export async function POST(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ids, action, metadata } = body;
        const supabase = getSupabaseAdmin();

        const itemIds = ids || [id];
        if (!itemIds || itemIds.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        if (action === 'reject') {
            const { error } = await supabase
                .from('drive_queue')
                .update({ 
                    status: 'rejected', 
                    processed_at: new Date().toISOString(),
                    processed_by: user.uid 
                })
                .in('id', itemIds);

            if (error) throw error;
            return NextResponse.json({ success: true, count: itemIds.length });
        }

        if (action === 'approve') {
            // For now, we just mark as approved. 
            // In a full implementation, this might trigger a file move/publish.
            const { error } = await supabase
                .from('drive_queue')
                .update({ 
                    status: 'approved', 
                    processed_at: new Date().toISOString(),
                    processed_by: user.uid,
                    metadata: metadata || {}
                })
                .in('id', itemIds);

            if (error) throw error;
            
            // Note: If bulk, we return the data format expected by executeBulkAction
            return NextResponse.json({ 
                success: itemIds.length, 
                failed: 0,
                message: `Successfully approved ${itemIds.length} items` 
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (e: any) {
        console.error('[DRIVE_QUEUE_POST] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
