// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient, ensureFolderPath, makeFilePublic, DRIVE_CONFIG, sanitizeForDrive } from '@/lib/drive';
import { verifyUser } from '@/lib/server/server-utils';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.uid;

        // Parse Form Data
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Drive Setup
        const drive = await getDriveClient();
        const rootId = DRIVE_CONFIG.folderId || 'root';

        const avatarsFolderId = await ensureFolderPath(drive, rootId, ['MediaHive', 'Avatars']);

        // Prepare File
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new (require('stream').PassThrough)();
        stream.end(buffer);

        const safeName = sanitizeForDrive(`${userId}-${Date.now()}.jpg`);

        // Upload to Google Drive
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

        const file_id = driveFile.data.id!;

        // Make Public
        await makeFilePublic(drive, file_id);

        const publicUrl = `https://drive.google.com/thumbnail?id=${file_id}&sz=s1000`;

        // Update Supabase Profile with both URL and direct ID for proxy support
        const supabaseAdmin = getSupabaseAdmin();
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                avatar_url: publicUrl,
                avatar_drive_id: file_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[Avatar/Route] Supabase Profile Update Error:', updateError);
            throw updateError;
        }

        return NextResponse.json({ success: true, avatar_url: publicUrl });

    } catch (error: any) {
        console.error('Avatar Upload Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
