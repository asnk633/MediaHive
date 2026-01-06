import admin from 'firebase-admin';

if (!admin.apps.length) {
  console.log('[FIREBASE ADMIN] Initializing...');

  const projectId = process.env.FIREBASE_PROJECT_ID || 'thaiba-media-prod'; // Fallback for safety

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'thaiba-media-prod', // Explicitly force production project ID
  });

  console.log(
    '[FIREBASE ADMIN] Initialized for project:',
    admin.app().options.projectId
  );
}

export { admin };
export default admin;
