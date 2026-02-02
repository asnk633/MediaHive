import { NextResponse } from 'next/server';
import { getDriveClient, makeFilePublic } from '@/lib/drive';
import { verifyUser, getFirebaseServices } from '@/lib/server-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const drive = await getDriveClient();
        const { firestore } = await getFirebaseServices();

        // Fetch all files from Firestore
        const snapshot = await firestore.collection('files').get();
        const results = {
            total: snapshot.size,
            processed: 0,
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        const batchSize = 10;
        const docs = snapshot.docs;

        // Process in chunks to avoid rate limits
        for (let i = 0; i < docs.length; i += batchSize) {
            const chunk = docs.slice(i, i + batchSize);
            const promises = chunk.map(async (doc: any) => {
                const data = doc.data();
                const fileId = data.driveFileId;
                const fileName = data.name || doc.id;

                if (!fileId) {
                    return { id: doc.id, status: 'skipped', reason: 'No driveFileId' };
                }

                try {
                    const success = await makeFilePublic(drive, fileId);
                    if (success) {
                        return { id: doc.id, status: 'success' };
                    } else {
                        return { id: doc.id, status: 'failed', reason: 'Drive API error' };
                    }
                } catch (e: any) {
                    return { id: doc.id, status: 'error', reason: e.message };
                }
            });

            const chunkResults = await Promise.all(promises);

            chunkResults.forEach(r => {
                results.processed++;
                if (r.status === 'success') {
                    results.success++;
                } else if (r.status === 'failed' || r.status === 'error') {
                    results.failed++;
                    results.errors.push(`${r.id}: ${r.reason}`);
                }
            });
        }

        return NextResponse.json({
            message: 'Backfill complete',
            stats: results
        });

    } catch (error: any) {
        console.error('Backfill error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
