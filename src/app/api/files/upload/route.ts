// @ts-nocheck

import { getDriveClient, ensureFolderPath, makeFilePublic } from '@/lib/drive';
import { Readable } from 'stream';
import { verifyUser } from '@/lib/server-utils';
import { logFileUploaded } from '@/app/api/_lib/audit';
import { supabase } from '@/lib/supabaseClient';

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
                    const isAdminOrTeam = userRole === 'admin' || userRole === 'team';

                    if (!isAdminOrTeam && metadata.taskId) {
                        const { data: task, error: taskError } = await supabase
                            .from('tasks')
                            .select('*')
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
                        mimeType: mimeType,
                        driveFileId: file_id,
                        viewLink: viewLink,
                        downloadLink: downloadLink,
                        previewLink: previewLink,
                        created_at: new Date().toISOString(),
                        uploaded_by: metadata.uploaded_by || user.uid,
                        uploadedByRole: metadata.uploadedByRole || user.role,
                        uploadedByName: metadata.uploadedByName || 'Anonymous',
                        visibility: metadata.visibility || { mode: 'all' },
                        folderId: targetFolderId,
                        path: metadata.folder ? `${metadata.folder}/${metadata.subfolder || ''}` : 'Auto',
                        size: driveFile.data.size ? Number(driveFile.data.size) : 0,
                        uploadContext: metadata.uploadContext || (metadata.taskId ? 'task_attachment' : 'downloads_direct'),
                        institution_id: user.institution_id || null,
                        taskId: metadata.taskId || null,
                        event_id: metadata.event_id || null,
                        tenantId: user.tenantId || 1
                    };

                    // Only include department and institution if they have values
                    if (metadata.department) {
                        fileDoc.department = metadata.department;
                    }
                    if (metadata.institution) {
                        fileDoc.institution = metadata.institution;
                    }

                    const { data: createdFile, error: insertError } = await supabase
                        .from('files')
                        .insert([fileDoc])
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Supabase File Insert Error:', insertError);
                        throw insertError;
                    }

                    // 5. Audit Logging
                    await logFileUploaded(
                        user.uid,
                        user.tenantId || 1,
                        createdFile.id,
                        { name: fileDoc.name, type: fileDoc.type }
                    );

                    resolve({ success: true, id: createdFile.id, file_id, ...fileDoc });

                } catch (err: any) {
                    console.error('Upload stream error:', err);
                    reject(err);
                    stream.resume(); // Ensure stream drains logic
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
