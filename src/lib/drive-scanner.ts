import { getDriveClient, ensureFolderPath } from '@/lib/drive';
import { DriveQueueItem } from '@/types/drive-queue';
import { logSystemActivity } from '@/lib/server/activity-logger';
import { getSupabaseAdmin } from '@/lib/server-utils';

const INCOMING_FOLDER_NAME = 'MediaHive/Incoming';
const QUEUE_TABLE = 'drive_queue';

export class DriveScannerService {

    /**
     * Ensures the /MediaHive/Incoming folder exists and returns its ID.
     */
    static async ensureIncomingFolder(): Promise<string> {
        const drive = await getDriveClient();
        const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!rootId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');

        console.log(`[DriveScanner] Resolving folder '${INCOMING_FOLDER_NAME}' from root '${rootId}'...`);
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
                file_id: folderId,
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
            const supabase = getSupabaseAdmin();

            log(`[DriveScanner] Starting scan of folder: ${folderId}`);

            // 1. Detect if this is a Shared Drive
            let driveId: string | undefined;
            try {
                const folderMeta = await drive.files.get({
                    file_id: folderId,
                    fields: 'driveId',
                    supportsAllDrives: true
                });
                driveId = folderMeta.data.driveId || undefined;
                if (driveId) {
                    log(`[DriveScanner] Folder is in Shared Drive: ${driveId}`);
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

            if (driveId) {
                listParams.corpora = 'drive';
                listParams.driveId = driveId;
            }

            log(`[DriveScanner] Executing list...`);

            const res = await drive.files.list(listParams);
            const files = res.data.files || [];
            log(`[DriveScanner] Raw files found in folder: ${files.length}`);

            if (files.length === 0) return { count: 0, logs };

            let addedCount = 0;

            for (const file of files) {
                if (!file.id || !file.name) continue;

                // Absolute Purge: Remove check for non-existent 'files' table.
                // Check only 'drive_queue' for pending/rejected items.
                const { data: existingQueue, error: queueError } = await supabase
                    .from(QUEUE_TABLE)
                    .select('id')
                    .eq('drive_file_id', file.id)
                    .limit(1);

                if (queueError) {
                    log(`[DriveScanner] Warning: Queue check failed for ${file.name}: ${queueError.message}`);
                    continue;
                }

                if (existingQueue && existingQueue.length > 0) {
                    log(`[DriveScanner] Skipping ${file.name} (Already in Queue)`);
                    continue;
                }

                log(`[DriveScanner] Detected NEW file: ${file.name} (${file.id})`);

                const newItem = {
                    drive_file_id: file.id,
                    name: file.name,
                    mime_type: file.mimeType || 'application/octet-stream',
                    size: parseInt(file.size || '0'),
                    web_view_link: file.webViewLink || '',
                    thumbnail_link: file.thumbnailLink || '',
                    uploaded_by: file.owners?.[0]?.displayName || 'Drive User',
                    detected_at: new Date().toISOString(),
                    status: 'pending'
                };

                const { error: insertError } = await supabase
                    .from(QUEUE_TABLE)
                    .insert([newItem]);

                if (insertError) {
                    log(`[DriveScanner] Error inserting ${file.name}: ${insertError.message}`);
                    continue;
                }

                await logSystemActivity({
                    actorId: 'system',
                    actorRole: 'system',
                    action: 'drive_file_detected',
                    entityType: 'drive_queue_item',
                    entityId: file.id || 'unknown',
                    summary: `Drive File Detected: ${file.name}`,
                    source: 'system',
                    severity: 'info',
                    visibility: { mode: 'admin' },
                    metadata: {
                        drive_id: file.id,
                        size: file.size
                    }
                });

                addedCount++;
            }

            log(`[DriveScanner] Scan complete. Added ${addedCount} new files.`);
            return { count: addedCount, logs };

        } catch (error: any) {
            log(`[DriveScanner] Error: ${error.message}`);
            return { count: 0, logs };
        }
    }
}

