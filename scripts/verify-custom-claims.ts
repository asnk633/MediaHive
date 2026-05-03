// @ts-nocheck
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}

async function verifyCustomClaims() {
  try {
    const auth = admin.auth();
    
    // Find the user by email
    const user = await auth.getUserByEmail('media@thaibagarden.com');
    
    console.log('User custom claims:', user.customClaims);
    
    // Check if the user has the expected Super Admin claims
    const hasSuperAdmin = user.customClaims?.superAdmin === true;
    const hasAdmin = user.customClaims?.admin === true;
    const hasIsTeam = user.customClaims?.isTeam === true;
    
    console.log('\nClaim verification results:');
    console.log(`✅ Super Admin claim: ${hasSuperAdmin ? 'SET' : 'MISSING'}`);
    console.log(`✅ Admin claim: ${hasAdmin ? 'SET' : 'MISSING'}`);
    console.log(`✅ IsTeam claim: ${hasIsTeam ? 'SET' : 'MISSING'}`);
    
    if (!hasSuperAdmin) {
      console.log('\n🔧 Setting Super Admin claims...');
      
      // Set the custom claims for Super Admin
      await auth.setCustomUserClaims(user.uid, {
        superAdmin: true,
        admin: true,
        isTeam: true
      });
      
      console.log('✅ Super Admin claims set successfully!');
      
      // Verify the claims were set
      const updatedUser = await auth.getUser(user.uid);
      console.log('Updated custom claims:', updatedUser.customClaims);
    } else {
      console.log('\n✅ User already has Super Admin claims. No action needed.');
    }
    
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User media@thaibagarden.com not found in Firebase Authentication');
    } else {
      console.error('❌ Error checking custom claims:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyCustomClaims()
    .then(user => {
      console.log('\n📋 Custom claims verification complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyCustomClaims };