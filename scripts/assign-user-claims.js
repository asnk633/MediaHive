const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with explicit project ID
// This script should be run with proper service account credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'thaiba-media-staging'
});

/**
 * Script to assign claims to users who don't have them
 * This helps with the transition period when users exist but don't have custom claims
 */
async function assignClaimsToUsers() {
  const projectId = admin.app().options.projectId;
  
  console.log(`[CLAIMS ASSIGNMENT] Starting for project: ${projectId}`);
  
  if (projectId !== 'thaiba-media-staging') {
    console.error(`[ERROR] This script should only run on 'thaiba-media-staging', not '${projectId}'`);
    process.exit(1);
  }

  try {
    // List all users (in batches if there are many)
    let listUsersResult = await admin.auth().listUsers();
    let users = listUsersResult.users;
    
    // If there are more users, continue listing
    while (listUsersResult.pageToken) {
      listUsersResult = await admin.auth().listUsers(1000, listUsersResult.pageToken);
      users = users.concat(listUsersResult.users);
    }

    console.log(`[CLAIMS ASSIGNMENT] Found ${users.length} users`);

    let updatedCount = 0;
    const skippedUsers = [];

    for (const user of users) {
      try {
        // Get current custom claims
        const userRecord = await admin.auth().getUser(user.uid);
        const currentClaims = userRecord.customClaims || {};
        
        // Check if user already has any role claims
        if (currentClaims.superAdmin || currentClaims.admin || currentClaims.isTeam) {
          console.log(`[CLAIMS ASSIGNMENT] User ${user.uid} (${user.email}) already has claims:`, currentClaims);
          continue;
        }

        // Determine appropriate claims based on email or other criteria
        let newClaims = {};
        
        if (user.email === 'media@thaibagarden.com') {
          // Assign Super Admin claims to the designated super admin
          newClaims = {
            superAdmin: true,
            admin: true,
            isTeam: true
          };
          console.log(`[CLAIMS ASSIGNMENT] Assigning Super Admin claims to: ${user.email}`);
        } else {
          // For other users, assign team role as default (can be changed later by admin)
          newClaims = {
            isTeam: true
          };
          console.log(`[CLAIMS ASSIGNMENT] Assigning default team claims to: ${user.email}`);
        }

        // Set the new custom claims
        await admin.auth().setCustomUserClaims(user.uid, newClaims);
        console.log(`[CLAIMS ASSIGNMENT] Successfully updated claims for ${user.uid} (${user.email}):`, newClaims);
        updatedCount++;
      } catch (error) {
        console.error(`[CLAIMS ASSIGNMENT] Error updating claims for user ${user.uid}:`, error.message);
        skippedUsers.push({ uid: user.uid, email: user.email, error: error.message });
      }
    }

    console.log(`[CLAIMS ASSIGNMENT] Completed. Updated ${updatedCount} users.`);
    if (skippedUsers.length > 0) {
      console.log(`[CLAIMS ASSIGNMENT] Skipped ${skippedUsers.length} users due to errors:`, skippedUsers);
    }

    return {
      totalUsers: users.length,
      updatedCount,
      skippedCount: skippedUsers.length,
      projectId
    };

  } catch (error) {
    console.error('[CLAIMS ASSIGNMENT] Fatal error:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  assignClaimsToUsers()
    .then((result) => {
      console.log('[CLAIMS ASSIGNMENT] Script completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[CLAIMS ASSIGNMENT] Script failed:', error);
      process.exit(1);
    });
}

module.exports = { assignClaimsToUsers };