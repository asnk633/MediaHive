const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

if (!clientEmail || !privateKey) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

async function run() {
    const authClient = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth: authClient });
    const fileId = '1OvB7hybb9X18YB0hzxnQ1K0NeFVnZDAf';

    try {
        console.log(`Fetching metadata for file ID: ${fileId}...`);
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: '*',
            supportsAllDrives: true,
        });

        console.log('--- Metadata ---');
        console.log(JSON.stringify(metadata.data, null, 2));

    } catch (err) {
        console.error('Error fetching file metadata:', err);
    }
}

run();
