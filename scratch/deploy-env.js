const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const token = 'vcp_3g1s6vRlcEEhueh6SAQoBbDQk6y6CCdgBkL7sRFXC7OVKI7s8H3IP0gV';
const scope = 'abdul-shukoors-projects';
const keyFile = path.join(__dirname, '../serviceAccountKey.json');

async function run() {
    try {
        console.log('Reading service account key...');
        const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        
        const clientEmail = keyData.client_email;
        const privateKey = keyData.private_key; // Keep exactly as is
        const folderId = '1nPv67BFL0XdPw7vZ4tPBfShByCOMBfHb';

        const environments = ['production', 'preview', 'development'];

        for (const env of environments) {
            console.log(`\n--- Deploying variables to: ${env} ---`);

            // 1. GOOGLE_SERVICE_ACCOUNT_EMAIL
            console.log(`Setting GOOGLE_SERVICE_ACCOUNT_EMAIL in ${env}...`);
            try {
                execSync(`vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL ${env} --value "${clientEmail}" --yes --force --token=${token} --scope=${scope}`, { stdio: 'pipe' });
                console.log(`✅ GOOGLE_SERVICE_ACCOUNT_EMAIL set successfully.`);
            } catch (err) {
                console.error(`❌ Failed to set GOOGLE_SERVICE_ACCOUNT_EMAIL:`);
                if (err.stdout) console.error('Stdout:', err.stdout.toString());
                if (err.stderr) console.error('Stderr:', err.stderr.toString());
            }

            // 2. GOOGLE_DRIVE_FOLDER_ID
            console.log(`Setting GOOGLE_DRIVE_FOLDER_ID in ${env}...`);
            try {
                execSync(`vercel env add GOOGLE_DRIVE_FOLDER_ID ${env} --value "${folderId}" --yes --force --token=${token} --scope=${scope}`, { stdio: 'pipe' });
                console.log(`✅ GOOGLE_DRIVE_FOLDER_ID set successfully.`);
            } catch (err) {
                console.error(`❌ Failed to set GOOGLE_DRIVE_FOLDER_ID:`);
                if (err.stdout) console.error('Stdout:', err.stdout.toString());
                if (err.stderr) console.error('Stderr:', err.stderr.toString());
            }

            // 3. GOOGLE_PRIVATE_KEY
            console.log(`Setting GOOGLE_PRIVATE_KEY in ${env}...`);
            try {
                // Pass value via stdin option in execSync! It's much cleaner than shell redirect!
                execSync(`vercel env add GOOGLE_PRIVATE_KEY ${env} --force --yes --token=${token} --scope=${scope}`, {
                    input: privateKey,
                    stdio: 'pipe'
                });
                console.log(`✅ GOOGLE_PRIVATE_KEY set successfully.`);
            } catch (err) {
                console.error(`❌ Failed to set GOOGLE_PRIVATE_KEY:`);
                if (err.stdout) console.error('Stdout:', err.stdout.toString());
                if (err.stderr) console.error('Stderr:', err.stderr.toString());
            }
        }

        console.log('\nAll variables added. Triggering production redeployment...');
        execSync(`vercel deploy --prod --yes --token=${token} --scope=${scope}`, { stdio: 'inherit' });
        console.log('🚀 Redeployment triggered successfully!');

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
