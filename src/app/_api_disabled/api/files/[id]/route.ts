
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { getDriveClient } from '@/lib/drive';
import { logSystemActivity } from '@/lib/server/activity-logger';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
        }

        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const docRef = adminDb.collection('files').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const data = docSnap.data();

        // Return metadata
        return NextResponse.json({
            id: docSnap.id,
            ...data,
            // Ensure createdAt is serialized if it's a timestamp
            createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data?.createdAt
        });

    } catch (error: any) {
        console.error('GET /api/files/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
        }

        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get file doc from Firestore to find Drive ID
        const docRef = adminDb.collection('files').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileData = docSnap.data();

        // Check permissions: Admin or Uploader
        const isUploader = fileData?.uploadedBy === user.uid;
        const isAdmin = user.role === 'admin';

        if (!isAdmin && !isUploader) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Trash from Google Drive (if driveFileId exists)
        if (fileData?.driveFileId) {
            try {
                const drive = await getDriveClient();
                await drive.files.update({
                    fileId: fileData.driveFileId,
                    requestBody: {
                        trashed: true
                    }
                });
                console.log(`Drive file ${fileData.driveFileId} trashed.`);
            } catch (driveErr) {
                console.error('Failed to trash Google Drive file', driveErr);
                // Continue to delete from DB even if Drive fails? 
                // Yes, better to remove broken link.
            }
        }

        // 2. Delete from Firestore
        await docRef.delete();

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role || 'viewer',
            action: 'file_deleted',
            entityType: 'file',
            entityId: id,
            summary: `File deleted: ${fileData?.name || 'Unknown File'}`,
            severity: 'warning',
            metadata: {
                driveId: fileData?.driveFileId
            },
            visibility: { mode: 'admin' }
        });

        return NextResponse.json({ success: true, id });

    } catch (error: any) {
        console.error('DELETE /api/files/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
