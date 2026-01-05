const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    console.log('Creating profile for new user:', user.uid);
    
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);
    
    // Check if user profile already exists to avoid duplicates
    const docSnapshot = await userRef.get();
    
    if (docSnapshot.exists) {
      console.log(`User profile already exists for ${user.uid}, skipping creation`);
      return null;
    }
    
    // Create the user profile document with default values
    const userProfile = {
      uid: user.uid,
      email: user.email,
      role: 'team', // Default role for new users
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'cloud-function',
      emailVerified: user.emailVerified,
      displayName: user.displayName || user.email?.split('@')[0] || 'New User',
      photoURL: user.photoURL || null
    };
    
    await userRef.set(userProfile);
    console.log(`Successfully created user profile for ${user.uid}`);
    
    return null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
});

// Import the claims functions
const { setCustomClaims, bulkAssignRoles, bootstrapSuperAdmin } = require('./claims');

// Export the bootstrap function as well
exports.bootstrapSuperAdmin = bootstrapSuperAdmin;

// Callable function for admin role updates
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to update roles'
    );
  }

  // Ensure the user is an admin
  const adminUser = await admin.auth().getUser(context.auth.uid);
  const isAdmin = adminUser.customClaims?.admin === true;
  
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can update roles'
    );
  }

  const { targetUid, newRole } = data;

  // Validate inputs
  if (!targetUid || !newRole) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetUid and newRole are required'
    );
  }

  // Validate role
  const validRoles = ['guest', 'team', 'admin'];
  if (!validRoles.includes(newRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Role must be one of: ${validRoles.join(', ')}`
    );
  }

  try {
    // Update role in Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(targetUid);
    
    await userRef.update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update custom claims based on the new role
    let customClaims = await admin.auth().getUser(targetUid).then(user => user.customClaims || {});
    
    if (newRole === 'admin') {
      // Admin: set both isAdmin and isTeam to true
      customClaims = { ...customClaims, isAdmin: true, isTeam: true };
    } else if (newRole === 'team') {
      // Team: set isAdmin to false, isTeam to true
      customClaims = { ...customClaims, isAdmin: false, isTeam: true };
    } else { // guest
      // Guest: set both to false
      customClaims = { ...customClaims, isAdmin: false, isTeam: false };
    }
    
    // Remove false values to keep claims clean
    if (customClaims.isAdmin === false) delete customClaims.isAdmin;
    if (customClaims.isTeam === false) delete customClaims.isTeam;
    
    await admin.auth().setCustomUserClaims(targetUid, customClaims);

    console.log(`Updated role for user ${targetUid} to ${newRole} by admin ${context.auth.uid}`);
    
    return { success: true, message: `Role updated to ${newRole}` };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update user role'
    );
  }
});