const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This script should be run in an environment with proper Firebase Admin credentials
// Either with GOOGLE_APPLICATION_CREDENTIALS environment variable set or
// with proper service account key
const app = admin.initializeApp({
  projectId: 'thaiba-media-prod',
});

// HARD RUNTIME GUARD: Script crashes immediately if wrong Firebase project is used
// This ensures we don't accidentally run this against staging or another environment
const targetProjectId = 'thaiba-media-prod';
const currentProjectId = app.options.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;

if (currentProjectId !== targetProjectId) {
  const errorMsg = `[FIREBASE] CRITICAL ERROR: Expected '${targetProjectId}', but got '${currentProjectId}'. Script will crash to prevent using wrong Firebase project.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

console.log(`[FIREBASE] Confirmed correct project ID via Admin SDK: ${currentProjectId}`);

async function bootstrapSuperAdmin() {
  try {
    const email = 'media@thaibagarden.com';

    console.log(`Looking for user with email: ${email}`);

    // Find user by email
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`Found user: ${userRecord.uid} (${userRecord.email})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`User with email ${email} does not exist. Creating user...`);

        // Create the user if they don't exist
        userRecord = await admin.auth().createUser({
          email: email,
          emailVerified: true,
          displayName: 'Super Admin',
          disabled: false,
        });

        console.log(`Created user: ${userRecord.uid} (${userRecord.email})`);
      } else {
        throw error;
      }
    }

    // Set custom claims for Super Admin
    const customClaims = {
      superAdmin: true,
      admin: true,
      isTeam: true, // Note: using isTeam instead of team to match our rules
    };

    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

    console.log(`Successfully set Super Admin claims for user ${userRecord.uid}:`, customClaims);
    console.log('Super Admin setup completed successfully!');

  } catch (error) {
    console.error('Error bootstrapping Super Admin:', error);
    throw error;
  }
}

// Run the bootstrap function
if (require.main === module) {
  bootstrapSuperAdmin()
    .then(() => {
      console.log('Super Admin bootstrap completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Super Admin bootstrap failed:', error);
      process.exit(1);
    });
}

module.exports = { bootstrapSuperAdmin };