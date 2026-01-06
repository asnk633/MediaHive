const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'thaiba-media-prod',
});

async function verifyAdmin() {
  try {
    const projectId = admin.app().options.projectId;
    console.log('[VERIFY] Connected to project:', projectId);

    // Read-only check: list up to 1 user
    const result = await admin.auth().listUsers(1);
    console.log('[VERIFY] Admin SDK can read users.');
    console.log('[VERIFY] Users found:', result.users.length);

    console.log('✅ ADMIN SDK VERIFIED — SAFE TO PROCEED');
  } catch (err) {
    console.error('❌ ADMIN SDK VERIFICATION FAILED');
    console.error(err);
    process.exit(1);
  }
}

verifyAdmin();
