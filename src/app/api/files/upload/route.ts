
import { getDriveClient, ensureFolderPath, makeFilePublic } from '@/lib/drive';
import { ServerNotification } from '@/lib/server-notification';
import { Readable } from 'stream';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { logServerActivity } from '@/lib/server/activity-logger';

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for Busboy/Stream
// export const dynamic = 'force-dynamic'; // Disable caching

export async function POST(req: NextRequest) {
    try {
        // Log incoming request headers for debugging
        const authHeader = req.headers.get('Authorization');
        console.log('[API /api/files/upload] Authorization header received:', authHeader ? 'Yes' : 'No');
        if (authHeader) {
            console.log('[API /api/files/upload] Authorization header value:', authHeader.substring(0, 30) + '...');
        }

        // Verify user authentication
        const user = await verifyUser(req);
        if (!user) {
            console.error('[API /api/files/upload] verifyUser failed - user is null');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[API /api/files/upload] User authenticated successfully:', user);

        // Only admin and team users can upload files
        // Only admin and team users can upload files - UPDATED to allow assignees (Granular check inside)
        // if (user.role !== 'admin' && user.role !== 'team') {
        //    return NextResponse.json({ error: 'Forbidden: Only admin and team users can upload files' }, { status: 403 });
        // }
        const contentType = req.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
        }

        // Robust Busboy loading with Debugging
        let Busboy;
        try {
            const busboyModule = require('busboy');
            // Check if it's a default export (ESM/Webpack interop)
            if (busboyModule.default && typeof busboyModule.default === 'function') {
                Busboy = busboyModule.default;
            } else {
                Busboy = busboyModule;
            }
            console.log('Busboy loaded. Type:', typeof Busboy);
        } catch (e) {
            console.error('Failed to require busboy:', e);
            throw new Error('Server configuration error: Upload library missing');
        }

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
                        console.log('Metadata received:', metadata);
                    } catch (e) {
                        console.error('Failed to parse metadata JSON', e);
                    }
                }
            });

            busboy.on('file', async (name: string, stream: any, info: any) => {
                fileProcessed = true;
                const { filename, mimeType } = info;
                console.log(`File incoming: ${filename} (${mimeType})`);

                // 0. Metadata Fallback (Header Backup)
                // If busboy hasn't parsed the field yet (ordering issue), try headers
                if (!metadata || Object.keys(metadata).length === 0) {
                    const headerMetadata = req.headers.get('X-Upload-Metadata');
                    if (headerMetadata) {
                        try {
                            const parsedHeader = JSON.parse(headerMetadata);
                            console.log('Metadata recovered from X-Upload-Metadata header:', parsedHeader);
                            metadata = { ...metadata, ...parsedHeader };
                        } catch (e) {
                            console.warn('Failed to parse X-Upload-Metadata header');
                        }
                    }
                }

                try {
                    // PERMISSION CHECK (Granular)
                    const userRole = (user.role || '').toLowerCase();
                    const isAdminOrTeam = userRole === 'admin' || userRole === 'team';
                    let isTaskAssignee = false;

                    if (!isAdminOrTeam) {
                        // User is likely a Guest or Restricted Team Member
                        // They can ONLY upload if they are assigned to the task they are uploading for
                        if (metadata.taskId) {
                            try {
                                const taskDoc = await adminDb.collection('tasks').doc(metadata.taskId).get();
                                if (taskDoc.exists) {
                                    const task = taskDoc.data();
                                    isTaskAssignee = Array.isArray(task?.assignedTo) && task.assignedTo.some((u: any) => (typeof u === 'string' ? u : u.uid) === user.uid);
                                }
                            } catch (permErr) {
                                console.error('Permission check failed for task fetch', permErr);
                            }
                        }

                        if (!isTaskAssignee) {
                            let assignedDebug = '[]';
                            try {
                                if (metadata.taskId) {
                                    const taskDoc = await adminDb.collection('tasks').doc(metadata.taskId).get();
                                    const task = taskDoc.data();
                                    assignedDebug = JSON.stringify(task?.assignedTo || []).substring(0, 100);
                                }
                            } catch (e) { assignedDebug = 'error_reading_task'; }

                            const debugInfo = `Role=${user.role}, Me=${user.uid}, TaskId=${metadata?.taskId || 'missing'}, AssignedTo=${assignedDebug}`;
                            console.error(`[Upload] Forbidden: ${debugInfo}`);
                            throw new Error(`Forbidden: You do not have permission. (Debug: ${debugInfo})`);
                        }
                    }

                    // 1. Determine Target Folder
                    let targetFolderId = rootFolderId;
                    if (metadata && metadata.folder) {
                        const pathParts = [metadata.folder.trim()];
                        if (metadata.subfolder && metadata.subfolder.trim()) {
                            pathParts.push(metadata.subfolder.trim());
                        }
                        console.log(`Creating / Ensuring folder path: ${pathParts.join('/')} `);
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
                        console.log(`Auto - routing to: ${defaultName} `);
                        targetFolderId = await ensureFolderPath(drive, rootFolderId, [defaultName]);
                    }

                    // 2. Upload to Drive (Piping stream directly)
                    console.log(`[Upload] Starting Upload to Drive (Resumable forced) for: ${filename}`);
                    // Use 'resource' alias and pass uploadType in options as well to force it
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

                    const fileId = driveFile.data.id;
                    if (!fileId) throw new Error('Failed to retrieve file ID from Google Drive');

                    const viewLink = driveFile.data.webViewLink;
                    const downloadLink = driveFile.data.webContentLink;

                    // Construct a direct preview URL
                    // default thumbnailLink is small, so we use the undocumented 'sz' parameter for larger images
                    const previewLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

                    // 2.5. Make Public
                    await makeFilePublic(drive, fileId);

                    // 3. Save Metadata to Firestore
                    const db = adminDb;

                    const fileDoc: any = {
                        name: metadata.name || filename,
                        type: mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'document',
                        mimeType: mimeType,
                        driveFileId: fileId,
                        viewLink: viewLink,
                        downloadLink: downloadLink,
                        previewLink: previewLink,
                        createdAt: FieldValue.serverTimestamp(),
                        uploadedBy: metadata.uploadedBy || user.uid,
                        uploadedByRole: metadata.uploadedByRole || user.role,
                        uploadedByName: metadata.uploadedByName || 'Anonymous',
                        visibility: metadata.visibility || { mode: 'all' },
                        folderId: targetFolderId,
                        path: metadata.folder ? `${metadata.folder}/${metadata.subfolder || ''}` : 'Auto',
                        size: driveFile.data.size ? Number(driveFile.data.size) : 0,
                        uploadContext: metadata.uploadContext || (metadata.taskId ? 'task_attachment' : 'downloads_direct')
                    };

                    // Add institutionId only if it exists
                    if (user.institutionId) {
                        fileDoc.institutionId = user.institutionId;
                    }

                    // Only include department and institution if they have values
                    if (metadata.department) {
                        fileDoc.department = metadata.department;
                    }
                    if (metadata.institution) {
                        fileDoc.institution = metadata.institution;
                    }

                    // Add taskId to fileDoc if present in metadata
                    if (metadata.taskId) {
                        fileDoc.taskId = metadata.taskId;
                    }

                    await db.collection('files').add(fileDoc);
                    console.log('Metadata saved to Firestore');

                    await logServerActivity({
                        type: 'file_uploaded',
                        entityType: 'file',
                        entityId: fileDoc.driveFileId || 'unknown',
                        title: `File Uploaded: ${fileDoc.name}`,
                        performedBy: user.name || 'Unknown',
                        performedByRole: user.role || 'viewer',
                        metadata: {
                            folder: fileDoc.path,
                            type: fileDoc.type
                        }
                    });

                    // 4. Trigger Notification (Phase 1.5)
                    try {
                        // Notify Admins about new file - DISABLED PER USER REQUEST (Noise reduction 2026-01-05)
                        /*
                        // Fetch all admins
                        const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
                        const adminIds = adminsSnap.docs.map((d: any) => d.id);

                        await ServerNotification.notifyFileUploaded(
                            fileId || 'unknown_id',
                            metadata.name || filename,
                            metadata.uploadedBy || 'system',
                            adminIds
                        );
                        */

                        // PHASE 6.1 — Media Upload → Task Awareness

                        // PHASE 6.1 — Media Upload → Task Awareness
                        // If this file is linked to a task, check if it's the first media upload
                        if (metadata.taskId) {
                            try {
                                // Import the TaskAutomationService dynamically to avoid circular dependencies
                                const { TaskAutomationServiceServer } = await import('@/lib/task-automation.server');

                                // Check if this is the first media file for this task
                                const mediaFiles = await db.collection('files').where('taskId', '==', metadata.taskId).get();

                                // If this is the first file (count is 1, which is this file), suggest task status change
                                if (mediaFiles.docs.length === 1) {
                                    TaskAutomationServiceServer.suggestTaskInProgress(metadata.taskId, metadata.uploadedBy || user.uid);
                                }
                            } catch (automationErr) {
                                console.error('Failed to trigger task automation for media upload', automationErr);
                                // Don't fail the upload just because automation failed
                            }
                        }
                    } catch (notifErr) {
                        console.error("Failed to send upload notification", notifErr);
                        // Don't fail the upload just because notification failed
                    }

                    resolve({ success: true, fileId, ...fileDoc });

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
