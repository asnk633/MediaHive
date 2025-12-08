// scripts/ci-decode-sa.js
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(process.cwd(), '.secrets');
const outFile = path.join(outDir, 'service-account.json');

if (!process.env.FIREBASE_ADMIN_SA && !process.env.FIREBASE_ADMIN_SA_PATH) {
    console.log('No FIREBASE_ADMIN_SA or FIREBASE_ADMIN_SA_PATH set; skipping decode.');
    process.exit(0);
}

if (process.env.FIREBASE_ADMIN_SA) {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const b64 = process.env.FIREBASE_ADMIN_SA;
    fs.writeFileSync(outFile, Buffer.from(b64, 'base64').toString('utf8'));
    console.log('Wrote', outFile);
    // set env var for subsequent steps (CI will not persist this automatically)
    console.log('::set-output name=sa_path::.secrets/service-account.json');
    process.exit(0);
} else {
    console.log('Using provided FIREBASE_ADMIN_SA_PATH:', process.env.FIREBASE_ADMIN_SA_PATH);
    process.exit(0);
}
