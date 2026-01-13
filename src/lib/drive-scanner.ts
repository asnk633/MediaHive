import { adminDb } from '@/lib/firebase/server';
import { getDriveClient, ensureFolderPath } from '@/lib/drive';
import { DriveQueueItem } from '@/types/drive-queue';
import { FieldValue } from 'firebase-admin/firestore';
import { logServerActivity } from '@/lib/server/activity-logger';

const INCOMING_FOLDER_NAME = 'MediaHive/Incoming';
const QUEUE_COLLECTION = 'drive_queue';
const PROCESSED_FILES_COLLECTION = 'drive_processed_history'; // Optional: to track historical IDs to prevent re-add

export class DriveScannerService {

    /**
     * Ensures the /MediaHive/Incoming folder exists and returns its ID.
     */
    static async ensureIncomingFolder(): Promise<string> {
        const drive = await getDriveClient();
        const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!rootId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');

        console.log(`[DriveScanner] Resolving folder '${INCOMING_FOLDER_NAME}' from root '${rootId}'...`);
        // ensureFolderPath handles nested paths nicely
        const resolvedId = await ensureFolderPath(drive, rootId, INCOMING_FOLDER_NAME.split('/'));
        console.log(`[DriveScanner] Resolved Incoming Folder ID: ${resolvedId}`);
        return resolvedId;
    }

    /**
     * Returns metadata about the Incoming folder (ID, Name, Link).
     */
    static async getIncomingFolderInfo(): Promise<{ id: string, name: string, webViewLink: string | null }> {
        try {
            const folderId = await this.ensureIncomingFolder();
            const drive = await getDriveClient();

            const res = await drive.files.get({
                fileId: folderId,
                fields: 'id, name, webViewLink',
                supportsAllDrives: true
            });

            return {
                id: res.data.id || folderId,
                name: res.data.name || INCOMING_FOLDER_NAME,
                webViewLink: res.data.webViewLink || null
            };
        } catch (e) {
            console.error('Failed to get incoming folder info:', e);
            // Fallback - Do not throw, return a safe partial object
            return { id: '', name: 'Start Scan to Retry', webViewLink: null };
        }
    }

    /**
     * Scans the Incoming folder for new files and adds them to the queue.
     * Returns the number of new files detected and execution logs.
     */
    static async scanIncomingFolder(): Promise<{ count: number, logs: string[] }> {
        const logs: string[] = [];
        const log = (msg: string) => {
            console.log(msg);
            logs.push(msg);
        };

        try {
            const folderId = await this.ensureIncomingFolder();
            const drive = await getDriveClient();
            const db = adminDb;

            log(`[DriveScanner] Starting scan of folder: ${folderId}`);

            // 1. Detect if this is a Shared Drive
            let driveId: string | undefined;
            try {
                const folderMeta = await drive.files.get({
                    fileId: folderId,
                    fields: 'driveId',
                    supportsAllDrives: true
                });
                driveId = folderMeta.data.driveId || undefined;
                if (driveId) {
                    log(`[DriveScanner] Folder is in Shared Drive: ${driveId}`);
                } else {
                    log(`[DriveScanner] Folder is in My Drive (User: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL})`);
                }
            } catch (e: any) {
                log(`[DriveScanner] Warning: Could not determine Drive ID: ${e.message}`);
            }

            // 2. Construct List Params
            const listParams: any = {
                q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
                fields: 'files(id, name, mimeType, size, webViewLink, thumbnailLink, createdTime, owners)',
                pageSize: 100,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            };

            // If Shared Drive, we must use specific corpora params as per user request
            if (driveId) {
                listParams.corpora = 'drive';
                listParams.driveId = driveId;
            } else {
                // Determine corpus strategy for standard drive? 
                // 'allDrives' is safest if no driveId, but 'user' is default.
                // User instruction: "If this is a Shared Drive, also include: corpora: 'drive', driveId: ..."
                // Otherwise keeping standard params.
            }

            log(`[DriveScanner] Executing list with params: supportsAllDrives=true, includeItemsFromAllDrives=true${driveId ? `, corpora='drive', driveId='${driveId}'` : ''}`);

            const res = await drive.files.list(listParams);

            const files = res.data.files || [];
            log(`[DriveScanner] Raw files found in folder: ${files.length}`);
            if (files.length > 0) {
                log(`[DriveScanner] Files: ${files.map(f => f.name).join(', ')}`);
            }

            if (files.length === 0) return { count: 0, logs };

            let addedCount = 0;

            // 2. Process each file
            for (const file of files) {
                if (!file.id || !file.name) continue;

                // Check if file is strictly "new" to our system
                // We check:
                // A. Is it already in 'files' collection? (Already imported)
                // B. Is it already in 'drive_queue'? (Pending/Rejected)

                // Optimization: These checks can be parallelized or batched if volume is high, 
                // but for now sequential is safer for consistency.

                // A. Check 'files' collection (Downloads)
                const filesQuery = await db.collection('files').where('driveFileId', '==', file.id).limit(1).get();
                if (!filesQuery.empty) {
                    log(`[DriveScanner] Skipping ${file.name} (Already in Downloads)`);
                    continue;
                }

                // B. Check 'drive_queue' collection
                const queueQuery = await db.collection(QUEUE_COLLECTION).where('driveFileId', '==', file.id).limit(1).get();
                if (!queueQuery.empty) {
                    log(`[DriveScanner] Skipping ${file.name} (Already in Queue/Rejected)`);
                    continue;
                }

                log(`[DriveScanner] Detected NEW file: ${file.name} (${file.id})`);

                // C. Add to Queue
                const newQueueItem: Omit<DriveQueueItem, 'id'> = {
                    driveFileId: file.id,
                    name: file.name,
                    mimeType: file.mimeType || 'application/octet-stream',
                    size: parseInt(file.size || '0'),
                    webViewLink: file.webViewLink || '',
                    thumbnailLink: file.thumbnailLink || '',
                    uploadedBy: file.owners?.[0]?.displayName || 'Drive User',
                    detectedAt: new Date(file.createdTime || Date.now()), // Local Date object for Firestore
                    status: 'pending'
                };

                // Add serialized timestamps for Firestore if needed, but Admin SDK handles Date objects well.
                // Using FieldValue.serverTimestamp() for detectedAt might be better for sorting "Just Now", 
                // but preserving Drive's createdTime is more accurate for the file itself. 
                // Let's use Firestore Timestamp for compatibility.

                await db.collection(QUEUE_COLLECTION).add({
                    ...newQueueItem,
                    detectedAt: FieldValue.serverTimestamp() // Mark detection time as NOW
                });

                // Log activity
                await logServerActivity({
                    type: 'drive_file_detected' as any,
                    entityType: 'drive_queue_item',
                    entityId: file.id, // Using Drive ID as reference or use the new Doc ID
                    title: `Drive File Detected: ${file.name}`,
                    performedBy: 'System',
                    performedByRole: 'system',
                    metadata: {
                        driveId: file.id,
                        size: file.size
                    }
                });

                addedCount++;
            }

            log(`[DriveScanner] Scan complete. Added ${addedCount} new files to queue.`);
            return { count: addedCount, logs };

        } catch (error: any) {
            log(`[DriveScanner] Error: ${error.message}`);
            return { count: 0, logs };
        }
    }
}
