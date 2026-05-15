// @ts-nocheck

import { getDriveClient, ensureFolderPath, makeFilePublic } from '@/lib/drive';
import { Readable } from 'stream';
import { verifyUser } from '@/lib/server/server-utils';
import { logFileUploaded } from '@/app/api/_lib/audit';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { withTenant } from '@/lib/tenantQuery';

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for Busboy/Stream
// export const dynamic = 'force-dynamic'; // Disable caching

export async function POST(req: NextRequest) {
    try {
        // Verify user authentication
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        console.log(`[UploadAPI] 📁 Starting upload for user: ${user.uid}, tenant: ${tenantId}`);
        
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[POST /api/files/upload] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const contentType = req.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        // Robust Busboy loading
        let Busboy;
        const busboyModule = require('busboy');
        Busboy = busboyModule.default || busboyModule;

        // Call as factory function (busboy v1.x API)
        const busboy = Busboy({ headers: { 'content-type': contentType } });

        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!rootFolderId) {
            throw new Error('Server configuration error: GOOGLE_DRIVE_FOLDER_ID not set');
        }

        const drive = await getDriveClient();
        const supabaseAdmin = getSupabaseAdmin();

        // Promise to handle the single file upload
        const uploadResult = new Promise<any>((resolve, reject) => {
            let metadata: any = {};
            let fileProcessed = false;

            busboy.on('field', (name: string, val: string) => {
                if (name === 'metadata') {
                    try {
                        metadata = JSON.parse(val);
                    } catch (e) {
                        console.error('Failed to parse metadata JSON', e);
                    }
                }
            });

            busboy.on('file', async (name: string, stream: any, info: any) => {
                fileProcessed = true;
                const { filename, mimeType } = info;

                // Metadata Fallback
                if (!metadata || Object.keys(metadata).length === 0) {
                    const headerMetadata = req.headers.get('X-Upload-Metadata');
                    if (headerMetadata) {
                        try {
                            metadata = JSON.parse(headerMetadata);
                        } catch (e) {
                            console.warn('Failed to parse X-Upload-Metadata header');
                        }
                    }
                }

                try {
                    // 1. Permission Check (Supabase Native)
                    const userRole = (user.role || '').toLowerCase();
                    const isAdminOrTeam = userRole === 'admin' || (userRole === 'manager' || userRole === 'member');

                    if (!isAdminOrTeam && metadata.taskId) {
                        const { data: task, error: taskError } = await withTenant(
                            supabaseAdmin
                                .from('tasks')
                                .select('*'),
                            tenantId
                        )
                            .eq('id', metadata.taskId)
                            .single();

                        if (taskError || !task) {
                            throw new Error('Forbidden: Task not found or permission denied');
                        }
                    }

                    // 2. Determine Target Folder
                    let targetFolderId = rootFolderId;
                    if (metadata && metadata.folder) {
                        const pathParts = [metadata.folder.trim()];
                        if (metadata.subfolder && metadata.subfolder.trim()) {
                            pathParts.push(metadata.subfolder.trim());
                        }
                        targetFolderId = await ensureFolderPath(drive, rootFolderId, pathParts);
                    } else if (metadata && metadata.type) {
                        let category = metadata.type || 'other';
                        if (mimeType.startsWith('video/')) category = 'video';
                        const typeToFolderMap: Record<string, string> = {
                            'image': 'Photos',
                            'video': 'Videos',
                            'document': 'Essential Documents',
                            'other': 'Essential Documents'
                        };
                        const defaultName = typeToFolderMap[category] || 'Essential Documents';
                        targetFolderId = await ensureFolderPath(drive, rootFolderId, [defaultName]);
                    }

                    // 3. Upload to Drive (Piping stream directly)
                    const driveFile = await drive.files.create({
                        requestBody: {
                            name: metadata.name || filename,
                            mimeType: mimeType,
                            parents: [targetFolderId],
                        },
                        media: {
                            mimeType: mimeType,
                            body: stream, // Stream piped directly from request
                        },
                        fields: 'id, webViewLink, webContentLink, size',
                        supportsAllDrives: true,
                    });

                    console.log(`[UploadAPI] ✅ Drive upload successful: ${driveFile.data.id}`);

                    const file_id = driveFile.data.id;
                    if (!file_id) throw new Error('Failed to retrieve file ID from Google Drive');

                    const viewLink = driveFile.data.webViewLink;
                    const downloadLink = driveFile.data.webContentLink;

                    // Construct a direct preview URL
                    // default thumbnailLink is small, so we use the undocumented 'sz' parameter for larger images
                    const previewLink = `https://drive.google.com/thumbnail?id=${file_id}&sz=w1000`;

                    // 2.5. Make Public
                    await makeFilePublic(drive, file_id);

                    // 4. Save Metadata to Supabase
                    const fileDoc: any = {
                        name: metadata.name || filename,
                        type: mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'document',
                        mime_type: mimeType,
                        drive_file_id: file_id,
                        web_view_link: viewLink,
                        download_link: downloadLink,
                        thumbnail_link: previewLink,
                        created_at: new Date().toISOString(),
                        uploaded_by: metadata.uploaded_by || user.uid,
                        uploaded_by_role: metadata.uploadedByRole || user.role,
                        uploaded_by_name: metadata.uploadedByName || 'Anonymous',
                        visibility: metadata.visibility || { mode: 'all' },
                        folder_id: targetFolderId,
                        path: metadata.folder ? `${metadata.folder}/${metadata.subfolder || ''}` : 'Auto',
                        size: driveFile.data.size ? Number(driveFile.data.size) : 0,
                        upload_context: metadata.uploadContext || (metadata.taskId ? 'task_attachment' : 'downloads_direct'),
                        institution_id: user.institution_id || null,
                        task_id: metadata.taskId || null,
                        event_id: metadata.event_id || null,
                        tenant_id: tenantId
                    };

                    // Only include department and institution if they have values
                    if (metadata.department) {
                        fileDoc.department = metadata.department;
                    }
                    if (metadata.institution) {
                        fileDoc.institution = metadata.institution;
                    }

                    let createdFile;
                    try {
                        const { data, error: insertError } = await supabaseAdmin
                            .from('files')
                            .insert([fileDoc])
                            .select()
                            .single();

                        if (insertError) {
                            console.error(`[UploadAPI] ❌ Supabase insert error:`, insertError);
                            throw insertError;
                        }
                        
                        console.log(`[UploadAPI] ✅ Supabase metadata saved: ${data.id}`);
                        createdFile = data;
                    } catch (dbError) {
                        console.error('[UploadAPI] ❌ DB Insert failed, cleaning up Drive file:', file_id);
                        try {
                            await drive.files.delete({ fileId: file_id });
                        } catch (driveErr) {
                            console.error('[UploadAPI] 🛑 CRITICAL: Failed to cleanup orphaned Drive file:', file_id, driveErr);
                        }
                        throw dbError;
                    }

                    // 5. Audit Logging
                    await logFileUploaded(
                        user.uid,
                        tenantId,
                        createdFile.id,
                        { name: fileDoc.name, type: fileDoc.type }
                    );

                    resolve({ success: true, id: createdFile.id, file_id, viewLink, downloadLink, ...fileDoc });

                } catch (err: any) {
                    console.error('Upload stream error:', err);
                    reject(err);
                    stream.resume(); // Ensure stream drains
                }
            });

            busboy.on('finish', () => {
                if (!fileProcessed) {
                    resolve({ success: false, error: 'No file uploaded' });
                }
            });

            busboy.on('error', (err: any) => {
                console.error('Busboy error:', err);
                reject(err);
            });
        });

        // Start piping
        // @ts-ignore
        Readable.fromWeb(req.body).pipe(busboy);

        const result = await uploadResult;
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
