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
        const { searchParams } = new URL(req.url);
        const isThumbnail = searchParams.get('thumbnail') === 'true';
        
        // 1. Fetch file metadata
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'mimeType, name, thumbnailLink',
            supportsAllDrives: true,
        });

        if (isThumbnail) {
            if (metadata.data.thumbnailLink) {
                // Fetch the thumbnail content directly from official link
                const thumbRes = await fetch(metadata.data.thumbnailLink);
                if (thumbRes.ok) {
                    const thumbBuffer = await thumbRes.arrayBuffer();
                    return new NextResponse(thumbBuffer, {
                        headers: {
                            'Content-Type': 'image/jpeg',
                            'Cache-Control': 'public, max-age=3600',
                        },
                    });
                }
            }

            // Fallback: Try the public Drive thumbnail service for PDFs/Docs
            // sz=w400 is width. This often works when metadata.thumbnailLink is missing.
            const fallbackUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
            console.log(`[Drive Proxy] 🔄 Attempting fallback thumbnail for ${fileId}: ${fallbackUrl}`);
            
            const fallbackRes = await fetch(fallbackUrl);
            if (fallbackRes.ok) {
                const thumbBuffer = await fallbackRes.arrayBuffer();
                const contentType = fallbackRes.headers.get('content-type') || 'image/jpeg';
                
                // Only return if it's actually an image (not a login page/html)
                if (contentType.startsWith('image/')) {
                    return new NextResponse(thumbBuffer, {
                        headers: {
                            'Content-Type': contentType,
                            'Cache-Control': 'public, max-age=3600',
                        },
                    });
                }
            }

            console.warn(`[Drive Proxy] ⚠️ No thumbnail available for ${fileId} (${metadata.data.mimeType})`);
            // DO NOT return the full file content if it's a thumbnail request and it's not an image/video
            if (metadata.data.mimeType === 'application/pdf' || !metadata.data.mimeType?.startsWith('image/')) {
                return NextResponse.json({ error: 'Thumbnail not available' }, { status: 404 });
            }
        }

        const mimeType = metadata.data.mimeType || 'application/octet-stream';

        // 2. Fetch the file content (Full media)
        const response = await drive.files.get(
            { 
                fileId: fileId, 
                alt: 'media',
                supportsAllDrives: true,
            },
            { responseType: 'stream' }
        );

        // 3. Create a readable stream from the Drive response
        const nodeStream = response.data;
        
        // 4. Convert Node.js stream to Web Stream for Next.js NextResponse
        // @ts-ignore - response.data is a Node stream but types may not reflect this
        const webStream = new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk: any) => controller.enqueue(chunk));
                nodeStream.on('end', () => controller.close());
                nodeStream.on('error', (err: any) => controller.error(err));
            }
        });

        // 5. Return the stream as a NextResponse
        return new NextResponse(webStream, {
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
