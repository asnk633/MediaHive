import { google } from 'googleapis';
import { assertDriveEnv } from './drive-config';

/**
 * Google Drive Client Singleton
 * Manages a persistent auth session to avoid repeated JWT handshakes.
 */

let _authClient: any = null;
let _driveClient: any = null;

export async function getDriveClient() {
    // 1. Return cached instance if available
    if (_driveClient) return _driveClient;

    // 2. Validate environment and get formatted credentials
    const { clientEmail, privateKey } = assertDriveEnv();

    // 3. Initialize Singleton Auth Client
    _authClient = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // 4. Initialize Singleton Drive Client
    _driveClient = google.drive({ version: 'v3', auth: _authClient });

    console.log('[Drive] ✅ Singleton Client Initialized (Service Account)');
    return _driveClient;
}

/**
 * Force-reset the singleton instances.
 * Use as an escape hatch for credential rotation or connection issues.
 */
export function resetDriveClient() {
    _authClient = null;
    _driveClient = null;
    console.warn('[Drive] ⚠️ Singleton Client Reset');
}

export const DRIVE_CONFIG = {
    get folderId() {
        return process.env.GOOGLE_DRIVE_FOLDER_ID;
    }
};

/**
 * Helper to find or create a deep folder path (e.g. "Events", "2025" -> creates Events/2025)
 */
export async function ensureFolderPath(drive: any, rootId: string, pathParts: string[]): Promise<string> {
    let currentParentId = rootId;

    for (const folderName of pathParts) {
        if (!folderName || !folderName.trim()) continue;
        const cleanName = folderName.trim();

        try {
            const res = await drive.files.list({
                q: `'${currentParentId}' in parents and name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });

            if (res.data.files && res.data.files.length > 0) {
                currentParentId = res.data.files[0].id;
            } else {
                const newFolder = await drive.files.create({
                    requestBody: {
                        name: cleanName,
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [currentParentId],
                    },
                    fields: 'id',
                    supportsAllDrives: true,
                });
                currentParentId = newFolder.data.id;
            }
        } catch (e) {
            console.warn(`Failed to resolve/create folder '${cleanName}', stopping at parent ${currentParentId}.`, e);
            throw e;
        }
    }
    return currentParentId;
}

/**
 * Sanitizes a string for use as a Drive folder or file name.
 */
export function sanitizeForDrive(name: string): string {
    if (!name) return 'Untitled';
    let clean = name.replace(/[/\\]/g, '-').replace(/[\x00-\x1F\x7F]/g, '').replace(/\s+/g, ' ').trim();
    if (!clean) return 'Untitled';
    return clean.length > 120 ? clean.substring(0, 117) + '...' : clean;
}

/**
 * Makes a file publicly readable by anyone with the link.
 */
export async function makeFilePublic(drive: any, file_id: string): Promise<boolean> {
    try {
        const listRes = await drive.permissions.list({
            fileId: file_id,
            fields: 'permissions(id, type, role)',
            supportsAllDrives: true,
        });

        const existingPerm = listRes.data.permissions?.find((p: any) => p.type === 'anyone' && p.role === 'reader');
        if (existingPerm) return true;

        await drive.permissions.create({
            fileId: file_id,
            requestBody: { role: 'reader', type: 'anyone' },
            supportsAllDrives: true,
        });
        return true;
    } catch (error) {
        console.error(`[Drive] Failed to make file ${file_id} public:`, error);
        return false;
    }
}

/**
 * Removes 'anyone' reader permissions.
 */
export async function makeFilePrivate(drive: any, file_id: string): Promise<boolean> {
    try {
        const res = await drive.permissions.list({
            fileId: file_id,
            fields: 'permissions(id, type, role)',
            supportsAllDrives: true,
        });

        const sensitivePerm = res.data.permissions?.find((p: any) => p.type === 'anyone' && p.role === 'reader');

        if (sensitivePerm && sensitivePerm.id) {
            await drive.permissions.delete({
                fileId: file_id,
                permissionId: sensitivePerm.id,
                supportsAllDrives: true,
            });
        }
        return true;
    } catch (error) {
        console.error(`[Drive] Failed to make file ${file_id} private:`, error);
        return false;
    }
}
