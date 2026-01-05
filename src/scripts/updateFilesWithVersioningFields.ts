import { adminDb } from '@/lib/firebase/server';

/**
 * Script to update existing files with versioning fields
 * This script adds versioning fields to all existing files
 * and sets them to default values:
 * - versionNumber = 1
 * - isActiveVersion = true
 * - versionGroupId = file.id (for existing files, each is its own group initially)
 */

async function updateFilesWithVersioningFields() {
  try {
    const db = adminDb;

    console.log('Fetching all files...');
    const filesSnapshot = await db.collection('files').get();

    console.log(`Found ${filesSnapshot.size} files to update`);

    let updatedCount = 0;
    const batch = db.batch();

    filesSnapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Only update files that don't already have versioning fields
      if (!data.hasOwnProperty('versionNumber') && !data.hasOwnProperty('isActiveVersion')) {
        batch.update(doc.ref, {
          versionNumber: 1,
          isActiveVersion: true,
          versionGroupId: doc.id // Initially, each file is its own group
        });

        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      console.log(`Updating ${updatedCount} files with versioning fields...`);
      await batch.commit();
      console.log('Successfully updated files with versioning fields');
    } else {
      console.log('No files needed to be updated');
    }
  } catch (error) {
    console.error('Error updating files with versioning fields:', error);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  updateFilesWithVersioningFields().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default updateFilesWithVersioningFields;