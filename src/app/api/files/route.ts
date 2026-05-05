import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { getSupabaseServerClient } from '@/lib/supabaseServerClient';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await getSupabaseServerClient();
        const { tenantId } = user; // verifyUser returns user object with tenantId
        const url = new URL(req.url);
        const institutionId = url.searchParams.get('institutionId');

        let query = supabase
            .from(TABLES.MEDIA)
            .select('*')
            .eq('tenant_id', tenantId)
            .or('upload_context.is.null,upload_context.neq.inventory_asset'); // Include both legacy nulls and non-inventory files

        if (institutionId) {
            // Point 4: Deep-link protection. Backend must reject unauthorized institution access.
            if (user.role !== 'admin' && !user.allowed_institutions?.includes(institutionId)) {
                return NextResponse.json({ error: 'Forbidden: You do not have access to this workspace' }, { status: 403 });
            }
            query = query.eq('institution_id', institutionId);
        }

        const { data: files, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('GET /api/files error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map snake_case to camelCase for the frontend
        const mappedFiles = (files || []).map(f => ({
            ...f,
            mimeType: f.mime_type,
            driveFileId: f.drive_file_id,
            viewLink: f.web_view_link,
            downloadLink: f.download_link,
            previewLink: f.thumbnail_link,
            uploadedByName: f.uploaded_by_name,
            uploadedByRole: f.uploaded_by_role,
            folderId: f.folder_id,
            uploadContext: f.upload_context,
            taskId: f.task_id
        }));

        return NextResponse.json({ files: mappedFiles });

    } catch (error: any) {
        console.error('GET /api/files catch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
