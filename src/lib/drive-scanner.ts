import { getDriveClient, ensureFolderPath } from '@/lib/drive';
import { getSupabaseAdmin } from '@/lib/server/server-utils';
import { MonitoringService } from '@/services/monitoringService';
import { AuditService } from '@/services/auditService';

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

        MonitoringService.info('[DriveScanner] Resolving incoming folder...', { rootId, folder: INCOMING_FOLDER_NAME });
        const resolvedId = await ensureFolderPath(drive, rootId, INCOMING_FOLDER_NAME.split('/'));
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
            MonitoringService.error('[DriveScanner] Failed to get incoming folder info', e);
            return { id: '', name: 'Start Scan to Retry', webViewLink: null };
        }
    }

    /**
     * Scans the Incoming folder for new files and adds them to the queue.
     * Returns the number of new files detected and execution logs.
     */
    static async scanIncomingFolder(institutionId?: string): Promise<{ count: number, logs: string[] }> {
        const logs: string[] = [];
        const log = (msg: string, level: 'info' | 'warn' | 'error' = 'info') => {
            logs.push(msg);
            if (level === 'info') MonitoringService.info(msg);
            else if (level === 'warn') MonitoringService.warn(msg);
            else MonitoringService.error(msg, new Error(msg));
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
                    fileId: folderId,
                    fields: 'driveId',
                    supportsAllDrives: true
                });
                driveId = folderMeta.data.driveId || undefined;
                if (driveId) {
                    log(`[DriveScanner] Folder is in Shared Drive: ${driveId}`);
                }
            } catch (e: any) {
                log(`[DriveScanner] Warning: Could not determine Drive ID: ${e.message}`, 'warn');
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

                const { data: existingQueue, error: queueError } = await supabase
                    .from(QUEUE_TABLE)
                    .select('id')
                    .eq('drive_file_id', file.id)
                    .limit(1);

                if (queueError) {
                    log(`[DriveScanner] Warning: Queue check failed for ${file.name}: ${queueError.message}`, 'warn');
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
                    status: 'pending',
                    institution_id: institutionId
                };

                const { error: insertError } = await supabase
                    .from(QUEUE_TABLE)
                    .insert([newItem]);

                if (insertError) {
                    log(`[DriveScanner] Error inserting ${file.name}: ${insertError.message}`, 'error');
                    continue;
                }

                await AuditService.logAction(
                    'DRIVE_FILE_DETECTED',
                    {
                        entityType: 'drive_queue_item',
                        entityId: file.id,
                        summary: `Drive File Detected: ${file.name}`,
                        drive_id: file.id,
                        size: file.size,
                        mime_type: file.mimeType
                    },
                    'OPERATIONAL'
                );

                addedCount++;
            }

            log(`[DriveScanner] Scan complete. Added ${addedCount} new files.`);
            return { count: addedCount, logs };

        } catch (error: any) {
            log(`[DriveScanner] Error: ${error.message}`, 'error');
            MonitoringService.error('[DriveScanner] Scan failed', error);
            return { count: 0, logs };
        }
    }
    /**
     * Audits existing DB records against Drive state and cleans up orphans.
     */
    static async reconcileDriveStorage(): Promise<{ orphansRemoved: number }> {
        const drive = await getDriveClient();
        const supabase = getSupabaseAdmin();
        let orphansRemoved = 0;

        // 1. Audit 'files' table
        const { data: dbFiles } = await supabase.from('files').select('id, drive_file_id, name');
        for (const file of (dbFiles || [])) {
            if (!file.drive_file_id) continue;
            try {
                await drive.files.get({ fileId: file.drive_file_id, supportsAllDrives: true });
            } catch (e: any) {
                if (e.code === 404) {
                    MonitoringService.warn(`[DriveScanner] Orphan detected in DB: ${file.name}. Removing...`);
                    await supabase.from('files').delete().eq('id', file.id);
                    orphansRemoved++;
                }
            }
        }

        // 2. Audit 'drive_queue' table
        const { data: queueFiles } = await supabase.from(QUEUE_TABLE).select('id, drive_file_id, name');
        for (const file of (queueFiles || [])) {
            try {
                await drive.files.get({ fileId: file.drive_file_id, supportsAllDrives: true });
            } catch (e: any) {
                if (e.code === 404) {
                    MonitoringService.warn(`[DriveScanner] Orphan detected in Queue: ${file.name}. Removing...`);
                    await supabase.from(QUEUE_TABLE).delete().eq('id', file.id);
                    orphansRemoved++;
                }
            }
        }

        if (orphansRemoved > 0) {
            await AuditService.logAction(
                'DRIVE_RECONCILIATION_COMPLETE',
                {
                    entityType: 'storage',
                    entityId: 'global',
                    summary: `Storage reconciliation complete. Cleaned up ${orphansRemoved} orphan records.`
                },
                'OPERATIONAL'
            );
        }

        return { orphansRemoved };
    }
}

