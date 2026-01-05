const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This script should be run in an environment with proper Firebase Admin credentials
admin.initializeApp();

async function verifySuperAdmin() {
  try {
    const email = 'media@thaibagarden.com';
    
    console.log(`Verifying Super Admin claims for: ${email}`);
    
    // Find user by email
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log(`Found user: ${userRecord.uid} (${userRecord.email})`);
      
      // Check custom claims
      const claims = userRecord.customClaims || {};
      
      console.log('Current custom claims:', claims);
      
      const requiredClaims = {
        superAdmin: true,
        admin: true,
        isTeam: true
      };
      
      let allClaimsPresent = true;
      for (const [claim, value] of Object.entries(requiredClaims)) {
        if (claims[claim] !== value) {
          console.log(`❌ Missing or incorrect claim: ${claim} should be ${value}, but is ${claims[claim]}`);
          allClaimsPresent = false;
        }
      }
      
      if (allClaimsPresent) {
        console.log('✅ All Super Admin claims are properly set!');
        return true;
      } else {
        console.log('❌ Super Admin claims are not properly set. Run the bootstrap function first.');
        return false;
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`❌ User with email ${email} does not exist.`);
        return false;
      } else {
        console.error('Error verifying Super Admin:', error);
        return false;
      }
    }
    
  } catch (error) {
    console.error('Error in Super Admin verification:', error);
    return false;
  }
}

// Run the verification function
if (require.main === module) {
  verifySuperAdmin()
    .then((success) => {
      console.log('Super Admin verification completed.');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Super Admin verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifySuperAdmin };