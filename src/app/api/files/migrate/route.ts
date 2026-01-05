import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

/**
 * Migration endpoint to fix existing files with old field names
 * Changes: webViewLink -> viewLink, driveId -> driveFileId, adds downloadLink
 */
import { verifyUser } from '@/lib/server-utils';

export async function POST(req: Request) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const db = adminDb;

        const filesSnapshot = await db.collection('files').get();
        let migrated = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const doc of filesSnapshot.docs) {
            const data = doc.data();

            // Check if already migrated
            if (data.viewLink && data.driveFileId) {
                skipped++;
                continue;
            }

            try {
                const updates: any = {};

                // Migrate webViewLink -> viewLink
                if (data.webViewLink && !data.viewLink) {
                    updates.viewLink = data.webViewLink;
                }

                // Migrate driveId -> driveFileId
                if (data.driveId && !data.driveFileId) {
                    updates.driveFileId = data.driveId;
                }

                // Generate downloadLink from viewLink if missing
                if (!data.downloadLink && updates.viewLink) {
                    // Extract file ID from viewLink and create downloadLink
                    const fileIdMatch = updates.viewLink.match(/\/d\/([^/]+)/);
                    if (fileIdMatch) {
                        const fileId = fileIdMatch[1];
                        updates.downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    }
                } else if (!data.downloadLink && data.webViewLink) {
                    const fileIdMatch = data.webViewLink.match(/\/d\/([^/]+)/);
                    if (fileIdMatch) {
                        const fileId = fileIdMatch[1];
                        updates.downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    }
                }

                // Migrate uploadedAt -> createdAt if needed
                if (data.uploadedAt && !data.createdAt) {
                    updates.createdAt = Timestamp.fromDate(new Date(data.uploadedAt));
                }

                // Add mimeType if missing (use type field as fallback)
                if (!data.mimeType && data.type) {
                    const typeMap: Record<string, string> = {
                        'image': 'image/jpeg',
                        'video': 'video/mp4',
                        'document': 'application/pdf'
                    };
                    updates.mimeType = typeMap[data.type] || 'application/octet-stream';
                }

                if (Object.keys(updates).length > 0) {
                    await doc.ref.update(updates);
                    migrated++;
                } else {
                    skipped++;
                }
            } catch (error: any) {
                errors.push(`${doc.id}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            migrated,
            skipped,
            total: filesSnapshot.docs.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
