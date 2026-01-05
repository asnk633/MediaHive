import { adminDb } from '@/lib/firebase/server';

/**
 * Script to update existing files with proofing status fields
 * This script adds the proofingStatus field to all existing files
 * and sets it to 'pending' by default
 */

async function updateFilesWithProofingFields() {
  try {
    const db = adminDb;

    console.log('Fetching all files...');
    const filesSnapshot = await db.collection('files').get();

    console.log(`Found ${filesSnapshot.size} files to update`);

    let updatedCount = 0;
    const batch = db.batch();

    filesSnapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Only update files that don't already have proofingStatus
      if (!data.hasOwnProperty('proofingStatus')) {
        batch.update(doc.ref, {
          proofingStatus: 'pending',
          proofingStatusUpdatedAt: null,
          proofingStatusUpdatedBy: null,
          proofingStatusUpdatedByName: null
        });

        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      console.log(`Updating ${updatedCount} files with proofing status fields...`);
      await batch.commit();
      console.log('Successfully updated files with proofing status fields');
    } else {
      console.log('No files needed to be updated');
    }
  } catch (error) {
    console.error('Error updating files with proofing fields:', error);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  updateFilesWithProofingFields().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default updateFilesWithProofingFields;