import { google } from 'googleapis';
// Legacy Admin App logic removed.


// These should be in .env.local
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
// NOTE: formatted private key is crucial. env vars often mess up newlines.
const SHARED_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export async function getDriveClient() {
    if (!CLIENT_EMAIL || !PRIVATE_KEY) {
        throw new Error('Missing Google Service Account credentials');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY,
        },
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

export const DRIVE_CONFIG = {
    folderId: SHARED_DRIVE_FOLDER_ID
};

// Helper to find or create a deep folder path (e.g. "Events", "2025" -> creates Events/2025)
export async function ensureFolderPath(drive: any, rootId: string, pathParts: string[]): Promise<string> {
    let currentParentId = rootId;

    for (const folderName of pathParts) {
        if (!folderName || !folderName.trim()) continue;
        const cleanName = folderName.trim();

        try {
            // Check if folder exists in current parent
            const res = await drive.files.list({
                q: `'${currentParentId}' in parents and name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });

            if (res.data.files && res.data.files.length > 0) {
                // Folder exists, descend into it
                currentParentId = res.data.files[0].id;
            } else {
                // Create folder
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

// Deprecated wrapper for backward compatibility if needed, using the new logic
export async function getTargetFolderId(drive: any, parentId: string, fileTypeOrName: string, isExactName = false): Promise<string> {
    const typeToFolderMap: Record<string, string> = {
        'video': 'Videos',
        'image': 'Photos',
        'document': 'Essential Documents',
        'archive': 'Archives',
    };

    const targetName = isExactName ? fileTypeOrName : (typeToFolderMap[fileTypeOrName] || 'Essential Documents');
    return ensureFolderPath(drive, parentId, [targetName]);
}

/**
 * Sanitizes a string for use as a Drive folder or file name.
 * Rules:
 * - Replaces illegal chars (slash, backslash) with hyphen.
 * - Removes control characters.
 * - Trims whitespace.
 * - Collapses multiple spaces.
 * - Max length clamp (Google Drive supports long names but good to be sane, e.g. 255).
 */
export function sanitizeForDrive(name: string): string {
    if (!name) return 'Untitled';

    // 1. Replace folder separators and common illegal/confusing chars
    let clean = name.replace(/[/\\]/g, '-');

    // 2. Remove control chars
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

    // 3. Collapse whitespace
    clean = clean.replace(/\s+/g, ' ');

    // 4. Trim
    clean = clean.trim();

    // 5. Fallback if empty after cleaning
    if (!clean) return 'Untitled';

    // 6. Truncate (approx 120 chars to be safe/readable)
    if (clean.length > 120) {
        clean = clean.substring(0, 117) + '...';
    }

    return clean;
}

/**
 * Makes a file publicly readable by anyone with the link.
 * This is crucial for avoiding access request prompts.
 */
export async function makeFilePublic(drive: any, file_id: string): Promise<boolean> {
    try {
        // Idempotency: Check if already public
        const listRes = await drive.permissions.list({
            file_id,
            fields: 'permissions(id, type, role)',
            supportsAllDrives: true,
        });

        const existingPerm = listRes.data.permissions?.find((p: any) => p.type === 'anyone' && p.role === 'reader');
        if (existingPerm) {
            console.log(`[Drive] File ${file_id} is already public.`);
            return true;
        }

        await drive.permissions.create({
            file_id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });
        console.log(`[Drive] File ${file_id} is now public (anyone with link).`);
        return true;
    } catch (error: any) {
        console.error(`[Drive] Failed to make file ${file_id} public:`, error);
        // We don't throw here to avoid failing the whole upload, but we log it.
        return false;
    }
}

/**
 * Removes 'anyone' reader permissions, making the file effectively private
 * (or restricted to inherited folder permissions).
 */
export async function makeFilePrivate(drive: any, file_id: string): Promise<boolean> {
    try {
        // List permissions to find the 'anyone' permission
        const res = await drive.permissions.list({
            file_id,
            fields: 'permissions(id, type, role)',
            supportsAllDrives: true,
        });

        const sensitivePerm = res.data.permissions?.find((p: any) => p.type === 'anyone' && p.role === 'reader');

        if (sensitivePerm && sensitivePerm.id) {
            await drive.permissions.delete({
                file_id,
                permissionId: sensitivePerm.id,
                supportsAllDrives: true,
            });
            console.log(`[Drive] File ${file_id} is now PRIVATE (removed 'anyone' link).`);
            return true;
        }
        return true; // Already private
    } catch (error: any) {
        console.error(`[Drive] Failed to make file ${file_id} private:`, error);
        return false;
    }
}
