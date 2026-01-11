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

        if (section === 'requester-inputs') {
            if (!isAdmin && !isCreator) {
                return NextResponse.json({ error: 'Only the requester or admin can upload to this section' }, { status: 403 });
            }
        } else if (section === 'team-working-files' || section === 'team-final-exports') {
            if (!isAdmin && !isTeam) {
                return NextResponse.json({ error: 'Only team members or admin can upload to team sections' }, { status: 403 });
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
        const drive = await getDriveClient();
        let rootFolderId = DRIVE_CONFIG.folderId!;
        const rootName = 'Thaiba-Media-Tasks';
        rootFolderId = await ensureFolderPath(drive, rootFolderId, [rootName]);

        const taskFolderName = `Task-${taskId}`;
        const taskFolderId = await ensureFolderPath(drive, rootFolderId, [taskFolderName]);

        if (taskData.driveFolderId !== taskFolderId) {
            await taskRef.update({ driveFolderId: taskFolderId });
        }

        const subfolderName = section;
        const targetFolderId = await ensureFolderPath(drive, taskFolderId, [subfolderName]);

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
        });

        const fileId = driveFile.data.id!;

        // 5. Apply Permissions
        if (showInDownloads) {
            await makeFilePublic(drive, fileId);
        }

        // 6. Create Metadata Object
        const newFile: TaskFile = {
            id: fileId,
            name: file.name,
            mimeType: file.type,
            url: driveFile.data.webViewLink || '',
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
            fileId,
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

        return NextResponse.json({ success: true, file: newFile });

    } catch (error: any) {
        console.error('Upload Error:', error);
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
