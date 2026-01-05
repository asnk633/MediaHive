const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for production with explicit project ID
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'thaiba-media-staging'
});

async function bootstrapSuperAdmin() {
  const email = 'media@thaibagarden.com';
  const projectId = admin.app().options.projectId;
  
  console.log(`[BOOTSTRAP] Starting Super Admin setup for project: ${projectId}`);
  console.log(`[BOOTSTRAP] Target user: ${email}`);
  
  if (projectId !== 'thaiba-media-staging') {
    console.error(`[ERROR] This script should only run on 'thaiba-media-staging', not '${projectId}'`);
    process.exit(1);
  }

  try {
    let userRecord;
    
    // Try to find the user by email
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`[BOOTSTRAP] Found existing user: ${userRecord.uid} (${userRecord.email})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`[BOOTSTRAP] User not found. Creating user: ${email}`);
        
        // Create the user if they don't exist
        userRecord = await admin.auth().createUser({
          email: email,
          emailVerified: true,
          displayName: 'Super Admin',
          disabled: false,
        });
        
        console.log(`[BOOTSTRAP] Created user: ${userRecord.uid} (${userRecord.email})`);
      } else {
        throw error;
      }
    }

    // Set the required custom claims for Super Admin
    const customClaims = {
      superAdmin: true,
      admin: true,
      isTeam: true,
    };

    // Apply the custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    
    console.log('[SUCCESS] Super Admin claims set successfully!');
    console.log('[SUCCESS] Claims:', customClaims);
    console.log('[IMPORTANT] User must log out and log back in to receive new claims.');
    console.log('[IMPORTANT] Service worker cache should be cleared for immediate effect.');
    
    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('[VERIFICATION] Updated user claims:', updatedUser.customClaims);
    
    return {
      success: true,
      userId: userRecord.uid,
      email: email,
      claims: customClaims,
      projectId: projectId
    };
    
  } catch (error) {
    console.error('[ERROR] Failed to bootstrap Super Admin:', error);
    throw error;
  }
}

// Run the bootstrap function if this script is executed directly
if (require.main === module) {
  bootstrapSuperAdmin()
    .then((result) => {
      console.log('[COMPLETED] Super Admin bootstrap completed successfully');
      console.log('[RESULT]', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[FAILED] Super Admin bootstrap failed:', error);
      process.exit(1);
    });
}

module.exports = { bootstrapSuperAdmin };