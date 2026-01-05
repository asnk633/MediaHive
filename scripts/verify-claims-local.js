// For local development, we'll try different authentication methods
const admin = require('firebase-admin');

// Try to initialize with service account file if it exists, otherwise use application default
let serviceAccountPath = null;
try {
  // Try to find a service account key file
  const fs = require('fs');
  const path = require('path');
  
  // Look for service account key in common locations
  const possiblePaths = [
    './serviceAccountKey.json',
    './service-account-key.json',
    './firebase-adminsdk.json',
    '../serviceAccountKey.json',
    '../service-account-key.json',
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ];
  
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      serviceAccountPath = p;
      break;
    }
  }
  
  if (serviceAccountPath) {
    console.log(`[VERIFY CLAIMS] Using service account file: ${serviceAccountPath}`);
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'thaiba-media-staging'
    });
  } else {
    console.log('[VERIFY CLAIMS] No service account file found, trying application default credentials');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'thaiba-media-staging'
    });
  }
} catch (error) {
  console.log('[VERIFY CLAIMS] Application default failed, trying with environment project ID only');
  // If all else fails, try without explicit credential (will use environment)
  admin.initializeApp({
    projectId: 'thaiba-media-staging'
  });
}

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
      console.log('[VERIFY CLAIMS] HINT: Make sure you have proper Firebase Admin SDK credentials set up.');
      console.log('[VERIFY CLAIMS] You may need to set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.log('[VERIFY CLAIMS] or download a service account key from Firebase Console.');
      process.exit(1);
    });
}

module.exports = { verifyClaims };