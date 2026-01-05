const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with explicit project ID
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'thaiba-media-staging'
});

async function forceSetClaims() {
  const email = 'media@thaibagarden.com';
  const projectId = admin.app().options.projectId;
  
  console.log(`[FORCE SET CLAIMS] Starting for project: ${projectId}`);
  console.log(`[FORCE SET CLAIMS] Target user: ${email}`);
  
  if (projectId !== 'thaiba-media-staging') {
    console.error(`[ERROR] Admin SDK connected to WRONG project: ${projectId}`);
    process.exit(1);
  }

  try {
    let userRecord;
    
    // Try to find the user by email
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`[FORCE SET CLAIMS] Found existing user: ${userRecord.uid} (${userRecord.email})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`[FORCE SET CLAIMS] User not found. Creating user: ${email}`);
        
        // Create the user if they don't exist
        userRecord = await admin.auth().createUser({
          email: email,
          emailVerified: true,
          displayName: 'Super Admin',
          disabled: false,
        });
        
        console.log(`[FORCE SET CLAIMS] Created user: ${userRecord.uid} (${userRecord.email})`);
      } else {
        throw error;
      }
    }

    // Define the required Super Admin claims
    const superAdminClaims = {
      superAdmin: true,
      admin: true,
      isTeam: true,
    };

    console.log('[FORCE SET CLAIMS] Setting Super Admin claims:', superAdminClaims);
    
    // Apply the custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, superAdminClaims);
    
    console.log('[FORCE SET CLAIMS] Claims set successfully!');
    
    // Re-read the user to verify claims were written
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    const updatedClaims = updatedUser.customClaims || {};
    
    console.log('[FORCE SET CLAIMS] Updated user claims:', updatedClaims);
    
    // Verify all required claims are present
    const requiredClaims = {
      superAdmin: updatedClaims.superAdmin === true,
      admin: updatedClaims.admin === true,
      isTeam: updatedClaims.isTeam === true
    };
    
    console.log('[FORCE SET CLAIMS] Verification of required claims:', requiredClaims);
    
    const allClaimsPresent = requiredClaims.superAdmin && requiredClaims.admin && requiredClaims.isTeam;
    
    if (!allClaimsPresent) {
      console.error('[FORCE SET CLAIMS] ❌ ABORT: Claims were not properly written');
      console.error('[FORCE SET CLAIMS] Missing claims:', requiredClaims);
      process.exit(1);
    }
    
    console.log('[FORCE SET CLAIMS] ✅ ALL Super Admin claims verified successfully');
    
    return {
      success: true,
      uid: userRecord.uid,
      claims: updatedClaims,
      requiredClaims: requiredClaims,
      projectId: projectId
    };
    
  } catch (error) {
    console.error('[FORCE SET CLAIMS] Error in force-set claims:', error);
    throw error;
  }
}

// Run the force-set function if this script is executed directly
if (require.main === module) {
  forceSetClaims()
    .then((result) => {
      console.log('[FORCE SET CLAIMS] Script completed successfully:', result);
      console.log(`[FINAL RESULT] media@thaibagarden.com`);
      console.log(`[FINAL RESULT] UID: ${result.uid}`);
      console.log(`[FINAL RESULT] Claims:`, result.claims);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[FORCE SET CLAIMS] Script failed:', error);
      process.exit(1);
    });
}

module.exports = { forceSetClaims };