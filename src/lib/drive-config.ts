/**
 * Google Drive Environment Configuration & Validation
 */

export function assertDriveEnv() {
    const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!CLIENT_EMAIL) {
        throw new Error('Configuration Error: GOOGLE_SERVICE_ACCOUNT_EMAIL is missing.');
    }

    if (!PRIVATE_KEY) {
        throw new Error('Configuration Error: GOOGLE_PRIVATE_KEY is missing.');
    }

    if (!FOLDER_ID) {
        throw new Error('Configuration Error: GOOGLE_DRIVE_FOLDER_ID is missing.');
    }

    // Key integrity check
    if (!PRIVATE_KEY.includes('BEGIN PRIVATE KEY') || !PRIVATE_KEY.includes('END PRIVATE KEY')) {
        throw new Error('Configuration Error: GOOGLE_PRIVATE_KEY appears to be malformed (missing BEGIN/END markers).');
    }

    return {
        clientEmail: CLIENT_EMAIL,
        privateKey: PRIVATE_KEY.replace(/\\n/g, '\n'),
        folderId: FOLDER_ID
    };
}
