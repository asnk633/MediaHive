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

async function checkUserEmailVerification() {
  try {
    const auth = admin.auth();
    
    // Find the user by email
    const user = await auth.getUserByEmail('media@thaibagarden.com');
    
    console.log('User found:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      customClaims: user.customClaims
    });
    
    if (!user.emailVerified) {
      console.log('❌ Email is NOT verified. This will cause 403 errors on admin APIs.');
      console.log('🔧 Fix by running:');
      console.log(`await auth.updateUser('${user.uid}', { emailVerified: true });`);
      
      // Optionally fix it right away
      const fix = process.argv.includes('--fix');
      if (fix) {
        await auth.updateUser(user.uid, { emailVerified: true });
        console.log('✅ Email verification status updated to TRUE');
      }
    } else {
      console.log('✅ Email is already verified. No action needed.');
    }
    
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User media@thaibagarden.com not found in Firebase Authentication');
    } else {
      console.error('❌ Error checking user:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkUserEmailVerification()
    .then(user => {
      console.log('\n📋 Verification complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { checkUserEmailVerification };