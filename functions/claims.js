const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Super Admin bootstrap function
exports.bootstrapSuperAdmin = functions.https.onRequest(async (req, res) => {
  // This endpoint is intended for initial setup only
  // In production, you should add additional security measures
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const email = 'media@thaibagarden.com';
    
    console.log(`Looking for user with email: ${email}`);
    
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`Found existing user: ${userRecord.uid} (${userRecord.email})`);
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
      isTeam: true,
    };
    
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    
    console.log(`Successfully set Super Admin claims for user ${userRecord.uid}:`, customClaims);
    
    res.status(200).json({ 
      success: true, 
      message: 'Super Admin setup completed successfully!',
      userId: userRecord.uid,
      claims: customClaims
    });
    
  } catch (error) {
    console.error('Error in Super Admin bootstrap:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Callable function for admin to set custom claims
exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to set custom claims'
    );
  }

  // Ensure the user is a Super Admin or Admin
  const adminUser = await admin.auth().getUser(context.auth.uid);
  const isSuperAdmin = adminUser.customClaims?.superAdmin === true;
  const isAdmin = adminUser.customClaims?.isAdmin === true;
  
  if (!isSuperAdmin && !isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only Super Admins or Admins can set custom claims'
    );
  }
  
  // Super Admins can set any claims, regular admins can only set team/isAdmin (not superAdmin)
  const { targetUid, superAdmin: newSuperAdmin, isAdmin: newIsAdmin, isTeam: newIsTeam } = data;

  // Validate inputs
  if (!targetUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetUid is required'
    );
  }

  if (newSuperAdmin === undefined && newIsAdmin === undefined && newIsTeam === undefined) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'At least one of superAdmin, isAdmin, or isTeam must be provided'
    );
  }

  try {
    // Get the target user to verify they exist
    const targetUser = await admin.auth().getUser(targetUid);
    
    // Prepare custom claims
    const currentClaims = targetUser.customClaims || {};
    
    // If the caller is not a Super Admin, prevent them from setting superAdmin claims
    let newClaims = { ...currentClaims };
    
    if (newSuperAdmin !== undefined) {
      if (isSuperAdmin) {
        newClaims.superAdmin = newSuperAdmin;
      } else {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only Super Admins can modify superAdmin claims'
        );
      }
    }
    
    if (newIsAdmin !== undefined) {
      newClaims.isAdmin = newIsAdmin;
    }
    
    if (newIsTeam !== undefined) {
      newClaims.isTeam = newIsTeam;
    }

    // Remove null/undefined claims to keep things clean
    if (newClaims.superAdmin === null || newClaims.superAdmin === undefined || newClaims.superAdmin === false) {
      delete newClaims.superAdmin;
    }
    if (newClaims.isAdmin === null || newClaims.isAdmin === undefined || newClaims.isAdmin === false) {
      delete newClaims.isAdmin;
    }
    if (newClaims.isTeam === null || newClaims.isTeam === undefined || newClaims.isTeam === false) {
      delete newClaims.isTeam;
    }

    // Set the custom claims
    await admin.auth().setCustomUserClaims(targetUid, newClaims);

    console.log(`Updated custom claims for user ${targetUid}:`, newClaims);
    
    return { 
      success: true, 
      message: `Custom claims updated for user ${targetUid}`,
      newClaims 
    };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set custom claims: ' + error.message
    );
  }
});

// Admin function to bulk assign roles via custom claims
exports.bulkAssignRoles = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to assign roles'
    );
  }

  const adminUser = await admin.auth().getUser(context.auth.uid);
  const isSuperAdmin = adminUser.customClaims?.superAdmin === true;
  const isAdmin = adminUser.customClaims?.isAdmin === true;
  
  if (!isSuperAdmin && !isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only Super Admins or Admins can assign roles'
    );
  }

  const { userIds, role } = data;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userIds array is required and must not be empty'
    );
  }

  if (!role || !['admin', 'team', 'guest', 'superAdmin'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'role must be one of: admin, team, guest, superAdmin'
    );
  }

  try {
    const results = [];
    
    for (const uid of userIds) {
      try {
        const user = await admin.auth().getUser(uid);
        const currentClaims = user.customClaims || {};
        
        let newClaims;
        if (role === 'superAdmin') {
          if (isSuperAdmin) {
            newClaims = { ...currentClaims, superAdmin: true, isAdmin: true, isTeam: true };
          } else {
            throw new functions.https.HttpsError(
              'permission-denied',
              'Only Super Admins can assign superAdmin role'
            );
          }
        } else if (role === 'admin') {
          newClaims = { ...currentClaims, superAdmin: false, isAdmin: true, isTeam: true };
        } else if (role === 'team') {
          newClaims = { ...currentClaims, superAdmin: false, isAdmin: false, isTeam: true };
        } else { // guest
          newClaims = { ...currentClaims, superAdmin: false, isAdmin: false, isTeam: false };
        }
        
        // Remove false values to keep claims clean
        if (newClaims.superAdmin === false) delete newClaims.superAdmin;
        if (newClaims.isAdmin === false) delete newClaims.isAdmin;
        if (newClaims.isTeam === false) delete newClaims.isTeam;

        await admin.auth().setCustomUserClaims(uid, newClaims);
        results.push({ uid, success: true });
      } catch (error) {
        console.error(`Error updating claims for user ${uid}:`, error);
        results.push({ uid, success: false, error: error.message });
      }
    }

    const successfulUpdates = results.filter(r => r.success).length;
    console.log(`Bulk role assignment completed: ${successfulUpdates}/${userIds.length} users updated`);

    return { 
      success: true, 
      message: `Bulk role assignment completed: ${successfulUpdates}/${userIds.length} users updated`,
      results 
    };
  } catch (error) {
    console.error('Error in bulk role assignment:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to assign roles: ' + error.message
    );
  }
});