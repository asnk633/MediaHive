// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { getDriveClient } from '@/lib/drive';
import { logFileDeleted } from '@/app/api/_lib/audit';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // STUB: public.files table is missing.
        console.warn(`GET /api/files/${id}: public.files table missing. Returning 404.`);
        return NextResponse.json({ error: 'File not found (Migration Pending)' }, { status: 404 });

    } catch (error: any) {
        console.error('GET /api/files/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // 1. Fetch File Metadata to get Drive ID
        const { data: file, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 2. Strict Tenant Isolation
        if (file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Delete from Google Drive
        if (file.drive_file_id) {
            try {
                const drive = await getDriveClient();
                await drive.files.delete({
                    fileId: file.drive_file_id,
                    supportsAllDrives: true
                });
                console.log(`[Drive] Deleted file from storage: ${file.drive_file_id}`);
            } catch (driveError: any) {
                // If 404, the file is already gone, which is fine
                if (driveError.code !== 404) {
                    console.error('[Drive] Error deleting file:', driveError);
                    // We continue anyway to cleanup DB, but log it
                }
            }
        }

        // 4. Delete from Database
        const { error: deleteError } = await supabase
            .from('files')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // 5. Log Audit
        await logFileDeleted(user.id, user.tenant_id, id, { name: file.name });

        return NextResponse.json({ success: true, id, message: 'File deleted successfully' });

    } catch (error: any) {
        console.error('DELETE /api/files/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
