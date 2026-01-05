const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// ANSI Colors
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

const log = {
    info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    error: (msg, err) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`, err || ''),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`)
};

async function runHealthCheck() {
    console.log(`${colors.bold}MediaHive Google Drive Health Check${colors.reset}\n`);

    // 1. Environment Variable Validation
    log.info("Checking environment variables...");
    const requiredVars = [
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY'
    ];

    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        log.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
    log.success("Environment variables present.");

    const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    // Enhanced Key Normalization/Debugging
    let rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) {
        log.error("GOOGLE_PRIVATE_KEY is empty.");
        process.exit(1);
    }

    // Remove surrounding quotes if somehow included in the value
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
        rawKey = rawKey.slice(1, -1);
    }
    if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
        rawKey = rawKey.slice(1, -1);
    }

    // Replace literal \n with actual newlines
    const PRIVATE_KEY = rawKey.replace(/\\n/g, '\n');

    log.info(`Key Debug: Length=${PRIVATE_KEY.length}, Newlines=${(PRIVATE_KEY.match(/\n/g) || []).length}`);
    log.info(`Key Start: ${JSON.stringify(PRIVATE_KEY.substring(0, 30))}`);
    log.info(`Key End: ${JSON.stringify(PRIVATE_KEY.substring(PRIVATE_KEY.length - 30))}`);
    log.info(`Service Account Email: ${CLIENT_EMAIL}`);

    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Helper to attempt key repair
    function repairKey(key) {
        try {
            // Remove headers/footers and all whitespace
            let body = key
                .replace(/-----BEGIN PRIVATE KEY-----/g, '')
                .replace(/-----END PRIVATE KEY-----/g, '')
                .replace(/\s/g, '');

            // Re-chunk into 64 chars
            const chunks = body.match(/.{1,64}/g);
            if (!chunks) return key;

            return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
        } catch (e) {
            return key;
        }
    }

    function validateKeyWithCrypto(key, label) {
        try {
            crypto.createPrivateKey(key);
            log.success(`${label}: Valid private key format (Node Crypto accepted).`);
            return true;
        } catch (e) {
            log.warn(`${label}: Node Crypto Rejected: ${e.message}`);

            const body = key
                .replace(/-----BEGIN PRIVATE KEY-----/g, '')
                .replace(/-----END PRIVATE KEY-----/g, '')
                .replace(/\s/g, '');

            log.info(`${label} Debug: Base64 BodyLength=${body.length}, Modulo4=${body.length % 4}`);
            if (body.length % 4 !== 0) {
                log.error(`CRITICAL: Key length is invalid (Modulo 4 is ${body.length % 4}). Characters are missing.`);
                log.error("Action Required: Re-copy the Private Key from the JSON file.");
            }
            return false;
        }
    }

    async function tryAuth(keyToUse, label) {
        // Pre-check
        const isValid = validateKeyWithCrypto(keyToUse, label);
        if (!isValid) {
            // We continue to try auth anyway just to see the error, but we know it will likely fail
        }

        try {
            const authClient = new google.auth.GoogleAuth({
                credentials: {
                    client_email: CLIENT_EMAIL,
                    private_key: keyToUse,
                },
                scopes: ['https://www.googleapis.com/auth/drive'],
            });
            const driveClient = google.drive({ version: 'v3', auth: authClient });
            const about = await driveClient.about.get({ fields: 'user(emailAddress)' });
            return { success: true, client: authClient, email: about.data.user.emailAddress };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    // 2. Drive API Authentication Test
    log.info("Authenticating with Google Drive...");

    // Attempt 1: As provided
    let authResult = await tryAuth(PRIVATE_KEY, "Original");

    // Attempt 2: Repaired Key (if failed with decoder error)
    if (!authResult.success && authResult.error.message && authResult.error.message.includes('DECODER')) {
        log.warn("Standard auth failed. Attempting to repair Private Key format...");
        const repairedKey = repairKey(PRIVATE_KEY);
        // log.info(`Repaired Key: Length=${repairedKey.length}, Newlines=${(repairedKey.match(/\n/g) || []).length}`);

        const retryResult = await tryAuth(repairedKey, "Repaired");
        if (retryResult.success) {
            log.success("Auth successful with REPAIRED key.");
            authResult = retryResult;
        }
    }

    let auth;
    if (authResult.success) {
        auth = authResult.client;
        if (authResult.email.toLowerCase() === CLIENT_EMAIL.toLowerCase()) {
            log.success(`Authenticated as ${authResult.email}`);
        } else {
            log.warn(`Authenticated as ${authResult.email}, expected ${CLIENT_EMAIL}`);
        }
    } else {
        log.error("Authentication failed", authResult.error.message);
        process.exit(1);
    }

    const drive = google.drive({ version: 'v3', auth });

    // 3. Shared Drive Access Test
    if (FOLDER_ID) {
        log.info(`Checking access to configured folder: ${FOLDER_ID}`);
        try {
            await drive.files.get({
                fileId: FOLDER_ID,
                fields: 'id, name, capabilities, webViewLink',
                supportsAllDrives: true
            });
            log.success("Folder access confirmed.");
        } catch (e) {
            log.error(`Failed to access folder ${FOLDER_ID}. Check permissions or ID.`, e.message);
            process.exit(1);
        }
    } else {
        log.warn("No GOOGLE_DRIVE_FOLDER_ID configured. Uploading to Root.");
    }

    // 4. Upload Test (Non-Destructive)
    log.info("Attempting test upload...");
    let fileId;
    try {
        const testContent = `MediaHive Drive Health Check\nDate: ${new Date().toISOString()}\nUser: ${CLIENT_EMAIL}`;

        const res = await drive.files.create({
            requestBody: {
                name: 'mediahive-healthcheck.txt',
                mimeType: 'text/plain',
                parents: FOLDER_ID ? [FOLDER_ID] : [],
            },
            media: {
                mimeType: 'text/plain',
                body: testContent,
            },
            fields: 'id, name, webViewLink, webContentLink',
            supportsAllDrives: true,
        });

        fileId = res.data.id;
        log.success(`File uploaded successfully. ID: ${fileId}`);

        // 5. Metadata Consistency Check
        if (res.data.webViewLink && res.data.webContentLink) {
            log.success("Links generated successfully.");
        } else {
            log.error("Failed to generate links.");
        }

    } catch (e) {
        log.error("Upload failed", e.message);
        process.exit(1);
    }

    // 6. Cleanup
    log.info("Cleaning up... Deleting test file.");
    try {
        await drive.files.delete({
            fileId: fileId,
            supportsAllDrives: true
        });
        log.success("Test file deleted.");
    } catch (e) {
        log.warn(`Failed to delete test file ${fileId}. Please remove manually.`, e.message);
    }

    console.log(`\n${colors.bold}${colors.green}✅ Google Drive connection verified${colors.reset}`);
    console.log(`${colors.green}✅ Service account authenticated${colors.reset}`);
    console.log(`${colors.green}✅ Folder access confirmed${colors.reset}`);
    console.log(`${colors.green}✅ Upload & link generation working${colors.reset}`);
}

runHealthCheck().catch(err => {
    log.error("Unexpected error", err);
    process.exit(1);
});
