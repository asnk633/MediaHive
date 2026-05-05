import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/drive';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: fileId } = await params;

    if (!fileId) {
        return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    try {
        const drive = await getDriveClient();
        
        // 1. Fetch file metadata to get MIME type
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'mimeType, name',
            supportsAllDrives: true,
        });

        const mimeType = metadata.data.mimeType || 'application/octet-stream';

        // 2. Fetch the file content
        const response = await drive.files.get(
            { 
                fileId: fileId, 
                alt: 'media',
                supportsAllDrives: true,
            },
            { responseType: 'stream' }
        );

        // 3. Create a readable stream from the Drive response
        const stream = response.data;

        // 4. Return the stream as a NextResponse
        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Content-Disposition': `inline; filename="${metadata.data.name}"`,
            },
        });
    } catch (error: any) {
        console.error(`[Drive Proxy] Failed to fetch file ${fileId}:`, error);
        
        // Return 404 for missing/forbidden files
        if (error.code === 404 || error.code === 403) {
            return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
        }
        
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
