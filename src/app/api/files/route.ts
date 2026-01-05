
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyUser } from '@/lib/server-utils';
import { DriveFile } from '@/types/file';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('taskId');
        const eventId = searchParams.get('eventId');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Fetch files from Firestore 'files' collection
        let filesQuery = adminDb.collection('files').orderBy('createdAt', 'desc');

        // Apply filters if provided
        if (taskId) {
            filesQuery = adminDb.collection('files').where('taskId', '==', taskId);
        } else if (eventId) {
            filesQuery = adminDb.collection('files').where('eventId', '==', eventId);
        }

        const snapshot = await filesQuery.limit(limit).get();

        const files: DriveFile[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                type: data.type,
                mimeType: data.mimeType,
                driveFileId: data.driveFileId,
                viewLink: data.viewLink,
                downloadLink: data.downloadLink,
                uploadedBy: data.uploadedBy,
                uploadedByRole: data.uploadedByRole,
                uploadedByName: data.uploadedByName,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                visibility: data.visibility || { mode: 'all' },
                department: data.department,
                institution: data.institution,
                folder: data.folder,
                path: data.path,
                module: data.module,
                taskId: data.taskId,
                eventId: data.eventId
            } as any;
        })
            .filter(file => {
                // Filter out Inventory Photos
                if ((file as any).module === 'inventory') return false;
                if ((file as any).path === 'Photos/Inventory Photos') return false;
                return true;
            });

        // Always return object with files array
        return NextResponse.json({ files });

    } catch (error: any) {
        console.error('GET /api/files error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
