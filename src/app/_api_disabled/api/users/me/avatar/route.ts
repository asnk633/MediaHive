
import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient, ensureFolderPath, makeFilePublic, DRIVE_CONFIG, sanitizeForDrive } from '@/lib/drive';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function POST(req: NextRequest) {
    try {
        console.log('[Avatar/Route] Starting upload request');

        // 1. Auth Check
        const allCookies = req.cookies.getAll();
        console.log('[Avatar/Route] Incoming Cookies:', allCookies.map(c => c.name));
        const sessionCookie = req.cookies.get('__session');
        console.log('[Avatar/Route] __session cookie present:', !!sessionCookie, 'Value length:', sessionCookie?.value?.length);

        const user = await verifyUser(req);

        if (!user) {
            console.warn('[Avatar/Route] verifyUser returned null. Unauthorized.');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.uid;

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 3. Drive Setup
        const drive = await getDriveClient();
        const rootId = DRIVE_CONFIG.folderId || 'root';

        // Ensure "MediaHive/Avatars" exists
        // We reuse the logic from drive-init roughly, but locally here is fine.
        const avatarsFolderId = await ensureFolderPath(drive, rootId, ['MediaHive', 'Avatars']);

        // 4. Prepare File
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new (require('stream').PassThrough)();
        stream.end(buffer);

        const safeName = sanitizeForDrive(`${userId}-${Date.now()}.jpg`);

        // 5. Upload
        const driveFile = await drive.files.create({
            requestBody: {
                name: safeName,
                parents: [avatarsFolderId],
                mimeType: 'image/jpeg',
            },
            media: {
                mimeType: 'image/jpeg',
                body: stream,
            },
            fields: 'id, webContentLink, thumbnailLink',
            supportsAllDrives: true,
        });

        const fileId = driveFile.data.id!;

        // 6. Make Public
        await makeFilePublic(drive, fileId);

        // 7. Get Public URL
        // webContentLink = download link. thumbnailLink = viewable.
        // We often prefer thumbnailLink for avatars to reduce bandwidth, but webContentLink is the "real" file.
        // Hack: thumbnailLink often comes with '=s220'. We can strip it to get full size or specific size.
        // Let's use webContentLink for now, or thumbnailLink if webContentLink is forced download.
        // User asked for "profile pictures... use it in their avatar".
        // Embeddable link: `https://drive.google.com/uc?export=view&id=${fileId}` is a common hack.

        const publicUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=s1000`;
        // using standard thumbnail generator endpoint allows resize. s1000 = 1000px.

        // Update Firestore
        await adminDb.collection('users').doc(userId).update({
            avatarUrl: publicUrl,
            avatarUpdatedAt: new Date().toISOString(),
            avatarDriveId: fileId
        });

        return NextResponse.json({ success: true, avatarUrl: publicUrl });

    } catch (error: any) {
        console.error('Avatar Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
