import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';
import * as admin from 'firebase-admin';
import { getDriveClient, ensureFolderPath, makeFilePublic, makeFilePrivate, DRIVE_CONFIG } from '@/lib/drive';
import { Task, TaskFile, TaskFileSection, AttachmentLog } from '@/types/task';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const taskId = params.id;

        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const section = formData.get('section') as TaskFileSection;

        if (!file || !section) {
            return NextResponse.json({ error: 'File and section are required' }, { status: 400 });
        }

        // 1. Fetch Task for Permission Check
        const taskRef = adminDb.collection('tasks').doc(taskId);
        const taskSnap = await taskRef.get();
        if (!taskSnap.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const taskData = taskSnap.data() as Task;

        // 2. Permission Check
        const isCreator = user.uid === (typeof taskData.createdBy === 'string' ? taskData.createdBy : taskData.createdBy?.uid);
        const isAdmin = user.role === 'admin';
        const isTeam = user.role === 'team';

        // Check assignment
        const assignedToArray = Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [];
        const isAssignee = assignedToArray.some((u: any) => {
            const uid = typeof u === 'string' ? u : u.uid;
            return uid === user.uid;
        });

        if (section === 'requester-inputs') {
            if (!isAdmin && !isCreator && !isAssignee) {
                return NextResponse.json({ error: 'Only the requester, assignee, or admin can upload to this section' }, { status: 403 });
            }
        } else if (section === 'team-working-files' || section === 'team-final-exports') {
            // Allow Assignees (even if Guest role) to upload deliverables
            if (!isAdmin && !isTeam && !isAssignee) {
                return NextResponse.json({ error: 'Only team members, assignees, or admin can upload to team sections' }, { status: 403 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }

        const isFinal = section === 'team-final-exports';
        const showInDownloadsRaw = formData.get('showInDownloads');
        let showInDownloads = false;
        if (isFinal) {
            showInDownloads = showInDownloadsRaw === 'true';
        }

        // 3. Drive Setup
        let rootFolderId = DRIVE_CONFIG.folderId!;
        let drive: any;
        let taskFolderId: string;
        let targetFolderId: string;

        try {
            drive = await getDriveClient();
            const rootName = 'Thaiba-Media-Tasks';
            rootFolderId = await ensureFolderPath(drive, rootFolderId, [rootName]);

            const taskFolderName = `Task-${taskId}`;
            taskFolderId = await ensureFolderPath(drive, rootFolderId, [taskFolderName]);
        } catch (driveErr: any) {
            console.error('Drive Setup Failed:', driveErr);
            throw new Error(`Failed to access Google Drive folders: ${driveErr.message}`);
        }

        if (!taskFolderId) {
            console.error('CRITICAL: taskFolderId is undefined after ensureFolderPath');
            throw new Error('Drive Setup Error: Could not resolve or create task folder.');
        }
        console.log(`[DEBUG_UPLOAD] Resolved Task Folder ID: ${taskFolderId} (Root: ${rootFolderId})`);

        if (taskData.driveFolderId !== taskFolderId) {
            await taskRef.update({ driveFolderId: taskFolderId });
        }

        // Add propagation delay to ensure Task Folder is recognized by Drive API
        // "File not found" errors occurring here suggest specific Drive replicas haven't synced the new folder yet
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const subfolderName = section;
            console.log(`[DEBUG_UPLOAD] Ensuring subfolder '${subfolderName}' in parent '${taskFolderId}'`);
            targetFolderId = await ensureFolderPath(drive, taskFolderId, [subfolderName]);
            console.log(`[DEBUG_UPLOAD] Target Folder ID: ${targetFolderId}`);

            // Explicit verification of folder existence before upload
            // This catches "File not found" issues where the folder ID is valid but not visible to the service account
            try {
                await drive.files.get({
                    fileId: targetFolderId,
                    fields: 'id, name, mimeType',
                    supportsAllDrives: true
                });
                console.log(`[DEBUG_UPLOAD] Verified folder ${targetFolderId} exists and is accessible.`);
            } catch (verifyErr: any) {
                console.error(`[DEBUG_UPLOAD] CRITICAL: Folder ${targetFolderId} returned by ensureFolderPath is NOT accessible via files.get().`, verifyErr);
                throw new Error(`Folder verification failed: ${verifyErr.message}`);
            }

            // 4. Upload File
            const buffer = Buffer.from(await file.arrayBuffer());
            const stream = Readable.from(buffer);

            const driveFile = await drive.files.create({
                requestBody: {
                    name: file.name,
                    parents: [targetFolderId],
                },
                media: {
                    mimeType: file.type,
                    body: stream,
                },
                fields: 'id, webViewLink, webContentLink',
                supportsAllDrives: true,
            });

            var fileId = driveFile.data.id!;
            var webViewLink = driveFile.data.webViewLink;
        } catch (uploadErr: any) {
            console.error('Drive Upload Failed:', uploadErr);
            throw new Error(`Failed to upload file to Drive: ${uploadErr.message}`);
        }

        // 5. Apply Permissions
        if (showInDownloads) {
            await makeFilePublic(drive, fileId);
        }

        // 6. Create Metadata Object
        // IMPORTANT: We must also save this to the global 'files' collection for consistency/verification
        // and use the Firestore ID as the primary ID, not the Drive ID.

        const metadataForDb = {
            userId: user.uid,
            name: file.name,
            originalName: file.name,
            size: file.size,
            type: file.type,
            storageUrl: webViewLink || '',
            storagePath: `tasks/${taskId}/${section}/${file.name}`, // Virtual path concept
            uploadedDate: new Date().toISOString(),
            uploadedBy: user.uid,
            driveFileId: fileId,
            taskId: taskId,
            section: section,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const fileDocRef = await adminDb.collection('files').add(metadataForDb);
        const fileFirestoreId = fileDocRef.id;

        const newFile: TaskFile = {
            id: fileFirestoreId, // Use Firestore ID
            name: file.name,
            mimeType: file.type,
            url: webViewLink || '',
            size: file.size,
            section: section,
            showInDownloads: showInDownloads,
            uploadedBy: {
                uid: user.uid,
                name: user.name || user.email || 'Unknown',
                role: user.role || 'guest'
            },
            uploadedAt: new Date().toISOString()
        };

        // 7. Activity Log (SUBCOLLECTION)
        const log: AttachmentLog = {
            id: randomUUID(),
            fileId: fileFirestoreId,
            fileName: newFile.name,
            action: 'upload',
            performedBy: {
                uid: user.uid,
                name: user.name || 'Unknown',
                role: user.role || 'guest'
            },
            timestamp: new Date().toISOString()
        };

        // Batch update: Update Task File Array AND Add Log to Subcollection
        const batch = adminDb.batch();
        batch.update(taskRef, {
            files: admin.firestore.FieldValue.arrayUnion(newFile)
        });
        const logRef = taskRef.collection('activity_logs').doc(log.id);
        batch.set(logRef, log);
        await batch.commit();

        // Log system activity
        const { logSystemActivity } = await import('@/lib/server/activity-logger');
        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role || 'viewer',
            action: 'file_uploaded',
            entityType: 'file',
            entityId: fileFirestoreId,
            summary: `Task Attachment Uploaded: ${file.name}`,
            metadata: {
                taskId,
                section
            },
            visibility: { mode: 'internal' }
        });

        return NextResponse.json({ success: true, file: newFile, id: fileFirestoreId });

    } catch (error: any) {
        console.error('Upload Error Stack:', error.stack);
        console.error('Upload Error Message:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const taskId = params.id;

        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) return NextResponse.json({ error: 'File ID is required' }, { status: 400 });

        const taskRef = adminDb.collection('tasks').doc(taskId);
        const taskSnap = await taskRef.get();
        if (!taskSnap.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const taskData = taskSnap.data() as Task;
        const files = taskData.files || [];
        const fileToDelete = files.find(f => f.id === fileId);

        if (!fileToDelete) return NextResponse.json({ error: 'File not found in task' }, { status: 404 });

        const isAdmin = user.role === 'admin';
        const isUploader = fileToDelete.uploadedBy.uid === user.uid;

        if (!isAdmin && !isUploader) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const drive = await getDriveClient();
        try {
            await drive.files.delete({ fileId: fileId });
        } catch (driveError) {
            console.warn('Drive delete failed (might verify manual cleanup)', driveError);
        }

        // Activity Log (SUBCOLLECTION)
        const log: AttachmentLog = {
            id: randomUUID(),
            fileId,
            fileName: fileToDelete.name,
            action: 'delete',
            performedBy: {
                uid: user.uid,
                name: user.name || 'Unknown',
                role: user.role || 'guest'
            },
            timestamp: new Date().toISOString()
        };

        const batch = adminDb.batch();
        batch.update(taskRef, {
            files: admin.firestore.FieldValue.arrayRemove(fileToDelete)
        });
        const logRef = taskRef.collection('activity_logs').doc(log.id);
        batch.set(logRef, log);
        await batch.commit();

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('Attachment delete failed', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const taskId = params.id;

        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { fileId, showInDownloads } = body;

        if (!fileId || typeof showInDownloads !== 'boolean') {
            return NextResponse.json({ error: 'fileId and showInDownloads are required' }, { status: 400 });
        }

        const taskRef = adminDb.collection('tasks').doc(taskId);
        const taskSnap = await taskRef.get();
        if (!taskSnap.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const taskData = taskSnap.data() as Task;
        const files = taskData.files || [];
        const targetFileIndex = files.findIndex(f => f.id === fileId);

        if (targetFileIndex === -1) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const targetFile = files[targetFileIndex];

        if (targetFile.section !== 'team-final-exports') {
            if (showInDownloads) {
                return NextResponse.json({ error: 'Only Final Deliverables can be made public' }, { status: 400 });
            }
        }

        const isAdmin = user.role === 'admin';
        const isTeam = user.role === 'team';
        if (!isAdmin && !isTeam) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Update Drive Permission
        const drive = await getDriveClient();
        if (showInDownloads) {
            await makeFilePublic(drive, fileId);
        } else {
            await makeFilePrivate(drive, fileId);
        }

        // 2. Update Firestore
        const updatedFile = { ...targetFile, showInDownloads };

        // Activity Log (SUBCOLLECTION)
        const log: AttachmentLog = {
            id: randomUUID(),
            fileId,
            fileName: targetFile.name,
            action: showInDownloads ? 'visibility_public' : 'visibility_private',
            performedBy: {
                uid: user.uid,
                name: user.name || 'Unknown',
                role: user.role || 'guest'
            },
            timestamp: new Date().toISOString()
        };

        const batch = adminDb.batch();
        batch.update(taskRef, {
            files: [
                ...files.filter(f => f.id !== fileId),
                updatedFile
            ]
        });
        const logRef = taskRef.collection('activity_logs').doc(log.id);
        batch.set(logRef, log);
        await batch.commit();

        return NextResponse.json({ success: true, file: updatedFile });

    } catch (e: any) {
        console.error('Attachment update failed', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
