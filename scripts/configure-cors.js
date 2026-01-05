
const admin = require('firebase-admin');

// Service account key path - ensure this file exists or use default application credentials
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function configureCors() {
    console.log('Initializing Firebase Admin...');

    if (!admin.apps.length) {
        try {
            // Initialize without a specific bucket to allow using multiple
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        } catch (e) {
            console.error('Failed to initialize admin with default credentials:', e.message);
            console.log('Please ensure you are logged in via `gcloud auth application-default login` or have GOOGLE_APPLICATION_CREDENTIALS set.');
            process.exit(1);
        }
    }

    const storage = admin.storage();

    // Potential buckets to try
    const bucketsToTry = [
        'thaiba-media-staging.appspot.com',       // Default pattern
        'thaiba-media-staging.firebasestorage.app' // Alias pattern
    ];

    console.log('Configuring CORS for potential buckets:', bucketsToTry);

    for (const bucketName of bucketsToTry) {
        console.log(`\nAttempting to configure bucket: ${bucketName}`);
        try {
            const bucket = storage.bucket(bucketName);
            // Check if bucket exists by getting metadata
            await bucket.getMetadata();

            await bucket.setCorsConfiguration([
                {
                    origin: ['http://localhost:3000', 'https://thaiba-media-staging.web.app'],
                    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
                    maxAgeSeconds: 3600,
                    responseHeader: ['Authorization', 'Content-Type', 'x-goog-resumable']
                }
            ]);
            console.log(`✅ Success! CORS applied to ${bucketName}`);
        } catch (error) {
            if (error.code === 404) {
                console.log(`⚠️ Bucket ${bucketName} does not exist. Skipping.`);
            } else {
                console.error(`❌ Failed to configure ${bucketName}:`, error.message);
            }
        }
    }

    console.log('\nCORS configuration process completed.');
}

configureCors();
