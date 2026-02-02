import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';
import { makeFilePublic } from '@/lib/drive';
import { logSystemActivity } from '@/lib/server/activity-logger';
import { getDriveClient } from '@/lib/drive';
import { FieldValue } from 'firebase-admin/firestore';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // List pending items
        const snapshot = await adminDb.collection('drive_queue')
            .where('status', '==', 'pending')
            .orderBy('detectedAt', 'desc')
            .get();

        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(items);

    } catch (error: any) {
        console.error('Failed to list queue:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// Helper: Logic to mirror client-side auto-routing (Safety net)
function getAutoCategory(mimeType: string): string {
    if (!mimeType) return 'Documents';
    if (mimeType.startsWith('image/')) return 'Photos';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return 'Documents';
    if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) return 'Archives';
    return 'Documents'; // Default safety
}

// Canonical Folder Mapping
const FOLDER_MAP: Record<string, string> = {
    'Documents': 'Essential Documents',
    'Photos': 'Photos',
    'Videos': 'Videos',
    'Audio': 'Audio',
    'Archives': 'Archives',
    'Other': 'Essential Documents' // Sinkhole prevention: Default to safe storage
};

async function processItem(id: string, action: string, user: any, drive: any, metadata?: any) {
    const docRef = adminDb.collection('drive_queue').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new Error(`Item ${id} not found`);
    }

    const item = doc.data() as any;

    if (item.status !== 'pending') {
        // Skip if already processed to prevent double-processing in bulk
        return;
    }

    if (action === 'approve') {
        // 1. Ensure public visibility
        await makeFilePublic(drive, item.driveFileId);

        // Calculate Final Name
        let finalName = item.name;
        if (metadata?.name) {
            // Explicit override (Single mode)
            finalName = metadata.name;
        } else {
            // Modifiers (Bulk mode)
            if (metadata?.namePrefix) finalName = `${metadata.namePrefix}${finalName}`;
            if (metadata?.nameSuffix) finalName = `${finalName}${metadata.nameSuffix}`;
        }

        // Calculate Canonical Path (Category)
        // 1. Try metadata category (Admin Override)
        // 2. Fallback to server-side auto-detection
        const rawCategory = metadata?.category || getAutoCategory(item.mimeType);
        // 3. Map to canonical folder name
        const finalPath = FOLDER_MAP[rawCategory] || 'Essential Documents';

        // Calculate Tags (Robust Merging)
        // 1. Start with user-provided tags (Manual overrides)
        let finalTags: string[] = [];
        if (metadata?.tags && typeof metadata.tags === 'string') {
            finalTags = metadata.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
        }

        // 2. Enforce System Tags (Locking)
        const systemTags: string[] = [];

        // Year Logic (Regex > Drive Date > Current)
        const nameYearMatch = item.name.match(/\b20\d{2}\b/);
        if (nameYearMatch) {
            systemTags.push(nameYearMatch[0]);
        } else if (item.detectedAt) {
            // item.detectedAt is Firestore Timestamp, but here likely serializable object or Date
            // Safe fallback
            try {
                const d = new Date(item.detectedAt.seconds ? item.detectedAt.seconds * 1000 : item.detectedAt);
                if (!isNaN(d.getTime())) systemTags.push(d.getFullYear().toString());
                else systemTags.push(new Date().getFullYear().toString());
            } catch (e) {
                systemTags.push(new Date().getFullYear().toString());
            }
        } else {
            systemTags.push(new Date().getFullYear().toString());
        }

        // Institution Logic
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes('orchid')) systemTags.push('Orchids');
        if (lowerName.includes('thaiba')) systemTags.push('Thaiba');
        if (lowerName.includes('garden')) systemTags.push('Garden');
        if (lowerName.includes('koppa')) systemTags.push('Koppa');
        if (lowerName.includes('feroke')) systemTags.push('Feroke');

        // Event Logic
        const eventMatch = item.name.match(/[\[\(](.*?)[\]\)]/);
        if (eventMatch && eventMatch[1]) {
            systemTags.push(eventMatch[1].trim());
        }

        // Type & Source Logic
        systemTags.push('Drive Import');
        if (item.mimeType.startsWith('image/')) systemTags.push('Image');
        else if (item.mimeType.startsWith('video/')) systemTags.push('Video');
        else if (item.mimeType.includes('pdf')) systemTags.push('Doc');
        else systemTags.push('Document'); // Fallback

        // Merge: User Tags + System Tags (Dedup)
        finalTags = Array.from(new Set([...finalTags, ...systemTags]));

        // 2. Create File Doc
        const fileDoc: any = {
            name: finalName,
            description: metadata?.description || '',
            type: item.mimeType?.startsWith('image/') ? 'image' : item.mimeType?.startsWith('video/') ? 'video' : 'document',
            mimeType: item.mimeType,
            driveFileId: item.driveFileId,
            viewLink: item.webViewLink,
            downloadLink: item.webViewLink.replace('/view', '/uc?export=download'),
            previewLink: item.thumbnailLink,
            createdAt: FieldValue.serverTimestamp(),
            uploadedBy: user.uid,
            uploadedByName: `${user.name} (via Drive)`,
            uploadedByRole: 'admin',
            visibility: metadata?.visibility || { mode: 'all' },
            folderId: 'DriveImport',
            path: finalPath, // Resolved Canonical Path
            tags: finalTags, // Persist Tags
            size: item.size || 0,
            uploadContext: 'downloads_direct',
            importedFromQueue: true
        };

        await adminDb.collection('files').add(fileDoc);

        // 3. Mark approved
        await docRef.update({
            status: 'approved',
            processedAt: FieldValue.serverTimestamp(),
            processedBy: user.uid
        });

        return { id: item.driveFileId, name: finalName, action: 'approved' };

    } else if (action === 'reject') {
        await docRef.update({
            status: 'rejected',
            processedAt: FieldValue.serverTimestamp(),
            processedBy: user.uid
        });

        return { id: item.driveFileId, name: item.name, action: 'rejected' };
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { action, metadata } = body;

        // Normalize 'id' (single) or 'ids' (bulk) into an array
        const ids: string[] = body.ids || (body.id ? [body.id] : []);

        if (ids.length === 0 || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid Input: Action and at least one ID required' }, { status: 400 });
        }

        const drive = await getDriveClient();
        const results = { success: 0, failed: 0, errors: [] as any[] };

        // Process sequentially to be safe with rate limits, or parallel?
        // Sequential is safer for reliability and logging order.
        const processedItems: any[] = [];

        // Process sequentially to be safe with rate limits, or parallel?
        // Sequential is safer for reliability and logging order.
        for (const id of ids) {
            try {
                const result = await processItem(id, action, user, drive, metadata);
                if (result) processedItems.push(result);
                results.success++;
            } catch (e: any) {
                console.error(`Failed to process item ${id}:`, e);
                results.failed++;
                results.errors.push({ id, error: e.message });
            }
        }

        // --- BULK LOGGING ---
        if (processedItems.length > 0) {
            const isBulk = processedItems.length > 1;
            const firstItem = processedItems[0];

            let actionKey = action === 'approve' ? 'drive_file_approved' : 'drive_file_rejected';
            let summary = '';

            if (isBulk) {
                summary = `Bulk ${action}d ${processedItems.length} files`; // e.g. Bulk approved 5 files
            } else {
                summary = action === 'approve'
                    ? `File published: ${firstItem.name}`
                    : `File rejected: ${firstItem.name}`;
            }

            await logSystemActivity({
                actorId: user.uid,
                actorRole: user.role,
                action: actionKey,
                entityType: 'file', // or drive_queue_item
                entityId: isBulk ? `bulk_${Date.now()}` : firstItem.id,
                summary: summary,
                severity: action === 'reject' ? 'warning' : 'info',
                metadata: {
                    count: processedItems.length,
                    ids: processedItems.map(i => i.id),
                    names: processedItems.map(i => i.name),
                    action
                },
                visibility: action === 'approve' ? { mode: 'public' } : { mode: 'admin' }
            });
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error('Queue Action Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
