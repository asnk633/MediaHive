const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with explicit project ID
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'thaiba-media-staging'
});

async function verifyClaims() {
  const email = 'media@thaibagarden.com';
  const projectId = admin.app().options.projectId;
  
  console.log(`[VERIFY CLAIMS] Starting verification for project: ${projectId}`);
  console.log(`[VERIFY CLAIMS] Target user: ${email}`);
  
  if (projectId !== 'thaiba-media-staging') {
    console.error(`[ERROR] Admin SDK connected to WRONG project: ${projectId}`);
    process.exit(1);
  }

  try {
    // Fetch user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`[VERIFY CLAIMS] Found user UID: ${userRecord.uid}`);
    
    // Get custom claims
    const customClaims = userRecord.customClaims || {};
    console.log(`[VERIFY CLAIMS] Current custom claims:`, customClaims);
    
    // Check if claims exist
    if (Object.keys(customClaims).length === 0) {
      console.log('[VERIFY CLAIMS] ❌ CLAIMS ARE MISSING - customClaims is {}');
      return {
        success: false,
        uid: userRecord.uid,
        claims: customClaims,
        projectId: projectId
      };
    }
    
    // Check for required Super Admin claims
    const requiredClaims = {
      superAdmin: customClaims.superAdmin === true,
      admin: customClaims.admin === true,
      isTeam: customClaims.isTeam === true
    };
    
    console.log('[VERIFY CLAIMS] Required Super Admin claims status:', requiredClaims);
    
    const allClaimsPresent = requiredClaims.superAdmin && requiredClaims.admin && requiredClaims.isTeam;
    
    if (allClaimsPresent) {
      console.log('[VERIFY CLAIMS] ✅ ALL Super Admin claims are present');
    } else {
      console.log('[VERIFY CLAIMS] ❌ Some Super Admin claims are missing');
    }
    
    return {
      success: allClaimsPresent,
      uid: userRecord.uid,
      claims: customClaims,
      requiredClaims: requiredClaims,
      projectId: projectId
    };
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`[VERIFY CLAIMS] ❌ User not found: ${email}`);
      return {
        success: false,
        error: 'User not found',
        projectId: projectId
      };
    } else {
      console.error('[VERIFY CLAIMS] Error verifying claims:', error);
      throw error;
    }
  }
}

// Run the verification function if this script is executed directly
if (require.main === module) {
  verifyClaims()
    .then((result) => {
      console.log('[VERIFY CLAIMS] Verification completed:', result);
      if (result.success) {
        console.log('[VERIFY CLAIMS] ✅ Super Admin claims are properly set');
        process.exit(0);
      } else {
        console.log('[VERIFY CLAIMS] ❌ Super Admin claims are missing or incomplete');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('[VERIFY CLAIMS] Script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyClaims };