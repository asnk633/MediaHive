const path = require('path');
require('ts-node').register(); // To handle TS import if needed, but checking source file physically is easier via regex for verification if ts-node fails.

// Actually, let's just use regex to check the file content on disk since running TS files directly in this environment might lack ts-node config.
const fs = require('fs');

const filePath = path.join(__dirname, '../src/lib/firebaseAdmin.ts');
const content = fs.readFileSync(filePath, 'utf8');

console.log('Checking ' + filePath);

if (content.includes('export function getAdminDb()')) {
    console.log('✅ getAdminDb is exported.');
} else {
    console.error('❌ getAdminDb export MISSING.');
    process.exit(1);
}

if (content.includes('export default { apps: getApps(), getFirebaseAdminApp, getAdminDb }')) {
    console.log('✅ Default export includes getAdminDb.');
} else {
    console.warn('⚠️ Default export missing getAdminDb (Not critical if named export is used).');
}
